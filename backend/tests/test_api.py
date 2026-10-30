import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client(tmp_path):
    c = TestClient(create_app(f"sqlite:///{tmp_path / 't.db'}"))
    assert c.post("/data/seed").status_code == 200
    return c


def test_generate_before_seed_is_409(tmp_path):
    c = TestClient(create_app(f"sqlite:///{tmp_path / 'e.db'}"))
    assert c.post("/plan/generate", json={}).status_code == 409


def test_generate_plan(client):
    r = client.post("/plan/generate", json={})
    assert r.status_code == 200
    body = r.json()
    assert body["feasible"] and len(body["items"]) == 25
    assert all(i["reasons"] for i in body["items"])
    assert client.get(f"/plan/{body['plan_id']}").json()["items"][0]["rank"] == 1
    assert client.get("/plan/history").json()[0]["counts"]["REVENUE"] == 18


def test_simulate_diff(client):
    plan = client.post("/plan/generate", json={}).json()
    tid = next(i["train_id"] for i in plan["items"] if i["assignment"] == "REVENUE")
    r = client.post("/plan/simulate", json={"scenarios": [{"type": "cert_expire", "train_id": tid}]})
    assert r.status_code == 200
    assert any(c["train_id"] == tid and c["after"] == "IBL" for c in r.json()["changes"])


def test_override_logged_and_unfit_rejected(client):
    plan = client.post("/plan/generate", json={}).json()
    standby = next(i["train_id"] for i in plan["items"] if i["assignment"] == "STANDBY")
    r = client.post("/plan/override", json={"train_id": standby, "to_assignment": "REVENUE", "reason": "VIP event"})
    assert r.status_code == 200 and r.json()["from_assignment"] == "STANDBY"
    assert len(client.get("/plan/overrides").json()) == 1
    status = client.get("/fleet/status").json()
    unfit = next((t["train_id"] for t in status["trains"] if not t["fit"]), None)
    if unfit:
        r = client.post("/plan/override", json={"train_id": unfit, "to_assignment": "REVENUE", "reason": "try"})
        assert r.status_code == 422


def test_ingest_json_and_csv(client):
    r = client.post("/data/ingest", json={"branding": []})
    assert r.json()["loaded"] == {"branding": 0}
    csv = b"wonum,assetnum,description,wopriority,status,reportdate\nWO1,TS-01,Door fault,CRITICAL,OPEN,2026-10-30\n"
    r = client.post("/data/ingest", files={"f": ("job_cards.csv", csv, "text/csv")})
    assert r.status_code == 200
    plan = client.post("/plan/generate", json={}).json()
    assert next(i for i in plan["items"] if i["train_id"] == "TS-01")["assignment"] == "IBL"
    assert client.post("/data/ingest", json={"nonsense": []}).status_code == 422
