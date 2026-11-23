"""CP-SAT induction model: hard constraints + weighted soft objective."""
from __future__ import annotations

from dataclasses import dataclass, field

from ortools.sat.python import cp_model

from .constraints import (ASSIGNMENTS, IBL, REVENUE, STANDBY, cleaning_due, goals_not_used, is_fit,
                          open_noncritical_jobs, rules_not_checked)
from .explain import explain
from .snapshot import FleetSnapshot

DEFAULT_WEIGHTS = {"branding": 10.0, "mileage": 2.0, "shunting": 5.0, "standby": 3.0, "maintenance": 4.0,
                   "apu_risk": 500.0, "compressor_duty": 2.0, "low_pressure": 5.0}
APU_ALERT_AT = 0.5
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
    rules_not_checked: list[str] = field(default_factory=list)
    goals_not_used: list[str] = field(default_factory=list)


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


def apu_risk(snap: FleetSnapshot, train_id: str) -> float:
    """Compressor failure risk in [0, 1] from MetroPT-3 sensor data; 0 when no sensor data is attached."""
    return float(snap.apu.get(train_id, {}).get("risk", 0.0))


def apu_stat(snap: FleetSnapshot, train_id: str, key: str) -> float:
    return float(snap.apu.get(train_id, {}).get(key, 0.0))


