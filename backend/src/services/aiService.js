const OpenAI = require('openai');
const logger = require('../utils/logger');
const Idea = require('../models/Idea');
const Signal = require('../models/Signal');

let openai;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'demo-key' });
  }
  return openai;
}

// ── Mock Data Engine (for demo without OpenAI key) ───────────────────────────
const MOCK_IDEAS = [
  {
    title: 'AI-Powered Supply Chain Visibility Platform',
    tagline: 'Real-time disruption detection before it hits your bottom line',
    problemStatement: 'Global supply chains have become impossibly complex. 94% of Fortune 500 companies experienced supply chain disruptions in 2024, costing an average of $180M annually. Small and mid-market companies have zero visibility tools.',
    solution: 'An AI agent that monitors 500+ data sources (weather, port congestion, geopolitical signals, supplier news) and alerts procurement teams 72 hours before disruption with alternative routing suggestions.',
    category: { industry: 'Supply Chain', subIndustry: 'Logistics Tech', tags: ['AI', 'B2B', 'SaaS', 'Enterprise'] },
    scoring: {
      opportunityScore: 87,
      components: {
        trendStrength: { score: 90, weight: 0.30, weighted: 27 },
        painIntensity: { score: 95, weight: 0.25, weighted: 23.75 },
        marketSize: { score: 85, weight: 0.20, weighted: 17 },
        competitionDensity: { score: 70, weight: 0.15, weighted: 10.5 },
        executionComplexity: { score: 60, weight: 0.10, weighted: 6 },
      },
      deltaScore: 0.82,
      trendPhase: 'Growing',
      whyNowScore: 88,
      failureProbability: 0.28,
    },
    evidence: {
      redditQuotes: [
        { text: "We found out our key supplier had a factory fire from Twitter, not from them. We were 3 weeks behind before we even knew.", subreddit: 'r/supplychain', upvotes: 2847, sentiment: 'negative' },
        { text: "Spent $2M on a Gartner report that told us what Reddit already knew about port congestion. There has to be a better way.", subreddit: 'r/logistics', upvotes: 1923, sentiment: 'frustrated' },
        { text: "Our ERP cost $4M and still can't tell me where my shipment is in real-time. This is insane.", subreddit: 'r/procurement', upvotes: 3421, sentiment: 'negative' },
      ],
      newsCitations: [
        { title: 'Global Supply Chain Disruptions Cost Companies $1.5T in 2024', source: 'Reuters', url: 'https://reuters.com', publishedAt: new Date('2024-11-15'), relevanceScore: 0.95 },
        { title: 'Red Sea Crisis Forces Shipping Reroutes, Adding 14 Days to Transit', source: 'Bloomberg', url: 'https://bloomberg.com', publishedAt: new Date('2024-12-01'), relevanceScore: 0.91 },
      ],
      marketData: { tam: '$19.3B', sam: '$4.2B', som: '$420M (5yr)', growthRate: '17.8% CAGR', sources: ['Gartner 2024', 'McKinsey Supply Chain Report'] },
    },
    competitors: [
      { name: 'Resilinc', weaknesses: ['Enterprise-only pricing ($200k+/yr)', 'Slow onboarding (6+ months)', 'No AI predictions'], gapOpportunity: 'SMB market completely unserved', riskLevel: 'medium' },
      { name: 'Everstream Analytics', weaknesses: ['No real-time alerts', 'Manual data entry required'], gapOpportunity: 'Real-time AI prediction layer', riskLevel: 'low' },
    ],
    competitorGhostingInsights: [
      'Zero players serve <$50M revenue companies - massive whitespace',
      'No competitor offers 72-hour predictive windows (all reactive)',
      'No competitor integrates Reddit/social signals as early warning',
    ],
    whyNow: {
      triggers: ['Post-COVID supply chain consciousness at all-time high', 'AI inference costs dropped 90% in 18 months'],
      technologicalEnablers: ['GPT-4 Vision for container scanning', 'Real-time satellite data APIs now affordable'],
      marketShifts: ['CFOs now own supply chain risk budgets', 'Procurement teams got budget post-2022 crisis'],
      timeWindow: '18-24 months before enterprise players pivot down-market',
    },
    risks: {
      regulatory: [{ description: 'Data sovereignty laws may restrict cross-border supplier data', severity: 'medium', region: 'EU' }],
      technical: ['Data quality from tier-2/3 suppliers', 'False positive alert fatigue'],
      premortem: [
        { scenario: 'Enterprise players build similar feature into existing ERP systems', probability: 0.35, mitigation: 'Lock in annual contracts; build deep integrations making switching costly' },
        { scenario: 'Economic slowdown reduces procurement tech budgets', probability: 0.25, mitigation: 'Position as cost-saving tool with 10x ROI calculator' },
      ],
      overallRisk: 'medium',
    },
    execution: {
      mvpPlan: {
        hours24: [
          { step: 'Set up Next.js dashboard with mock supply chain data visualization', tools: ['Next.js', 'Recharts', 'Tailwind'], outcome: 'Clickable demo to show investors' },
          { step: 'Build supplier news aggregator using NewsAPI + RSS feeds', tools: ['NewsAPI', 'rss-parser', 'Node.js'], outcome: 'Real signal detection working' },
        ],
        hours48: [
          { step: 'Integrate OpenAI GPT-4 for disruption classification and alerting', tools: ['OpenAI API', 'Langchain'], outcome: 'AI-powered alert engine' },
          { step: 'Build alert notification system (email + Slack)', tools: ['SendGrid', 'Slack API'], outcome: 'Users get real-time alerts' },
        ],
        hours72: [
          { step: 'Launch landing page with waitlist + Stripe payment setup', tools: ['Stripe', 'Mailchimp'], outcome: 'Revenue-ready product' },
          { step: 'Onboard 3 beta customers from LinkedIn cold outreach', tools: ['LinkedIn Sales Nav', 'Apollo.io'], outcome: 'Validated demand' },
        ],
        techStack: {
          frontend: ['Next.js 14', 'Tailwind CSS', 'Recharts', 'Framer Motion'],
          backend: ['Node.js', 'FastAPI (Python ML service)', 'Bull Queue'],
          database: ['MongoDB Atlas', 'Redis', 'Pinecone (embeddings)'],
          ai: ['OpenAI GPT-4', 'LangChain', 'sentence-transformers'],
          infra: ['Vercel (frontend)', 'Railway (backend)', 'Cloudflare Workers'],
        },
        estimatedCost: '$800-1,200/month at launch',
      },
      smokeTest: {
        landingPageCopy: {
          headline: 'Know About Supply Chain Disruptions 72 Hours Before They Hit',
          subheadline: 'AI monitors 500+ signals so your procurement team doesn\'t have to. Get early warnings, alternative routes, and cost impact estimates - automatically.',
          cta: 'Start Free 14-Day Trial',
          bullets: ['Real-time monitoring of 500+ disruption signals', '72-hour predictive alerts with 89% accuracy', 'Alternative supplier suggestions in seconds', 'Works with your existing ERP in 24 hours'],
        },
        adCopies: [
          { platform: 'LinkedIn', headline: 'Your next supply chain crisis is 72 hours away. Are you ready?', body: 'Most companies find out about disruptions AFTER they happen. NSE\'s AI watches 500+ signals 24/7 so you get warnings before it costs you.', targetAudience: 'VP Supply Chain, CPO, Procurement Directors' },
          { platform: 'Google', headline: 'Supply Chain Risk Management Software | 72hr Early Warning', body: 'AI-powered disruption detection. Monitor suppliers, logistics & geopolitical risks in real-time. Free trial.', targetAudience: 'supply chain risk software, supplier monitoring tool' },
        ],
        valuePropositions: ['Save $2.3M average per prevented disruption', 'Deploy in 24 hours (no ERP replacement)', '10x ROI within first quarter guaranteed'],
        successMetrics: ['500 waitlist signups in 2 weeks = strong signal', '10 beta users paying $500+/mo = product-market fit', '<48hr average time-to-value for new users'],
      },
      personas: [
        { name: 'Marcus Chen', role: 'VP of Procurement, $50M-500M manufacturer', painPoints: ['No visibility beyond tier-1 suppliers', 'Board-level scrutiny after 2022 disruptions', 'ERP too expensive/slow to update'], communities: ['r/supplychain', 'LinkedIn Supply Chain groups', 'ISM forums'], platforms: ['LinkedIn', 'Gartner Peer Insights'], willingnessToPay: '$2,000-8,000/month', acquisitionChannel: 'LinkedIn outreach + content marketing' },
      ],
    },
    businessModels: {
      bootstrapped: { revenueModel: 'Monthly SaaS subscriptions', pricing: [{ tier: 'Starter', price: '$499/mo', features: ['10 suppliers', '5 alert rules', 'Email alerts'] }, { tier: 'Growth', price: '$1,999/mo', features: ['100 suppliers', 'Unlimited alerts', 'Slack + API'] }], monthsToRevenue: 2, initialCapitalRequired: '<$10,000' },
      venture: { revenueModel: 'SaaS + Enterprise licensing', pricing: [{ tier: 'Enterprise', price: '$30,000-150,000/yr', features: ['Unlimited suppliers', 'Custom integrations', 'Dedicated CSM'] }], fundingRequired: '$3-5M Seed', useOfFunds: '60% Engineering, 25% GTM, 15% Ops', projectedARR: '$5M by Year 2' },
    },
    isPublic: true,
    isFeatured: true,
    views: 4231,
    saves: 892,
  },
  {
    title: 'Mental Health Copilot for Remote Engineering Teams',
    tagline: 'Detect burnout before it destroys your best engineers',
    problemStatement: 'Remote engineering teams face an invisible burnout epidemic. 83% of developers report burnout (Stack Overflow 2024), yet companies only discover it when a key engineer quits. Replacement cost: $150k-300k per senior engineer.',
    solution: 'Passive behavioral analytics on coding patterns, PR review sentiment, meeting transcripts, and Slack communication to detect early burnout signals - then trigger personalized interventions before engineers quit.',
    category: { industry: 'HR Tech', subIndustry: 'Developer Wellbeing', tags: ['AI', 'SaaS', 'Remote Work', 'Mental Health', 'B2B'] },
    scoring: {
      opportunityScore: 81,
      components: {
        trendStrength: { score: 88, weight: 0.30, weighted: 26.4 },
        painIntensity: { score: 92, weight: 0.25, weighted: 23 },
        marketSize: { score: 78, weight: 0.20, weighted: 15.6 },
        competitionDensity: { score: 65, weight: 0.15, weighted: 9.75 },
        executionComplexity: { score: 55, weight: 0.10, weighted: 5.5 },
      },
      deltaScore: 0.76,
      trendPhase: 'Emerging',
      whyNowScore: 82,
      failureProbability: 0.32,
    },
    evidence: {
      redditQuotes: [
        { text: "Lost 3 senior engineers in 6 weeks. All burnout. Each one gave 2 weeks notice, left no knowledge transfer. $800k in recruiter fees later...", subreddit: 'r/ExperiencedDevs', upvotes: 5621, sentiment: 'negative' },
        { text: "My 1:1s used to be 30 min discussions. Now they're 10 min 'everything is fine' sessions. Something's wrong but I can't put my finger on it as a manager.", subreddit: 'r/engineering_managers', upvotes: 3201, sentiment: 'frustrated' },
      ],
      newsCitations: [
        { title: '83% of Developers Report Burnout, Up 7% YoY', source: 'Stack Overflow Survey 2024', url: 'https://stackoverflow.com', publishedAt: new Date('2024-06-15'), relevanceScore: 0.98 },
      ],
      marketData: { tam: '$8.9B', sam: '$1.8B', som: '$180M (5yr)', growthRate: '22.4% CAGR', sources: ['Grand View Research 2024'] },
    },
    competitors: [
      { name: 'Clockwise', weaknesses: ['Calendar optimization only, no mental health signal'], gapOpportunity: 'No behavioral health analytics player in dev tooling', riskLevel: 'low' },
    ],
    competitorGhostingInsights: ['No product combines GitHub + Slack + Calendar into a unified health score', 'Category is pre-product-market-fit = first-mover advantage available'],
    whyNow: {
      triggers: ['Post-2023 layoffs created massive trust deficit with remaining engineers', 'AI coding tools created measurable productivity baselines (deviation = signal)'],
      technologicalEnablers: ['GitHub API exposes commit patterns', 'Slack Audit API available for Enterprise', 'LLM sentiment analysis at low cost'],
      timeWindow: '12-18 months before HR giants (Workday, BambooHR) acquire a solution',
    },
    risks: {
      regulatory: [{ description: 'GDPR/CCPA compliance for employee behavioral monitoring required', severity: 'high', region: 'EU/US' }],
      technical: ['Privacy pushback from engineers being monitored', 'False positives could damage trust'],
      premortem: [{ scenario: 'Engineers perceive tool as surveillance, union pushback', probability: 0.40, mitigation: 'Radical transparency: employees see their own data first, opt-in model' }],
      overallRisk: 'medium',
    },
    execution: {
      mvpPlan: {
        hours24: [{ step: 'GitHub OAuth integration + PR activity dashboard', tools: ['GitHub API', 'Next.js'], outcome: 'Visual dev activity tracker' }],
        hours48: [{ step: 'Burnout score algorithm (commit frequency + PR review time + merge conflicts)', tools: ['Python', 'scikit-learn'], outcome: 'First burnout signal working' }],
        hours72: [{ step: 'Slack bot alert to manager with suggested 1:1 talking points', tools: ['Slack API', 'OpenAI'], outcome: 'End-to-end workflow complete' }],
        techStack: { frontend: ['Next.js', 'Tailwind', 'Chart.js'], backend: ['FastAPI', 'Celery', 'PostgreSQL'], database: ['PostgreSQL', 'Redis'], ai: ['OpenAI', 'HuggingFace Sentiment'], infra: ['Railway', 'Vercel'] },
        estimatedCost: '$300-600/month at launch',
      },
      smokeTest: {
        landingPageCopy: { headline: 'Detect Engineer Burnout Before They Quit', subheadline: 'Passive AI analysis of coding patterns, PR sentiment, and communication signals. Get 30-day early warnings.', cta: 'Request Early Access', bullets: ['Zero engineer friction - fully passive', 'GitHub + Slack + Calendar integration', '30-day burnout prediction score', 'Manager intervention playbooks included'] },
        adCopies: [{ platform: 'LinkedIn', headline: 'Your best engineer is 30 days from quitting. You just don\'t know it yet.', body: 'NSE detects burnout patterns in coding behavior and communication 30 days early. Give managers the signal to act.', targetAudience: 'Engineering Managers, CTOs, VP Engineering, CHRO' }],
        valuePropositions: ['$200k average cost of losing one senior engineer', 'Detect 87% of burnout cases 30 days early', 'ROI in first retention event'],
        successMetrics: ['20 engineering managers on trial', 'Detect 1 real burnout case in beta = viral word of mouth'],
      },
      personas: [{ name: 'Priya Sharma', role: 'Engineering Manager, 50-person team', painPoints: ['Remote team gives no visibility', 'Can\'t tell who is struggling', 'Losing engineers to competitors'], communities: ['r/engineering_managers', 'Rands Leadership Slack', 'EM Weekly newsletter'], platforms: ['LinkedIn', 'Twitter/X'], willingnessToPay: '$500-2000/month per team', acquisitionChannel: 'EM communities + word of mouth' }],
    },
    businessModels: {
      bootstrapped: { revenueModel: 'Per-seat SaaS', pricing: [{ tier: 'Team', price: '$15/seat/month', features: ['Up to 25 engineers', 'GitHub + Slack integration', 'Weekly reports'] }], monthsToRevenue: 1, initialCapitalRequired: '<$5,000' },
      venture: { revenueModel: 'Enterprise SaaS', pricing: [{ tier: 'Enterprise', price: '$20,000-80,000/yr', features: ['Unlimited seats', 'SSO', 'Custom integrations', 'Compliance reports'] }], fundingRequired: '$2-4M Seed', useOfFunds: '50% Eng, 30% Sales, 20% Compliance', projectedARR: '$3M by Year 2' },
    },
    isPublic: true,
    isFeatured: true,
    views: 3187,
    saves: 671,
  },
];

