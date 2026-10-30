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


def test_readme_scenarios(snap25):
    _, d = _diff(snap25, {"type": "cert_expire", "train_id": "TS-07", "kind": "ROLLING_STOCK"})
    assert d == {("TS-07", "REVENUE", "IBL"), ("TS-04", "IBL", "REVENUE")}
    _, d = _diff(snap25, {"type": "critical_job", "train_id": "TS-22"})
    assert d == {("TS-22", "REVENUE", "IBL"), ("TS-04", "IBL", "REVENUE")}
    _, d = _diff(snap25, {"type": "required_revenue", "value": 16})
    assert {("TS-02", "REVENUE", "STANDBY"), ("TS-13", "REVENUE", "STANDBY"), ("TS-17", "REVENUE", "STANDBY")} <= d
    res, _ = _diff(snap25, {"type": "crews_absent", "count": 1})
    assert not res.feasible
    assert any(r["constraint"] == "cleaning_slots" and r["relax_by"] == 2 for r in res.relaxations)
