const cron = require('node-cron');
const axios = require('axios');
const crypto = require('crypto');
const Signal = require('../models/Signal');
const logger = require('../utils/logger');
const { seedMockData } = require('./aiService');

// ── Mock signal data for demo ─────────────────────────────────────────────────
const MOCK_SIGNALS = [
  { title: 'SMBs Struggle With AI Tool Fragmentation', content: 'Small businesses report using 12+ disconnected AI tools with no unified workflow. Decision fatigue hitting productivity.', source: { type: 'reddit', name: 'r/smallbusiness', credibilityScore: 0.8 }, categorization: { industry: 'Productivity', tags: ['AI', 'SMB', 'SaaS'] }, analysis: { painIntensity: 0.87, sentiment: { score: -0.72, label: 'negative' }, frictionPoints: [{ description: 'Tool fragmentation and context switching', intensity: 0.9, category: 'workflow' }] }, scoring: { compositeScore: 0.85, relevanceScore: 0.88, urgencyScore: 0.82, noveltyScore: 0.75 } },
  { title: 'Healthcare Staff Burnout Reaching Crisis Levels Post-Pandemic', content: 'Hospital systems report 40% nurse turnover in 2024. Staffing agencies charging 300% premium rates. Rural hospitals closing ER departments.', source: { type: 'news', name: 'Healthcare Weekly', credibilityScore: 0.92 }, categorization: { industry: 'Healthcare', tags: ['Staffing', 'Crisis', 'Rural Health'] }, analysis: { painIntensity: 0.95, sentiment: { score: -0.88, label: 'negative' }, frictionPoints: [{ description: 'Healthcare worker shortage creating care gaps', intensity: 0.95, category: 'workforce' }] }, scoring: { compositeScore: 0.91, relevanceScore: 0.94, urgencyScore: 0.96, noveltyScore: 0.68 } },
  { title: 'E-commerce Returns Processing Costs Exploding', content: 'Online retailers spending $0.17 per dollar of revenue on returns processing. Return fraud hitting $100B industry-wide. No unified returns intelligence platform exists.', source: { type: 'reddit', name: 'r/ecommerce', credibilityScore: 0.78 }, categorization: { industry: 'E-Commerce', tags: ['Returns', 'Fraud', 'Operations'] }, analysis: { painIntensity: 0.82, sentiment: { score: -0.76, label: 'frustrated' }, frictionPoints: [{ description: 'Returns processing is a margin killer with no automation', intensity: 0.85, category: 'operations' }] }, scoring: { compositeScore: 0.80, relevanceScore: 0.83, urgencyScore: 0.78, noveltyScore: 0.82 } },
  { title: 'Construction Industry Faces Massive Skills Shortage', content: '650,000 additional workers needed in 2025. Average age of construction worker is 43. Zero digital apprenticeship platforms. $1.3T in projects delayed due to labor shortages.', source: { type: 'news', name: 'Construction Dive', credibilityScore: 0.89 }, categorization: { industry: 'Construction', tags: ['Workforce', 'Training', 'Skills Gap'] }, analysis: { painIntensity: 0.91, sentiment: { score: -0.83, label: 'negative' }, frictionPoints: [{ description: 'No scalable way to train construction workers digitally', intensity: 0.92, category: 'education' }] }, scoring: { compositeScore: 0.87, relevanceScore: 0.90, urgencyScore: 0.89, noveltyScore: 0.85 } },
  { title: 'Climate Tech Due Diligence Is Broken', content: 'VCs spending 6-8 months on climate tech DD vs 2-3 months for SaaS. No standardized carbon accounting verification. Greenwashing claims costing investors billions.', source: { type: 'reddit', name: 'r/climatetech', credibilityScore: 0.83 }, categorization: { industry: 'Climate Tech', tags: ['VC', 'ESG', 'Carbon', 'Due Diligence'] }, analysis: { painIntensity: 0.78, sentiment: { score: -0.65, label: 'frustrated' }, frictionPoints: [{ description: 'No standardized climate tech investment verification tooling', intensity: 0.82, category: 'finance' }] }, scoring: { compositeScore: 0.79, relevanceScore: 0.81, urgencyScore: 0.74, noveltyScore: 0.88 } },
  { title: 'Legal AI Hallucination Problem Costing Law Firms', content: 'Multiple attorneys sanctioned for submitting AI-hallucinated case citations. No legal-specific AI verification layer exists. Bar associations creating emergency guidelines.', source: { type: 'news', name: 'Law.com', credibilityScore: 0.95 }, categorization: { industry: 'Legal Tech', tags: ['AI Safety', 'Legal', 'Compliance'] }, analysis: { painIntensity: 0.93, sentiment: { score: -0.89, label: 'critical' }, frictionPoints: [{ description: 'AI hallucination creating professional liability for lawyers', intensity: 0.95, category: 'compliance' }] }, scoring: { compositeScore: 0.89, relevanceScore: 0.92, urgencyScore: 0.94, noveltyScore: 0.79 } },
  { title: 'Restaurant Industry Payroll Tax Complexity Explosion', content: 'Restaurant owners spending 15+ hours/week on tip pooling, FICA tip credits, and state-specific labor law compliance. $40B in annual penalties from payroll errors.', source: { type: 'reddit', name: 'r/restaurantowners', credibilityScore: 0.76 }, categorization: { industry: 'Restaurant Tech', tags: ['Payroll', 'Compliance', 'SMB'] }, analysis: { painIntensity: 0.85, sentiment: { score: -0.80, label: 'negative' }, frictionPoints: [{ description: 'Restaurant payroll is uniquely complex with no specialized tooling', intensity: 0.88, category: 'compliance' }] }, scoring: { compositeScore: 0.82, relevanceScore: 0.85, urgencyScore: 0.80, noveltyScore: 0.83 } },
  { title: 'B2B Procurement Fraud Blind Spot Growing', content: 'Internal procurement fraud reaching $4.7T globally. 95% of organizations have no real-time vendor verification. Average fraud goes undetected for 16 months.', source: { type: 'news', name: 'CFO Magazine', credibilityScore: 0.91 }, categorization: { industry: 'FinTech', tags: ['Fraud Detection', 'Procurement', 'B2B', 'Enterprise'] }, analysis: { painIntensity: 0.89, sentiment: { score: -0.85, label: 'alarming' }, frictionPoints: [{ description: 'No real-time procurement fraud detection for mid-market companies', intensity: 0.91, category: 'security' }] }, scoring: { compositeScore: 0.86, relevanceScore: 0.89, urgencyScore: 0.88, noveltyScore: 0.80 } },
];

