/**
 * Trajectory & Outcome service — the engine behind the proprietary moat.
 *
 *   recordSnapshots()      → freeze each opportunity's current metrics into the
 *                            OpportunitySnapshot time-series and roll up momentum.
 *   detectOutcomeEvents()  → attach newly-ingested real signals back onto existing
 *                            opportunities (a living evidence stream) and auto-tag
 *                            funding / competitor / regulatory events.
 *   reportOutcome()        → capture human ground-truth (building/launched/dead).
 *
 * None of this can be cloned from the free public feeds: it is accumulated by
 * running the pipeline over time. The longer it runs, the deeper the moat.
 *
 * Everything here is best-effort and must never throw into the ingestion loop.
 */
const mongoose = require('mongoose');
const Idea = require('../models/Idea');
const Signal = require('../models/Signal');
const OpportunitySnapshot = require('../models/OpportunitySnapshot');
const logger = require('../utils/logger');
const { cosineSimilarity } = require('./embedding');

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const connected = () => mongoose.connection.readyState === 1;
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// ── Metrics from an idea's currently-linked real signals ───────────────────────
function metricsFromSignals(idea, signals) {
  const now = Date.now();
  const verified = signals.filter(s => ['verified', 'corroborated'].includes(s.verification?.status)).length;
  const domains = new Set(signals.map(s => s.source?.domain).filter(Boolean));
  const newSignals7d = signals.filter(s => s.createdAt && (now - new Date(s.createdAt).getTime()) <= WEEK).length;
  return {
    opportunityScore: idea.scoring?.opportunityScore ?? 0,
    demandIndex: idea.marketSignals?.demandIndex ?? 0,
    signalCount: signals.length,
    newSignals7d,
    sourceBreadth: domains.size,
    verifiedShare: signals.length ? Number((verified / signals.length).toFixed(3)) : 0,
    competitorCount: idea.competitors?.length ?? 0,
    avgPain: Number(avg(signals.map(s => s.analysis?.painIntensity ?? 0)).toFixed(3)),
    trendPhase: idea.scoring?.trendPhase ?? 'Emerging',
  };
}

// Centroid of an idea's signal embeddings — persisted so later similarity checks
// don't have to refetch. This is what lets new signals find their idea.
function centroid(embeddings) {
  const valid = embeddings.filter(e => Array.isArray(e) && e.length);
  if (!valid.length) return null;
  const dim = valid[0].length;
  const out = new Array(dim).fill(0);
  for (const e of valid) for (let i = 0; i < dim; i++) out[i] += e[i] || 0;
  for (let i = 0; i < dim; i++) out[i] /= valid.length;
  return out;
}

function classifyMomentum(velocity, newSignals7d) {
  if (velocity >= 3) return 'accelerating';
  if (velocity >= 0.5 || newSignals7d >= 2) return 'rising';
  if (velocity <= -3 && newSignals7d === 0) return 'dormant';
  if (velocity <= -0.5) return 'cooling';
  return 'steady';
}

/**
 * Record a snapshot for each active opportunity and roll up its trajectory.
 * Returns { snapshots } count.
 */
