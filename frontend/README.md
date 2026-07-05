# Frontend — Blackcoffer Insights Dashboard

React 19 + Vite single-page app: URL-synced filters (react-router), data fetching/caching
with TanStack Query, and five interactive D3.js charts.

```bash
npm install
npm run dev        # http://localhost:5173 (backend must be on :8000)
npm run build      # production build to dist/
npm test           # Vitest + React Testing Library
npm run test:e2e   # Playwright (auto-starts a seeded API + the dev server)
npm run lint
```

Configure the API base URL via `VITE_API_BASE_URL` (default `http://localhost:8000`).

See the **root `README.md`** for full setup, architecture, and the seeding workflow.
