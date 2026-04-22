const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  tagline: String,
  description: String,
  problemStatement: String,
  solution: String,

  category: {
    industry: { type: String, index: true },
    subIndustry: String,
    tags: [String],
  },

  // ── Scoring System ───────────────────────────────────────────────────────────
  scoring: {
    opportunityScore: { type: Number, min: 0, max: 100, default: 0 },
    components: {
      // weight is stored as Number so it can be read back; static weights defined in service
      trendStrength:     { score: { type: Number, default: 0 }, weight: { type: Number, default: 0.30 }, weighted: { type: Number, default: 0 } },
      painIntensity:     { score: { type: Number, default: 0 }, weight: { type: Number, default: 0.25 }, weighted: { type: Number, default: 0 } },
      marketSize:        { score: { type: Number, default: 0 }, weight: { type: Number, default: 0.20 }, weighted: { type: Number, default: 0 } },
      competitionDensity:{ score: { type: Number, default: 0 }, weight: { type: Number, default: 0.15 }, weighted: { type: Number, default: 0 } },
      executionComplexity:{ score: { type: Number, default: 0 }, weight: { type: Number, default: 0.10 }, weighted: { type: Number, default: 0 } },
    },
    deltaScore:          { type: Number, min: 0, max: 1, default: 0 },
    trendPhase:          { type: String, enum: ['Emerging', 'Growing', 'Peak', 'Declining'], default: 'Emerging' },
    whyNowScore:         { type: Number, default: 0 },
    failureProbability:  { type: Number, default: 0 },
  },

  // ── Evidence & Trust Layer ──────────────────────────────────────────────────
  evidence: {
    redditQuotes: [{
      text: String,
      subreddit: String,
      upvotes: Number,
      url: String,
      sentiment: String,
      postedAt: Date,
    }],
    newsCitations: [{
      title: String,
      source: String,
      url: String,
      publishedAt: Date,
      relevanceScore: Number,
    }],
    regulatoryReferences: [{
      title: String,
      body: String,
      url: String,
      region: String,
      effectiveDate: Date,
    }],
    marketData: {
      tam: String,
      sam: String,
      som: String,
      growthRate: String,
      sources: [String],
    },
  },

  // ── Competitor Analysis ─────────────────────────────────────────────────────
  competitors: [{
    name: String,
    url: String,
    funding: String,
    weaknesses: [String],
    gapOpportunity: String,
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] },
  }],
  competitorGhostingInsights: [String],

  // ── Why Now ─────────────────────────────────────────────────────────────────
  whyNow: {
    triggers: [String],
    technologicalEnablers: [String],
    marketShifts: [String],
    regulatoryChanges: [String],
    timeWindow: String,
  },

  // ── Risk Analysis ───────────────────────────────────────────────────────────
  risks: {
    regulatory: [{ description: String, severity: String, region: String }],
    technical: [String],
    market: [String],
    premortem: [{ scenario: String, probability: Number, mitigation: String }],
    overallRisk: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
  },

  // ── Execution Blueprint ─────────────────────────────────────────────────────
  execution: {
    mvpPlan: {
      hours24: [{ step: String, tools: [String], outcome: String }],
      hours48: [{ step: String, tools: [String], outcome: String }],
      hours72: [{ step: String, tools: [String], outcome: String }],
      techStack: { frontend: [String], backend: [String], database: [String], ai: [String], infra: [String] },
      estimatedCost: String,
    },
    smokeTest: {
      landingPageCopy: { headline: String, subheadline: String, cta: String, bullets: [String] },
      adCopies: [{ platform: String, headline: String, body: String, targetAudience: String }],
      valuePropositions: [String],
      successMetrics: [String],
    },
    personas: [{
      name: String,
      role: String,
      painPoints: [String],
      communities: [String],
      platforms: [String],
      willingnessToPay: String,
      acquisitionChannel: String,
    }],
  },

  // ── Business Models ─────────────────────────────────────────────────────────
  businessModels: {
    bootstrapped: {
      revenueModel: String,
      pricing: [{ tier: String, price: String, features: [String] }],
      monthsToRevenue: Number,
      initialCapitalRequired: String,
    },
    venture: {
      revenueModel: String,
      pricing: [{ tier: String, price: String, features: [String] }],
      fundingRequired: String,
      useOfFunds: String,
      projectedARR: String,
    },
  },

  signals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Signal' }],
  clusterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cluster' },
  embedding: { type: [Number], select: false },

  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  views: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  aiModel: { type: String, default: 'claude-sonnet' },

}, { timestamps: true });

ideaSchema.index({ 'scoring.opportunityScore': -1 });
ideaSchema.index({ 'category.industry': 1, 'scoring.opportunityScore': -1 });
ideaSchema.index({ 'scoring.trendPhase': 1, createdAt: -1 });
ideaSchema.index({ '$**': 'text' });

module.exports = mongoose.model('Idea', ideaSchema);
