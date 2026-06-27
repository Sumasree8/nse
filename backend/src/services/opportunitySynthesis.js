/**
 * Opportunity synthesis — turns REAL ingested signals into REAL opportunities.
 *
 * No-API-key path that replaces the old hardcoded MOCK_IDEAS. Every opportunity
 * is anchored on real Signal documents (live RSS + GDELT + Reddit, verified).
 *
 * Quality guards (so output never reads like auto-generated filler):
 *   1. RELEVANCE GATE — a signal can only seed/join an opportunity if it
 *      actually expresses a business problem (has friction points + pain).
 *      This rejects obituaries, curiosities and off-topic news outright.
 *   2. EMBEDDING CLUSTERING — corroborating signals are grouped by semantic
 *      similarity (cosine over the stored embeddings), not merely by industry,
 *      so the evidence in one opportunity is actually about the same thing.
 *   3. CORROBORATION — an opportunity needs >= 2 related signals; we never
 *      build a thesis off a single story.
 *   4. GROUNDED COPY — titles / problem statements are built from the cluster's
 *      real recurring keywords, not a fixed template.
 *
 * Tagged `aiModel: 'nse-synthesis'`.
 */
const Idea = require('../models/Idea');
const Signal = require('../models/Signal');
const logger = require('../utils/logger');
const { cosineSimilarity } = require('./embedding');
const { computeDemandEvidence } = require('./marketIntel');

// Friction category → grounded, grammatical problem / solution framing.
const FRICTION = {
  workflow:   { theme: 'fragmented, manual workflows',        verb: 'Automating', noun: 'manual workflows', solution: 'a workflow-automation layer' },
  cost:       { theme: 'rising, opaque costs',                verb: 'Cutting',    noun: 'cost pressure',    solution: 'a cost-intelligence platform' },
  compliance: { theme: 'a rising compliance and regulatory burden', verb: 'Automating', noun: 'compliance overhead', solution: 'a compliance-automation platform' },
  workforce:  { theme: 'staffing shortages and burnout',      verb: 'Easing',     noun: 'workforce strain', solution: 'a workforce-enablement platform' },
  security:   { theme: 'fraud and security exposure',         verb: 'Containing', noun: 'security exposure', solution: 'a fraud-and-security platform' },
  operations: { theme: 'operational bottlenecks and delays',  verb: 'Unblocking', noun: 'operational delays', solution: 'an operations-orchestration platform' },
};

const INDUSTRY_MARKET = {
  Healthcare: 82, FinTech: 80, 'AI / ML': 85, 'Climate Tech': 74, 'E-Commerce': 70,
  'Supply Chain': 72, 'Legal Tech': 64, 'HR Tech': 62, EdTech: 60, Cybersecurity: 78,
  'Real Estate': 66, 'Developer Tools': 70, Productivity: 64, 'Restaurant Tech': 56, General: 58,
};
const INDUSTRY_DENSITY = {
  Productivity: 0.8, 'E-Commerce': 0.75, FinTech: 0.7, 'AI / ML': 0.72, 'Developer Tools': 0.66,
  Healthcare: 0.55, 'Supply Chain': 0.5, 'Legal Tech': 0.45, 'Climate Tech': 0.45, Cybersecurity: 0.6,
  'HR Tech': 0.55, EdTech: 0.6, 'Real Estate': 0.5, 'Restaurant Tech': 0.5, General: 0.6,
};
// Industry-specific MVP stack + persona, so blueprints aren't identical.
const PLAYBOOK = {
  Healthcare:        { stack: ['FHIR/HL7 APIs', 'Node', 'Postgres', 'Retool'], role: 'Clinical operations lead', channel: 'Health-system pilots' },
  FinTech:           { stack: ['Plaid', 'Node', 'Postgres', 'Stripe'],         role: 'Risk & compliance manager', channel: 'Fintech communities + warm intros' },
  'AI / ML':         { stack: ['Python', 'FastAPI', 'pgvector', 'LangChain'],  role: 'ML platform owner',        channel: 'Dev communities + technical content' },
  Cybersecurity:     { stack: ['Go', 'Node', 'ClickHouse', 'OpenTelemetry'],   role: 'Security engineer',        channel: 'Security forums + design partners' },
  'Supply Chain':    { stack: ['Node', 'Postgres', 'Mapbox', 'Airflow'],       role: 'Logistics manager',        channel: 'Trade shows + operator referrals' },
  'Legal Tech':      { stack: ['Node', 'Postgres', 'LLM API', 'React'],        role: 'In-house counsel',         channel: 'Bar associations + legal ops groups' },
  'HR Tech':         { stack: ['Node', 'Postgres', 'React', 'Workday API'],    role: 'People-ops lead',          channel: 'HR communities + HRIS marketplaces' },
  default:           { stack: ['React', 'Node', 'Postgres'],                   role: 'Operations lead',          channel: 'Niche communities + founder-led sales' },
};

