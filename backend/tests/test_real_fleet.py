"""The default, real-data-only fleet: built from MetroPT-3 with no synthetic planning inputs."""
from app import metropt_fleet
from ml.apu_risk import assign_slices
from optimizer.constraints import IBL, REVENUE, check_plan, rules_not_checked
from optimizer.model import solve
from optimizer.snapshot import FleetSnapshot


def real_snapshot():
    data = metropt_fleet.build()
    data["apu"] = assign_slices([t["train_id"] for t in data["trainsets"]])
    return FleetSnapshot.from_dict(data)


def test_fleet_has_no_synthetic_inputs():
    data = metropt_fleet.build()
    assert len(data["trainsets"]) == 25 and data["depots"][0]["name"] == "Muttom"
    assert data["certificates"] == data["job_cards"] == data["branding"] == data["bays"] == []
    assert all(t["cumulative_km"] is None and t["bay_id"] is None and t["days_since_cleaning"] is None
               for t in data["trainsets"])


def test_missing_inputs_are_reported_not_silently_passed():
    snap = real_snapshot()
    assert snap.available == {"certificates": False, "job_cards": False, "branding": False, "mileage": False,
                              "cleaning": False, "bays": False, "compressor": True}
    assert len(rules_not_checked(snap)) == 3
    res = solve(snap)
    assert res.feasible and len(res.rules_not_checked) == 3 and len(res.goals_not_used) == 3


def test_plan_runs_on_real_sensor_data_only():
    snap = real_snapshot()
    res = solve(snap)
    plan = {i.train_id: i.assignment for i in res.items}
    assert check_plan(snap, plan) == []
    assert list(plan.values()).count(REVENUE) == 18
    assert plan["TS-21"] == IBL  # 94% fault risk; its slice holds the real 29-30 May 2020 air leak
    assert all(i.reasons for i in res.items)
    assert not any("Mileage" in r or "fitness certificate" in r.lower() or "certificates valid" in r for i in res.items for r in i.reasons)


def test_fleet_status_does_not_claim_fitness_without_data(tmp_path):
    from fastapi.testclient import TestClient
    from app.main import create_app
    trains = TestClient(create_app(f"sqlite:///{tmp_path / 'f.db'}")).get("/fleet/status").json()["trains"]
    assert all(t["fit"] is None for t in trains)


def test_low_pressure_minutes_raise_an_alert():
    snap = real_snapshot()
    item = next(i for i in solve(snap).items if i.train_id == "TS-05")
    assert any("below 7 bar" in v for v in item.violations)
