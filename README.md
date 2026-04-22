# NSE — News-to-Startup Engine

> **The Bloomberg Terminal for startup intelligence.** AI-powered global system that detects emerging real-world problems and converts them into validated, evidence-backed, execution-ready startup opportunities.

---

## Product Vision

NSE solves the #1 problem facing founders: **finding validated startup ideas faster than competitors**.

Instead of guessing or copying, NSE ingests 500+ real-world signals (news, Reddit, regulatory changes, product reviews) and uses a multi-agent AI pipeline to surface emerging problems with:

- **Evidence trail** (Reddit quotes, news citations, regulatory refs)
- **Opportunity scoring** (5-factor weighted system)
- **72-hour MVP plan** (step-by-step build guide)
- **Competitor gap map** (where to attack)
- **Pre-mortem analysis** (why it might fail + how to mitigate)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NSE SYSTEM ARCHITECTURE                     │
├─────────────────┬───────────────────────┬───────────────────────────┤
│   DATA LAYER    │    AI ENGINE LAYER     │      API/UI LAYER         │
├─────────────────┼───────────────────────┼───────────────────────────┤
│                 │                       │                           │
│  NewsAPI ──────►│ Signal Collector      │  REST API (Express)       │
│  Reddit API ───►│ Trend Delta Agent     │  ├── GET /signals         │
│  RSS Feeds ────►│ Clustering Agent      │  ├── GET /ideas           │
│  Regulatory ───►│ Friction Extractor    │  ├── POST /ideas/generate │
│  G2/Capterra ──►│ Validation Agent      │  ├── GET /clusters        │
│                 │ Risk/Kill-Switch       │  ├── POST /watchlist      │
│  MongoDB ◄─────►│ Blueprint Agent       │  └── GET /analytics       │
│  Redis ◄───────►│                       │                           │
│  Pinecone ◄────►│  OpenAI GPT-4         │  React Frontend           │
│                 │  text-embedding-3     │  ├── Dashboard (heatmap)  │
│                 │                       │  ├── Ideas Browser        │
│                 │                       │  ├── Context Drawer       │
│                 │                       │  ├── Builder Mode         │
│                 │                       │  ├── Pivot Slider         │
│                 │                       │  ├── Command Bar (⌘K)     │
│                 │                       │  └── Watchlist            │
└─────────────────┴───────────────────────┴───────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, TanStack Query |
| Backend | Node.js, Express, JWT Auth |
| Database | MongoDB 7 (primary), Redis (cache/queues) |
| AI | OpenAI GPT-4 Turbo, text-embedding-3-small |
| Deployment | Docker, docker-compose, Nginx |
| Monitoring | Winston logging, /health endpoint |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (optional but recommended)
- MongoDB (local or Atlas)
- OpenAI API key (optional — works with mock data)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/nse.git
cd nse

# Install all dependencies (backend + frontend)
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# The backend/.env file is pre-filled with safe dev defaults.
# No changes needed to run locally.
# Optionally add your OpenAI key for real AI generation:
# OPENAI_API_KEY=sk-...   (leave blank to use rich mock data)
```

### 3. Start MongoDB (pick one)

```bash
# Option A — Docker (easiest)
docker run -d -p 27017:27017 --name mongo mongo:7

# Option B — MongoDB installed locally
mongod --dbpath /data/db

# Option C — MongoDB Atlas free tier
# Set MONGODB_URI in backend/.env to your Atlas connection string
```

### 4. Seed Demo Data (optional but recommended)

```bash
cd backend
npm run seed
# Creates demo@nse.ai / demo1234 + sample signals & ideas
```

### 5. Start the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev
# → http://localhost:4000
# → http://localhost:4000/health  (health check)

# Terminal 2 — Frontend
cd frontend
npm run dev
# → http://localhost:5173
```

### 6. Login

- Open http://localhost:5173
- Use **demo@nse.ai** / **demo1234**  (seeded Founder account)
- Or register a new free account

### 7. Run with Docker (full stack)

```bash
cd nse
docker-compose up -d
# Frontend: http://localhost
# Backend:  http://localhost:4000
# MongoDB + Redis included
```

### Demo Mode (No MongoDB needed)

The app works **without MongoDB** — it falls back to in-memory mock data:
- Signals and ideas served from built-in mock datasets
- Full UI, scoring, evidence trail, MVP plans all work
- Great for quick demos and development without any setup

---

## API Documentation

### Authentication

All protected routes require: `Authorization: Bearer <token>`

