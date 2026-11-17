import time

from fixture_data import generate
from optimizer.constraints import check_plan
from optimizer.model import solve
from optimizer.snapshot import FleetSnapshot


def test_40_trains_2_depots_under_10s():
    snap = FleetSnapshot.from_dict(generate(40, 2, 471))
    t0 = time.perf_counter()
    res = solve(snap)
    elapsed = time.perf_counter() - t0
    assert elapsed < 10
    assert res.feasible
    assert check_plan(snap, {i.train_id: i.assignment for i in res.items}) == []
    assert {i.depot_id for i in res.items} == {"D1", "D2"}
