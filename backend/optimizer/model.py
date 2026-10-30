"""CP-SAT induction model: hard constraints + weighted soft objective."""
from __future__ import annotations

from dataclasses import dataclass, field

from ortools.sat.python import cp_model

from .constraints import ASSIGNMENTS, IBL, REVENUE, STANDBY, cleaning_due, is_fit, open_noncritical_jobs
from .explain import explain
from .snapshot import FleetSnapshot

DEFAULT_WEIGHTS = {"branding": 10.0, "mileage": 2.0, "shunting": 5.0, "standby": 3.0, "maintenance": 4.0}
TIME_LIMIT_S = 8.0
RELAX_PENALTY = 1_000_000


@dataclass
class PlanItem:
    train_id: str
    depot_id: str
    assignment: str
    rank: int
    score: float
    reasons: list[str]
    violations: list[str]


@dataclass
class PlanResult:
    feasible: bool
    items: list[PlanItem] = field(default_factory=list)
    relaxations: list[dict] = field(default_factory=list)
    objective: float = 0.0
    solve_seconds: float = 0.0
    weights: dict = field(default_factory=dict)


def shunt_pairs(snap: FleetSnapshot) -> list[tuple[str, str]]:
    """(t, u): u sits between t and the exit on the same stabling line, so if t goes out and u stays, u must move."""
    pos = {}
    for t in snap.trains:
        bay = snap.bays.get(t["bay_id"])
        if bay and bay["kind"] == "STABLING":
            pos[t["train_id"]] = (bay["depot_id"], bay["line"], bay["position"])
    pairs = []
    for t, (dt, lt, pt) in pos.items():
        for u, (du, lu, pu) in pos.items():
            if t != u and dt == du and lt == lu and pu < pt:
                pairs.append((t, u))
    return pairs


def candidate_score(snap: FleetSnapshot, train: dict, weights: dict, mean_km: float) -> float:
    """Assignment-independent desirability for revenue service; used for ranking and per-train score."""
    tid = train["train_id"]
    s = 50.0
    br = snap.branding.get(tid)
    if br:
        s += weights["branding"] * (br["min_hours_per_day"] + br["hours_shortfall_7d"]) / 10
    s -= weights["mileage"] * (train["cumulative_km"] - mean_km) / 10_000
    bay = snap.bays.get(train["bay_id"])
    if bay and bay["kind"] == "STABLING":
        s -= weights["shunting"] * (bay["position"] - 1)
    s -= weights["maintenance"] * len(open_noncritical_jobs(snap, tid))
    if not is_fit(snap, tid):
        s -= 100
    return round(s, 1)


def _build(snap: FleetSnapshot, weights: dict, relax: bool):
    m = cp_model.CpModel()
    ids = [t["train_id"] for t in snap.trains]
    x = {(t, a): m.new_bool_var(f"x_{t}_{a}") for t in ids for a in ASSIGNMENTS}
    for t in ids:
        m.add_exactly_one(x[t, a] for a in ASSIGNMENTS)
        if not is_fit(snap, t):
            m.add(x[t, IBL] == 1)

    slack = {}
    def slack_var(name, ub):
        if not relax:
            return 0
        slack[name] = m.new_int_var(0, ub, f"s_{name}")
        return slack[name]

    n = len(ids)
    rev = sum(x[t, REVENUE] for t in ids)
    m.add(rev + slack_var("required_revenue", n) == snap.required_revenue)
    m.add(sum(x[t, STANDBY] for t in ids) + slack_var("min_standby", n) >= snap.min_standby)
    m.add(sum(x[t, IBL] for t in ids) <= snap.ibl_capacity + slack_var("ibl_capacity", n))
    due = [t["train_id"] for t in snap.trains if cleaning_due(snap, t)]
    m.add(sum(x[t, REVENUE] for t in due) <= snap.cleaning_slots + slack_var("cleaning_slots", n))

    # Soft objective (integer-scaled, minimise).
    mean_km = sum(t["cumulative_km"] for t in snap.trains) / n
    terms = []
    for tr in snap.trains:
        t = tr["train_id"]
        br = snap.branding.get(t)
        if br:
            need = br["min_hours_per_day"] + br["hours_shortfall_7d"]
            terms.append(int(weights["branding"] * need) * (1 - x[t, REVENUE]))
        terms.append(int(weights["mileage"] * (tr["cumulative_km"] - mean_km) / 1000) * x[t, REVENUE])
        terms.append(-int(weights["standby"] * 10) * x[t, STANDBY])
        if is_fit(snap, t):
            jobs = len(open_noncritical_jobs(snap, t))
            terms.append(-int(weights["maintenance"] * 10 * jobs) * x[t, IBL])
    for t, u in shunt_pairs(snap):
        mv = m.new_bool_var(f"mv_{t}_{u}")
        m.add(mv >= x[t, REVENUE] - x[u, REVENUE])
        terms.append(int(weights["shunting"] * 10) * mv)
    if relax:
        terms += [RELAX_PENALTY * s for s in slack.values()]
    m.minimize(sum(terms))
    return m, x, slack, mean_km


def solve(snap: FleetSnapshot, weights: dict | None = None) -> PlanResult:
    weights = {**DEFAULT_WEIGHTS, **(weights or {})}
    m, x, _, mean_km = _build(snap, weights, relax=False)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = TIME_LIMIT_S
    solver.parameters.num_workers = 8
    status = solver.solve(m)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return _relaxation_report(snap, weights)

    assignment = {t["train_id"]: next(a for a in ASSIGNMENTS if solver.value(x[t["train_id"], a]))
                  for t in snap.trains}
    order = {REVENUE: 0, STANDBY: 1, IBL: 2}
    scored = [(t, candidate_score(snap, t, weights, mean_km)) for t in snap.trains]
    scored.sort(key=lambda p: (order[assignment[p[0]["train_id"]]], -p[1], p[0]["train_id"]))
    items = []
    for rank, (t, score) in enumerate(scored, start=1):
        reasons, alerts = explain(snap, t, assignment, mean_km)
        items.append(PlanItem(t["train_id"], t["depot_id"], assignment[t["train_id"]], rank, score, reasons, alerts))
    return PlanResult(True, items, [], solver.objective_value, solver.wall_time, weights)


def _relaxation_report(snap: FleetSnapshot, weights: dict) -> PlanResult:
    m, _, slack, _ = _build(snap, weights, relax=True)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = TIME_LIMIT_S
    solver.parameters.num_workers = 8
    status = solver.solve(m)
    relax = []
    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        for name, var in slack.items():
            v = solver.value(var)
            if v:
                relax.append({"constraint": name, "relax_by": v,
                              "message": f"Relax {name.replace('_', ' ')} by {v} to obtain a feasible plan"})
    unfit = sum(1 for t in snap.trains if not is_fit(snap, t["train_id"]))
    relax.append({"constraint": "info", "relax_by": 0,
                  "message": f"{unfit} train(s) unfit (certificates / critical job cards are never relaxed)"})
    return PlanResult(False, [], relax, 0.0, solver.wall_time, weights)