#### POST /api/auth/register
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "securepass" }
```
Returns: `{ token, user }`

#### POST /api/auth/login
```json
{ "email": "jane@example.com", "password": "securepass" }
```
Returns: `{ token, user }`

### Ideas

#### GET /api/ideas
Query params: `page, limit, industry, trendPhase, minScore, sort, search, featured`

```json
{
  "ideas": [...],
  "pagination": { "page": 1, "limit": 20, "total": 156, "pages": 8 }
}
```

#### GET /api/ideas/:id
Returns full idea object with evidence, execution plan, competitors.

#### POST /api/ideas/generate (Pro+)
```json
{
  "industry": "FinTech",
  "fundingModel": "bootstrapped",
  "customPrompt": "Focus on solo founders"
}
```
Returns: Complete validated startup opportunity.

### Signals

#### GET /api/signals
Query params: `page, limit, sourceType, minScore, startDate, endDate`

#### GET /api/signals/heatmap
Returns aggregated heatmap data by industry.

#### GET /api/signals/meta/trending
Returns top 10 highest-scored recent signals.

### Trends

#### GET /api/trends
Returns: `{ byIndustry, byPhase, velocity }`

### Watchlist (Auth required)

#### GET /api/watchlist
#### POST /api/watchlist — `{ name, description, keywords, industries }`
#### POST /api/watchlist/:id/add-idea — `{ ideaId }`
#### DELETE /api/watchlist/:id

### Validation

#### GET /api/validation/:id
Returns full validation report with kill-switches, opportunity windows, PMF indicators.

---

## Monetization Model

| Tier | Price | Key Features |
|------|-------|-------------|
| Free | $0 | 5 ideas/mo, 20 signals/day, basic scoring |
| Pro | $29/mo | 100 ideas, full evidence trail, MVP plans, watchlist |
| Founder | $99/mo | Unlimited, VC reports, white-label, API key |
| Enterprise | $10k+/yr | Custom API, dedicated infra, SLA, white-label |

**Additional Revenue Streams:**
- VC Intelligence Reports (PDF, $299/report)
- Trend Forecasting Reports (quarterly, $499)
- API Licensing (enterprise, volume pricing)
- White-label Dashboards ($5k-50k setup fee)

---

## Scaling Plan

```
Phase 1 (0-1K users):   $0-500/mo infra
├── Single backend instance
├── MongoDB Atlas M10 ($57/mo)
└── Redis Cloud 30MB (free)

Phase 2 (1K-10K users): $500-3K/mo infra
├── 3 backend instances + Nginx LB
├── MongoDB Atlas M30 ($540/mo)
├── Redis Cluster
└── Separate AI worker (FastAPI + Celery)

Phase 3 (10K-100K):     $3K-15K/mo infra
├── Kubernetes orchestration
├── Kafka for event streaming
├── ClickHouse for analytics
└── Pinecone for vector search

Phase 4 ($10M ARR):     $15K+/mo infra
├── Multi-region (US/EU/APAC)
├── Custom fine-tuned models
├── WebSocket real-time streaming
└── SOC 2 Type II compliance
```

---

## Project Structure

```
nse/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app entry
│   │   ├── config/
│   │   │   ├── database.js        # MongoDB connection
│   │   │   └── redis.js           # Redis + mock cache
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT + tier-based RBAC
│   │   │   └── errorHandler.js    # Global error handler
│   │   ├── models/
│   │   │   ├── User.js            # User + tier system
│   │   │   ├── Signal.js          # World signal schema
│   │   │   ├── Idea.js            # Full opportunity schema
│   │   │   ├── Cluster.js         # Problem cluster schema
│   │   │   └── Watchlist.js       # User watchlists
│   │   ├── routes/
│   │   │   ├── auth.js            # Register/login/me
│   │   │   ├── ideas.js           # CRUD + AI generation
│   │   │   ├── signals.js         # Signal feed + heatmap
│   │   │   ├── clusters.js        # Cluster browsing
│   │   │   ├── trends.js          # Trend analytics
│   │   │   ├── watchlist.js       # User watchlists
│   │   │   ├── validation.js      # Idea validation engine
│   │   │   ├── users.js           # Profile + usage
│   │   │   └── analytics.js       # Overview stats
│   │   ├── services/
│   │   │   ├── aiService.js       # OpenAI + mock generation
│   │   │   ├── validationService.js # 5-factor scoring engine
│   │   │   └── ingestionScheduler.js# Cron + data ingestion
│   │   └── utils/
│   │       └── logger.js          # Winston logger
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Router + lazy loading
│   │   ├── main.jsx               # React entry + providers
│   │   ├── pages/
│   │   │   ├── Landing.jsx        # Public landing page
│   │   │   ├── Dashboard.jsx      # Main intelligence hub
│   │   │   ├── Ideas.jsx          # Opportunity browser
│   │   │   ├── IdeaDetail.jsx     # Full analysis + pivot slider
│   │   │   ├── Builder.jsx        # AI generation + checklist
│   │   │   ├── Signals.jsx        # Live signal feed
│   │   │   ├── Watchlist.jsx      # Saved ideas + alerts
│   │   │   ├── Login.jsx          # Auth pages
│   │   │   └── Pricing.jsx        # Pricing tiers
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Layout.jsx     # Sidebar + topbar shell
│   │   │       ├── CommandBar.jsx # ⌘K command palette
│   │   │       └── ScoreRing.jsx  # Animated score ring
│   │   ├── store/
│   │   │   └── authStore.js       # Zustand auth state
│   │   ├── utils/
│   │   │   └── api.js             # Axios client + all APIs
│   │   └── styles/
│   │       └── globals.css        # Tailwind + custom vars
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── ai-engine/
│   └── AI_PIPELINE.md             # Full pipeline documentation
│
├── database/
│   └── SCHEMA.md                  # Full schema documentation
│
├── docker-compose.yml             # Full stack orchestration
├── .env.example                   # Environment template
└── README.md                      # This file
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | No* | MongoDB connection string (* uses mock if absent) |
| `REDIS_URL` | No* | Redis connection string (* uses in-memory if absent) |
| `JWT_SECRET` | Yes | Secret for JWT signing (use 256-bit random string) |
| `OPENAI_API_KEY` | No* | OpenAI API key (* uses rich mock data if absent) |
| `NEWS_API_KEY` | No | NewsAPI.org key for real signal ingestion |
| `FRONTEND_URL` | No | CORS origin (default: http://localhost:5173) |
| `PORT` | No | Backend port (default: 4000) |

---

## Demo Credentials

The app auto-seeds with demo data. Register any account to explore:
```
Email: any valid email
Password: minimum 8 characters
```

Or use the "Demo Account" button on the login page.

---

## License

MIT License — See LICENSE file for details.

---

*NSE — Built for founders who want to move faster than the market.*
