"""Pure hard-constraint checks, shared by the optimizer, explanations and the independent plan checker."""
from __future__ import annotations

from datetime import date

from .snapshot import FleetSnapshot

REVENUE, STANDBY, IBL = "REVENUE", "STANDBY", "IBL"
ASSIGNMENTS = (REVENUE, STANDBY, IBL)
CERT_LABEL = {"ROLLING_STOCK": "Rolling-Stock", "SIGNALLING": "Signalling", "TELECOM": "Telecom"}


def expired_certificates(snap: FleetSnapshot, train_id: str) -> list[dict]:
    return [c for c in snap.certificates.get(train_id, [])
            if date.fromisoformat(c["valid_until"]) < snap.service_date]


def missing_certificates(snap: FleetSnapshot, train_id: str) -> list[str]:
    if not snap.available["certificates"]:
        return []  # no certificate data loaded: this rule is reported as not checked (rules_not_checked)
    have = {c["kind"] for c in snap.certificates.get(train_id, [])}
    return [k for k in CERT_LABEL if k not in have]


def open_critical_jobs(snap: FleetSnapshot, train_id: str) -> list[dict]:
    return [j for j in snap.job_cards.get(train_id, [])
            if j["status"] == "OPEN" and j["wopriority"] == "CRITICAL"]


def open_noncritical_jobs(snap: FleetSnapshot, train_id: str) -> list[dict]:
    return [j for j in snap.job_cards.get(train_id, [])
            if j["status"] == "OPEN" and j["wopriority"] != "CRITICAL"]


def is_fit(snap: FleetSnapshot, train_id: str) -> bool:
    return not (expired_certificates(snap, train_id) or missing_certificates(snap, train_id)
                or open_critical_jobs(snap, train_id))


def cleaning_due(snap: FleetSnapshot, train: dict) -> bool:
    if not snap.available["cleaning"] or train.get("days_since_cleaning") is None:
        return False
    return train["days_since_cleaning"] >= snap.cleaning_due_days


HARD_RULE_INPUTS = {
    "certificates": "Fitness certificates valid (no certificate data loaded)",
    "job_cards": "No open critical job card (no job-card data loaded)",
    "cleaning": "Cleaning-slot capacity (no cleaning data loaded)",
}
SOFT_GOAL_INPUTS = {
    "branding": "Branding exposure (no branding data loaded)",
    "mileage": "Mileage balancing (no mileage data loaded)",
    "bays": "Shunting / stabling geometry (no bay data loaded)",
    "compressor": "Compressor fault risk (no MetroPT-3 data prepared)",
}


def rules_not_checked(snap: FleetSnapshot) -> list[str]:
    """Hard rules that could not be checked because their input is missing. Shown with every plan."""
    return [label for key, label in HARD_RULE_INPUTS.items() if not snap.available[key]]


def goals_not_used(snap: FleetSnapshot) -> list[str]:
    return [label for key, label in SOFT_GOAL_INPUTS.items() if not snap.available[key]]


def check_plan(snap: FleetSnapshot, assignment: dict[str, str]) -> list[str]:
    """Independent hard-constraint checker. Returns a list of violations (empty = valid)."""
    problems: list[str] = []
    if set(assignment) != {t["train_id"] for t in snap.trains}:
        problems.append("plan does not cover exactly the fleet")
    for t in snap.trains:
        tid = t["train_id"]
        a = assignment.get(tid)
        if a not in ASSIGNMENTS:
            problems.append(f"{tid}: invalid assignment {a}")
        elif a != IBL and not is_fit(snap, tid):
            problems.append(f"{tid}: unfit train assigned {a}")
    counts = {a: sum(1 for v in assignment.values() if v == a) for a in ASSIGNMENTS}
    if counts[REVENUE] != snap.required_revenue:
        problems.append(f"revenue count {counts[REVENUE]} != required {snap.required_revenue}")
    if counts[STANDBY] < snap.min_standby:
        problems.append(f"standby {counts[STANDBY]} < minimum {snap.min_standby}")
    if counts[IBL] > snap.ibl_capacity:
        problems.append(f"IBL {counts[IBL]} > capacity {snap.ibl_capacity}")
    needs_clean = sum(1 for t in snap.trains if assignment.get(t["train_id"]) == REVENUE and cleaning_due(snap, t))
    if snap.available["cleaning"] and needs_clean > snap.cleaning_slots:
        problems.append(f"cleaning demand {needs_clean} > slots {snap.cleaning_slots}")
    return problems
