"""Agent memory: notes come from earlier saved plans and supervisor changes only."""
from fastapi.testclient import TestClient

from app.main import create_app


def test_memory_recalls_past_plans_and_supervisor_changes(tmp_path):
    c = TestClient(create_app(f"sqlite:///{tmp_path / 'm.db'}"))
    first = c.post("/plan/generate", json={}).json()
    assert c.get(f"/plan/{first['plan_id']}/memory").json()["notes"] == {}  # nothing remembered yet

    c.post("/plan/override", json={"train_id": "TS-12", "to_assignment": "IBL", "reason": "brake check",
                                   "plan_id": first["plan_id"]})
    c.post("/plan/generate", json={})
    third = c.post("/plan/generate", json={}).json()
    notes = c.get(f"/plan/{third['plan_id']}/memory").json()["notes"]

    assert any('"brake check"' in n for n in notes["TS-12"])        # feedback memory
    steady = [t for t, ns in notes.items() if any("Same place" in n for n in ns)]
    assert steady                                                     # episodic memory
    assert c.get("/plan/9999/memory").status_code == 404
