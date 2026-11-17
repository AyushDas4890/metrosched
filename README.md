# MetroSched

Nightly train induction planner for a metro depot. This is a CSE 471 class project based on Smart India Hackathon problem SIH25081 (Kochi Metro Rail Limited).

Every night, supervisors decide which trainsets run revenue service the next morning, which stay on standby, and which go to the Inspection Bay Line (IBL). MetroSched produces that decision as a ranked list. Every train in the list comes with plain-language reasons and conflict alerts.

> **Per-train planning data is synthetic.** Network-level facts and every assumed number are listed in [docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md). Nothing here reflects real KMRL operations.
>
> **Compressor sensor data is real:** the [MetroPT-3 dataset](https://doi.org/10.24432/C5VW3R) (Metro do Porto, Feb–Aug 2020, CC BY 4.0). Mapping its slices onto the synthetic trainsets is an assumption.

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
  - The soft objective is a weighted sum of branding shortfall, mileage imbalance, shunting moves, standby buffer, preventive maintenance and compressor fault risk.
  - The solver runs on one worker thread, so tied plans resolve the same way and runs are repeatable (checked on this machine and OR-Tools 9.15).
  - If no plan satisfies every hard rule, the API returns the smallest relaxation instead of a plan.
- **Explanations** (`optimizer/explain.py`): reasons come from rules, not from an LLM. For example: "Rolling-Stock fitness certificate expired on 2026-10-31 (hard rule)".
- **Compressor (APU) fault risk** (`backend/ml/apu_risk.py`, `data/metropt3/`): a random forest trained on real MetroPT-3 air-compressor sensor data and its four reported air-leak failures. Each trainset is given a seeded 12-hour slice of the real timeline; the slice's peak score is its risk. Risk at or above 50% raises an alert, and the optimizer penalises it in revenue (weight 500). Out-of-fold results (leave-one-month-out): ROC AUC 0.975, 2 of 4 reported failures caught at 50%; false alarms on 1.5% of 30-minute windows and 3.9% of failure-free 12-hour slices. See [Real data: MetroPT-3](#real-data-metropt-3).
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
| GET | `/fleet/status` | Certificates, job cards, branding, bays, fitness, compressor risk |
| GET | `/apu/model` | Compressor risk model: source and out-of-fold metrics |

`violations[]` holds soft conflict alerts, such as a certificate expiring soon, a shunting move needed, or a branding shortfall. Hard-rule violations never appear in a plan; this is checked by `optimizer.constraints.check_plan` in the tests.

## What-if scenarios (seeded data, seed 471)

Generate a plan first, then use the What-if simulator page or `POST /plan/simulate`:

Baseline plan: 18 Revenue, 2 Standby (TS-04, TS-16), 5 IBL. TS-21 is in IBL because its compressor slice contains the real 29–30 May 2020 air leak (risk 94%).

1. **TS-07 Rolling-Stock certificate expires.** `{"type":"cert_expire","train_id":"TS-07","kind":"ROLLING_STOCK"}`
   Diff: TS-07 goes REVENUE to IBL; TS-04 goes STANDBY to REVENUE; TS-21 goes IBL to STANDBY. Why TS-21: fit trains drop from 21 to 20, and 18 revenue + 2 standby need all 20, so TS-21 must leave IBL; standby carries no compressor penalty, so the 94%-risk train becomes the reserve.
2. **Critical fault on TS-22.** `{"type":"critical_job","train_id":"TS-22"}`
   Diff: TS-22 goes REVENUE to IBL; TS-04 goes STANDBY to REVENUE; TS-21 goes IBL to STANDBY.
3. **Only 16 revenue trains needed.** `{"type":"required_revenue","value":16}`
   Diff: TS-09 (86% compressor risk) and TS-20 go REVENUE to STANDBY; TS-04 goes STANDBY to IBL for maintenance.
4. **One cleaning crew absent.** `{"type":"crews_absent","count":1}`
   Result: no valid plan. The relaxation report gives the smallest fix of size 2 ("Relax required revenue by 2"; relaxing cleaning slots by 2 would cost the same).

These exact diffs are asserted by `test_readme_scenarios` in `backend/tests/test_simulate.py`.

## Tests

```powershell
.\.venv\Scripts\python -m pytest backend\tests -q
```

| Suite | Count | What it covers |
|---|---|---|
| pytest | 28 | Generator determinism, constraints, optimizer, simulation, ML fallback and learning, MetroPT-3 data prep, risk model and risk-driven planning, API, 40-train / 2-depot run under 10 s |
| Vitest | 6 | Formatting helpers and components |
| Playwright | 1 | Seeds the data, generates a plan in the browser, sees 25 ranked rows and opens the reasons |

## Known limitations

- Cleaning-slot and IBL capacities are fleet-wide totals, not per depot. The two-depot case is shown in tests; the dashboard shows the first depot only.
- Shunting is modelled per stabling line as "a revenue train behind a non-revenue train". It is not a full move-sequence planner.
- Compressor risk comes from one real train's data mapped onto synthetic trainsets. The model misses 2 of the 4 reported failures at the 50% alert level and raises false alarms (TS-09 in the seed).
- Override learning adjusts the soft weights only.
- Overrides are logged and shown in the plan, but the plan is not re-solved around an override.

## Real data: MetroPT-3

The prepared files are committed (`data/metropt3/windows.csv`, `window_risk.csv`), so nothing has to be downloaded to run the app. To rebuild them from the raw data:

```powershell
curl.exe -L -o data\metropt3\metropt3.zip "https://archive.ics.uci.edu/static/public/791/metropt+3+dataset.zip"
Expand-Archive data\metropt3\metropt3.zip data\metropt3\raw
.\.venv\Scripts\python data\metropt3\prepare.py
cd backend; ..\.venv\Scripts\python -m ml.apu_risk
```

Citation: Davari, N. et al. (2021), "Predictive maintenance based on anomaly detection using deep learning for air production unit in the railway industry", IEEE DSAA; Veloso, B. et al. (2022), "The MetroPT dataset for predictive maintenance", Scientific Data 9, 764. Dataset DOI 10.24432/C5VW3R, CC BY 4.0.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/PLAN.md](docs/PLAN.md), [docs/USER_GUIDE.md](docs/USER_GUIDE.md).
