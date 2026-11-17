# Demo script — 7 minutes

A live walkthrough of the Intelligent Agricultural Supply & Demand Coordination prototype.
Open <http://localhost:5173> with both dev servers running (`npm run dev`).

**Before you start**

- Confirm the API is up: <http://localhost:8000/api/health> returns `{ "status": "ok" }`.
- Leave the browser at 100% zoom on a desktop-width window (≥ 1280 px).
- If you have edited farmers/buyers or uploaded CSV, restart `npm run dev` to restore the
  seeded data.
- The "today" of the simulation is 15 November 2026. Nothing changes with the real date.

Every screen carries a `SIMULATED DATA` badge. Say this early and plainly: the dataset was
generated for the demonstration; the algorithms and APIs are real.

---

## 0:00 — Opening (30 s)

> "This prototype answers one question: given farmers with produce and buyers with
> requirements, who should trade with whom, and why? It scores every feasible pairing, then
> allocates under three competing policies. Every recommendation has a written explanation."

Point at the scenario bar: **Scenario A — normal season**, 16.9 t supply, 15.5 t demand, no
disruptions.

---

## 0:30 — Dashboard: the health of the market (60 s)

Open **Dashboard**.

Talk through four numbers, not all eight:

- **15 farmers / 8 buyers** — small enough to inspect, large enough for real constraints.
- **Feasible matches: 18** — "120 candidate pairs were tested; only 18 pass every hard
  constraint. Feasibility is boolean — a high price score cannot rescue a pair that is 300 km
  apart."
- **Fill rate 94.8%** — 14.7 t allocated, 800 kg unmet.
- **Transport Rs 19,465**, **Jain 0.9844** — cost and fairness are first-class outcomes, not
  afterthoughts.

Briefly indicate the three charts: score distribution (how strong the feasible set is),
distance vs price (each dot a feasible pair), allocation by crop.

> "Scenario A is deliberately healthy. The interesting part is what happens when it is not."

---

## 1:30 — Matching: a score you can defend (75 s)

Open **Matching**.

- Point at **Candidate pairs 120 / Feasible 18 / Blocked 102**.
- "Blocked pairs are not hidden. The API reports why a pair failed: crop mismatch, price cap,
  grade, distance, timing, or minimum lot."
- Click **Why?** on the top match.

Walk through the drawer in this order:

1. **Explanation** — the one-line rationale.
2. **Score components** — price, distance, quantity, quality, availability, each 0–100 and
   weighted (30/25/20/15/10).
3. **Rank for buyer** — this farmer is in the Nth percentile for that buyer.
4. **Constraints checked** — every hard rule is listed explicitly.

> "The explanation is generated from the same numbers the ranking used. It cannot drift from
> the score."

Optional: drag a weight slider. The list re-sorts immediately; weights are normalised server
side. Reset by refreshing the page if you want the default 30/25/20/15/10.

---

## 2:45 — Allocation: three policies, one instance (90 s)

Open **Allocation**.

- Header: **Min-cost max-flow (successive shortest paths, SPFA) · 15 augmentations**.
- KPI row: **14.70 t allocated, 94.8% fill, average suitability 70.6, transport Rs 19,465,
  Jain 0.9844, buyer coverage 7/8**.
- Point at the **Sankey** — "thickness is kilograms; you can see which buyers take the bulk."
- Point at the **corridor map** — "towns and road legs are simulated; the line is illustrative
  and the score uses haversine × 1.3."
- Scroll to **What could not be served** — 800 kg unmet and the farmer surplus list, with the
  binding reason on each row.

Now switch the strategy to **Fairness-weighted**:

- Allocation stays near 14.5 t, but Jain rises from 0.9844 to about 0.9908 and transport falls.
- Say the honest caveat: "This is a concave-welfare greedy heuristic. It measurably improves
  fairness; it is not a proof of the max-min optimum. The exact claim belongs to min-cost
  max-flow, which is exact for the linear cost model."

Switch back to **Min-cost max-flow** before moving on.

---

## 4:15 — Strategies: the trade-off in one screen (45 s)

Open **Strategies**.

- Three cards, same feasible graph, same weights.
- **Greedy** — fastest, highest-scoring pairs first; can starve small buyers.
- **Min-cost max-flow** — maximum kilograms, then minimum score loss + freight; 15
  augmentations.
- **Fairness** — protects low-fill buyers; higher Jain, slightly lower average score.
- Point at the badges ("Moves the most kg", "Most even split", "Cheapest transport") — they
  are computed from this run, not hard-coded.

> "The choice is not which algorithm is 'best'. It is which outcome the market regulator
> prefers: volume, cost, or fairness."

Do not click **Use this strategy** unless you want the allocation page to adopt it.

---

## 5:00 — Scenario B: the stress test (75 s)

Switch the scenario to **Scenario B** using the tab in the scenario bar (or the top bar).

Watch these change together:

- **Supply 9.60 t, demand 15.50 t** — supply cut to 60%.
- **Farmer F07 is gone**; the **Badulla–Colombo corridor is closed**.
- **Fill rate falls to 58.1%**, **6,500 kg unmet**, Jain **0.9156**, average suitability
  **65.6**.
- **Farmer surplus** now competes with unmet demand — "there is produce left in the system
  that cannot legally or economically reach the buyers who need it."
- A warning: **tomato at Rs 184/kg, z ≈ 13.7** — the anomaly detector has fired.

Say the design point: "The disruption is not random noise. Scenario B is derived from A with
three explicit rules, which is why we can explain every difference."

---

## 6:15 — Prices: catching a bad tick (45 s)

Open **Prices** (still scenario B). Tomato is selected.

- Chart: 90 days, rolling mean, ±3σ band, a red dot on 15 November.
- Metrics: current **Rs 184**, rolling mean **Rs 123**, **z ≈ 13.7**, scoring reference
  **Rs 127** (30-day median), next estimate **Rs 141** (7-day moving average).
- "Scoring does not blindly trust this price. It switches to the robust median and halves the
  price weight, so one spike cannot reorder the whole market."

Switch the product pills to **Beans**, **Carrot**, **Potato** — tomato is the only *current*
flag, because non-tomato series are identical in both scenarios. Then switch back to
**Scenario A** and show that tomato is **Rs 127, z ≈ 0.1, normal**.

> "Same detector, same threshold. The normal season has no current anomaly — historical
> excursions show as red dots, which is exactly what a rolling detector should do. That is
> the control."

---

## 7:00 — Close (20 s)

> "Under the hood: a zod-validated Express API with an in-memory store, a scoring pipeline
> with explanations, three allocators including a hand-written min-cost max-flow solver, and
> a React front end where server state lives in TanStack Query. 76 backend tests and a
> validator assert the invariants. All data is simulated — and every screen says so."

Invite one question. Likely follow-ups are answered in `docs/JUDGE_QA.md`.

---

## Recovery lines

- **A page looks empty or stale:** the dev server may have reloaded; press the page's
  **Refresh/Re-run** button, or reload the browser tab.
- **Backend not responding:** check <http://localhost:8000/api/health>; restart `npm run dev`.
- **Unexpected anomaly flags:** you may have uploaded or edited data. Restart to restore the
  seed, then re-run `npm run validate` to confirm the expected A/B numbers.
- **Map tiles missing:** the basemap needs internet. Markers and lines still render; say the
  geometry is simulated and the map is illustrative.
