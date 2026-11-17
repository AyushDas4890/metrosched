# MetroSched

Nightly train induction planner for a metro depot. This is a CSE 471 class project based on Smart India Hackathon problem SIH25081 (Kochi Metro Rail Limited).

Every night, supervisors decide which trainsets run revenue service the next morning, which stay on standby, and which go to the Inspection Bay Line (IBL). MetroSched produces that decision as a ranked list. Every train in the list comes with plain-language reasons and conflict alerts.

> **No synthetic data.** The app plans only from real data:
> - the [MetroPT-3 dataset](https://doi.org/10.24432/C5VW3R): air-compressor sensor readings from a Metro do Porto train, Feb–Aug 2020, with four reported air-leak failures (CC BY 4.0);
> - public KMRL facts: 25 trainsets, Muttom depot;
> - any real files you upload through `POST /data/ingest`.
>
> Certificates, Maximo job cards, branding, mileage, cleaning status and bay positions have no public source, so they start **not loaded**. The rules that need them are skipped and every plan lists them as "not checked".
>
> MetroPT-3 covers **one** train. The 25-train fleet is an arrangement of its readings: each trainset gets a different 12-hour slice, and three trainsets are deliberately given slices that contain a reported failure. That mapping is an assumption ([docs/ASSUMPTIONS.md](docs/ASSUMPTIONS.md)).

## Run it (Windows PowerShell)

Requires Python 3.12+ (tested on 3.14) and Node.js 20+.

```powershell
git clone <repo-url> metrosched
cd metrosched
.\run.ps1
```

On the first run, `run.ps1` creates `.venv` and installs the Python and npm packages. It then starts:
- the API at http://localhost:8000 (interactive docs at `/docs`),
- the dashboard at http://localhost:3000.

There is no seeding step: with nothing uploaded, the backend builds the fleet from the prepared MetroPT-3 files in `data/metropt3/`.

| Command | What it does |
|---|---|
| `.\run.ps1 test` | Run pytest, Vitest and the Playwright smoke test |

Operating parameters (fleet size, depot, trains required in revenue, minimum standby, IBL bays) are in `data/fleet_config.json`. They are planning assumptions, not measurements.

## How it works

- **Fleet** (`backend/app/metropt_fleet.py`): 25 trainsets at Muttom, each carrying a slice of real MetroPT-3 data. If real files have been uploaded, those are used instead, with compressor data still attached.
- **Optimizer** (`backend/optimizer/`): a Google OR-Tools CP-SAT model.
  - **Hard rules:**
    - Always applied: the exact revenue requirement, minimum standby, IBL capacity.
    - Applied only when their data is loaded: fitness certificates, critical job cards, cleaning-slot capacity. Otherwise they are listed as not checked.
  - **Soft goals:**
    - From real data: compressor fault risk (weight 500), minutes below 7 bar (5), compressor duty above the fleet mean (2), standby buffer (3), and IBL time for trains with real alarms (4).
    - When uploaded: branding, mileage and shunting.
  - The solver runs on one worker thread, so tied plans resolve the same way and runs are repeatable.
  - If no plan fits, it returns the smallest relaxation instead.
- **Explanations** (`optimizer/explain.py`): reasons come from rules, not from an AI model.
  - A train is called "fit" only when certificate and job-card data were checked. Otherwise the reason says "fitness not verified".
- **Compressor (APU) fault risk** (`backend/ml/apu_risk.py`, `data/metropt3/`): a random forest trained on the 30-minute sensor windows and the four reported air leaks, scored leave-one-month-out.
  - ROC AUC 0.975.
  - Catches 2 of the 4 reported failures at the 50% alert level.
  - False alarms on 1.5% of windows and 3.9% of failure-free 12-hour slices.
  - Each slice also yields two real operating statistics: **compressor duty** (share of time loaded) and **minutes below 7 bar** (LPS signal).
- **Knowledge base, retrieval only** (`backend/rag/kb.py`, `data/kb/`): RAG without the generation step, over real documents only.
  - The four MetroPT-3 failure reports and the dataset's sensor documentation (10 passages).
  - Real past work orders, if you supply `data/kb/work_orders.csv`.
  - Search is TF-IDF with cosine ranking, and every hit cites its source.
- **Override learning** (`backend/ml/learner.py`): after 20 logged overrides, a logistic regression re-weights the soft goals.
- **Dashboard** (`frontend/`): Next.js, Tailwind, shadcn/ui, Recharts, Motion, React Bits.
  - Pages: Tonight's plan, Fleet health, Compressor usage, Depot, What-if simulator, Override log, Knowledge base.
  - Pages for inputs that aren't loaded say so instead of showing invented values.
- **Story page** (`/story`): an illustrative GSAP / CSS 3D walkthrough. It shows no data.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/data/status` | Data source (`metropt3` or `uploaded`), which inputs are loaded, rules not checked, goals not used |
| POST | `/data/ingest` | Upload real data: JSON body `{trainsets: [...], ...}` or files such as `trainsets.json`, `certificates.json`, `job_cards.csv` (Maximo columns) |
| DELETE | `/data` | Remove uploads and return to the MetroPT-3-only fleet |
| POST | `/plan/generate` | Ranked plan `{train_id, assignment, rank, score, reasons[], violations[]}` plus `rules_not_checked`, `goals_not_used` |
| POST | `/plan/simulate` | What-if scenarios; returns the baseline plan, the scenario plan and the diff |
| POST | `/plan/override` | Log a supervisor override with a reason |
| GET | `/plan/history`, `/plan/{id}`, `/plan/overrides` | Past plans and the override log |
| GET | `/fleet/status` | Per train: compressor risk and statistics; certificates, job cards and branding when uploaded. `fit` is null when it can't be checked |
| GET | `/apu/model` | Compressor risk model: source and out-of-fold metrics |
| GET | `/kb/search?q=…&k=5`, `/kb/train/{id}` | Knowledge-base retrieval, with sources |

## What-if scenarios (MetroPT-3 fleet)

Baseline: 18 Revenue, 3 Standby (TS-22, TS-19, TS-06), 4 IBL.
- **TS-21:** 94% fault risk; its slice holds the real 29–30 May 2020 air leak.
- **TS-09:** 86% fault risk, a false alarm, plus 6 min below 7 bar.
- **TS-03:** 89 min below 7 bar. Its slice holds the real 15 July leak, which the model missed (4%) but the low-pressure signal caught.
- **TS-15:** 63 min below 7 bar.

1. **TS-07 Rolling-Stock certificate expires** (hypothetical): `{"type":"cert_expire","train_id":"TS-07","kind":"ROLLING_STOCK"}`. Diff: TS-07 REVENUE → IBL; TS-22 STANDBY → REVENUE.
2. **Critical fault reported on TS-12:** `{"type":"critical_job","train_id":"TS-12"}`. Diff: TS-12 REVENUE → IBL; TS-22 STANDBY → REVENUE.
3. **Only 16 revenue trains needed:** `{"type":"required_revenue","value":16}`. Diff: TS-14 REVENUE → IBL (16.9 min below 7 bar); TS-16 REVENUE → STANDBY.
4. **Cleaning crews absent:** refused with "no cleaning data loaded", because no real cleaning data exists to simulate.

These exact results are asserted by `test_readme_scenarios` in `backend/tests/test_simulate.py`.

## Tests

```powershell
.\.venv\Scripts\python -m pytest backend\tests -q
```

| Suite | Count | What it covers |
|---|---|---|
| pytest | 39 | The real-data fleet (no synthetic inputs, missing rules reported, fitness never claimed without data), constraints, optimizer, simulation, learning, MetroPT-3 prep and risk model, retrieval, API, 40-train / 2-depot speed |
| Vitest | 6 | Formatting helpers and components |
| Playwright | 1 | Clears uploads, generates a plan from MetroPT-3 data in the browser, sees 25 ranked rows and opens the reasons |

Tests that need a full fleet with certificates, job cards and bays use `backend/tests/fixture_data.py`, a seeded invented fixture. It lives in `backend/tests/` only and is never loaded by the app.

## Known limitations

- MetroPT-3 is one Porto train mapped onto 25 Kochi trainsets. The risk model misses 2 of 4 reported failures at 50% and raises false alarms (TS-09).
- Without uploads, three hard rules (certificates, critical job cards, cleaning) are not checked, and branding, mileage and shunting are not planned.
- Retrieval is keyword-based (TF-IDF), and the corpus is small.
- Overrides are logged but the plan is not re-solved around them.
- Capacities are fleet-wide, not per depot.

## Real data: MetroPT-3

The prepared files are committed (`data/metropt3/windows.csv`, `window_risk.csv`), so nothing has to be downloaded to run the app. To rebuild them from the raw data:

```powershell
curl.exe -L -o data\metropt3\metropt3.zip "https://archive.ics.uci.edu/static/public/791/metropt+3+dataset.zip"
Expand-Archive data\metropt3\metropt3.zip data\metropt3\raw
.\.venv\Scripts\python data\metropt3\prepare.py
cd backend; ..\.venv\Scripts\python -m ml.apu_risk
```

Citation: Davari, N. et al. (2021), "Predictive maintenance based on anomaly detection using deep learning for air production unit in the railway industry", IEEE DSAA; Veloso, B. et al. (2022), "The MetroPT dataset for predictive maintenance", Scientific Data 9, 764. Dataset DOI 10.24432/C5VW3R, CC BY 4.0.

More detail: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/USER_GUIDE.md](docs/USER_GUIDE.md), [docs/MetroSched_Explained.pdf](docs/MetroSched_Explained.pdf).
