# Blackcoffer Insights Dashboard

An interactive, full-stack data-visualization dashboard for the Blackcoffer test
assignment. It loads the provided `jsondata.json` (~1000 records) into MongoDB, exposes a
read-only REST API with rich filtering + server-side aggregation, and renders five
interactive D3.js charts with URL-synced filters.

- **Backend** — Node.js + Express 5 (ES modules), MongoDB via Mongoose, Zod validation,
  helmet/rate-limit/sanitization hardening, Swagger docs.
- **Frontend** — React 19 + Vite, TanStack Query, react-router (URL-synced filters),
  D3.js charts, CSS Modules.
- **Data** — the assignment's `jsondata.json`, normalized into an `insights` collection.

## Architecture

```
                    ┌──────────────────────────────┐
                    │        Browser (React)        │
                    │  Vite dev :5173 / static build │
                    │  ─ FilterBar (URL-synced)      │
                    │  ─ TanStack Query cache        │
                    │  ─ 5 × D3 chart components      │
                    └───────────────┬──────────────┘
                                    │  HTTP  (CORS allowlist)
                                    │  GET /api/insights | /filters | /stats
                                    ▼
                    ┌──────────────────────────────┐
                    │      Express API  :8000        │
                    │  helmet · rate-limit · CORS    │
                    │  sanitize · Zod validation     │
                    │  routes → services (aggregation)│
                    │  pino logging · error handler   │
                    └───────────────┬──────────────┘
                                    │  Mongoose
                                    ▼
                    ┌──────────────────────────────┐
                    │   MongoDB  (Atlas or local)    │
                    │   `insights` collection        │
                    │   indexed for filter+sort      │
                    └──────────────────────────────┘
```

## Project structure

```
blackcoffer-dashboard/
├── backend/
│   └── src/
│       ├── server.js / app.js         # boot + Express app factory
│       ├── db.js                       # Mongoose connection
│       ├── models/Insight.js           # schema + normalization + indexes
│       ├── routes/                     # health.js, insights.js (Swagger-annotated)
│       ├── services/insightsService.js # ALL DB access + aggregation pipelines
│       ├── validation/insightsQuery.js # Zod query schemas
│       ├── middleware/                 # sanitize.js, errorHandler.js
│       ├── config/swagger.js           # OpenAPI spec
│       ├── utils/                      # logger.js (pino), asyncHandler.js
│       ├── scripts/                    # seedData.js, devDb.js, e2eServer.js
│       └── tests/                      # security.test.js, insightsApi.test.js
├── frontend/
│   └── src/
│       ├── api/                        # client.js, insights.js
│       ├── hooks/                      # useFilters (URL), useInsights (Query), useDebouncedCallback
│       ├── components/
│       │   ├── Dashboard.jsx           # layout + responsive sidebar
│       │   ├── ChartsGrid.jsx          # KPIs + chart grid
│       │   ├── filters/                # FilterBar, FilterMultiSelect, YearSelect, RangeSlider, DisabledControl
│       │   ├── charts/                 # 5 D3 charts + shared/ (palette, tooltip, ChartCard, captions)
│       │   └── common/                 # EmptyState, Skeleton
│       └── test/                       # RTL setup + helpers
│       └── e2e/                        # Playwright spec
├── data/                               # jsondata.json (git-ignored)
├── docker-compose.yml                  # backend + frontend (Mongo stays on Atlas)
├── .env.example
└── SUBMISSION_CHECKLIST.md             # assignment bullet → implementation map
```

## Prerequisites

- Node.js 18+ (developed on Node 24) and npm.
- A MongoDB database — one of:
  - **MongoDB Atlas** (recommended for submission) — set `MONGODB_URI` to the cluster URI.
  - **Local mongod**, or the built-in **zero-install dev DB** (`npm run db:local`, uses
    `mongodb-memory-server` to run a real, persistent mongod on :27017 with no install).

## Environment variables

Copy `.env.example` → `backend/.env` (and optionally `frontend/.env`):

| Variable            | Where    | Purpose                                                        |
| ------------------- | -------- | -------------------------------------------------------------- |
| `MONGODB_URI`       | backend  | MongoDB connection string (Atlas or local).                    |
| `PORT`              | backend  | API port (default `8000`).                                     |
| `CORS_ORIGIN`       | backend  | Comma-separated allowlist of frontend origins (no wildcard).   |
| `NODE_ENV`          | backend  | `development` \| `production` \| `test`.                       |
| `RATE_LIMIT_MAX`    | backend  | Requests/min per IP on `/api/*` (default `100`).               |
| `VITE_API_BASE_URL` | frontend | Base URL of the backend API (default `http://localhost:8000`). |

> Secrets are only ever read from env via `dotenv` — never hardcoded or logged (pino
> redacts `MONGODB_URI`, auth headers, tokens). `.env` files are git-ignored.

## Running locally

```bash
# 1. Backend deps
cd backend && npm install

# 2a. (Option A) Zero-install local MongoDB in a dedicated terminal:
npm run db:local        # persistent mongod on mongodb://127.0.0.1:27017/blackcoffer
# 2b. (Option B) point MONGODB_URI at your Atlas cluster in backend/.env instead

# 3. Seed the database from data/jsondata.json (idempotent)
npm run seed            # prints a per-field completeness summary

# 4. Start the API (http://localhost:8000, docs at /api/docs)
npm run dev

# 5. Frontend (separate terminal)
cd ../frontend && npm install && npm run dev   # http://localhost:5173
```

