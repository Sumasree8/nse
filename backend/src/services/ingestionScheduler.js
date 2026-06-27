/**
 * Ingestion pipeline — turns real, day-to-day news into verified signals.
 *
 *   sources (RSS + GDELT, no API key)
 *      → embed (deterministic)
 *      → novelty (vs recent corpus, for unique ideas)
 *      → verify (domain credibility + cross-source corroboration)
 *      → analyze (sentiment / industry / friction / scoring)
 *      → noise gate
 *      → persist (deduped by hash)
 *
 * No mock data is generated here anymore. If no MongoDB is available the cycle
 * simply logs and exits — it never fabricates signals.
 */
const cron = require('node-cron');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Signal = require('../models/Signal');
const logger = require('../utils/logger');
const { fetchRss } = require('./sources/rss');
const { fetchGdelt } = require('./sources/gdelt');
const { fetchReddit } = require('./sources/reddit');
const { localEmbedding, cosineSimilarity } = require('./embedding');
const { analyzeArticle, analyzeSentiment, painIntensity, problemRelevance } = require('./nlp');
const { verify, passesGate } = require('./verification');

let running = false;

function hashArticle(a) {
  return crypto.createHash('sha256').update(a.url || a.title).digest('hex');
}

function articleText(a) {
  return [a.title, a.summary, a.content].filter(Boolean).join('. ');
}

async function gatherArticles() {
  const settled = await Promise.allSettled([fetchRss(), fetchGdelt(), fetchReddit()]);
  const all = [];
  for (const s of settled) if (s.status === 'fulfilled') all.push(...s.value);
  // batch-level dedup by URL
  const byKey = new Map();
  for (const a of all) {
    const key = a.url || a.title;
    if (key && !byKey.has(key)) byKey.set(key, a);
  }
  return [...byKey.values()];
}

/**
 * Run one full ingestion cycle. Returns { fetched, inserted, rejected }.
 */
