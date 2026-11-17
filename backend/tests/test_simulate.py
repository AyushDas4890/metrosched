from optimizer.constraints import IBL, REVENUE, check_plan
from optimizer.simulate import apply_scenario, simulate


def _revenue_train(snap):
    from optimizer.model import solve
    return next(i.train_id for i in solve(snap).items if i.assignment == REVENUE)


def test_cert_expiry_moves_train_to_ibl(snap25):
    tid = _revenue_train(snap25)
    r = simulate(snap25, [{"type": "cert_expire", "train_id": tid, "kind": "ROLLING_STOCK"}])
    after = {i.train_id: i.assignment for i in r["scenario"].items}
    assert after[tid] == IBL
    assert any(c["train_id"] == tid and c["before"] == REVENUE for c in r["changes"])


def test_crews_absent_respects_fewer_slots(snap25):
    r = simulate(snap25, [{"type": "crews_absent", "count": 2}])
    mutated = apply_scenario(snap25, {"type": "crews_absent", "count": 2})
    assert mutated.cleaning_slots == snap25.cleaning_slots - 6
    if r["scenario"].feasible:
        assert check_plan(mutated, {i.train_id: i.assignment for i in r["scenario"].items}) == []
    else:
        assert r["scenario"].relaxations


def test_critical_job_card(snap25):
    tid = _revenue_train(snap25)
    r = simulate(snap25, [{"type": "critical_job", "train_id": tid}])
    after = {i.train_id: i.assignment for i in r["scenario"].items}
    assert after[tid] == IBL
    assert snap25.job_cards.get(tid, []) == [j for j in snap25.job_cards.get(tid, []) if j["wonum"] != "WO-SIM"]


def _diff(snap, scenario):
    r = simulate(snap, [scenario])
    return r["scenario"], {(c["train_id"], c["before"], c["after"]) for c in r["changes"]}


def test_readme_scenarios(snap25_apu):
    """The four what-if scenarios documented in README.md, on the fleet as the API sees it (with MetroPT-3 risk)."""
    snap = snap25_apu
    _, d = _diff(snap, {"type": "cert_expire", "train_id": "TS-07", "kind": "ROLLING_STOCK"})
    assert d == {("TS-07", "REVENUE", "IBL"), ("TS-04", "STANDBY", "REVENUE"), ("TS-21", "IBL", "STANDBY")}
    _, d = _diff(snap, {"type": "critical_job", "train_id": "TS-22"})
    assert d == {("TS-22", "REVENUE", "IBL"), ("TS-04", "STANDBY", "REVENUE"), ("TS-21", "IBL", "STANDBY")}
    _, d = _diff(snap, {"type": "required_revenue", "value": 16})
    assert d == {("TS-09", "REVENUE", "STANDBY"), ("TS-20", "REVENUE", "STANDBY"), ("TS-04", "STANDBY", "IBL")}
    res, _ = _diff(snap, {"type": "crews_absent", "count": 1})
    assert not res.feasible
    assert any(r["relax_by"] == 2 for r in res.relaxations if r["constraint"] != "info")