async function recordSnapshots({ maxIdeas = 400 } = {}) {
  if (!connected()) return { snapshots: 0 };
  const ideas = await Idea.find({ isPublic: true })
    .select('+embedding scoring marketSignals competitors signals trajectory')
    .sort('-createdAt')
    .limit(maxIdeas)
    .lean();
  if (!ideas.length) return { snapshots: 0 };

  let written = 0;
  for (const idea of ideas) {
    try {
      const signals = idea.signals?.length
        ? await Signal.find({ _id: { $in: idea.signals } })
            .select('+embedding verification source.domain analysis.painIntensity createdAt')
            .lean()
        : [];
      const m = metricsFromSignals(idea, signals);

      const prev = await OpportunitySnapshot.findOne({ idea: idea._id }).sort('-capturedAt').lean();
      const delta = {
        opportunityScore: m.opportunityScore - (prev?.metrics?.opportunityScore ?? m.opportunityScore),
        demandIndex: m.demandIndex - (prev?.metrics?.demandIndex ?? m.demandIndex),
        signalCount: m.signalCount - (prev?.metrics?.signalCount ?? m.signalCount),
      };

      await OpportunitySnapshot.create({ idea: idea._id, metrics: m, delta });
      written++;

      // velocity = score change per week across the trailing 21-day window
      const window = await OpportunitySnapshot.find({
        idea: idea._id,
        capturedAt: { $gte: new Date(Date.now() - 21 * DAY) },
      }).sort('capturedAt').lean();

      let velocity = 0;
      if (window.length >= 2) {
        const first = window[0], last = window[window.length - 1];
        const weeks = Math.max((new Date(last.capturedAt) - new Date(first.capturedAt)) / WEEK, 1 / 7);
        velocity = Number(((last.metrics.opportunityScore - first.metrics.opportunityScore) / weeks).toFixed(2));
      }

      const firstTrackedAt = prev ? (idea.trajectory?.firstTrackedAt || prev.capturedAt) : new Date();
      const daysTracked = Math.round((Date.now() - new Date(firstTrackedAt).getTime()) / DAY);
      const snapshots = (idea.trajectory?.snapshots ?? 0) + 1;

      const set = {
        'trajectory.firstTrackedAt': firstTrackedAt,
        'trajectory.lastSnapshotAt': new Date(),
        'trajectory.snapshots': snapshots,
        'trajectory.daysTracked': daysTracked,
        'trajectory.velocity': velocity,
        'trajectory.peakScore': Math.max(idea.trajectory?.peakScore ?? 0, m.opportunityScore),
        'trajectory.momentum': classifyMomentum(velocity, m.newSignals7d),
      };

      // Backfill the centroid embedding once, so outcome detection can match.
      if ((!idea.embedding || !idea.embedding.length) && signals.length) {
        const c = centroid(signals.map(s => s.embedding));
        if (c) set.embedding = c;
      }

      // A meaningful jump/drop in demand is itself an outcome event.
      if (prev && delta.demandIndex >= 8) {
        await pushEvent(idea._id, { type: 'demand_spike', origin: 'system',
          description: `Demand index rose ${Math.round(delta.demandIndex)} pts since last snapshot.`, confidence: 0.6 });
      } else if (prev && delta.demandIndex <= -8) {
        await pushEvent(idea._id, { type: 'demand_decline', origin: 'system',
          description: `Demand index fell ${Math.round(-delta.demandIndex)} pts since last snapshot.`, confidence: 0.6 });
      }

      await Idea.updateOne({ _id: idea._id }, { $set: set });
    } catch (e) {
      logger.warn(`Snapshot failed for idea ${idea._id}: ${e.message}`);
    }
  }

  logger.info(`Trajectory: recorded ${written} opportunity snapshot${written === 1 ? '' : 's'}`);
  return { snapshots: written };
}

// ── Outcome-event classification from a freshly ingested signal ────────────────
const EVENT_RULES = [
  { type: 'funding_detected',   re: /\b(raises?|raised|funding round|series\s+[a-e]\b|seed round|pre-seed|valuation|venture round|led the round)\b/i,
    label: (s) => `Funding signal: “${s.title}”` },
  { type: 'competitor_emerged', re: /\b(launch(?:es|ed)?|unveils?|introduc(?:es|ed)|debuts?|rolls out|now available|enters the market)\b/i,
    label: (s) => `Possible competitor move: “${s.title}”` },
  { type: 'regulatory_shift',   re: /\b(regulat\w+|legislation|\bbill\b|ruling|court|\bban\b|mandate|compliance deadline|policy change|sanction)\b/i,
    label: (s) => `Regulatory development: “${s.title}”` },
];
function classifyEvent(signal) {
  const text = `${signal.title || ''}. ${signal.summary || ''}`;
  for (const r of EVENT_RULES) if (r.re.test(text)) return { type: r.type, description: r.label(signal) };
  return { type: 'new_evidence', description: `New corroborating signal: “${signal.title}”` };
}