def fleet_mean(snap: FleetSnapshot, values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def real_alarms(snap: FleetSnapshot, train_id: str) -> int:
    """Count of real sensor alarms on this train's slice: high fault risk, time below 7 bar."""
    return int(apu_risk(snap, train_id) >= APU_ALERT_AT) + int(apu_stat(snap, train_id, "low_pressure_minutes") > 0)


def candidate_score(snap: FleetSnapshot, train: dict, weights: dict, mean_km: float) -> float:
    """Assignment-independent desirability for revenue service; used for ranking and per-train score."""
    tid = train["train_id"]
    s = 50.0
    br = snap.branding.get(tid)
    if br:
        s += weights["branding"] * (br["min_hours_per_day"] + br["hours_shortfall_7d"]) / 10
    if snap.available["mileage"]:
        s -= weights["mileage"] * (train["cumulative_km"] - mean_km) / 10_000
    bay = snap.bays.get(train.get("bay_id"))
    if bay and bay["kind"] == "STABLING":
        s -= weights["shunting"] * (bay["position"] - 1)
    s -= weights["maintenance"] * len(open_noncritical_jobs(snap, tid))
    s -= weights["apu_risk"] * apu_risk(snap, tid) / 10
    s -= weights["low_pressure"] * min(apu_stat(snap, tid, "low_pressure_minutes"), 60) / 10
    duty_mean = fleet_mean(snap, [apu_stat(snap, t["train_id"], "duty") for t in snap.trains])
    s -= weights["compressor_duty"] * (apu_stat(snap, tid, "duty") - duty_mean) * 10
    if not is_fit(snap, tid):
        s -= 100
    return round(s, 1)


def _build(snap: FleetSnapshot, weights: dict, relax: bool, pinned: dict[str, str] | None = None):
    m = cp_model.CpModel()
    ids = [t["train_id"] for t in snap.trains]
    x = {(t, a): m.new_bool_var(f"x_{t}_{a}") for t in ids for a in ASSIGNMENTS}
    for t in ids:
        m.add_exactly_one(x[t, a] for a in ASSIGNMENTS)
        if not is_fit(snap, t):
            m.add(x[t, IBL] == 1)
    # Supervisor decisions are fixed; the solver re-plans every other train around them.
    for t, a in (pinned or {}).items():
        m.add(x[t, a] == 1)

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
    if snap.available["cleaning"]:
        due = [t["train_id"] for t in snap.trains if cleaning_due(snap, t)]
        m.add(sum(x[t, REVENUE] for t in due) <= snap.cleaning_slots + slack_var("cleaning_slots", n))

    # Soft objective (integer-scaled, minimise). Terms whose input is not loaded are left out.
    mean_km = fleet_mean(snap, [t["cumulative_km"] for t in snap.trains]) if snap.available["mileage"] else 0.0
    duty_mean = fleet_mean(snap, [apu_stat(snap, t["train_id"], "duty") for t in snap.trains])
    terms = []
    for tr in snap.trains:
        t = tr["train_id"]
        br = snap.branding.get(t)
        if br:
            need = br["min_hours_per_day"] + br["hours_shortfall_7d"]
            terms.append(int(weights["branding"] * need) * (1 - x[t, REVENUE]))
        if snap.available["mileage"]:
            terms.append(int(weights["mileage"] * (tr["cumulative_km"] - mean_km) / 1000) * x[t, REVENUE])
        terms.append(int(weights["apu_risk"] * apu_risk(snap, t)) * x[t, REVENUE])
        # Real MetroPT-3 operating statistics: minutes below 7 bar, and loaded share above the fleet mean.
        terms.append(int(weights["low_pressure"] * min(apu_stat(snap, t, "low_pressure_minutes"), 60)) * x[t, REVENUE])
        terms.append(int(weights["compressor_duty"] * (apu_stat(snap, t, "duty") - duty_mean) * 100) * x[t, REVENUE])
        terms.append(-int(weights["standby"] * 10) * x[t, STANDBY])
        if is_fit(snap, t):
            work = len(open_noncritical_jobs(snap, t)) + real_alarms(snap, t)
            terms.append(-int(weights["maintenance"] * 10 * work) * x[t, IBL])
    for t, u in shunt_pairs(snap):
        mv = m.new_bool_var(f"mv_{t}_{u}")
        m.add(mv >= x[t, REVENUE] - x[u, REVENUE])
        terms.append(int(weights["shunting"] * 10) * mv)
    if relax:
        terms += [RELAX_PENALTY * s for s in slack.values()]
    m.minimize(sum(terms))
    return m, x, slack, mean_km


def solve(snap: FleetSnapshot, weights: dict | None = None, pinned: dict[str, str] | None = None) -> PlanResult:
    """Optimal plan. `pinned` maps train_id -> assignment fixed by a supervisor."""
    weights = {**DEFAULT_WEIGHTS, **(weights or {})}
    m, x, _, mean_km = _build(snap, weights, relax=False, pinned=pinned)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = TIME_LIMIT_S
    solver.parameters.num_workers = 1  # single worker: tied optima always resolve the same way
    status = solver.solve(m)
    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return _relaxation_report(snap, weights, pinned)

    assignment = {t["train_id"]: next(a for a in ASSIGNMENTS if solver.value(x[t["train_id"], a]))
                  for t in snap.trains}
    order = {REVENUE: 0, STANDBY: 1, IBL: 2}
    scored = [(t, candidate_score(snap, t, weights, mean_km)) for t in snap.trains]
    scored.sort(key=lambda p: (order[assignment[p[0]["train_id"]]], -p[1], p[0]["train_id"]))
    items = []
    for rank, (t, score) in enumerate(scored, start=1):
        reasons, alerts = explain(snap, t, assignment, mean_km)
        items.append(PlanItem(t["train_id"], t["depot_id"], assignment[t["train_id"]], rank, score, reasons, alerts))
    return PlanResult(True, items, [], solver.objective_value, solver.wall_time, weights,
                      rules_not_checked(snap), goals_not_used(snap))


def _relaxation_report(snap: FleetSnapshot, weights: dict, pinned: dict[str, str] | None = None) -> PlanResult:
    m, _, slack, _ = _build(snap, weights, relax=True, pinned=pinned)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = TIME_LIMIT_S
    solver.parameters.num_workers = 1  # single worker: tied optima always resolve the same way
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
    return PlanResult(False, [], relax, 0.0, solver.wall_time, weights, rules_not_checked(snap), goals_not_used(snap))
