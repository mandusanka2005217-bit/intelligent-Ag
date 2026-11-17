# Requirement checklist

How the delivered system maps to the brief. Each row names the code that implements the
requirement and the evidence that it works. Test counts are from the final run
(`npm test`: 7 files, 76 tests passing).

Legend: ✅ implemented and verified · ⚠️ implemented with an explicitly documented
limitation.

---

## 1. Platform and architecture

| Requirement | Where | Evidence |
| --- | --- | --- |
| Node 20+ / Express / TypeScript backend | `backend/src/app.ts`, `backend/src/index.ts`, `backend/tsconfig.json` | `npm run build -w backend` succeeds; API starts on :8000. |
| npm workspaces for backend + frontend | root `package.json` (`workspaces: [frontend, backend]`) | `npm install` resolves both; `concurrently` runs both in `npm run dev`. |
| Shared types between tiers | `contracts/types.ts` (type-only) | Both workspaces compile against the same contracts via `@contracts/*` paths. |
| zod validation on every request body/query/param | `backend/src/routes/schemas.ts`, `backend/src/middleware/validate.ts` | API tests cover invalid payloads returning 400 with issue details. |
| Consistent JSON error envelope | `backend/src/middleware/error.ts`, `backend/src/errors.ts` | `tests/api.test.ts` asserts `{ error: { code, message, requestId } }` for 400/404/422/500. |
| Structured logging with request ids | `backend/src/app.ts` (pino-http, x-request-id) | Response header and log line share the id; health checks excluded from auto-logging. |
| Identical-request caching | `backend/src/utils/cache.ts`, `cached()` in routers | API tests assert cache hits; cold allocation 1–5 ms. |
| In-memory data store with revision counter | `backend/src/data/store.ts`, `backend/src/data/loader.ts` | CRUD and CSV import bump the revision and invalidate derived caches. |
| Optional static frontend serving | `backend/src/app.ts` | If `frontend/dist/index.html` exists, `npm start` serves SPA + API on :8000. |

## 2. Domain model and data

| Requirement | Where | Evidence |
| --- | --- | --- |
| Farmers, buyers, crops, prices, quantities, quality, availability with fixed field names | `contracts/types.ts`, `data/scenario_a/*.json` | Fields preserved exactly: `cropType`, `pricePerKg`, `quantityKg`, `requiredQuantityKg`, `minAcceptableQuantityKg`, `availableFrom`, etc. |
| Two scenarios (normal, disrupted) | `data/scenarios.json`, `backend/src/domain/scenarios.ts` | A/B switch available on every screen; totals from `/api/scenarios`. |
| Scenario B derived explicitly from A | `backend/scripts/generate-data.ts` | Supply ×0.6, F07 removed, Badulla–Colombo blocked, tomato +45%; `tests/data.test.ts`. |
| Locations with coordinates | `data/locations.json`, `backend/src/domain/geo.ts` | 20 towns; haversine distance and corridor rules tested. |
| 90-day price history per product | `data/price_history/**/*.csv` | 6 products × 2 scenarios × 90 rows; loader validates dates and values. |
| Deterministic, repeatable generation | seeded PRNG in `backend/scripts/generate-data.ts` (seed 42) | Re-running produces identical files; `tests/data.test.ts` checks stability. |
| Clearly labelled simulated data | `frontend/src/shared/components/SimulatedBadge.tsx`, scenario banner, README | Badge on every page and in the sidebar/topbar; explicit notes on dashboard, prices, strategies. |
| CSV import with row-level errors | `backend/src/routes/upload.ts`, `backend/src/utils/csv.ts` | Alias headers accepted; partial success returns inserted count + per-row issues (`tests/api.test.ts`). |

## 3. Scoring and matching

| Requirement | Where | Evidence |
| --- | --- | --- |
| Hard feasibility constraints first | `backend/src/domain/matching.ts` | 120 candidates → 18 feasible in A; blocked pairs carry a reason. |
| 0–100 weighted suitability score | `backend/src/domain/scoring.ts` | 5 components; weights 30/25/20/15/10 and runtime normalisation. `tests/scoring.test.ts` (15 tests). |
| Price scoring around a reference | `backend/src/domain/scoring.ts` | `100·clamp01(0.5 + (ref − asking)/(0.4·ref))`; boundary tests. |
| Distance and transport model | `backend/src/domain/geo.ts` | Haversine × 1.3, 250 km cap, Rs 0.012/kg/km; `tests/geo.test.ts`. |
| Quantity fit, quality, availability | `backend/src/domain/scoring.ts` | Quality A/B/C = 100/75/50; delay ≤ 7 days; component tests. |
| Written explanation for every recommendation | `backend/src/domain/explain.ts` | Explanation on every match and allocation row; binding reason on unmet demand. |
| Rejected pairs explain the binding constraint | `backend/src/domain/matching.ts` | Matching response exposes blocked reasons; UI shows the blocked count. |
| Match ranking and percentile | `backend/src/domain/analysis.ts`, matching UI | Rank shown in the explanation drawer. |

## 4. Allocation algorithms

