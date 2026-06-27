/**
 * Market & Demand Intelligence — the defensible layer.
 *
 * Instead of fabricating a TAM, we compute REAL, cited demand evidence by
 * fusing multiple signal types for a theme:
 *   • News momentum   — is coverage rising or cooling? (last 7d vs prior 7d)
 *   • Source breadth  — how many independent outlets / verified sources?
 *   • Community demand — Reddit mentions + pain intensity (operators complaining)
 *   • Research activity — arXiv papers on the theme (keyless), an EARLY signal
 *                         that surfaces before mainstream headlines.
 *
 * This is what a corporate-strategy / innovation buyer actually pays for:
 * "is demand for this real, where is it forming, and is it accelerating?" —
 * answered with numbers traceable to real sources, not model guesses.
 */
const axios = require('axios');
const Signal = require('../models/Signal');
const logger = require('../utils/logger');

const DAY = 24 * 60 * 60 * 1000;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

// Research is a meaningful leading indicator only for science/tech-led sectors.
// Elsewhere an arXiv count is noise, so we don't show it.
const RESEARCH_LED = new Set([
  'AI / ML', 'Cybersecurity', 'Climate Tech', 'Developer Tools', 'Healthcare', 'Robotics', 'Biotech',
]);

/**
 * arXiv research activity for a SPECIFIC theme query (keyless, best-effort).
 * Returns matching-paper count + recent titles + the exact query used (so the
 * number is transparent, not a magic figure). arXiv leads commercialization by
 * years — a real "before the headline" signal for deep-tech themes.
 */
async function arxivActivity(query) {
  try {
    // Phrase query keeps it specific (avoids matching all of CS).
    const q = encodeURIComponent(`all:"${query}"`);
    const url = `http://export.arxiv.org/api/query?search_query=${q}&start=0&max_results=4&sortBy=submittedDate&sortOrder=descending`;
    const res = await axios.get(url, { timeout: 7000, headers: { 'User-Agent': 'NSE-MarketIntel/1.0' } });
    const xml = String(res.data || '');
    const count = Number((xml.match(/<opensearch:totalResults[^>]*>(\d+)</) || [])[1] || 0);
    const samples = [...xml.matchAll(/<entry>[\s\S]*?<title>([\s\S]*?)<\/title>/g)]
      .map(m => m[1].replace(/\s+/g, ' ').trim())
      .slice(0, 3);
    return { source: 'arXiv', count, samples, query };
  } catch (e) {
    logger.warn(`arXiv lookup failed (${query}): ${e.message}`);
    return { source: 'arXiv', count: 0, samples: [], query };
  }
}

/**
 * Compute fused demand evidence for a theme. `cluster` is the opportunity's own
 * signals; we also query the wider corpus for momentum context.
 * `arxivCache` (Map) dedups arXiv calls within a synthesis batch.
 */
async function computeDemandEvidence({ industry, keywords = [], cluster = [], arxivCache } = {}) {
  const now = Date.now();
  const ind = industry && industry !== 'General' ? industry : null;

  // News momentum: related signals in the last 7d vs the prior 7d.
  // Velocity is only meaningful once there's a real prior baseline — otherwise
  // a brand-new corpus shows absurd "+1200%" artifacts, so we suppress it.
  const baseMatch = ind ? { 'categorization.industry': ind } : {};
  const dateField = 'metadata.publishedAt';
  const [count7d, countPrior] = await Promise.all([
    Signal.countDocuments({ ...baseMatch, [dateField]: { $gte: new Date(now - 7 * DAY) } }),
    Signal.countDocuments({ ...baseMatch, [dateField]: { $gte: new Date(now - 14 * DAY), $lt: new Date(now - 7 * DAY) } }),
  ]);
  const hasBaseline = countPrior >= 3;
  const velocityPct = hasBaseline ? Math.round(((count7d - countPrior) / countPrior) * 100) : null;
  const trend = !hasBaseline ? 'baseline-building'
    : velocityPct > 20 ? 'rising' : velocityPct < -20 ? 'cooling' : 'steady';

  // Source breadth + community demand from the opportunity's own evidence.
  const sources = new Set(cluster.map(s => s.source?.name).filter(Boolean));
  const domains = new Set(cluster.map(s => s.source?.domain).filter(Boolean));
  const verified = cluster.filter(s => ['verified', 'corroborated'].includes(s.verification?.status)).length;
  const redditSigs = cluster.filter(s => s.source?.type === 'reddit');
  const avgPain = Number(avg(cluster.map(s => s.analysis?.painIntensity ?? 0)).toFixed(2));

  // Research activity (arXiv) — only for research-led sectors, with a specific
  // transparent query. Skipped (relevant:false) elsewhere so we never show an
  // irrelevant paper count.
  let research = { source: 'arXiv', relevant: false, count: 0, samples: [], query: null };
  if (RESEARCH_LED.has(ind)) {
    const theme = `${ind.replace(' / ', ' ')}${keywords[0] ? ' ' + keywords[0] : ''}`.trim();
    const key = theme.toLowerCase();
    if (arxivCache && arxivCache.has(key)) research = arxivCache.get(key);
    else { research = await arxivActivity(theme); research.relevant = true; if (arxivCache) arxivCache.set(key, research); }
    research.relevant = true;
  }

  // Composite demand index (0-100) — robust to baseline/scale artifacts.
  const verifiedRatio = cluster.length ? verified / cluster.length : 0;
  const researchTerm = research.relevant ? clamp01(Math.log10((research.count || 0) + 1) / 4) : 0;
  const demandIndex = Math.round(clamp01(
    0.30 * clamp01(count7d / 10) +
    0.22 * clamp01(sources.size / 4) +
    0.18 * verifiedRatio +
    0.18 * avgPain +
    0.12 * researchTerm
  ) * 100);

  return {
    demandIndex,
    newsMomentum: { count7d, countPrior, trend, velocityPct },
    sourceBreadth: { sources: sources.size, domains: domains.size, verified },
    community: { redditMentions: redditSigs.length, avgPain },
    research,
    updatedAt: new Date(),
  };
}

module.exports = { computeDemandEvidence, arxivActivity };
