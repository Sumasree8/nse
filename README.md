<div align="center">

# 🛰️ NSE — News-to-Startup Engine

### The Bloomberg Terminal for startup intelligence.

**An AI system that reads the world's news in real time, verifies what's real, and turns emerging problems into validated, evidence-backed, execution-ready startup opportunities.**

[![Node](https://img.shields.io/badge/Node-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-47A248?logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Quick Start](#-quick-start) · [How It Works](#-how-it-works) · [Architecture](#-architecture) · [API](#-api-reference) · [Why It's Different](#-what-makes-nse-different)

</div>

---

## 💡 The Problem

Every founder faces the same bottleneck: **finding a validated idea before the market is saturated.** Today that means manually scanning news, Reddit threads, and regulatory filings — slow, biased, and impossible to do at global scale.

**NSE automates the entire discovery-to-validation loop.** It ingests live news every 15 minutes, filters out noise and misinformation, clusters real recurring problems, and synthesizes each one into a fully-scored opportunity with an evidence trail and a 72-hour MVP plan.

---

## ✨ What Makes NSE Different

> Most "AI idea generators" hallucinate plausible-sounding ideas from a prompt. **NSE never invents a thesis it can't back with real, corroborated news.**

| Differentiator | What it means |
|---|---|
| 🌍 **Zero-API-key real data** | Live signals from public **RSS feeds + GDELT + Reddit** — no paid data vendors required to run. |
| 🛡️ **Verification layer** | Every story is scored for credibility (per-domain trust + cross-source corroboration) and tagged `verified` / `corroborated` / `single-source` / `noise`. Noise is dropped, never stored. |
| 🧬 **Grounded synthesis** | Opportunities are clustered from real signals by **semantic embedding similarity** and require **2+ corroborating sources** — no single-story theses, no template filler. |
| 📈 **The trajectory moat** | NSE records opportunity history over time, so it can answer *"what's heating up right now?"* — a momentum view that only exists because it's been watching since day one. |
| 🔬 **Validation engine** | 5-factor opportunity scoring, kill-switches, opportunity windows, and a pre-mortem for every idea. |

---

## 🧠 How It Works

```
        ┌──────────────── INGESTION (every 15 min, no API key) ───────────────┐
        │                                                                     │
  RSS ──┤                                                                     │
GDELT ──┼─► deterministic     ─► novelty      ─► VERIFICATION  ─► NLP analysis│
Reddit ─┤   embedding            check            (credibility +    (sentiment·│
        │   (semantic            (vs recent        cross-source      industry· │
        │    fingerprint)         corpus)          corroboration)    friction) │
        │                                                              │       │
        └──────────────────────────────────────────────────────────┐  ▼       │
                                                          NOISE GATE │  MongoDB │
                                       (drops promo / off-topic /    │ (deduped │
                                        untrusted single sources)    │ by hash) │
                                                                     └──────────┘
                                                                          │
        ┌──────────────── SYNTHESIS (signals → opportunities) ───────────┘
        │
        ├─► relevance gate  (must express a real business problem)
        ├─► embedding clustering (group signals about the same thing)
        ├─► corroboration  (≥ 2 related signals required)
        └─► grounded opportunity:  score · evidence trail · 72h MVP plan
                                    competitor gaps · pre-mortem · trajectory
```

**Verification verdicts** — *"is this news actually real?"*
- 🟢 `verified` — corroborated by 2+ independent reputable domains
- 🟡 `corroborated` — 1 independent corroboration, or a single highly-credible source
- 🟠 `single-source` / `unverified` — proceed with caution
- 🔴 `noise` — filtered out, never stored

> MongoDB is required for persistence. The ingestion job **skips rather than fabricates** if the database is unreachable, so the feed is always real.
> Trigger a cycle manually (Founder tier): `POST /api/signals/ingest` · Filter by trust: `GET /api/signals?verification=verified`

---

## 🏗️ Architecture

```
┌─────────────────┬────────────────────────────┬────────────────────────────┐
│   DATA LAYER    │      AI ENGINE LAYER        │       API / UI LAYER       │
├─────────────────┼────────────────────────────┼────────────────────────────┤
│ RSS Feeds ─────►│ Source adapters             │ REST API (Express + JWT)   │
│ GDELT ─────────►│ Embedding (semantic)        │  ├─ /auth   /ideas         │
│ Reddit ────────►│ Verification + NLP          │  ├─ /signals /clusters     │
│                 │ Opportunity Synthesis       │  ├─ /trends  /validation   │
│ MongoDB 7 ◄────►│ Validation (5-factor)       │  ├─ /watchlist /trajectory │
│ Redis (cache) ◄►│ Trajectory / Outcome ledger │  └─ /analytics  /users     │
│                 │ Market Intel                │                            │
│                 │ OpenAI GPT-4 (optional)*    │ React 18 SPA (Vite)        │
│                 │                             │  ├─ Dashboard (heatmap)    │
│                 │ * Fully functional with     │  ├─ Ideas / IdeaDetail     │
│                 │   rich mock + real-signal   │  ├─ Builder · Signals      │
│                 │   synthesis when no key set │  ├─ Watchlist · Pricing    │
│                 │                             │  └─ Command Bar (⌘K)       │
└─────────────────┴────────────────────────────┴────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|-----------|
| **Frontend** | React 18 · Vite · TanStack Query · Zustand · Framer Motion · Recharts · Tailwind-style CSS · Lucide |
| **Backend** | Node.js 20 · Express · JWT auth · Helmet · rate-limiting · node-cron |
| **Database** | MongoDB 7 (Mongoose) · Redis (cache / queues) |
| **AI / NLP** | Semantic embeddings + cosine clustering · OpenAI GPT-4 Turbo *(optional)* |
| **Data Sources** | RSS (`rss-parser`) · GDELT · Reddit · Cheerio scraping |
| **DevOps** | Docker · docker-compose · Nginx · Winston logging · `/health` |

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+**
- **MongoDB** (local, Docker, or Atlas) — required for real persistence
- Docker (optional, for one-command full stack)
- OpenAI API key (**optional** — the app runs fully on real signals + mock synthesis without one)

### Option A — One command (Docker) ⚡

```bash
git clone https://github.com/Sumasree8/nse.git
cd nse
docker-compose up -d
# Frontend → http://localhost      Backend → http://localhost:4000
# MongoDB + Redis included
```

### Option B — Local dev

```bash
git clone https://github.com/Sumasree8/nse.git
cd nse

# 1. Install everything (npm workspaces)
npm run install:all

# 2. Start MongoDB (pick one)
docker run -d -p 27017:27017 --name mongo mongo:7   # easiest
# or: mongod --dbpath /data/db
# or: set MONGODB_URI in backend/.env to your Atlas string

# 3. (Optional) seed demo data — creates demo@gmail.com / demo@1234
npm run seed

# 4. Run backend + frontend together
npm run dev
# Backend  → http://localhost:4000   (health: /health)
# Frontend → http://localhost:5173
```

### Login
Open **http://localhost:5173** and either:
- Use the seeded **Founder** account → `demo@gmail.com` / `demo@1234`
- Click **Demo Account**, or register any valid email (8+ char password)

> `backend/.env` ships with safe dev defaults — no config needed to run locally. Add `OPENAI_API_KEY` only if you want live GPT-4 generation.

---

## 📡 API Reference

All protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Endpoint | Body |
|---|---|---|
| `POST` | `/api/auth/register` | `{ name, email, password }` → `{ token, user }` |
| `POST` | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| `GET`  | `/api/auth/me` | current user |

### Ideas
| Method | Endpoint | Notes |
|---|---|---|
| `GET`  | `/api/ideas` | filters: `page, limit, industry, trendPhase, minScore, sort, search, featured` |
| `GET`  | `/api/ideas/:id` | full idea — evidence, execution plan, competitors, pre-mortem |
| `POST` | `/api/ideas/generate` | *(Pro+)* `{ industry, fundingModel, customPrompt }` → validated opportunity |

### Signals
| Method | Endpoint | Notes |
|---|---|---|
| `GET`  | `/api/signals` | filters incl. `verification=verified` |
| `GET`  | `/api/signals/heatmap` | aggregated by industry |
| `GET`  | `/api/signals/meta/trending` | top 10 highest-scored recent signals |
| `POST` | `/api/signals/ingest` | *(Founder)* trigger an ingestion cycle |

### Trajectory *(the moat)*
| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/api/trajectory/rising` | momentum leaderboard — *what's heating up* |
| `GET` | `/api/trajectory/:ideaId` | full time-series + outcome ledger |

### Trends · Validation · Watchlist · Analytics
| Method | Endpoint | Notes |
|---|---|---|
| `GET`  | `/api/trends` | `{ byIndustry, byPhase, velocity }` |
| `GET`  | `/api/validation/:id` | kill-switches, opportunity windows, PMF indicators |
| `GET`/`POST`/`DELETE` | `/api/watchlist` | saved ideas + alerts |
| `GET`  | `/api/analytics` | overview stats |

---

## 📂 Project Structure

```
nse/
├── backend/
│   └── src/
│       ├── server.js                # Express entry
│       ├── config/                  # MongoDB + Redis
│       ├── middleware/              # JWT auth (tier RBAC) + error handler
│       ├── models/                  # User · Signal · Idea · Cluster · Watchlist · OpportunitySnapshot
│       ├── routes/                  # auth · ideas · signals · trends · trajectory · validation · …
│       └── services/
│           ├── sources/             # rss.js · gdelt.js · reddit.js
│           ├── embedding.js         # semantic fingerprint + cosine similarity
│           ├── verification.js      # credibility + cross-source corroboration
│           ├── nlp.js               # sentiment · industry · friction extraction
│           ├── opportunitySynthesis.js  # signals → grounded opportunities
│           ├── validationService.js # 5-factor scoring engine
│           ├── trajectoryService.js # momentum + outcome ledger
│           ├── marketIntel.js       # demand evidence
│           ├── aiService.js         # OpenAI + mock generation
│           └── ingestionScheduler.js# cron pipeline (every 15 min)
│
├── frontend/
│   └── src/
│       ├── pages/                   # Landing · Dashboard · Ideas · IdeaDetail · Builder · Signals · Watchlist · Pricing · Login · Register
│       ├── components/common/       # Layout · CommandBar (⌘K) · ScoreRing
│       ├── store/authStore.js       # Zustand auth state
│       └── utils/api.js             # Axios client
│
├── ai-engine/AI_PIPELINE.md         # pipeline deep-dive
├── database/SCHEMA.md               # schema docs
├── docker-compose.yml               # full-stack orchestration
└── .env.example
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | **Yes** for persistence | MongoDB connection string |
| `JWT_SECRET` | **Yes** | Secret for JWT signing (256-bit random string) |
| `REDIS_URL` | No* | Redis connection (*falls back to in-memory cache) |
| `OPENAI_API_KEY` | No* | Enables live GPT-4 generation (*uses real-signal synthesis + mock if absent) |
| `FRONTEND_URL` | No | CORS origin (default `http://localhost:5173`) |
| `PORT` | No | Backend port (default `4000`) |

---

## 💰 Monetization

| Tier | Price | Highlights |
|---|---|---|
| **Free** | ₹0 | 5 ideas/mo · 20 signals/day · basic scoring |
| **Pro** | ₹2,499/mo | 100 ideas · full evidence trail · MVP plans · watchlist |
| **Founder** | ₹7,999/mo | Unlimited · VC reports · manual ingest · API key |
| **Enterprise** | ₹8,00,000+/yr | Custom API · dedicated infra · SLA · white-label |

**Additional streams:** VC Intelligence Reports (₹24,999) · Quarterly Trend Forecasts (₹39,999) · API licensing · white-label dashboards.

---

## 📈 Scaling Roadmap

```
Phase 1 (0–1K users) ........ single instance · Atlas M10 · Redis free tier
Phase 2 (1K–10K)  ........... 3 instances + Nginx LB · Atlas M30 · dedicated AI worker
Phase 3 (10K–100K) .......... Kubernetes · event streaming · analytics store · vector DB
Phase 4 ($10M ARR) .......... multi-region · fine-tuned models · realtime WS · SOC 2 Type II
```

---

## 🤝 Contributing

Issues and PRs welcome. Fork → branch → PR. Run `npm run dev` and ensure the backend `/health` check is green before submitting.

## 📄 License

MIT — see [LICENSE](LICENSE).

<div align="center">

---

**NSE — built for founders who want to move faster than the market.**

⭐ Star the repo if this sparked an idea.

</div>
