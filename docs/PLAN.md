# MetroSched — Implementation Plan

Each task is done when its test command passes.

1. Repo skeleton, venv, `requirements.txt`, `.env.example`, Makefile-equivalent `run.ps1`. — `python -c "import ortools, fastapi"`
2. `data/generator.py` seeded generator (25 or 40 trains, 1–2 depots) writing CSV/JSON to `data/seed/`. — `pytest backend/tests/test_generator.py`
3. DB models + loader (`backend/app/db.py`, `models.py`, `ingest.py`). — `pytest backend/tests/test_ingest.py`
4. Constraint checks (`optimizer/constraints.py`). — `pytest backend/tests/test_constraints.py`
5. CP-SAT model + explanations + relaxation report. — `pytest backend/tests/test_optimizer.py`
6. Simulation + diff (3 scenarios: cert expiry, crews absent, critical job card). — `pytest backend/tests/test_simulate.py`
7. ML learner with < 20 fallback. — `pytest backend/tests/test_ml.py`
8. FastAPI routes. — `pytest backend/tests/test_api.py`
9. Performance: 40 trains / 2 depots < 10 s. — `pytest backend/tests/test_perf.py`
10. Next.js app shell, API client, synthetic banner. — `npx vitest run`
11. Pages: Plan, Fleet, Mileage & Branding, Depot map, Simulator, Overrides. — `npx vitest run`, `npm run build`
12. Playwright smoke: open Plan, click Generate, see ranked rows. — `npx playwright test`
13. README, user guide, deck. — files exist, README commands run.

## Test plan
- Unit: eligibility rules, generator determinism, learner fallback/training.
- Property-ish: for every generated plan, zero hard violations (asserted by independent checker, not solver).
- Integration: API round-trip on seeded DB (TestClient).
- Performance: 40-train solve wall time < 10 s.
- E2E: Playwright against running backend + frontend.
