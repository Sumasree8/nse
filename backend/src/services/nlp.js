/**
 * NLP analysis engine — deterministic, no external API required.
 *
 * Everything here is computed from the text itself: sentiment (lexicon),
 * keyword salience (TF weighting), industry classification (keyword rules),
 * friction/pain detection, and a problem-relevance score used as a noise gate.
 *
 * This replaces the previously hardcoded `analysis` / `scoring` blocks that
 * shipped with the mock signals.
 */

// ── Lexicons ──────────────────────────────────────────────────────────────────
// Compact AFINN-style polarity lexicon (subset tuned for problem/market signals).
const SENTIMENT_LEXICON = {
  // negative
  crisis: -3, broken: -3, fail: -3, failing: -3, failure: -3, struggle: -2, struggling: -2,
  shortage: -2, burnout: -3, fraud: -3, lawsuit: -2, sanctioned: -3, penalty: -2, penalties: -2,
  expensive: -2, costly: -2, exploding: -2, surge: -1, decline: -2, declining: -2, collapse: -3,
  risk: -1, risky: -2, danger: -2, dangerous: -2, threat: -2, disruption: -2, disrupted: -2,
  delay: -2, delayed: -2, complaint: -2, complaints: -2, frustrated: -2, frustration: -2,
  pain: -2, painful: -2, problem: -2, problems: -2, difficult: -2, hard: -1, blocker: -2,
  inefficient: -2, waste: -2, wasted: -2, error: -2, errors: -2, bug: -2, outage: -3,
  layoff: -3, layoffs: -3, recession: -3, inflation: -2, scam: -3, breach: -3, hacked: -3,
  vulnerable: -2, gap: -1, missing: -1, lack: -2, lacking: -2, slow: -1, confusing: -2,
  overwhelmed: -2, fatigue: -2, churn: -2, complex: -1, complexity: -1, bottleneck: -2,
  // positive
  growth: 2, growing: 2, opportunity: 2, innovative: 2, innovation: 2, breakthrough: 3,
  efficient: 2, solution: 1, solved: 2, success: 2, successful: 2, profit: 2, profitable: 2,
  scalable: 2, boost: 2, improve: 2, improved: 2, gain: 1, gains: 1, win: 2, winning: 2,
  surging: 1, demand: 1, adoption: 2, thriving: 3, leading: 1, advantage: 2,
};

// Pain/urgency markers — presence raises painIntensity & urgency.
const PAIN_MARKERS = [
  'crisis', 'urgent', 'emergency', 'critical', 'broken', 'no solution', 'no tool', 'no way',
  'struggle', 'struggling', 'shortage', 'burnout', 'overwhelmed', 'can\'t', 'cannot', 'impossible',
  'costing', 'costs', 'losing', 'lost', 'wasting', 'manual', 'hours', 'every week', 'nobody',
  'no one', 'fragmented', 'disconnected', 'workaround', 'frustrated', 'fed up', 'nightmare',
];

const URGENCY_MARKERS = [
  'now', 'today', 'immediately', 'urgent', 'breaking', 'just', 'this week', 'rising', 'surge',
  'exploding', 'accelerating', 'rapidly', 'emergency', 'deadline', '2024', '2025', '2026',
];

// Industry classification rules. First industry whose keywords match wins by weight.
const INDUSTRY_RULES = [
  { industry: 'Healthcare', tags: ['Health'], kw: ['hospital', 'health', 'patient', 'clinical', 'medical', 'nurse', 'doctor', 'pharma', 'biotech', 'telehealth', 'mental health'] },
  { industry: 'FinTech', tags: ['Finance'], kw: ['bank', 'banking', 'fintech', 'payment', 'lending', 'credit', 'fraud', 'insurance', 'invest', 'crypto', 'wallet', 'procurement'] },
  { industry: 'AI / ML', tags: ['AI'], kw: ['ai ', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'model', 'neural', 'chatbot', 'hallucination', 'agent'] },
  { industry: 'Climate Tech', tags: ['Climate'], kw: ['climate', 'carbon', 'emission', 'renewable', 'solar', 'sustainability', 'esg', 'green energy', 'net zero'] },
  { industry: 'E-Commerce', tags: ['Retail'], kw: ['ecommerce', 'e-commerce', 'retail', 'shopify', 'marketplace', 'returns', 'checkout', 'dropship', 'fulfillment'] },
  { industry: 'Supply Chain', tags: ['Logistics'], kw: ['supply chain', 'logistics', 'shipping', 'freight', 'warehouse', 'inventory', 'port', 'supplier', 'procurement'] },
  { industry: 'Legal Tech', tags: ['Legal'], kw: ['legal', 'law firm', 'attorney', 'lawyer', 'court', 'compliance', 'contract', 'litigation', 'regulation'] },
  { industry: 'HR Tech', tags: ['HR'], kw: ['hiring', 'recruit', 'hr ', 'human resources', 'payroll', 'employee', 'workforce', 'talent', 'onboarding'] },
  { industry: 'EdTech', tags: ['Education'], kw: ['education', 'student', 'learning', 'school', 'university', 'course', 'training', 'edtech', 'apprenticeship'] },
  { industry: 'Cybersecurity', tags: ['Security'], kw: ['security', 'cyber', 'breach', 'ransomware', 'phishing', 'malware', 'vulnerability', 'hack', 'zero-day'] },
  { industry: 'Real Estate', tags: ['PropTech'], kw: ['real estate', 'property', 'mortgage', 'rent', 'housing', 'construction', 'proptech', 'landlord'] },
  { industry: 'Developer Tools', tags: ['DevTools'], kw: ['developer', 'devops', 'api', 'codebase', 'deployment', 'kubernetes', 'github', 'ci/cd', 'open source'] },
  { industry: 'Productivity', tags: ['SaaS'], kw: ['productivity', 'workflow', 'collaboration', 'saas', 'no-code', 'automation', 'spreadsheet', 'tooling'] },
  { industry: 'Restaurant Tech', tags: ['FoodTech'], kw: ['restaurant', 'food', 'kitchen', 'menu', 'hospitality', 'tipping', 'pos system'] },
];

