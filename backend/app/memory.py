"""Agent memory for the planner (CSE 471 Unit II: agent memory).

The planner keeps two kinds of memory, both read from tables it already writes, so nothing is invented:
- episodic: where each train was placed in earlier saved plans (plans + plan_items);
- feedback: every supervisor change and its reason (overrides).
`recall` turns them into short notes for one plan, so a supervisor sees each train's recent history
next to tonight's decision.
"""
from __future__ import annotations

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from . import models as M

LABEL = {"REVENUE": "In service", "STANDBY": "Standby", "IBL": "Maintenance (IBL)"}


def _past_assignments(db: Session, before_plan_id: int, k: int) -> list[dict[str, str]]:
    """Assignments in the k feasible plans saved before this one, newest first."""
    plans = db.scalars(select(M.Plan.id).where(M.Plan.id < before_plan_id, M.Plan.feasible)
                       .order_by(desc(M.Plan.id)).limit(k))
    out = []
    for pid in plans:
        rows = db.scalars(select(M.PlanItemRow).where(M.PlanItemRow.plan_id == pid))
        out.append({r.train_id: r.assignment for r in rows})
    return out


def recall(db: Session, plan_id: int, k: int = 5) -> dict[str, list[str]]:
    """Memory notes per train for plan `plan_id`, using up to k earlier plans and all overrides."""
    now = {r.train_id: r.assignment for r in db.scalars(select(M.PlanItemRow).where(M.PlanItemRow.plan_id == plan_id))}
    past = _past_assignments(db, plan_id, k)
    overrides = list(db.scalars(select(M.Override).order_by(desc(M.Override.id))))
    notes: dict[str, list[str]] = {}
    for t, a in now.items():
        n: list[str] = []
        seen = [p[t] for p in past if t in p]
        if seen:
            streak = next((i for i, x in enumerate(seen) if x != seen[0]), len(seen))
            if seen[0] != a:
                n.append(f"Last plan had it in {LABEL[seen[0]]}; tonight it is in {LABEL[a]}.")
            elif streak >= 2:
                n.append(f"Same place ({LABEL[a]}) in each of the last {streak} plans.")
            if a == "IBL" and seen.count("IBL") >= 2:
                n.append(f"Sent to maintenance in {seen.count('IBL')} of the last {len(seen)} plans: may need a deeper check.")
        mine = [o for o in overrides if o.train_id == t]
        if mine:
            last = mine[0]
            n.append(f"Supervisors changed it {len(mine)} time(s); last to {LABEL.get(last.to_assignment, last.to_assignment)} "
                     f"on {last.created_at:%d %b}: \"{last.reason}\".")
        if n:
            notes[t] = n
    return notes
