/**
 * Verification layer — the trust gate that sits BETWEEN raw news and the
 * signal/idea pipeline. Its job: decide whether a story is credible enough and
 * filter out noise, so the engine only ever turns *verified* problems into ideas.
 *
 * Two independent checks combine into a verification verdict:
 *   1. Source credibility — per-domain reputation (curated table + heuristics).
 *   2. Cross-source corroboration — is the same story reported independently by
 *      other reputable domains? A single anonymous blog is "unverified"; a story
 *      corroborated by 2+ independent reputable domains is "verified".
 *
 * Plus a noise gate using the NLP problem-relevance score.
 */
const { cosineSimilarity } = require('./embedding');

// Curated domain reputation. Higher = more trustworthy primary reporting.
const DOMAIN_CREDIBILITY = {
  'reuters.com': 0.97, 'apnews.com': 0.97, 'bloomberg.com': 0.95, 'wsj.com': 0.95,
  'nytimes.com': 0.93, 'ft.com': 0.94, 'bbc.co.uk': 0.93, 'bbc.com': 0.93,
  'economist.com': 0.93, 'cnbc.com': 0.88, 'theguardian.com': 0.88, 'npr.org': 0.9,
  'arstechnica.com': 0.88, 'wired.com': 0.86, 'theverge.com': 0.84, 'techcrunch.com': 0.82,
  'healthcareitnews.com': 0.85, 'supplychaindive.com': 0.85, 'constructiondive.com': 0.85,
  'law.com': 0.9, 'cfo.com': 0.85, 'forbes.com': 0.78, 'businessinsider.com': 0.76,
  'news.ycombinator.com': 0.7, 'ycombinator.com': 0.7, 'medium.com': 0.55,
  'reddit.com': 0.6, 'substack.com': 0.55,
};

// Domains that are aggregators / low-trust by default.
const LOW_TRUST_HINTS = ['blogspot', 'wordpress.com', 'prnewswire', 'businesswire', 'globenewswire', 'einnews', 'patch.com'];

function domainCredibility(domain) {
  if (!domain) return 0.5;
  const d = domain.toLowerCase().replace(/^www\./, '');
  if (DOMAIN_CREDIBILITY[d] !== undefined) return DOMAIN_CREDIBILITY[d];
  // suffix match (e.g. edition.cnn.com -> cnn.com not in table, fall through)
  for (const known of Object.keys(DOMAIN_CREDIBILITY)) {
    if (d.endsWith('.' + known) || d === known) return DOMAIN_CREDIBILITY[known];
  }
  for (const hint of LOW_TRUST_HINTS) if (d.includes(hint)) return 0.4;
  // .gov / .edu primary sources are trustworthy
  if (d.endsWith('.gov') || d.endsWith('.edu')) return 0.9;
  return 0.6; // unknown but plausible news domain
}

/**
 * Given a target article (with embedding) and the full batch, count how many
 * OTHER independent domains report a sufficiently similar story.
 * Independent = different registrable domain.
 */
function corroboration(target, batch, { threshold = 0.62 } = {}) {
  const corroborating = [];
  const seenDomains = new Set();
  for (const other of batch) {
    if (other === target || !other.embedding) continue;
    if (other.domain && target.domain && other.domain === target.domain) continue; // same outlet ≠ independent
    const sim = cosineSimilarity(target.embedding, other.embedding);
    if (sim >= threshold && other.domain && !seenDomains.has(other.domain)) {
      seenDomains.add(other.domain);
      corroborating.push({ domain: other.domain, sourceName: other.sourceName, url: other.url, similarity: Number(sim.toFixed(3)) });
    }
  }
  return corroborating.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
}

/**
 * Produce a verification verdict for a single article within its batch.
 * `relevance` is the NLP problem-relevance score (noise gate input).
 */
function verify(target, batch, { relevance = 0.5 } = {}) {
  const credibility = domainCredibility(target.domain);
  const corroborating = corroboration(target, batch);
  const corroborationCount = corroborating.length;
  // Trust the corroborating sources' credibility too — corroboration by
  // reputable outlets counts more than by unknown ones.
  const corroborationStrength = corroborating.reduce((s, c) => s + domainCredibility(c.domain), 0);

  // verificationScore in 0..1
  let verificationScore = credibility * 0.55 + Math.min(1, corroborationStrength / 2) * 0.45;
  verificationScore = Number(Math.min(1, verificationScore).toFixed(3));

  let status;
  if (relevance < 0.25) status = 'noise';
  else if (corroborationCount >= 2 && credibility >= 0.6) status = 'verified';
  else if (corroborationCount >= 1 || credibility >= 0.85) status = 'corroborated';
  else if (credibility >= 0.6) status = 'single-source';
  else status = 'unverified';

  return {
    status,
    score: verificationScore,
    credibility: Number(credibility.toFixed(3)),
    corroborationCount,
    corroboratingSources: corroborating,
    checkedAt: new Date(),
  };
}

/**
 * Should this article be persisted as a signal? Filters out noise and
 * untrustworthy single sources below the quality bar.
 */
function passesGate(verification, relevance) {
  if (verification.status === 'noise') return false;
  if (relevance < 0.25) return false;
  if (verification.status === 'unverified' && verification.credibility < 0.5) return false;
  return true;
}

module.exports = { verify, passesGate, domainCredibility, corroboration, DOMAIN_CREDIBILITY };
