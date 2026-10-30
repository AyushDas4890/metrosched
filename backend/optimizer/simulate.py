"""What-if scenarios: mutate a snapshot copy, re-solve, diff against the baseline plan."""
from __future__ import annotations

from datetime import timedelta

from .model import PlanResult, solve
from .snapshot import FleetSnapshot

SLOTS_PER_CREW = 3


def apply_scenario(snap: FleetSnapshot, scenario: dict) -> FleetSnapshot:
    s = snap.copy()
    kind = scenario["type"]
    if kind == "cert_expire":
        tid = scenario["train_id"]
        cert_kind = scenario.get("kind", "ROLLING_STOCK")
        for c in s.certificates.get(tid, []):
            if c["kind"] == cert_kind:
                c["valid_until"] = (s.service_date - timedelta(days=1)).isoformat()
    elif kind == "crews_absent":
        s.cleaning_slots = max(0, s.cleaning_slots - SLOTS_PER_CREW * int(scenario.get("count", 1)))
    elif kind == "critical_job":
        tid = scenario["train_id"]
        s.job_cards.setdefault(tid, []).append({
            "wonum": "WO-SIM", "assetnum": tid, "description": scenario.get("description", "Simulated critical fault"),
            "wopriority": "CRITICAL", "status": "OPEN", "reportdate": s.service_date.isoformat()})
    elif kind == "required_revenue":
        s.required_revenue = int(scenario["value"])
    else:
        raise ValueError(f"unknown scenario type: {kind}")
    return s


def diff_plans(before: PlanResult, after: PlanResult) -> list[dict]:
    b = {i.train_id: i for i in before.items}
    out = []
    for i in after.items:
        old = b.get(i.train_id)
        if old is None or old.assignment != i.assignment:
            out.append({"train_id": i.train_id, "before": old.assignment if old else None,
                        "after": i.assignment, "reasons": i.reasons})
    return out


def simulate(snap: FleetSnapshot, scenarios: list[dict], weights: dict | None = None) -> dict:
    base = solve(snap, weights)
    mutated = snap
    for sc in scenarios:
        mutated = apply_scenario(mutated, sc)
    after = solve(mutated, weights)
    return {"baseline": base, "scenario": after,
            "changes": diff_plans(base, after) if base.feasible and after.feasible else []}
