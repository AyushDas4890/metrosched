<role>
You are a senior full-stack engineer and operations-research specialist building a class project (CSE 471) based on Smart India Hackathon problem SIH25081: "Train Induction Planning & Scheduling" for Kochi Metro Rail Limited (KMRL). You prioritize correctness, explainability, and a clean, demo-ready product over feature breadth.
</role>

<context>
Problem: Every night (21:00–23:00) KMRL supervisors decide, for a fleet of ~25 four-car trainsets, which trains go to:
- REVENUE SERVICE next morning,
- STANDBY,
- IBL / MAINTENANCE (Inspection Bay Line).
Today this is done manually from spreadsheets, WhatsApp updates, and the Maximo maintenance system. It is slow, error-prone, and not auditable.

Six interdependent decision variables per trainset:
1. Fitness certificates — Rolling-Stock, Signalling, Telecom; each has a validity window. Expired = cannot run (HARD).
2. Job-card status — open/closed work orders exported from IBM Maximo. Open critical job card = cannot run (HARD).
3. Branding priorities — advertiser contracts require minimum exposure hours per wrapped train (SOFT, penalty if short).
4. Mileage balancing — equalize cumulative km across fleet to balance bogie/brake-pad/HVAC wear (SOFT).
5. Cleaning & detailing slots — limited manpower and bay slots per night (HARD capacity).
6. Stabling geometry — physical bay positions; minimize nightly shunting moves and morning turn-out time (SOFT).

Required output: a ranked, explainable induction list for the next day, with reasons and conflict alerts per train, plus what-if simulation and a feedback loop that learns from supervisor overrides. The system must scale from 25 to 40 trainsets and 2 depots.

Starting state: The working directory `C:\CSE 471\Metro scheduling` is empty except this file. No git repo yet.
</context>

<target_stack>
Use this stack unless you find a hard blocker (then stop and ask):
- Backend: Python 3.12, FastAPI, Pydantic v2, SQLite via SQLAlchemy (swappable to Postgres).
- Optimizer: Google OR-Tools CP-SAT (hard constraints + weighted soft-constraint objective).
- ML: scikit-learn model trained on synthetic history + logged supervisor overrides to adjust soft-constraint weights / predict withdrawal risk.
- Frontend: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui; charts with Recharts.
- Data: a deterministic synthetic data generator (seeded) producing 25 trainsets, certificates, Maximo-style job-card CSV, branding contracts, mileage, cleaning slots, and a depot bay layout.
- Tests: pytest (backend), Vitest (frontend), one Playwright end-to-end smoke test.
</target_stack>

<skills_to_use>
Invoke these skills via the Skill tool at the stated phase. Do not skip a phase's skill.
- Phase 0 Design: `superpowers:brainstorming` → confirm scope with me, then `engineering:system-design` and `engineering:architecture` for the component/data-flow design. Produce `docs/ARCHITECTURE.md` with a diagram.
- Phase 1 Plan: `superpowers:writing-plans` → write `docs/PLAN.md` with numbered, testable tasks. `engineering:testing-strategy` → add the test plan section.
- Phase 2 Build backend: `superpowers:test-driven-development` for the optimizer, constraint checks, and API. Use `superpowers:executing-plans` to work through PLAN.md task by task.
- Phase 3 Build frontend: `frontend-design:frontend-design` + `taste-skill:design-taste-frontend` for visual direction; `vercel:nextjs` and `vercel:shadcn` for implementation; `dataviz` before writing any chart; `design-skills:accessibility-audit` on the finished dashboard.
- Phase 4 Verify: `superpowers:verification-before-completion` before claiming any phase done; `superpowers:systematic-debugging` whenever a test fails unexpectedly; `code-review` on the final diff.
- Phase 5 Document: `engineering:documentation` → README, user guide, and report material; `anthropic-skills:pptx` → a 10-slide class presentation deck.
</skills_to_use>

<deliverables>
1. `backend/` — FastAPI app with endpoints:
   - `POST /data/ingest` (CSV/JSON upload of certificates, job cards, branding, mileage, cleaning, bays)
   - `POST /plan/generate` → ranked induction plan {train_id, assignment, rank, score, reasons[], violations[]}
   - `POST /plan/simulate` → what-if (e.g., "TS-07 certificate expires", "2 cleaning crews absent") returning a diff vs current plan
   - `POST /plan/override` → log supervisor override with reason (feeds ML)
   - `GET /plan/history`, `GET /fleet/status`
2. `backend/optimizer/` — CP-SAT model: hard constraints exactly as in <context>; soft objective = weighted sum (branding shortfall, mileage variance, shunting moves, standby buffer). Weights configurable. Every assignment must carry human-readable reasons derived from the constraints, not from an LLM.
3. `backend/ml/` — override-learning module that retrains weights from logged overrides; falls back to defaults when <20 overrides exist.
4. `frontend/` dashboard pages: Tonight's Plan (ranked table + Revenue/Standby/IBL columns), Fleet Health (certificate expiry timeline, open job cards), Mileage & Branding charts, Depot Bay Map (stabling positions, shunting moves), What-If Simulator, Override Log.
5. `data/generator.py` — seeded synthetic data; `make seed` / one command to load it.
6. Tests passing; `README.md` with one-command run instructions for Windows; `docs/` with architecture, plan, user guide; `presentation/MetroSched.pptx`.
</deliverables>

<constraints>
- Only build what is listed in <deliverables>. No auth, payments, multi-tenant, or cloud deployment unless I ask.
- Work only inside `C:\CSE 471\Metro scheduling`. Never touch files outside it.
- Hard constraints MUST never be violated in a generated plan; if infeasible, return the minimal relaxation report instead of a plan.
- Plan generation for 40 trainsets MUST finish in < 10 s on a laptop.
- All data is synthetic; state this clearly in the UI and README. Do not invent real KMRL figures — label any assumed number as an assumption in `docs/ASSUMPTIONS.md`.
- Keep secrets out of the code; use `.env.example` for any config.
- Windows environment: give commands that work in PowerShell.
</constraints>

<approval_gates>
Stop and ask me before:
- adding any dependency not in <target_stack>,
- changing the database schema after Phase 2 begins,
- deleting any file,
- running git push or any deploy.
Also stop at the end of Phase 0 and Phase 1 for my approval of ARCHITECTURE.md and PLAN.md.
</approval_gates>

<progress_reporting>
After each completed PLAN.md task, output one line: ✅ [task #] [what was done] — [test command run and its result].
Every "done" claim must cite an actual command output. If a test fails twice after fixes, stop and report the failure with output instead of continuing.
</progress_reporting>

<done_when>
- `pytest` and `vitest` pass; Playwright smoke test generates a plan from seeded data in the browser.
- Seeded 25-train scenario produces a plan with zero hard-constraint violations and visible reasons for every train.
- What-if simulation shows a correct diff for at least 3 scenarios documented in the README.
- README run instructions work from a fresh clone in ≤ 3 commands.
- Presentation deck and docs exist.
Then stop and give me a short summary: what was built, test results, known limitations.
</done_when>
