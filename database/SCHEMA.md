# NSE Database Schema

## Technology Stack
- **Primary DB:** MongoDB 7.0 (document store, flexible schema, horizontal scaling)
- **Cache:** Redis 7.2 (response caching, session store, rate limiting, job queues)
- **Vector DB:** Pinecone / Weaviate (production embedding search, 1536-dim)

---

## Collections

### users
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (bcrypt hashed, not returned in queries),
  name: String,
  avatar: String | null,
  
  tier: "free" | "pro" | "founder" | "enterprise" | "admin",
  
  usage: {
    ideasGenerated: Number,    // Reset monthly
    signalsViewed: Number,
    reportsDownloaded: Number,
    apiCalls: Number,
    lastReset: Date,
  },
  
  subscription: {
    stripeCustomerId: String,
    stripePriceId: String,
    status: "active" | "cancelled" | "past_due" | "trialing",
    currentPeriodEnd: Date,
  },
  
  preferences: {
    industries: [String],
    regions: [String],
    riskTolerance: "low" | "medium" | "high",
    fundingModel: "bootstrapped" | "venture",
    notifications: { email: Boolean, watchlistAlerts: Boolean, weeklyDigest: Boolean },
  },
  
  apiKey: String | null (unique, sparse),
  lastLogin: Date,
  isActive: Boolean,
  emailVerified: Boolean,
  createdAt: Date,
  updatedAt: Date,
}
```
**Indexes:** email (unique), tier, apiKey (sparse unique)

---

### signals
```javascript
{
  _id: ObjectId,
  title: String,
  content: String,
  summary: String,
  
  source: {
    type: "news" | "reddit" | "rss" | "regulatory" | "review" | "trends",
    name: String,          // e.g. "TechCrunch", "r/startups"
    url: String,
    domain: String,
    credibilityScore: Number (0-1),
  },
  
  metadata: {
    publishedAt: Date,
    author: String,
    language: String,
    region: String,
    upvotes: Number,       // Reddit upvotes
    comments: Number,
    engagement: Number,    // Computed engagement score
  },
  
  analysis: {
    sentiment: { score: Number (-1 to 1), label: String },
    topics: [String],
    entities: [{ text: String, type: String, relevance: Number }],
    keywords: [{ word: String, frequency: Number, tfidf: Number }],
    frictionPoints: [{ description: String, intensity: Number (0-1), category: String }],
    painIntensity: Number (0-1),
  },
  
  categorization: {
    industry: String (indexed),
    subIndustry: String,
    problemCategory: String,
    tags: [String],
  },
  
  scoring: {
    relevanceScore: Number (0-1),
    urgencyScore: Number (0-1),
    noveltyScore: Number (0-1),
    compositeScore: Number (0-1),
  },
  
  embedding: [Number] (1536 dims, NOT selected by default),
  clusterId: ObjectId → clusters,
  processed: Boolean (indexed),
  hash: String (SHA-256, unique indexed),
  deduplicatedFrom: [ObjectId],
  
  createdAt: Date,
  updatedAt: Date,
}
```
**Indexes:** hash (unique), createdAt desc, industry+compositeScore, source.type+publishedAt

---

### ideas
```javascript
{
  _id: ObjectId,
  title: String,
  tagline: String,
  description: String,
  problemStatement: String,
  solution: String,
  
  category: {
    industry: String (indexed),
    subIndustry: String,
    tags: [String],
  },
  
  scoring: {
    opportunityScore: Number (0-100, indexed),
    components: {
      trendStrength:      { score: Number, weight: 0.30, weighted: Number },
      painIntensity:      { score: Number, weight: 0.25, weighted: Number },
      marketSize:         { score: Number, weight: 0.20, weighted: Number },
      competitionDensity: { score: Number, weight: 0.15, weighted: Number },
      executionComplexity:{ score: Number, weight: 0.10, weighted: Number },
    },
    deltaScore: Number (0-1),
    trendPhase: "Emerging" | "Growing" | "Peak" | "Declining",
    whyNowScore: Number,
    failureProbability: Number (0-1),
  },
  
  evidence: {
    redditQuotes: [{ text, subreddit, upvotes, url, sentiment, postedAt }],
    newsCitations: [{ title, source, url, publishedAt, relevanceScore }],
    regulatoryReferences: [{ title, body, url, region, effectiveDate }],
    marketData: { tam, sam, som, growthRate, sources: [String] },
  },
  
  competitors: [{ name, url, funding, weaknesses: [String], gapOpportunity, riskLevel }],
  competitorGhostingInsights: [String],
  
  whyNow: {
    triggers: [String],
    technologicalEnablers: [String],
    marketShifts: [String],
    regulatoryChanges: [String],
    timeWindow: String,
  },
  
  risks: {
    regulatory: [{ description, severity, region }],
    technical: [String],
    market: [String],
    premortem: [{ scenario, probability, mitigation }],
    overallRisk: "low" | "medium" | "high" | "critical",
  },
  
  execution: {
    mvpPlan: {
      hours24: [{ step, tools: [String], outcome }],
      hours48: [{ step, tools: [String], outcome }],
      hours72: [{ step, tools: [String], outcome }],
      techStack: { frontend, backend, database, ai, infra },
      estimatedCost: String,
    },
    smokeTest: {
      landingPageCopy: { headline, subheadline, cta, bullets },
      adCopies: [{ platform, headline, body, targetAudience }],
      valuePropositions: [String],
      successMetrics: [String],
    },
    personas: [{ name, role, painPoints, communities, platforms, willingnessToPay, acquisitionChannel }],
  },
  
  businessModels: {
    bootstrapped: { revenueModel, pricing, monthsToRevenue, initialCapitalRequired },
    venture: { revenueModel, pricing, fundingRequired, useOfFunds, projectedARR },
  },
  
  signals: [ObjectId → signals],
  clusterId: ObjectId → clusters,
  embedding: [Number] (1536 dims, NOT selected by default),
  
  generatedBy: ObjectId → users,
  isPublic: Boolean (indexed),
  isFeatured: Boolean (indexed),
  views: Number,
  saves: Number,
  aiModel: String,
  
  createdAt: Date,
  updatedAt: Date,
}
```
**Indexes:** opportunityScore desc, industry+score, trendPhase+createdAt, text (full-text)

---

### clusters
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  centroidEmbedding: [Number] (not returned by default),
  theme: String,
  industry: String (indexed),
  tags: [String],
  signalCount: Number,
  ideaCount: Number,
  momentum: Number (0-1),
  trendPhase: "Emerging" | "Growing" | "Peak" | "Declining",
  topSignals: [ObjectId → signals],
  topIdeas: [ObjectId → ideas],
  velocityHistory: [{ date, signalCount, momentum }],
  createdAt: Date,
  updatedAt: Date,
}
```

