# Submission Checklist — Assignment Requirement → Implementation

Every bullet from the Blackcoffer assignment PDF mapped to where it lives in this repo.
Paths are relative to `blackcoffer-dashboard/`.

## Data & database

| Requirement                                   | Where implemented                                                        | Status |
| --------------------------------------------- | ------------------------------------------------------------------------ | ------ |
| Use the given JSON data                       | `data/jsondata.json` (1000 records, unchanged)                           | ✅     |
| Create a MongoDB database from the JSON        | `backend/src/scripts/seedData.js` → `insights` collection               | ✅     |
| Schema / normalization                        | `backend/src/models/Insight.js` (empty→null numerics, parsed dates)     | ✅     |
| Dashboard reads data from MongoDB              | `backend/src/services/insightsService.js` (all reads via Mongoose)      | ✅     |
| Create API in Node.js to get data from MongoDB | `backend/src/routes/insights.js` + service layer                        | ✅     |
| Use the given data only (no fabrication)       | City/SWOT rendered disabled + explained (`FilterBar.jsx`, seed header)   | ✅     |

## Stack (chose MERN)

| Requirement                       | Where                                                     | Status |
| --------------------------------- | -------------------------------------------------------- | ------ |
| Backend: Node.js + Express        | `backend/` (Express 5, ES modules)                       | ✅     |
| Frontend: React                   | `frontend/` (React 19 + Vite)                            | ✅     |
| Charts: **D3.js** (recommended)   | `frontend/src/components/charts/*` (5 D3 components)     | ✅     |
| Interactive graphs/charts/visuals | hover tooltips + click-to-filter on every chart          | ✅     |
| A creative visual for insight     | `SectorRadialOrScatter.jsx` (intensity × likelihood × count) | ✅  |

## Important variables to be visualized

| Variable   | Visualized in                                                             | Status |
| ---------- | ------------------------------------------------------------------------- | ------ |
| Intensity  | `IntensityLikelihoodTrendChart`, `SectorRadialOrScatter`, country color, KPI | ✅  |
| Likelihood | `IntensityLikelihoodTrendChart`, `SectorRadialOrScatter`, KPI            | ✅     |
| Relevance  | `TopicTreemap` (color), KPI tile                                          | ✅     |
| Year       | `IntensityLikelihoodTrendChart` (x-axis, from `end_year`)                | ✅     |
| Country    | `CountryChoroplethOrBarChart` (top 15, colored by avg intensity)         | ✅     |
| Topics     | `TopicTreemap` (top 15, sized by count)                                   | ✅     |
| Region     | `RegionBarChart` (count by region, click-to-filter)                      | ✅     |
| City       | No city data in source — documented (disabled control)                    | ⚠️ N/A |

## Filters in the dashboard

| Required filter        | Component                                          | Backend param        | Status |
| ---------------------- | ------------------------------------------------- | -------------------- | ------ |
| End year               | `filters/YearSelect.jsx`                          | `end_year`           | ✅     |
| Topics                 | `filters/FilterMultiSelect.jsx`                   | `topic` (repeatable) | ✅     |
| Sector                 | `filters/FilterMultiSelect.jsx`                   | `sector`             | ✅     |
| Region                 | `filters/FilterMultiSelect.jsx`                   | `region`             | ✅     |
| **PEST**               | `filters/FilterMultiSelect.jsx` "PESTLE Category" | `pestle`             | ✅     |
| Source                 | `filters/FilterMultiSelect.jsx` (searchable)      | `source`             | ✅     |
| **SWOT**               | `filters/DisabledControl.jsx` (present + explained)| — (no data)         | ⚠️ N/A |
| Country                | `filters/FilterMultiSelect.jsx` (searchable)      | `country`            | ✅     |
| City                   | `filters/DisabledControl.jsx` (present + explained)| `city` (always empty)| ⚠️ N/A |
| Any other control      | Intensity / Likelihood / Relevance range sliders  | `*_min` / `*_max`    | ✅     |

## Engineering quality (from the multi-prompt spec)

| Requirement                              | Where                                                            | Status |
| ---------------------------------------- | --------------------------------------------------------------- | ------ |
| Server-side aggregation (not client)     | `insightsService.getStats` — single `$facet` pipeline           | ✅     |
| Indexes for filter+sort                  | `models/Insight.js` (single + compound indexes)                 | ✅     |
| Input validation (Zod), 422 on bad input | `validation/insightsQuery.js`                                    | ✅     |
| NoSQL-injection prevention               | `middleware/sanitize.js` + Zod (tested)                         | ✅     |
| Rate limiting / helmet / CORS allowlist  | `app.js`                                                         | ✅     |
| No stack-trace leaks in prod             | `middleware/errorHandler.js`                                     | ✅     |
| Swagger docs                             | `config/swagger.js` → `GET /api/docs`                            | ✅     |
| Security test suite (12)                 | `tests/security.test.js`                                         | ✅     |
| Backend integration tests (20)           | `tests/insightsApi.test.js` (hand-calculated aggregations)      | ✅     |
| Frontend component tests (11)            | `filters/FilterBar.test.jsx`, `charts/charts.test.jsx`          | ✅     |
| E2E smoke test (Playwright)              | `frontend/e2e/dashboard.spec.js`                                | ✅     |
| URL-synced, shareable filters            | `hooks/useFilters.js` (react-router search params)              | ✅     |
| Loading skeletons + empty states         | `common/Skeleton.jsx`, `common/EmptyState.jsx`                  | ✅     |
| Responsive (sidebar slide-over < 768px)  | `Dashboard.module.css`                                           | ✅     |
| `npm audit` clean (backend + frontend)   | 0 vulnerabilities                                               | ✅     |

## Test results (latest run)

- **Backend:** 32 passed (12 security + 20 integration) — `cd backend && npm test`
- **Frontend:** 11 passed — `cd frontend && npm test`
- **E2E:** 1 passed — `cd frontend && npm run test:e2e`

## Before submitting

- [ ] Set `MONGODB_URI` to your Atlas cluster and run `npm run seed`.
- [ ] Start both halves and add real screenshots to `frontend/docs/` (README placeholders).
- [ ] Re-run `npm audit` in both halves.
- [ ] Zip the project (excluding `node_modules`, `.mongo-data`) and upload to Google Drive.
- [ ] Fill out the submission Google Form with the Drive URL.

## Notes on data honesty (PEST / PESTLE / SWOT / City)

The source data contains a `pestle` field (PESTLE — a superset of PEST) and has **no**
SWOT or city fields. Rather than invent data (which would violate "use the given data
only"), the PEST filter is served from `pestle` and labeled "PESTLE Category", while the
SWOT and City controls are rendered **visibly but disabled**, each with a tooltip
explaining why. This is intentional and documented in `seedData.js` and `FilterBar.jsx`.
