"""MetroSched FastAPI app. No synthetic data: the default fleet is built from real MetroPT-3 data (app/metropt_fleet.py);
uploaded real files, when present, are used instead."""
from __future__ import annotations

import os
import sys
from datetime import date
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "backend"))

from ml import apu_risk  # noqa: E402
from rag import kb  # noqa: E402
from ml.learner import features, learn_weights  # noqa: E402
from optimizer.constraints import (CERT_LABEL, cleaning_due, expired_certificates, goals_not_used, is_fit,  # noqa: E402
                                   open_critical_jobs, rules_not_checked)
from optimizer.model import PlanResult, solve  # noqa: E402
from optimizer.simulate import simulate  # noqa: E402
from optimizer.snapshot import FleetSnapshot  # noqa: E402

from . import metropt_fleet  # noqa: E402
from . import models as M  # noqa: E402
from . import repo  # noqa: E402
from .db import make_engine, make_session_factory  # noqa: E402
from .schemas import GenerateIn, OverrideIn, OverrideOut, PlanOut, SimulateIn, SimulateOut  # noqa: E402

ITEM_FIELDS = ("train_id", "depot_id", "assignment", "rank", "score", "reasons", "violations")


def create_app(db_url: str | None = None) -> FastAPI:
    SessionLocal = make_session_factory(make_engine(db_url))
    app = FastAPI(title="MetroSched", description="KMRL induction planning from real data: MetroPT-3 compressor sensors, plus any uploaded real files")
    app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
                       allow_methods=["*"], allow_headers=["*"])

    def get_db():
        with SessionLocal() as s:
            yield s

    def data_source(db: Session) -> str:
        return "uploaded" if repo.has_data(db) else "metropt3"

    def snapshot(db: Session) -> FleetSnapshot:
        # Uploaded real files take priority; otherwise the fleet is built from MetroPT-3 alone (no synthetic data).
        if repo.has_data(db):
            data = repo.load_dataset(db)
            base = metropt_fleet.build()
            # Uploads may omit config or depots; fill only those operating parameters from data/fleet_config.json.
            data["config"] = {**base["config"], **data["config"]}
            data["depots"] = data["depots"] or base["depots"]
        else:
            data = metropt_fleet.build()
        # Real MetroPT-3 compressor data, one slice per trainset (see ml/apu_risk.py).
        data["apu"] = apu_risk.assign_slices([t["train_id"] for t in data["trainsets"]])
        return FleetSnapshot.from_dict(data)

    def coverage(snap: FleetSnapshot, db: Session) -> dict:
        return {"data_source": data_source(db), "inputs_loaded": snap.available,
                "rules_not_checked": rules_not_checked(snap), "goals_not_used": goals_not_used(snap)}

    def learned(db: Session):
        overrides = [{"features": o.features, "to_assignment": o.to_assignment} for o in db.scalars(select(M.Override))]
        return learn_weights(overrides)

    def current_weights(db: Session, body_weights, use_learned: bool):
        if body_weights:
            return body_weights, "manual"
        if not use_learned:
            return None, "default"
        w, info = learned(db)
        return w, info["source"]

    def to_out(res: PlanResult, snap: FleetSnapshot, source: str, db: Session, plan: M.Plan | None = None) -> PlanOut:
        return PlanOut(plan_id=plan.id if plan else None, created_at=plan.created_at if plan else None,
                       service_date=snap.service_date.isoformat(), feasible=res.feasible,
                       items=[i.__dict__ for i in res.items], relaxations=res.relaxations,
                       objective=res.objective, solve_seconds=round(res.solve_seconds, 3),
                       weights=res.weights, weights_source=source, **coverage(snap, db))

    @app.get("/health")
    def health():
        return {"status": "ok", "synthetic_data": False, "real_data": ["MetroPT-3 compressor sensors"]}

    @app.get("/data/status")
    def data_status(db: Session = Depends(get_db)):
        """Which inputs are loaded, and which rules and goals cannot be applied without them."""
        return coverage(snapshot(db), db)

    @app.delete("/data")
    def clear_data(db: Session = Depends(get_db)):
        """Remove uploaded files and go back to the MetroPT-3-only fleet."""
        return {"cleared": repo.clear(db)}

    @app.post("/data/ingest")
    async def ingest(request: Request, db: Session = Depends(get_db)):
        """Accept a JSON body {dataset: rows} or multipart files named e.g. trainsets.json, job_cards.csv."""
        ctype = request.headers.get("content-type", "")
        try:
            if ctype.startswith("multipart/"):
                form = await request.form()
                data = {}
                for f in form.values():
                    if hasattr(f, "filename"):
                        key, rows = repo.parse_upload(f.filename, await f.read())
                        data[key] = rows
            else:
                data = await request.json()
            return {"loaded": repo.ingest(db, data)}
        except (ValueError, TypeError, KeyError) as e:
            db.rollback()
            raise HTTPException(422, f"ingest failed: {e}") from e

    @app.post("/plan/generate", response_model=PlanOut)
    def generate_plan(body: GenerateIn | None = None, db: Session = Depends(get_db)):
        body = body or GenerateIn()
        snap = snapshot(db)
        weights, source = current_weights(db, body.weights, body.use_learned_weights)
        res = solve(snap, weights)
        plan = M.Plan(service_date=snap.service_date.isoformat(), feasible=res.feasible, objective=res.objective,
                      solve_seconds=res.solve_seconds, weights=res.weights, relaxations=res.relaxations)
        db.add(plan)
        db.flush()
        db.add_all(M.PlanItemRow(plan_id=plan.id, **i.__dict__) for i in res.items)
        db.commit()
        return to_out(res, snap, source, db, plan)

    @app.post("/plan/simulate", response_model=SimulateOut)
    def simulate_plan(body: SimulateIn, db: Session = Depends(get_db)):
        snap = snapshot(db)
        weights, source = current_weights(db, body.weights, True)
        try:
            r = simulate(snap, [s.model_dump(exclude_none=True) for s in body.scenarios], weights)
        except (KeyError, ValueError) as e:
            raise HTTPException(422, f"bad scenario: {e}") from e
        return SimulateOut(baseline=to_out(r["baseline"], snap, source, db), scenario=to_out(r["scenario"], snap, source, db),
                           changes=r["changes"])

    @app.post("/plan/override", response_model=OverrideOut)
    def override(body: OverrideIn, db: Session = Depends(get_db)):
        snap = snapshot(db)
        try:
            train = snap.train(body.train_id)
        except KeyError:
            raise HTTPException(404, f"unknown train {body.train_id}")
        if body.to_assignment != "IBL" and not is_fit(snap, body.train_id):
            raise HTTPException(422, f"{body.train_id} is unfit (hard constraint); it can only be assigned IBL")
        plan_id = body.plan_id or db.scalar(select(M.Plan.id).order_by(desc(M.Plan.id)).limit(1))
        current = db.scalar(select(M.PlanItemRow).where(M.PlanItemRow.plan_id == plan_id,
                                                        M.PlanItemRow.train_id == body.train_id)) if plan_id else None
        row = M.Override(plan_id=plan_id, train_id=body.train_id,
                         from_assignment=current.assignment if current else "UNKNOWN",
                         to_assignment=body.to_assignment, reason=body.reason, supervisor=body.supervisor,
                         features=features(snap, train))
        db.add(row)
        if current:
            current.assignment = body.to_assignment
            current.violations = current.violations + [
                f"Supervisor override: {row.from_assignment} to {body.to_assignment} ({body.reason})"]
        db.commit()
        return OverrideOut(**{c: getattr(row, c) for c in OverrideOut.model_fields})

    @app.get("/plan/overrides", response_model=list[OverrideOut])
    def list_overrides(db: Session = Depends(get_db)):
        rows = db.scalars(select(M.Override).order_by(desc(M.Override.id)))
        return [OverrideOut(**{c: getattr(r, c) for c in OverrideOut.model_fields}) for r in rows]

    @app.get("/plan/history")
    def history(limit: int = 20, db: Session = Depends(get_db)):
        plans = list(db.scalars(select(M.Plan).order_by(desc(M.Plan.id)).limit(limit)))
        out = []
        for p in plans:
            items = list(db.scalars(select(M.PlanItemRow).where(M.PlanItemRow.plan_id == p.id)))
            out.append({"plan_id": p.id, "created_at": p.created_at, "service_date": p.service_date,
                        "feasible": p.feasible, "objective": p.objective, "solve_seconds": p.solve_seconds,
                        "counts": {a: sum(1 for i in items if i.assignment == a) for a in ("REVENUE", "STANDBY", "IBL")}})
        return out

    @app.get("/plan/{plan_id}", response_model=PlanOut)
    def get_plan(plan_id: int, db: Session = Depends(get_db)):
        p = db.get(M.Plan, plan_id)
        if not p:
            raise HTTPException(404, "plan not found")
        items = db.scalars(select(M.PlanItemRow).where(M.PlanItemRow.plan_id == plan_id).order_by(M.PlanItemRow.rank))
        return PlanOut(plan_id=p.id, created_at=p.created_at, service_date=p.service_date, feasible=p.feasible,
                       items=[{c: getattr(i, c) for c in ITEM_FIELDS} for i in items],
                       relaxations=p.relaxations, objective=p.objective, solve_seconds=p.solve_seconds,
                       weights=p.weights, **coverage(snapshot(db), db))

    @app.get("/fleet/status")
    def fleet_status(db: Session = Depends(get_db)):
        snap = snapshot(db)
        trains = []
        for t in snap.trains:
            tid = t["train_id"]
            trains.append({
                # "fit" is only known when certificate and job-card data are loaded; otherwise it is null (unknown).
                **t, "fit": is_fit(snap, tid) if snap.available["certificates"] and snap.available["job_cards"] else None,
                "cleaning_due": cleaning_due(snap, t),
                "certificates": [{**c, "label": CERT_LABEL[c["kind"]],
                                  "days_left": (date.fromisoformat(c["valid_until"]) - snap.service_date).days}
                                 for c in snap.certificates.get(tid, [])],
                "expired": [c["kind"] for c in expired_certificates(snap, tid)],
                "job_cards": snap.job_cards.get(tid, []),
                "critical_open": len(open_critical_jobs(snap, tid)),
                "branding": snap.branding.get(tid),
                "apu": snap.apu.get(tid),
            })
        return {"service_date": snap.service_date.isoformat(), "synthetic_data": False, **coverage(snap, db),
                "config": {"required_revenue": snap.required_revenue, "min_standby": snap.min_standby,
                           "cleaning_slots": snap.cleaning_slots, "ibl_capacity": snap.ibl_capacity,
                           "cleaning_due_days": snap.cleaning_due_days},
                "depots": snap.depots, "bays": list(snap.bays.values()), "trains": trains}

    @app.get("/kb/search")
    def kb_search(q: str = "", k: int = 5):
        """Retrieve knowledge-base passages: guidance (procedures, real MetroPT-3 failure reports) and past work orders."""
        idx, k = kb.default_index(), max(1, min(k, 20))
        return {"query": q, "hits": idx.search(q, k=k),
                "guidance": idx.search(q, k=k, docs=kb.GUIDANCE_DOCS),
                "past_cases": idx.search(q, k=k, docs=kb.HISTORY_DOCS)}

    @app.get("/kb/train/{train_id}")
    def kb_train(train_id: str, k: int = 3, db: Session = Depends(get_db)):
        """Similar past cases and procedures for each issue this train has tonight."""
        snap = snapshot(db)
        try:
            snap.train(train_id)
        except KeyError:
            raise HTTPException(404, f"unknown train {train_id}")
        return {"train_id": train_id, "related": kb.related_for_train(snap, train_id, k=max(1, min(k, 10)))}

    @app.get("/apu/model")
    def apu_model():
        """How well the compressor risk model detects the real reported failures (out-of-fold)."""
        scores = apu_risk.load_scores()
        if scores is None:
            raise HTTPException(404, "MetroPT-3 data not prepared. Run data/metropt3/prepare.py.")
        return {"source": apu_risk.SOURCE, "alert_threshold": apu_risk.ALERT_AT,
                "slice_hours": apu_risk.SLICE_WINDOWS / 2, "metrics": apu_risk.evaluate(scores)}

    @app.get("/ml/weights")
    def ml_weights(db: Session = Depends(get_db)):
        w, info = learned(db)
        return {"weights": w, **info}

    return app


app = create_app()
