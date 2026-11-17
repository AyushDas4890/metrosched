import sys

import pandas as pd
import pytest

from ml import apu_risk
from optimizer.constraints import REVENUE, check_plan
from optimizer.model import solve

sys.path.insert(0, str(apu_risk.ROOT / "data" / "metropt3"))
from prepare import aggregate, failure_label  # noqa: E402

needs_data = pytest.mark.skipif(not apu_risk.WINDOWS.exists(), reason="MetroPT-3 windows.csv not prepared")


def test_failure_label_marks_overlapping_windows():
    starts = pd.Series(pd.to_datetime(["2020-04-17 23:00", "2020-04-17 23:45", "2020-04-18 12:00", "2020-04-19 00:30"]))
    assert failure_label(starts).tolist() == [0, 1, 1, 0]


def test_aggregate_builds_windows_with_features():
    ts = pd.date_range("2020-07-15 14:00", periods=360, freq="10s")  # one hour at 0.1 Hz
    df = pd.DataFrame({"timestamp": ts.astype(str)})
    for c in apu_risk_columns():
        df[c] = 1.0
    out = aggregate(df)
    assert len(out) == 2
    assert out["failure"].tolist() == [0, 1]  # failure #4 starts at 14:30
    assert {"TP2_mean", "TP2_std", "LPS_mean"} <= set(out.columns)


def apu_risk_columns():
    from prepare import ANALOG, DIGITAL
    return ANALOG + DIGITAL


@needs_data
def test_model_ranks_failures_above_normal_operation():
    m = apu_risk.evaluate(apu_risk.load_scores())
    assert m["events"] == 4
    assert m["roc_auc"] > 0.9


@needs_data
def test_slices_are_deterministic_and_faulty_slices_hold_real_failures():
    ids = [f"TS-{i:02d}" for i in range(1, 26)]
    a, b = apu_risk.assign_slices(ids), apu_risk.assign_slices(ids)
    assert a == b
    faulty = [t for t, v in a.items() if v["reported_failure_in_slice"]]
    assert len(faulty) == apu_risk.N_FAULTY
    assert all(0.0 <= v["risk"] <= 1.0 for v in a.values())


def test_high_compressor_risk_pushes_train_out_of_revenue(snap25):
    base = {i.train_id: i for i in solve(snap25).items}
    tid = next(t for t, i in base.items() if i.assignment == REVENUE and i.rank > 10)
    snap25.apu = {tid: {"risk": 0.95, "slice_start": "2020-05-29 20:30", "slice_end": "2020-05-30 08:00",
                        "reported_failure_in_slice": True}}
    res = solve(snap25)
    item = next(i for i in res.items if i.train_id == tid)
    assert item.assignment != REVENUE
    assert any("Compressor (APU) fault risk 95%" in v for v in item.violations)
    assert check_plan(snap25, {i.train_id: i.assignment for i in res.items}) == []


@needs_data
def test_api_exposes_risk(tmp_path):
    from fastapi.testclient import TestClient
    from app.main import create_app
    c = TestClient(create_app(f"sqlite:///{tmp_path / 'a.db'}"))
    c.post("/data/seed")
    trains = c.get("/fleet/status").json()["trains"]
    assert all(t["apu"] and "risk" in t["apu"] for t in trains)
    model = c.get("/apu/model").json()
    assert model["metrics"]["events"] == 4 and "MetroPT-3" in model["source"]
