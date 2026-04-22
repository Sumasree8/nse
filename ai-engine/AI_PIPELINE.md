# NSE AI Pipeline Architecture

## Overview

NSE's intelligence core is a multi-agent pipeline that transforms raw world signals 
into validated, execution-ready startup opportunities.

```
WORLD                AI ENGINE              OUTPUT
─────          ─────────────────────      ──────────────────
News    ──→    Signal Collector Agent ──→  Raw Signal Store
Reddit  ──→    ↓                          ↓
RSS     ──→    Trend Delta Agent     ──→  Delta Score (0-1)
Reg.    ──→    ↓                          ↓
Reviews ──→    Clustering Agent      ──→  Problem Clusters
               ↓                          ↓
               Friction Extractor    ──→  Pain Points
               ↓                          ↓
               Validation Agent      ──→  Opportunity Score
               ↓                          ↓
               Risk/Kill-Switch      ──→  Risk Flags
               ↓                          ↓
               Execution Blueprint   ──→  MVP Plan + Personas
```

---

## Agent Specifications

### 1. Signal Collector Agent
**Role:** Ingest and normalize data from heterogeneous sources
**Inputs:** NewsAPI, Reddit API, RSS feeds, regulatory DBs, G2/Capterra reviews
**Processing:**
- Rate-limited async fetching (queue-based via Bull/Redis)
- SHA-256 content hashing for deduplication
- Language detection + translation normalization
- Credibility scoring per source (0-1)
**Outputs:** Normalized `Signal` documents in MongoDB

```javascript
// Signal queue processing
const signalQueue = new Bull('signals', redisConfig);
signalQueue.process(async (job) => {
  const { rawSignal, source } = job.data;
  const hash = sha256(rawSignal.url || rawSignal.title);
  if (await Signal.exists({ hash })) return; // Dedup
  await normalizeAndStore(rawSignal, source, hash);
});
```

### 2. Trend Delta Detection Agent
**Role:** Identify frequency acceleration and sentiment shifts
**Algorithm:**
```
Delta Score = w1 * FrequencyGrowth + w2 * SentimentShift + w3 * CrossSourceValidation + w4 * GeographicExpansion

Where:
  FrequencyGrowth   = (mentions_t - mentions_t-7) / mentions_t-7
  SentimentShift    = abs(sentiment_t - sentiment_baseline)
  CrossSourceValidation = unique_source_types / total_sources
  GeographicExpansion   = unique_regions / total_mentions
  
Weights: w1=0.40, w2=0.25, w3=0.20, w4=0.15
```

**Trend Phase Classification:**
| Delta Score | Trend Phase |
|------------|-------------|
| 0.0 - 0.3  | Declining   |
| 0.3 - 0.5  | Peak        |
| 0.5 - 0.75 | Growing     |
| 0.75 - 1.0 | Emerging    |

### 3. Clustering Agent (Embeddings)
**Role:** Group semantically similar problems across industries
**Technology:** OpenAI text-embedding-3-small (1536 dimensions)
**Algorithm:** K-means clustering with dynamic k selection (elbow method)
**Use cases:**
- Finding pattern clusters across industries
- "Ideas like this" semantic search
- Detecting cross-industry problem patterns

```python
from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('text-embedding-3-small')
embeddings = model.encode([s.content for s in signals])
kmeans = KMeans(n_clusters=optimal_k, random_state=42)
cluster_labels = kmeans.fit_predict(embeddings)
```

### 4. Friction Extraction Agent
**Role:** Identify and quantify user pain points from signals
**Prompt architecture:**
```
System: You are a customer pain extraction expert. Given text describing 
        a problem or complaint, identify discrete friction points.
        
User: Extract friction points from: "{signal_content}"
      Return JSON: { frictionPoints: [{ description, intensity(0-1), category }] }
```
**Categories:** workflow, cost, time, quality, compliance, access, integration

### 5. Validation Agent (Opportunity Scoring)
**Role:** Score each opportunity across 5 weighted dimensions
**Formula:**
```
OpportunityScore = (TrendStrength × 0.30) + (PainIntensity × 0.25) + 
                   (MarketSize × 0.20) + (CompetitionDensity × 0.15) + 
                   (ExecutionComplexity × 0.10)

All inputs normalized to 0-100 scale.
```

**Scoring sub-models:**
- **TrendStrength:** Delta score × signal frequency × cross-source validation
- **PainIntensity:** Reddit upvote-weighted sentiment × complaint frequency
- **MarketSize:** TAM estimation via industry classification + growth rate
- **CompetitionDensity:** Inverse of competitor count × funding levels
- **ExecutionComplexity:** Tech stack depth × regulatory barriers × team size required