async function ingestMockSignals() {
  let inserted = 0;
  for (const signal of MOCK_SIGNALS) {
    const hash = crypto.createHash('sha256').update(signal.title).digest('hex');
    const exists = await Signal.findOne({ hash });
    if (!exists) {
      await Signal.create({ ...signal, hash, processed: true, metadata: { publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) } });
      inserted++;
    }
  }
  if (inserted > 0) logger.info(`Ingested ${inserted} mock signals`);
}

function startIngestionScheduler() {
  // Seed initial data
  setTimeout(async () => {
    await ingestMockSignals();
    await seedMockData();
  }, 2000);

  // Re-seed every 30 minutes in dev
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Running scheduled ingestion...');
    await ingestMockSignals();
  });

  // Production: would hook into real NewsAPI, Reddit API, RSS feeds here
  if (process.env.NEWS_API_KEY) {
    cron.schedule('*/15 * * * *', async () => {
      await ingestFromNewsAPI();
    });
  }
}

async function ingestFromNewsAPI() {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: { q: 'startup problem market gap innovation', apiKey: process.env.NEWS_API_KEY, pageSize: 20, language: 'en', sortBy: 'publishedAt' },
    });
    const articles = response.data.articles || [];
    let inserted = 0;
    for (const article of articles) {
      const hash = crypto.createHash('sha256').update(article.url).digest('hex');
      const exists = await Signal.findOne({ hash });
      if (!exists && article.title && article.description) {
        await Signal.create({
          title: article.title,
          content: article.content || article.description,
          summary: article.description,
          source: { type: 'news', name: article.source?.name, url: article.url, credibilityScore: 0.75 },
          hash,
          metadata: { publishedAt: new Date(article.publishedAt), author: article.author },
          categorization: { industry: 'General', tags: [] },
          scoring: { compositeScore: 0.5, relevanceScore: 0.5, urgencyScore: 0.5, noveltyScore: 0.5 },
        });
        inserted++;
      }
    }
    if (inserted > 0) logger.info(`NewsAPI: Ingested ${inserted} articles`);
  } catch (err) {
    logger.error('NewsAPI ingestion failed:', err.message);
  }
}

// Exported alias so the seed script can call it directly
async function ingestMockSignalsForSeed() {
  return ingestMockSignals();
}

module.exports = { startIngestionScheduler, ingestMockSignalsForSeed };
