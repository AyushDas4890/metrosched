# MetroSched

Nightly train induction planner for a metro depot. This is a CSE 471 class project based on Smart India Hackathon problem SIH25081 (Kochi Metro Rail Limited).

Every night, supervisors decide which trainsets run revenue service the next morning, which stay on standby, and which go to the Inspection Bay Line (IBL). MetroSched produces that decision as a ranked list. Every train in the list comes with plain-language reasons and conflict alerts.

> **All per-train data is synthetic.** Network-level facts and every assumed number are listed in [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md). Nothing here reflects real KMRL operations.

## Run it (Windows PowerShell)

Requires Python 3.12+ (tested on 3.14) and Node.js 20+.

```powershell
git clone <repo-url> metrosched
cd metrosched
.\run.ps1
```

On the first run, `run.ps1` creates `.venv`, installs the Python and npm packages, generates the seeded data and loads it. It then starts:
- the API at http://localhost:8000 (interactive docs at `/docs`),
- the dashboard at http://localhost:3000.

| Command | What it does |
|---|---|
| `.\run.ps1 seed` | Regenerate `data/seed/` and load it into the database |
| `.\run.ps1 test` | Run pytest, Vitest and the Playwright smoke test |
| `python data/generator.py --trains 40 --depots 2 --out data/seed40` | Generate the 40-train, 2-depot scale scenario |

Optional settings are in `.env.example`. The defaults work without a `.env` file.

## How it works

- **Optimizer** (`backend/optimizer/`): a Google OR-Tools CP-SAT model.
  - Hard rules are never broken: valid Rolling-Stock, Signalling and Telecom certificates; no open critical job card; the exact revenue requirement; minimum standby; cleaning-slot capacity; IBL capacity.
  - The soft objective is a weighted sum of branding shortfall, mileage imbalance, shunting moves, standby buffer and preventive maintenance.
  - If no plan satisfies every hard rule, the API returns the smallest relaxation instead of a plan.
- **Explanations** (`optimizer/explain.py`): reasons come from rules, not from an LLM. For example: "Rolling-Stock fitness certificate expired on 2026-10-31 (hard rule)".
- **Override learning** (`backend/ml/learner.py`): each supervisor override is logged together with the train's features. After 20 overrides, a logistic regression rescales the soft weights. Below 20, the default weights are used.
- **Dashboard** (`frontend/`): Next.js, Tailwind, shadcn/ui and Recharts, with Motion (Framer Motion) springs and two React Bits components (CountUp, SpotlightCard). Pages: Tonight's plan, Fleet health, Mileage & branding, Depot bay map, What-if simulator, Override log.
- **Story page** (`/story`): a scroll-driven 3D walkthrough of one night at the depot, built with GSAP ScrollTrigger and CSS 3D transforms. It falls back to static layouts when the system asks for reduced motion.
- **Design rationale and self-critique:** [docs/DESIGN_CRITIQUE.md](docs/DESIGN_CRITIQUE.md).

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/data/ingest` | Upload JSON body `{trainsets: [...], ...}` or files such as `trainsets.json` or `job_cards.csv` (Maximo export columns) |
| POST | `/data/seed` | Load the seeded synthetic dataset |
| POST | `/plan/generate` | Ranked plan `{train_id, assignment, rank, score, reasons[], violations[]}` |
| POST | `/plan/simulate` | What-if scenarios; returns the baseline plan, the scenario plan and the diff |
| POST | `/plan/override` | Log a supervisor override with a reason |
| GET | `/plan/history`, `/plan/{id}`, `/plan/overrides` | Past plans and the override log |
| GET | `/fleet/status` | Certificates, job cards, branding, bays, fitness |

`violations[]` holds soft conflict alerts, such as a certificate expiring soon, a shunting move needed, or a branding shortfall. Hard-rule violations never appear in a plan; this is checked by `optimizer.constraints.check_plan` in the tests.

## What-if scenarios (seeded data, seed 471)

Generate a plan first, then use the What-if simulator page or `POST /plan/simulate`:

1. **TS-07 Rolling-Stock certificate expires.** `{"type":"cert_expire","train_id":"TS-07","kind":"ROLLING_STOCK"}`
   Diff: TS-07 goes REVENUE to IBL. TS-04, which is fit and had been held in IBL for preventive maintenance, goes IBL to REVENUE to keep 18 trains in service.
2. **Critical fault on TS-22.** `{"type":"critical_job","train_id":"TS-22"}`
   Diff: TS-22 goes REVENUE to IBL and TS-04 goes IBL to REVENUE.
3. **Only 16 revenue trains needed.** `{"type":"required_revenue","value":16}`
   Diff: TS-02, TS-13 and TS-17 go REVENUE to STANDBY. TS-04 goes IBL to REVENUE, and TS-16 goes STANDBY to IBL for maintenance.
4. **One cleaning crew absent.** `{"type":"crews_absent","count":1}`
   Result: no valid plan. With 3 slots instead of 6, too many cleaning-due trains would have to run. The relaxation report says "Relax cleaning slots by 2".

These scenarios are covered by `backend/tests/test_simulate.py` and `test_api.py`.

## Tests

```powershell
.\.venv\Scripts\python -m pytest backend\tests -q
```

| Suite | Count | What it covers |
|---|---|---|
| pytest | 21 | Generator determinism, constraints, optimizer, simulation, ML fallback and learning, API, 40-train / 2-depot run under 10 s |
| Vitest | 6 | Formatting helpers and components |
| Playwright | 1 | Seeds the data, generates a plan in the browser, sees 25 ranked rows and opens the reasons |

## Known limitations

- Cleaning-slot and IBL capacities are fleet-wide totals, not per depot. The two-depot case is shown in tests; the dashboard shows the first depot only.
- Shunting is modelled per stabling line as "a revenue train behind a non-revenue train". It is not a full move-sequence planner.
- Override learning adjusts the soft weights only; it does not predict withdrawal risk.
- Overrides are logged and shown in the plan, but the plan is not re-solved around an override.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/PLAN.md](docs/PLAN.md), [docs/USER_GUIDE.md](docs/USER_GUIDE.md).