async function pushEvent(ideaId, event) {
  const at = event.at || new Date();
  await Idea.updateOne(
    { _id: ideaId },
    { $push: { 'outcome.events': { ...event, at } }, $set: { 'outcome.lastEventAt': at } }
  );
}

/**
 * Attach newly ingested signals back onto the opportunities they corroborate,
 * growing each idea's living evidence base and auto-tagging notable events.
 * Returns { linked, events }.
 */
async function detectOutcomeEvents({ windowMinutes = 30, maxIdeas = 300, simThreshold = 0.55, perIdeaCap = 4 } = {}) {
  if (!connected()) return { linked: 0, events: 0 };
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  const fresh = (await Signal.find({ createdAt: { $gte: since } })
    .select('+embedding title summary source.url categorization.industry')
    .lean())
    .filter(s => Array.isArray(s.embedding) && s.embedding.length);
  if (!fresh.length) return { linked: 0, events: 0 };

  const ideas = await Idea.find({ 'outcome.status': { $nin: ['dead', 'acquired'] } })
    .select('+embedding category.industry signals trajectory')
    .sort('-createdAt')
    .limit(maxIdeas)
    .lean();
  if (!ideas.length) return { linked: 0, events: 0 };

  let linked = 0, events = 0;
  for (const idea of ideas) {
    // Ensure we have an embedding to match against (backfill from signals once).
    let emb = idea.embedding;
    if ((!emb || !emb.length) && idea.signals?.length) {
      const sigs = await Signal.find({ _id: { $in: idea.signals } }).select('+embedding').lean();
      emb = centroid(sigs.map(s => s.embedding));
      if (emb) await Idea.updateOne({ _id: idea._id }, { $set: { embedding: emb } });
    }
    if (!emb || !emb.length) continue;

    const have = new Set((idea.signals || []).map(String));
    const matches = [];
    for (const sig of fresh) {
      if (have.has(String(sig._id))) continue;
      const sim = cosineSimilarity(emb, sig.embedding);
      if (sim >= simThreshold) matches.push({ sig, sim });
    }
    if (!matches.length) continue;

    matches.sort((a, b) => b.sim - a.sim);
    for (const { sig, sim } of matches.slice(0, perIdeaCap)) {
      const { type, description } = classifyEvent(sig);
      await Idea.updateOne(
        { _id: idea._id },
        {
          $addToSet: { signals: sig._id },
          $push: { 'outcome.events': {
            type, description, origin: 'system', signal: sig._id,
            url: sig.source?.url, confidence: Number(sim.toFixed(3)), at: new Date(),
          } },
          $set: { 'outcome.lastEventAt': new Date() },
        }
      );
      linked++; events++;
    }
  }

  if (events) logger.info(`Trajectory: linked ${linked} new signal${linked === 1 ? '' : 's'} → ${events} outcome event${events === 1 ? '' : 's'}`);
  return { linked, events };
}

/**
 * Record a human-reported outcome — the proprietary ground-truth label.
 * Returns the updated outcome subdocument.
 */
async function reportOutcome({ ideaId, userId, status, note }) {
  const VALID = ['open', 'validated', 'building', 'launched', 'funded', 'acquired', 'dead'];
  if (!VALID.includes(status)) throw new Error(`Invalid outcome status: ${status}`);

  const at = new Date();
  const update = {
    $push: { 'outcome.events': {
      type: 'user_report', origin: 'user', recordedBy: userId, at,
      description: note ? `Marked “${status}”: ${note}` : `Marked “${status}”`,
      confidence: 1,
    } },
    $inc: { 'outcome.reportCount': 1 },
    $set: { 'outcome.status': status, 'outcome.lastEventAt': at },
  };
  const idea = await Idea.findByIdAndUpdate(ideaId, update, { new: true })
    .select('outcome trajectory title')
    .lean();
  if (!idea) throw new Error('Idea not found');
  return idea;
}

module.exports = { recordSnapshots, detectOutcomeEvents, reportOutcome };