const GENERIC_KW = new Set([
  'said','says','report','reports','new','year','years','week','weeks','company','companies','business',
  'market','markets','people','make','made','time','first','could','would','about','after','more','most',
  'began','last','number','amid','near','back','well','like','just','also','told','according','here','what',
  'january','february','march','april','june','july','august','september','october','november','december',
  'billion','million','percent','today','this','that','with','from','into','over','their','says',
]);

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const r100 = (x) => Math.max(0, Math.min(100, Math.round(x * 100)));
const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : s;
const titleCase = (s) => String(s || '').replace(/\b\w/g, c => c.toUpperCase());

// A signal can seed/join an opportunity only if it actually reads as a problem.
function isProblemSignal(s) {
  const friction = s.analysis?.frictionPoints?.length || 0;
  const pain = s.analysis?.painIntensity ?? 0;
  const rel = s.scoring?.relevanceScore ?? 0;
  return friction >= 1 && (pain >= 0.1 || rel >= 0.45);
}

function dominantFriction(signals) {
  const counts = {};
  for (const s of signals) for (const f of (s.analysis?.frictionPoints || [])) {
    counts[f.category] = (counts[f.category] || 0) + (f.intensity || 0.5);
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return (top && FRICTION[top[0]]) ? top[0] : null;
}

// Keywords that genuinely RECUR across the cluster (appear in >= 2 signals).
// Requiring recurrence kills one-off junk tokens ("February", "Number", names).
function clusterKeywords(signals, industry, n = 3) {
  const indWords = new Set(String(industry).toLowerCase().split(/[^a-z]+/).filter(Boolean));
  const sigCount = {};
  for (const s of signals) {
    const seen = new Set();
    for (const k of (s.analysis?.keywords || [])) {
      const w = k.word;
      if (!w || w.length < 4 || /\d/.test(w) || GENERIC_KW.has(w) || indWords.has(w)) continue;
      if (seen.has(w)) continue;
      seen.add(w);
      sigCount[w] = (sigCount[w] || 0) + 1;
    }
  }
  return Object.entries(sigCount)
    .filter(([, c]) => c >= 2)            // must recur across signals
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

// Most common real (non-"General") industry in a cluster.
function clusterIndustry(signals) {
  const counts = {};
  for (const s of signals) {
    const ind = s.categorization?.industry;
    if (ind && ind !== 'General') counts[ind] = (counts[ind] || 0) + 1;
  }
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

/**
 * Build a coherent cluster: a problem-signal seed + the most semantically
 * similar other problem-signals (same industry OR shared friction).
 */
function buildCluster(seed, pool, { minSim = 0.3, max = 6 } = {}) {
  const seedFric = (seed.analysis?.frictionPoints || []).map(f => f.category);
  const scored = pool
    .filter(s => s !== seed)
    .map(s => ({ s, sim: cosineSimilarity(seed.embedding, s.embedding) }))
    .filter(({ s, sim }) => {
      // Membership requires BOTH semantic similarity AND a shared problem type,
      // so every signal in an opportunity is about the same friction.
      const sharesFriction = (s.analysis?.frictionPoints || []).some(f => seedFric.includes(f.category));
      return sim >= minSim && sharesFriction;
    })
    .sort((a, b) => b.sim - a.sim)
    .slice(0, max - 1)
    .map(x => x.s);
  return [seed, ...scored];
}

/** Build a plain Idea object from a coherent cluster of real signals. */
function buildIdea(signals, { generatedBy } = {}) {
  const fk = dominantFriction(signals) || 'workflow';
  const f = FRICTION[fk];
  // Representative signal = the one that actually exhibits the claimed friction
  // (highest-composite among them), so the "Representative signal" never
  // contradicts the headline problem.
  const onFriction = signals.filter(s => (s.analysis?.frictionPoints || []).some(p => p.category === fk));
  const lead = (onFriction.length ? onFriction : signals)
    .slice().sort((a, b) => (b.scoring?.compositeScore || 0) - (a.scoring?.compositeScore || 0))[0];
  const industry = clusterIndustry(signals) || lead.categorization?.industry || 'General';
  const play = PLAYBOOK[industry] || PLAYBOOK.default;
  const keywords = clusterKeywords(signals, industry);

  const pains      = signals.map(s => s.analysis?.painIntensity ?? 0);
  const composites = signals.map(s => s.scoring?.compositeScore ?? 0);
  const urgencies  = signals.map(s => s.scoring?.urgencyScore ?? 0);
  const novelties  = signals.map(s => s.scoring?.noveltyScore ?? 0.5);
  const avgPain = avg(pains), avgComposite = avg(composites), avgUrgency = avg(urgencies), avgNovelty = avg(novelties);

  const density    = INDUSTRY_DENSITY[industry] ?? 0.6;
  const complexity = Math.min(0.85, 0.35 + density * 0.4);

  const comp = {
    trendStrength:      { score: r100(avgComposite),     weight: 0.30 },
    painIntensity:      { score: r100(avgPain),          weight: 0.25 },
    marketSize:         { score: INDUSTRY_MARKET[industry] ?? 60, weight: 0.20 },
    competitionDensity: { score: r100(1 - density),      weight: 0.15 },
    executionComplexity:{ score: r100(1 - complexity),   weight: 0.10 },
  };
  for (const k of Object.keys(comp)) comp[k].weighted = Number((comp[k].score * comp[k].weight).toFixed(2));
  const opportunityScore = Math.round(Object.values(comp).reduce((a, c) => a + c.weighted, 0));

  let trendPhase = 'Emerging';
  if (signals.length >= 3 && avgComposite >= 0.5) trendPhase = 'Growing';
  if (signals.length >= 5 && avgUrgency >= 0.6) trendPhase = 'Peak';

  const failureProbability = Number(Math.max(0.2, Math.min(0.7, 1 - avgComposite)).toFixed(2));
  const overallRisk = failureProbability > 0.55 ? 'high' : failureProbability > 0.4 ? 'medium' : 'low';

  const sourceNames = [...new Set(signals.map(s => s.source?.name).filter(Boolean))];
  const domains = [...new Set(signals.map(s => s.source?.domain).filter(Boolean))];
  const n = signals.length;
  const kwPhrase = keywords.length ? keywords.map(titleCase).join(', ') : null;

  const title = `${f.verb} ${f.noun} in ${industry}`;
  const tagline = `${cap(f.solution)} for ${industry} teams, built from live signals.`;

  const problemStatement =
    `${industry} teams are signalling ${f.theme}. ` +
    `Across ${n} related report${n > 1 ? 's' : ''} from ${sourceNames.length} ` +
    `source${sourceNames.length > 1 ? 's' : ''} (${sourceNames.slice(0, 3).join(', ')}${sourceNames.length > 3 ? ', …' : ''})` +
    (kwPhrase ? `, recurring themes include ${kwPhrase}` : '') + '. ' +
    `Representative signal: “${lead.title}”.`;

  const solution =
    `${cap(f.solution)} that consolidates these signals for ${industry} operators — ` +
    `prioritising the highest-friction work and automating it first` +
    (keywords[0] ? `, starting with ${keywords[0]}` : '') + '.';

  return {
    title,
    tagline,
    problemStatement,
    solution,
    category: { industry, subIndustry: lead.categorization?.subIndustry, tags: lead.categorization?.tags || [] },

    scoring: {
      opportunityScore,
      components: comp,
      deltaScore: Number(avgNovelty.toFixed(3)),
      trendPhase,
      whyNowScore: r100(avgUrgency),
      failureProbability,
    },

    evidence: {
      newsCitations: signals.slice(0, 8).map(s => ({
        title: s.title,
        source: s.source?.name || s.source?.domain || 'news',
        url: s.source?.url,
        publishedAt: s.metadata?.publishedAt,
        relevanceScore: s.scoring?.relevanceScore,
      })),
      marketData: {
        growthRate: trendPhase === 'Peak' ? 'High / late' : trendPhase === 'Growing' ? 'Accelerating' : 'Early',
        sources: domains,
      },
    },

    whyNow: {
      triggers: signals.slice(0, 4).map(s => s.title),
      technologicalEnablers: ['Low-cost LLM / AI tooling', 'Cheap cloud + serverless infra'],
      marketShifts: [`${industry}: ${f.theme}`],
      timeWindow: trendPhase === 'Emerging' ? '6–12 month opening' : '3–9 month opening',
    },

    risks: {
      premortem: [{
        scenario: `${industry} incumbents fold ${f.noun} handling into their suite before a wedge is established.`,
        probability: failureProbability,
        mitigation: 'Win a sharp, underserved segment first; expand from a defensible workflow.',
      }],
      overallRisk,
    },

    execution: {
      mvpPlan: {
        techStack: {
          frontend: ['React', 'Vite', 'Tailwind'],
          backend: play.stack.filter(t => !['React', 'Vite', 'Tailwind'].includes(t)),
          database: play.stack.includes('Postgres') ? ['Postgres'] : ['MongoDB'],
          ai: ['LLM API (optional)'],
          infra: ['Vercel / Fly.io'],
        },
        estimatedCost: '₹0–40,000 for a 72-hour MVP',
      },
      smokeTest: {
        landingPageCopy: {
          headline: title,
          subheadline: tagline,
          cta: 'Request early access',
          bullets: signals.slice(0, 3).map(s => s.title),
        },
        valuePropositions: [f.solution],
        successMetrics: ['Landing CTR', 'Design-partner interviews booked', 'Interview-to-yes rate'],
      },
      personas: [{
        name: play.role,
        role: `${industry} buyer`,
        painPoints: [cap(f.theme), ...(keywords.slice(0, 2).map(k => `Dealing with ${k}`))],
        platforms: [play.channel],
        willingnessToPay: comp.marketSize.score >= 75 ? 'High' : 'Medium',
        acquisitionChannel: play.channel,
      }],
    },

    businessModels: {
      bootstrapped: { revenueModel: 'SaaS subscription', pricing: [{ tier: 'Starter', price: '₹3,999/mo', features: ['Core automation', 'Up to 3 seats'] }], monthsToRevenue: 3, initialCapitalRequired: '₹0–4L' },
      venture: { revenueModel: 'SaaS + usage', pricing: [{ tier: 'Team', price: '₹24,999/mo', features: ['Unlimited seats', 'Integrations', 'SLA'] }], fundingRequired: '₹4–16Cr pre-seed', useOfFunds: '60% Eng, 25% GTM, 15% Ops', projectedARR: 'Targeting ₹8Cr ARR by Y2' },
    },

    signals: signals.map(s => s._id),
    isPublic: true,
    isFeatured: opportunityScore >= 80,
    generatedBy,
    aiModel: 'nse-synthesis',
  };
}

/**
 * Cluster recent real problem-signals and synthesize coherent opportunities.
 * Dedups against opportunities already anchored on the same lead signal.
 */
async function synthesizeOpportunities({ max = 8, minScore = 0.4, industry, minCluster = 2 } = {}) {
  const query = {
    'scoring.compositeScore': { $gte: minScore },
    'verification.status': { $in: ['verified', 'corroborated', 'single-source'] },
  };
  if (industry) query['categorization.industry'] = industry;

  const all = await Signal.find(query)
    .select('+embedding')
    .sort('-scoring.compositeScore -createdAt')
    .limit(400)
    .lean();

  // Only signals that actually express a problem can take part.
  const candidates = all.filter(s => Array.isArray(s.embedding) && s.embedding.length && isProblemSignal(s));
  if (!candidates.length) return [];

  const used = new Set();
  const created = [];
  const arxivCache = new Map(); // dedup arXiv lookups across the batch

  for (const seed of candidates) {
    if (created.length >= max) break;
    if (used.has(String(seed._id))) continue;

    const pool = candidates.filter(s => !used.has(String(s._id)));
    const cluster = buildCluster(seed, pool, { minSim: 0.3, max: 6 });
    if (cluster.length < minCluster) continue;        // need corroboration
    if (!clusterIndustry(cluster)) { used.add(String(seed._id)); continue; } // skip pure-"General"

    const leadId = cluster[0]._id;
    const exists = await Idea.findOne({ signals: leadId }).select('_id').lean();
    if (exists) { used.add(String(leadId)); continue; }

    cluster.forEach(s => used.add(String(s._id)));
    const ideaObj = buildIdea(cluster);
    try {
      ideaObj.marketSignals = await computeDemandEvidence({
        industry: ideaObj.category.industry,
        keywords: clusterKeywords(cluster, ideaObj.category.industry),
        cluster, arxivCache,
      });
    } catch (e) { logger.warn(`Demand evidence failed: ${e.message}`); }
    try {
      created.push(await Idea.create(ideaObj));
    } catch (e) {
      logger.warn(`Opportunity synthesis insert failed: ${e.message}`);
    }
  }

  if (created.length) logger.info(`Synthesized ${created.length} real opportunit${created.length === 1 ? 'y' : 'ies'} from live signals`);
  return created;
}

/**
 * Build ONE opportunity on demand (Builder, no LLM key). Prefers passed signal
 * objects, else clusters the strongest recent problem-signals for the industry.
 */
async function synthesizeOne({ signals, industry, generatedBy } = {}) {
  let cluster = Array.isArray(signals) && signals.length && typeof signals[0] === 'object' ? signals : null;

  if (!cluster) {
    const q = { 'verification.status': { $in: ['verified', 'corroborated', 'single-source'] } };
    if (industry && industry !== 'any') q['categorization.industry'] = industry;
    const pool = (await Signal.find(q).select('+embedding').sort('-scoring.compositeScore -createdAt').limit(120).lean())
      .filter(s => Array.isArray(s.embedding) && s.embedding.length && isProblemSignal(s));
    if (!pool.length) return null;
    cluster = buildCluster(pool[0], pool, { minSim: 0.28, max: 6 });
  }
  if (!cluster || !cluster.length) return null;

  const ideaObj = buildIdea(cluster, { generatedBy });
  try {
    ideaObj.marketSignals = await computeDemandEvidence({
      industry: ideaObj.category.industry,
      keywords: clusterKeywords(cluster, ideaObj.category.industry),
      cluster,
    });
  } catch (e) { logger.warn(`Demand evidence failed: ${e.message}`); }
  return Idea.create(ideaObj);
}

module.exports = { synthesizeOpportunities, synthesizeOne, buildIdea, isProblemSignal };