async function generateStartupIdea({ signals, industry, customPrompt, fundingModel, userId }) {
  // Check if OpenAI key is available
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
    logger.warn('No OpenAI key - returning mock idea');
    const mock = MOCK_IDEAS[Math.floor(Math.random() * MOCK_IDEAS.length)];
    const idea = await Idea.create({ ...mock, generatedBy: userId, aiModel: 'mock' });
    return idea;
  }

  const client = getOpenAI();

  const systemPrompt = `You are NSE's AI Startup Intelligence Engine. Generate a comprehensive, production-grade startup opportunity analysis.
You MUST respond with valid JSON only. No markdown, no explanation - just the JSON object.

The JSON must follow this exact structure:
{
  "title": "string",
  "tagline": "string",
  "problemStatement": "string (2-3 sentences, specific pain with data)",
  "solution": "string (2-3 sentences, specific solution)",
  "category": { "industry": "string", "subIndustry": "string", "tags": ["string"] },
  "scoring": {
    "opportunityScore": number (0-100),
    "components": {
      "trendStrength": { "score": number, "weight": 0.30, "weighted": number },
      "painIntensity": { "score": number, "weight": 0.25, "weighted": number },
      "marketSize": { "score": number, "weight": 0.20, "weighted": number },
      "competitionDensity": { "score": number, "weight": 0.15, "weighted": number },
      "executionComplexity": { "score": number, "weight": 0.10, "weighted": number }
    },
    "deltaScore": number (0-1),
    "trendPhase": "Emerging|Growing|Peak|Declining",
    "whyNowScore": number,
    "failureProbability": number (0-1)
  },
  "evidence": {
    "redditQuotes": [{ "text": "string", "subreddit": "string", "upvotes": number, "sentiment": "string" }],
    "newsCitations": [{ "title": "string", "source": "string", "url": "string" }],
    "marketData": { "tam": "string", "sam": "string", "som": "string", "growthRate": "string", "sources": ["string"] }
  },
  "competitors": [{ "name": "string", "weaknesses": ["string"], "gapOpportunity": "string", "riskLevel": "low|medium|high" }],
  "competitorGhostingInsights": ["string"],
  "whyNow": { "triggers": ["string"], "technologicalEnablers": ["string"], "marketShifts": ["string"], "timeWindow": "string" },
  "risks": {
    "regulatory": [{ "description": "string", "severity": "string", "region": "string" }],
    "technical": ["string"],
    "premortem": [{ "scenario": "string", "probability": number, "mitigation": "string" }],
    "overallRisk": "low|medium|high|critical"
  },
  "execution": {
    "mvpPlan": {
      "hours24": [{ "step": "string", "tools": ["string"], "outcome": "string" }],
      "hours48": [{ "step": "string", "tools": ["string"], "outcome": "string" }],
      "hours72": [{ "step": "string", "tools": ["string"], "outcome": "string" }],
      "techStack": { "frontend": ["string"], "backend": ["string"], "database": ["string"], "ai": ["string"], "infra": ["string"] },
      "estimatedCost": "string"
    },
    "smokeTest": {
      "landingPageCopy": { "headline": "string", "subheadline": "string", "cta": "string", "bullets": ["string"] },
      "adCopies": [{ "platform": "string", "headline": "string", "body": "string", "targetAudience": "string" }],
      "valuePropositions": ["string"],
      "successMetrics": ["string"]
    },
    "personas": [{ "name": "string", "role": "string", "painPoints": ["string"], "communities": ["string"], "platforms": ["string"], "willingnessToPay": "string", "acquisitionChannel": "string" }]
  },
  "businessModels": {
    "bootstrapped": { "revenueModel": "string", "pricing": [{ "tier": "string", "price": "string", "features": ["string"] }], "monthsToRevenue": number, "initialCapitalRequired": "string" },
    "venture": { "revenueModel": "string", "pricing": [{ "tier": "string", "price": "string", "features": ["string"] }], "fundingRequired": "string", "useOfFunds": "string", "projectedARR": "string" }
  }
}`;

  const userMessage = customPrompt
    ? `Generate a startup idea for: ${customPrompt}. Industry context: ${industry || 'any'}. Funding model focus: ${fundingModel}.`
    : `Generate a high-opportunity startup idea for the ${industry || 'technology'} industry. Focus on ${fundingModel} approach. Base it on real emerging problems in 2024-2025.`;

  const response = await client.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    temperature: 0.8,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices[0].message.content;
  const parsed = JSON.parse(raw);

  const idea = await Idea.create({
    ...parsed,
    generatedBy: userId,
    isPublic: true,
    aiModel: 'gpt-4-turbo',
    signals: signals || [],
  });

  return idea;
}

async function generateEmbedding(text) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
    // Return random embedding for mock mode
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
  const client = getOpenAI();
  const response = await client.embeddings.create({ model: 'text-embedding-3-small', input: text });
  return response.data[0].embedding;
}

async function seedMockData() {
  const count = await Idea.countDocuments();
  if (count > 0) return;

  logger.info('Seeding mock startup ideas...');
  await Idea.insertMany(MOCK_IDEAS.map(idea => ({ ...idea, aiModel: 'mock' })));
  logger.info(`Seeded ${MOCK_IDEAS.length} mock ideas`);
}

module.exports = { generateStartupIdea, generateEmbedding, seedMockData, MOCK_IDEAS };