const FRICTION_CATEGORIES = [
  { category: 'workflow', kw: ['workflow', 'fragmented', 'disconnected', 'switching', 'manual', 'spreadsheet'] },
  { category: 'cost', kw: ['expensive', 'cost', 'costing', 'pricing', 'budget', 'overpriced', 'fees'] },
  { category: 'compliance', kw: ['compliance', 'regulation', 'legal', 'audit', 'penalty', 'sanction', 'gdpr'] },
  { category: 'workforce', kw: ['shortage', 'hiring', 'burnout', 'turnover', 'staffing', 'talent', 'skills'] },
  { category: 'security', kw: ['fraud', 'breach', 'security', 'risk', 'vulnerability', 'hack'] },
  { category: 'operations', kw: ['operations', 'logistics', 'supply', 'inventory', 'delay', 'bottleneck'] },
];

const STOPWORDS = new Set(('a an the and or but of to in on for with at by from as is are was were be been being this that these those it its their our your you we they he she his her them then than so if not no nor can will just into over under out up down about after before more most some any all each new how what why when where who which been has have had do does did get got make made said says say also amid via per said'.split(' ')));

// ── Sentiment ─────────────────────────────────────────────────────────────────
function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function analyzeSentiment(text) {
  const tokens = tokenize(text);
  if (!tokens.length) return { score: 0, label: 'neutral' };
  let sum = 0;
  let hits = 0;
  for (let i = 0; i < tokens.length; i++) {
    const w = tokens[i];
    if (SENTIMENT_LEXICON[w] !== undefined) {
      let v = SENTIMENT_LEXICON[w];
      // simple negation handling: "not broken" flips polarity
      if (i > 0 && (tokens[i - 1] === 'not' || tokens[i - 1] === 'no' || tokens[i - 1] === 'never')) v = -v;
      sum += v;
      hits++;
    }
  }
  if (!hits) return { score: 0, label: 'neutral' };
  // normalize to -1..1 with diminishing returns
  const raw = sum / Math.sqrt(hits + 4);
  const score = Math.max(-1, Math.min(1, raw / 3));
  let label = 'neutral';
  if (score <= -0.6) label = 'critical';
  else if (score <= -0.25) label = 'negative';
  else if (score < 0) label = 'frustrated';
  else if (score >= 0.4) label = 'positive';
  else if (score > 0) label = 'optimistic';
  return { score: Number(score.toFixed(3)), label };
}