Open **http://localhost:5173**.

## Running the test suites

```bash
# Backend: security (12) + integration (20) — Vitest + Supertest + in-memory Mongo
cd backend && npm test

# Frontend unit/component: FilterBar + charts — Vitest + React Testing Library
cd frontend && npm test

# End-to-end smoke test — Playwright (auto-starts a seeded API + the dev server)
cd frontend && npx playwright install chromium   # first time only
npm run test:e2e
```

Latest run: **backend 32 passed, frontend 11 passed, e2e 1 passed.**

> Run `npm audit` in both `backend/` and `frontend/` before each release (currently
> **0 vulnerabilities** in both).

## API

| Endpoint                 | Description                                                              |
| ------------------------ | ----------------------------------------------------------------------- |
| `GET /api/health`        | Liveness probe → `{"status":"ok"}`.                                      |
| `GET /api/insights`      | Paginated, filterable list (all filters below, AND across / OR within). |
| `GET /api/insights/filters` | Distinct filter values + metric ranges for building the UI controls. |
| `GET /api/insights/stats`   | Server-side aggregations for the charts (respects the same filters). |
| `GET /api/docs`          | Live Swagger UI.                                                         |

The API is **read-only by design** — there are no public write/delete routes. If an
admin/write surface is added later it must require authentication (see security tests
`test_insights_endpoint_read_only`).

## Design decisions

**Why Node/Express + React + D3?** A single-language (JavaScript) stack keeps the
data model, API, and UI consistent and fast to iterate. Express 5 + Mongoose is a
well-trodden path for a filter-heavy REST API; **aggregation runs in MongoDB** (not in
app code) so the charts stay fast on the full dataset. React + TanStack Query gives
cache-keyed refetching (filters are part of the query key), and **D3** (the assignment's
recommended library) gives full control over the five bespoke, interactive visuals.

**Filter mapping (every assignment-required filter is implemented):**

| Assignment filter | Implemented as                            | Notes                                            |
| ----------------- | ----------------------------------------- | ------------------------------------------------ |
| End year          | `YearSelect` (dropdown)                   | `end_year`                                        |
| Topics            | `FilterMultiSelect`                       | repeatable `topic`                                |
| Sector            | `FilterMultiSelect`                       | `sector`                                          |
| Region            | `FilterMultiSelect`                       | `region`                                          |
| **PEST**          | `FilterMultiSelect` "PESTLE Category"     | uses `pestle` (PESTLE ⊇ PEST); tooltip explains   |
| Source            | `FilterMultiSelect` (searchable)          | `source`                                          |
| **SWOT**          | `DisabledControl` (present but disabled)  | no SWOT field in data — explained, not fabricated |
| Country           | `FilterMultiSelect` (searchable)          | ~56 distinct values, needs search                 |
| **City**          | `DisabledControl` (present but disabled)  | no city field in data — null for all records      |
| _extra_           | Intensity / Likelihood / Relevance sliders | debounced dual-range (300ms)                     |

**"Important variables" coverage:** Intensity, Likelihood (trend line + sector scatter +
KPIs), Relevance (topic treemap color + KPI), Year (trend chart), Country (country bar),
Topics (treemap), Region (region bar). **City** has no source data (documented).

**The creative visualization** is `SectorRadialOrScatter` — a scatter of **avg intensity
(x) vs avg likelihood (y)** with **bubble size = insight count**. Bars can only rank one
metric; this reveals which sectors combine *high impact AND high probability* (top-right),
the most decision-relevant quadrant. A one-line insight caption under each chart is
computed from the same stats data (e.g. _"Energy shows the highest combined intensity and
likelihood"_).

**PEST / PESTLE / SWOT / City honesty:** the data has a `pestle` field (a superset of
PEST) and **no** SWOT or city fields. Rather than fabricate data (which would violate
"use the given data only"), those controls are rendered visibly-but-disabled with
tooltips — see `backend/src/scripts/seedData.js` header and `FilterBar.jsx`.

## Screenshots

> _Add screenshots of the running dashboard here after starting it locally._

- `![Dashboard overview](docs/screenshot-overview.png)` &nbsp; _(placeholder — replace)_
- `![Filtered view](docs/screenshot-filtered.png)` &nbsp; _(placeholder — replace)_
- `![Charts close-up](docs/screenshot-charts.png)` &nbsp; _(placeholder — replace)_

## Docker (optional, for quick review)

```bash
# Set MONGODB_URI (Atlas) in your shell or a root .env, then:
docker compose up --build
# frontend → http://localhost:5173 , backend → http://localhost:8000
```

MongoDB is intentionally **not** containerized — it stays on Atlas (or your host) via
`MONGODB_URI`, keeping the compose file simple (see the comment in `docker-compose.yml`).

## Linting & formatting

Both halves share the root `.prettierrc.json` and use ESLint 9/10 flat config.

```bash
npm run lint      # in backend/ or frontend/
npm run format
```
```