### 6. Risk / Kill-Switch Agent
**Role:** Pre-mortem failure simulation + regulatory risk scanning
**Kill-switches triggered when:**
- Regulatory risk = critical AND no clear compliance path
- ExecutionComplexity < 20 (unfeasibly complex for MVP)
- CompetitionDensity < 10 (market completely dominated)
- Estimated failure probability > 0.75

**Pre-mortem simulation prompt:**
```
Generate 3 realistic failure scenarios for this startup:
"{idea_description}"

For each scenario: probability (0-1), description, mitigation strategy
Return as JSON array.
```

### 7. Execution Blueprint Agent
**Role:** Generate actionable 72-hour build plan
**Outputs:**
- Hour-by-hour build guide (0-24h, 24-48h, 48-72h)
- Technology stack recommendations
- Landing page copy + ad creatives
- Target persona definitions with acquisition channels
- Business model with pricing tiers (bootstrapped + venture)

**Prompt template:**
```
You are a serial founder and YC mentor. Generate a detailed 72-hour MVP plan for:
Title: {idea.title}
Problem: {idea.problemStatement}
Solution: {idea.solution}
Funding model: {fundingModel}

Include: step-by-step actions, specific tools, expected outcomes, tech stack.
Return JSON conforming to ExecutionBlueprint schema.
```

---

## Signal Flow

```
1. INGESTION (every 15 min)
   NewsAPI + Reddit + RSS → Bull Queue → Signal Collector Agent
   → Dedup Check → Normalize → Store in MongoDB

2. ANALYSIS (per signal, async)
   Raw Signal → Friction Extractor → Sentiment Analysis
   → Embedding Generation → Cluster Assignment

3. DELTA DETECTION (every 60 min)  
   Signal Window (7-day) → Delta Calculator → Trend Phase Assignment
   → Cluster Momentum Update

4. IDEA GENERATION (on-demand)
   User Request → Industry/Cluster Context → Top Signals
   → Validation Agent → Risk Agent → Blueprint Agent
   → Full Opportunity Object → MongoDB → Cache

5. CACHE INVALIDATION
   Redis TTL: Ideas (5 min), Signals (2 min), Heatmap (10 min)
   Invalidated on: new idea generation, score changes
```

---

## Vector Intelligence System

### Storage
- **Development:** Cosine similarity computed in-memory from MongoDB embeddings
- **Production:** Pinecone / Weaviate for ANN (approximate nearest neighbor) search

### Semantic Search
```javascript
// Find similar ideas using embedding cosine similarity
async function findSimilarIdeas(ideaId, limit = 5) {
  const target = await Idea.findById(ideaId).select('embedding');
  const candidates = await Idea.find({ _id: { $ne: ideaId } }).select('embedding title');
  
  return candidates
    .map(c => ({ ...c._doc, similarity: cosineSimilarity(target.embedding, c.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
```

### Cluster Detection
- Minimum 5 signals to form a cluster
- Clusters updated every 4 hours via background job
- Momentum score: signal velocity in last 7 days

---

## Evidence Trust System

Every opportunity includes a traceable evidence graph:

```
Opportunity
├── RedditQuotes[]
│   ├── text (verbatim)
│   ├── subreddit
│   ├── upvotes (engagement weight)
│   └── sentiment_label
├── NewsCitations[]
│   ├── title + source
│   ├── publishedAt
│   └── relevanceScore (cosine similarity to idea)
├── RegulatoryReferences[]
│   ├── body + jurisdiction
│   └── effectiveDate
└── MarketData
    ├── TAM / SAM / SOM
    ├── growthRate
    └── sources[]
```

Evidence is never fabricated — all citations link to real or structured mock data 
with proper source attribution.

---

## Scaling Plan

### Phase 1 (0-1K users): Current Architecture
- Single backend instance
- MongoDB Atlas M10
- Redis Cloud free tier
- OpenAI API (rate limited)

### Phase 2 (1K-10K users): Horizontal Scaling
- Backend → 3 instances behind load balancer (Nginx)
- MongoDB Atlas M30 (dedicated)
- Redis Cluster (3 nodes)
- Separate AI worker service (FastAPI + Celery)
- Pinecone for vector search

### Phase 3 (10K-100K users): Microservices
- Separate services: Ingestion, AI, Validation, User, Analytics
- Kafka for event streaming between services
- ClickHouse for analytics (high-write timeseries)
- CDN for static assets + API response caching
- Multi-region deployment (US, EU, APAC)

### Phase 4 ($10M ARR): Enterprise Grade
- Custom ML models (fine-tuned on domain data)
- Real-time WebSocket signal streaming
- GraphQL API for enterprise clients
- Dedicated tenant isolation
- SOC 2 Type II compliance