async function runIngestion() {
  if (running) { logger.warn('Ingestion already running, skipping cycle'); return { skipped: true }; }
  if (mongoose.connection.readyState !== 1) {
    logger.warn('Ingestion skipped — MongoDB not connected');
    return { fetched: 0, inserted: 0, rejected: 0 };
  }
  running = true;
  const t0 = Date.now();
  try {
    const articles = await gatherArticles();
    if (!articles.length) { logger.warn('Ingestion: no articles fetched'); return { fetched: 0, inserted: 0, rejected: 0 }; }

    // 0. drop articles we already have (by hash)
    const hashes = articles.map(a => { a._hash = hashArticle(a); return a._hash; });
    const existing = new Set(
      (await Signal.find({ hash: { $in: hashes } }).select('hash').lean()).map(s => s.hash)
    );
    const fresh = articles.filter(a => !existing.has(a._hash));
    if (!fresh.length) { logger.info('Ingestion: all articles already known'); return { fetched: articles.length, inserted: 0, rejected: 0 }; }

    // 1. deterministic embeddings (free, consistent space for corroboration + novelty)
    for (const a of fresh) a.embedding = localEmbedding(articleText(a));

    // 2. preliminary NLP signals (needed by the verification noise gate)
    for (const a of fresh) {
      const text = articleText(a);
      const sentiment = analyzeSentiment(text);
      const pain = painIntensity(text, sentiment);
      a._relevance = problemRelevance(text, sentiment, pain);
    }

    // 3. novelty vs recent corpus (so corroborated dupes don't spawn duplicate ideas)
    const corpus = await Signal.find({})
      .select('+embedding')
      .sort('-createdAt')
      .limit(500)
      .lean();
    const corpusEmb = corpus.map(s => s.embedding).filter(e => Array.isArray(e) && e.length);

    const docs = [];
    let rejected = 0;
    for (let i = 0; i < fresh.length; i++) {
      const a = fresh[i];

      // novelty = 1 - max similarity to corpus and to earlier accepted items this batch
      let maxSim = 0;
      for (const e of corpusEmb) maxSim = Math.max(maxSim, cosineSimilarity(a.embedding, e));
      for (let j = 0; j < i; j++) if (fresh[j]._accepted) maxSim = Math.max(maxSim, cosineSimilarity(a.embedding, fresh[j].embedding));
      const novelty = Number(Math.max(0, 1 - maxSim).toFixed(3));

      // 4. verification (credibility + cross-source corroboration within batch)
      const verification = verify(a, fresh, { relevance: a._relevance });

      // 5. noise / trust gate — near-duplicates and untrusted noise are rejected
      if (!passesGate(verification, a._relevance) || novelty < 0.12) { rejected++; continue; }
      a._accepted = true;

      // 6. full analysis + scoring with real verification inputs
      const { analysis, categorization, scoring } = analyzeArticle(a, {
        credibility: verification.credibility,
        verificationScore: verification.score,
        novelty,
      });

      docs.push({
        title: a.title,
        content: a.content || a.summary || a.title,
        summary: a.summary,
        source: {
          type: a.sourceType || 'news',
          name: a.sourceName,
          url: a.url,
          domain: a.domain,
          credibilityScore: verification.credibility,
        },
        metadata: {
          publishedAt: a.publishedAt || new Date(),
          author: a.author,
          language: 'en',
          region: a.region,
        },
        analysis,
        categorization,
        scoring,
        verification,
        embedding: a.embedding,
        hash: a._hash,
        processed: true,
      });
    }

    let inserted = 0;
    if (docs.length) {
      try {
        const res = await Signal.insertMany(docs, { ordered: false });
        inserted = res.length;
      } catch (err) {
        // duplicate-key races are expected under concurrent cycles
        inserted = err?.result?.insertedCount ?? err?.insertedDocs?.length ?? 0;
        if (err.code !== 11000) logger.warn(`insertMany partial: ${err.message}`);
      }
    }

    logger.info(`Ingestion done in ${Date.now() - t0}ms — fetched ${articles.length}, inserted ${inserted}, rejected ${rejected} (noise/dupe/untrusted)`);

    // Turn the freshly-verified real signals into real, evidence-backed
    // opportunities (deterministic, no API key). Best-effort — never blocks ingestion.
    let synthesized = 0;
    if (inserted > 0) {
      try {
        const { synthesizeOpportunities } = require('./opportunitySynthesis');
        const ideas = await synthesizeOpportunities({ max: 8, minScore: 0.4 });
        synthesized = ideas.length;
      } catch (e) {
        logger.warn(`Opportunity synthesis skipped: ${e.message}`);
      }
    }

    // Trajectory & outcome ledger (the proprietary, compounding moat). First
    // attach the freshly-ingested signals back onto existing opportunities, then
    // snapshot every opportunity's metrics into the time-series. Best-effort —
    // a failure here must never disrupt ingestion.
    let linkedEvents = 0;
    try {
      const { detectOutcomeEvents, recordSnapshots } = require('./trajectoryService');
      if (inserted > 0) {
        const r = await detectOutcomeEvents({ windowMinutes: 30 });
        linkedEvents = r.events;
      }
      await recordSnapshots({});
    } catch (e) {
      logger.warn(`Trajectory update skipped: ${e.message}`);
    }

    return { fetched: articles.length, inserted, rejected, synthesized, linkedEvents };
  } catch (err) {
    logger.error(`Ingestion cycle failed: ${err.message}`);
    return { error: err.message };
  } finally {
    running = false;
  }
}

function startIngestionScheduler() {
  // Initial ingestion shortly after boot
  setTimeout(() => { runIngestion(); }, 4000);

  // Real news refresh every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    logger.info('Scheduled news ingestion starting…');
    runIngestion();
  });
}

module.exports = { startIngestionScheduler, runIngestion };
