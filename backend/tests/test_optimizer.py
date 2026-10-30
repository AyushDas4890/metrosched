from optimizer.constraints import IBL, REVENUE, check_plan, is_fit
from optimizer.model import DEFAULT_WEIGHTS, solve


def test_seeded_plan_feasible_and_explained(snap25):
    res = solve(snap25)
    assert res.feasible
    plan = {i.train_id: i.assignment for i in res.items}
    assert check_plan(snap25, plan) == []
    assert all(i.reasons for i in res.items)
    assert sorted(i.rank for i in res.items) == list(range(1, 26))


def test_unfit_trains_go_to_ibl(snap25):
    res = solve(snap25)
    for i in res.items:
        if not is_fit(snap25, i.train_id):
            assert i.assignment == IBL


def test_infeasible_returns_relaxation(snap25):
    snap25.required_revenue = 25
    res = solve(snap25)
    assert not res.feasible
    assert res.items == []
    assert any(r["constraint"] == "required_revenue" for r in res.relaxations)


def test_branding_weight_pulls_branded_into_revenue(snap25):
    w = dict(DEFAULT_WEIGHTS, branding=1000)
    res = solve(snap25, w)
    plan = {i.train_id: i.assignment for i in res.items}
    fit_branded = [t for t in snap25.branding if is_fit(snap25, t)]
    assert all(plan[t] == REVENUE for t in fit_branded)