---

### watchlists
```javascript
{
  _id: ObjectId,
  userId: ObjectId → users (indexed),
  name: String,
  description: String,
  ideas: [ObjectId → ideas],
  clusters: [ObjectId → clusters],
  keywords: [String],
  industries: [String],
  alerts: {
    enabled: Boolean,
    frequency: "realtime" | "daily" | "weekly",
    email: Boolean,
  },
  lastAlertAt: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

---

## Redis Key Schema

```
# Cached API responses (TTL in seconds)
idea:{id}:{tier}          → JSON idea (300s)
ideas:list:{hash}         → JSON paginated list (120s)
signals:heatmap           → JSON heatmap data (600s)
signals:trending          → JSON trending signals (300s)
clusters:all              → JSON cluster list (300s)
analytics:overview        → JSON analytics (300s)
trends:global             → JSON trend data (600s)

# Rate limiting
rl:global:{ip}            → Request count (900s window)
rl:ai:{userId}            → AI generation count (60s window)

# Session
session:{token}           → User ID (86400s)

# Job queues
bull:signals              → Signal ingestion queue
bull:embeddings           → Embedding generation queue
bull:alerts               → Watchlist alert queue
```

---

## Relationships

```
User ──────────────── generates ──→ Idea (many)
User ──────────────── owns ───────→ Watchlist (many)
Watchlist ─────────── tracks ────→ Idea (many-to-many)
Idea ──────────────── derived from→ Signal (many-to-many)
Signal ────────────── belongs to ─→ Cluster (many-to-one)
Idea ──────────────── belongs to ─→ Cluster (many-to-one)
```