| Requirement | Where | Evidence |
| --- | --- | --- |
| Greedy by score | `backend/src/allocation/greedy.ts` | Deterministic order, capacity and minimum-lot invariants tested. |
| Min-cost max-flow written from scratch | `backend/src/allocation/minCostFlow.ts` | Successive shortest paths with SPFA; capacities, conservation and objective tested; cross-checked against `javascript-lp-solver`. |
| Fairness-aware allocation | `backend/src/allocation/fair.ts` | Concave welfare greedy (10 kg quanta + min-lot opening). ⚠️ heuristic, not exact max-min — stated in UI and README. |
| Jain fairness index | `backend/src/allocation/shared.ts` | Reported per strategy and scenario; test covers 0/1 bounds and even-split = 1. |
| Transport cost objective | `backend/src/allocation/shared.ts` | Edge cost `20·(1 − score/100) + distance·0.012`, integer milli-rupees. |
| Strategy comparison on the same instance | `backend/src/allocation/compare.ts`, `backend/src/routes/compare.ts`, `/strategies` UI | One POST returns all three results, badges and computed trade-offs. |
| Shortage policy (score priority / proportional) | `backend/src/allocation/*`, `frontend/src/core/store/scenarioStore.ts` | Selectable on allocation page; reflected in solve results. |
| Unmet demand and farmer surplus with reasons | `backend/src/domain/analysis.ts`, `AllocationPage` | Lists filter to strictly positive shortfall/surplus; reason included per row. |
| Per-run visibility of the solver | allocation response `solver` field + UI note | Algorithm name, augmentations, min-lot repairs, runtime, generated timestamp. |

## 5. Price anomaly detection and forecast

| Requirement | Where | Evidence |
| --- | --- | --- |
| Rolling z-score detector | `backend/src/domain/anomaly.ts` | 14-day window excluding the tested day, threshold 3.0; `tests/anomaly.test.ts`. |
| Capped influence on scoring | `backend/src/domain/scoring.ts` | Flagged product uses 30-day median and halves price weight; tests assert the cap. |
| Robust reference and warning text | anomaly response + matching/allocation responses | Tomato B: Rs 184 vs median Rs 127, z ≈ 13.7; warning appears in UI notices. |
| Forecast | `backend/src/domain/forecast.ts` | 7-day moving average; explicitly labelled as orientation only. |
| Clean control scenario | generator + detector | A has no current anomaly; B flags only tomato's current observation (verified by `npm run validate`). |

## 6. Frontend

| Requirement | Where | Evidence |
| --- | --- | --- |
| Existing folder/file structure preserved | `frontend/src/**` | No renames/moves of existing files; additions are new components/hooks/routes. |
| Per-feature `routes.ts` aggregation | `frontend/src/features/*/routes.ts`, `frontend/src/router.tsx` | Seven feature route files composed under the shared layout. |
| Lazy routes | every `routes.ts` uses `lazy()`; `AppLayout` wraps `Outlet` in `Suspense` | Vite build emits per-page chunks. |
| TanStack Query for server data | `frontend/src/features/**/hooks`, `shared/services/query-keys.ts` | Every query key carries `scenarioId` (+ weights/strategy where relevant); scenario switch refetches. |
| Zustand for UI/scenario state only | `frontend/src/core/store/scenarioStore.ts` | Scenario, strategy, shortage policy, weights; no API payloads stored. |
| All HTTP through one client | `frontend/src/shared/services/api-client.ts` | Axios instance, base `/api`, normalised errors; no other fetch/axios usage in features. |
| Green/white agricultural design | `frontend/src/core/styles/index.css` | Palette and component classes; existing stylesheet retained and extended. |
| Loading skeletons | `shared/components/Skeleton.tsx` and per-view skeletons | Route fallback, KPI grids, tables, charts, prices. |
| Accessibility | labels on inputs, `role="radiogroup"`, `aria-checked`, `aria-selected`, `aria-label` on icon buttons, keyboard-reachable rows/links, text + colour status | Browser accessibility snapshot; no colour-only states. |
| Simulated-data badge | `SimulatedBadge` on every page header + sidebar/topbar | Visible on all seven screens. |
| Scenario switch everywhere | `features/scenarios/components/ScenarioBar.tsx` + topbar | A/B drives every page. |
| Charts and visualisations | Recharts (dashboard, prices), d3-sankey (flow), Leaflet (map) | Render with real scenario data; zero console errors. |
| Empty/error states | `EmptyState`, notices, retry buttons | Shown for no allocations, no surplus, API failures. |

## 7. Quality, tests, docs

| Requirement | Where | Evidence |
| --- | --- | --- |
| Backend unit + integration tests | `backend/tests/*.test.ts` | 76 passing; includes algorithm cross-check against an LP solver. |
| Data invariance & performance report | `backend/scripts/validate.ts` | Asserts conservation, caps, minimum lots, determinism, anomaly expectations; prints timings. |
| Frontend type safety | `frontend/tsconfig.json` | `npm run type-check` clean. |
| Production build | `frontend/vite.config.ts` | `npm run build` succeeds; CSS ~51 kB, lazy page chunks. |
| README, demo script, checklist, Q&A | `README.md`, `docs/*.md` | This document set. |
| Honest limitation notes | README, strategies page, prices page, demo script | Simulated prices, haversine × 1.3, heuristic fairness, moving-average forecast, in-memory persistence. |