// ── Keywords (TF salience) ────────────────────────────────────────────────────
function extractKeywords(text, topN = 8) {
  const tokens = tokenize(text).filter(w => w.length > 3 && !STOPWORDS.has(w));
  const total = tokens.length || 1;
  const freq = {};
  for (const w of tokens) freq[w] = (freq[w] || 0) + 1;
  return Object.entries(freq)
    .map(([word, frequency]) => ({ word, frequency, tfidf: Number((frequency / total).toFixed(4)) }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, topN);
}

// ── Industry classification ───────────────────────────────────────────────────
function classifyIndustry(text) {
  const lc = ' ' + String(text || '').toLowerCase() + ' ';
  let best = null;
  let bestScore = 0;
  for (const rule of INDUSTRY_RULES) {
    let score = 0;
    for (const kw of rule.kw) if (lc.includes(kw)) score++;
    if (score > bestScore) { bestScore = score; best = rule; }
  }
  if (!best) return { industry: 'General', tags: [] };
  // tags: rule tag + any matched keyword-derived tags (title-cased single words)
  const tags = [...best.tags];
  return { industry: best.industry, subIndustry: undefined, tags };
}

// ── Friction / pain extraction ────────────────────────────────────────────────
function extractFrictionPoints(text, sentiment) {
  const lc = String(text || '').toLowerCase();
  const points = [];
  for (const fc of FRICTION_CATEGORIES) {
    const matched = fc.kw.filter(kw => lc.includes(kw));
    if (matched.length) {
      points.push({
        description: `Signals of ${fc.category} friction (${matched.slice(0, 3).join(', ')})`,
        intensity: Number(Math.min(1, 0.4 + matched.length * 0.18 + Math.abs(sentiment.score) * 0.3).toFixed(2)),
        category: fc.category,
      });
    }
  }
  return points.sort((a, b) => b.intensity - a.intensity).slice(0, 4);
}

function painIntensity(text, sentiment) {
  const lc = String(text || '').toLowerCase();
  let markers = 0;
  for (const m of PAIN_MARKERS) if (lc.includes(m)) markers++;
  // pain is driven by negative sentiment + density of pain markers
  const negative = Math.max(0, -sentiment.score);
  const score = Math.min(1, negative * 0.6 + Math.min(markers, 6) * 0.09);
  return Number(score.toFixed(3));
}

// ── Problem relevance (noise gate) ────────────────────────────────────────────
// Returns 0..1. Low scores are filtered out before persistence so that
// promotional / off-topic / contentless articles never become signals.
function problemRelevance(text, sentiment, pain) {
  const lc = String(text || '').toLowerCase();
  const len = lc.length;
  if (len < 120) return 0.1; // too thin to analyze
  const promo = ['buy now', 'discount', 'coupon', 'subscribe', 'sponsored', 'advertisement', 'click here', 'sweepstakes', 'giveaway', 'horoscope', 'celebrity', 'box office'];
  for (const p of promo) if (lc.includes(p)) return 0.1;
  const problemSignals = ['problem', 'struggle', 'shortage', 'cost', 'broken', 'lack', 'no tool', 'crisis', 'inefficient', 'manual', 'gap', 'frustrat', 'risk', 'fraud', 'delay', 'burnout', 'complain'];
  let sig = 0;
  for (const s of problemSignals) if (lc.includes(s)) sig++;
  const base = Math.min(1, sig * 0.12 + pain * 0.5 + Math.max(0, -sentiment.score) * 0.3);
  return Number(Math.max(0.1, base).toFixed(3));
}

// ── Composite scoring ─────────────────────────────────────────────────────────
// relevance: how strongly it reads as a real-world problem worth solving
// urgency:   temporal pressure markers
// novelty:   injected later (depends on dedup vs corpus); default here
function scoreSignal({ text, sentiment, pain, credibility, verificationScore = 0.5, novelty = 0.6 }) {
  const lc = String(text || '').toLowerCase();
  let urgencyMarkers = 0;
  for (const m of URGENCY_MARKERS) if (lc.includes(m)) urgencyMarkers++;
  const relevanceScore = problemRelevance(text, sentiment, pain);
  const urgencyScore = Number(Math.min(1, 0.25 + Math.min(urgencyMarkers, 6) * 0.12).toFixed(3));
  const noveltyScore = Number(Math.max(0, Math.min(1, novelty)).toFixed(3));
  // composite blends signal quality with how trustworthy/verified the source is
  const composite =
    relevanceScore * 0.32 +
    pain * 0.20 +
    urgencyScore * 0.13 +
    noveltyScore * 0.12 +
    credibility * 0.10 +
    verificationScore * 0.13;
  return {
    relevanceScore,
    urgencyScore,
    noveltyScore,
    compositeScore: Number(Math.min(1, composite).toFixed(3)),
  };
}

/**
 * Full analysis for a normalized article. Returns the `analysis`,
 * `categorization` and `scoring` blocks ready to persist on a Signal.
 */
function analyzeArticle(article, { credibility = 0.7, verificationScore = 0.5, novelty = 0.6 } = {}) {
  const text = [article.title, article.summary, article.content].filter(Boolean).join('. ');
  const sentiment = analyzeSentiment(text);
  const pain = painIntensity(text, sentiment);
  const keywords = extractKeywords(text);
  const category = classifyIndustry(text);
  const frictionPoints = extractFrictionPoints(text, sentiment);
  const scoring = scoreSignal({ text, sentiment, pain, credibility, verificationScore, novelty });
  return {
    analysis: {
      sentiment,
      topics: keywords.slice(0, 5).map(k => k.word),
      keywords,
      frictionPoints,
      painIntensity: pain,
    },
    categorization: {
      industry: category.industry,
      subIndustry: category.subIndustry,
      tags: category.tags,
    },
    scoring,
    relevance: scoring.relevanceScore,
  };
}

module.exports = {
  analyzeSentiment,
  extractKeywords,
  classifyIndustry,
  extractFrictionPoints,
  painIntensity,
  problemRelevance,
  scoreSignal,
  analyzeArticle,
  tokenize,
};
