"""Re-capture the real API outputs quoted in guide.html. Run from the project root:
    .venv\\Scripts\\python docs\\guide\\capture.py
Writes docs/guide/_captures.txt (plan, reasons, what-ifs) and _captures2.txt (every endpoint sample).
"""
import json
import os
import sys
import tempfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "backend"), str(ROOT / "data")]

from fastapi.testclient import TestClient  # noqa: E402

from app.main import create_app  # noqa: E402


def client():
    return TestClient(create_app("sqlite:///" + os.path.join(tempfile.mkdtemp(), "g.db")))


def part1(out):
    c = client()
    out.append(("SEED", c.post("/data/seed").json()))
    p = c.post("/plan/generate", json={}).json()
    out.append(("PLAN_META", {k: p[k] for k in ("plan_id", "service_date", "feasible", "objective", "solve_seconds", "weights")}))
    out.append(("COUNTS", dict(Counter(i["assignment"] for i in p["items"]))))
    for tid in ("TS-07", "TS-22", "TS-21", "TS-09", "TS-20", "TS-15"):
        out.append(("ITEM " + tid, next(i for i in p["items"] if i["train_id"] == tid)))
    for sc in ({"type": "cert_expire", "train_id": "TS-07", "kind": "ROLLING_STOCK"}, {"type": "critical_job", "train_id": "TS-22"},
               {"type": "required_revenue", "value": 16}, {"type": "crews_absent", "count": 1}):
        r = c.post("/plan/simulate", json={"scenarios": [sc]}).json()
        out.append(("SIM " + sc["type"], {"feasible": r["scenario"]["feasible"],
                                          "changes": [(x["train_id"], x["before"], x["after"]) for x in r["changes"]],
                                          "relaxations": r["scenario"]["relaxations"]}))
    out.append(("APU_MODEL", c.get("/apu/model").json()))


def part2(out):
    c = client()
    out.append(("GENERATE_BEFORE_SEED", c.post("/plan/generate", json={}).json()))
    out.append(("HEALTH", c.get("/health").json()))
    c.post("/data/seed")
    p = c.post("/plan/generate", json={}).json()
    out.append(("PLAN_BY_ID", {k: v for k, v in c.get(f"/plan/{p['plan_id']}").json().items() if k != "items"}))
    out.append(("OVERRIDE", c.post("/plan/override", json={"train_id": "TS-04", "to_assignment": "REVENUE", "reason": "Special event service"}).json()))
    out.append(("OVERRIDES", c.get("/plan/overrides").json()))
    out.append(("HISTORY", c.get("/plan/history").json()[:1]))
    out.append(("WEIGHTS", c.get("/ml/weights").json()))
    out.append(("FLEET_TS01", c.get("/fleet/status").json()["trains"][0]))
    out.append(("INGEST_JSON", c.post("/data/ingest", json={"branding": [{"contract_id": "BR-X", "train_id": "TS-02", "advertiser": "Milma",
                                                                           "min_hours_per_day": 10, "hours_shortfall_7d": 6}]}).json()))
    csv = b"wonum,assetnum,description,wopriority,status,reportdate\nWO900001,TS-05,Pantograph inspection,HIGH,OPEN,2026-10-31\n"
    out.append(("INGEST_CSV", c.post("/data/ingest", files={"f": ("job_cards.csv", csv, "text/csv")}).json()))
    bad = c.post("/data/ingest", json={"nonsense": []})
    out.append(("INGEST_BAD", {"status": bad.status_code, "body": bad.json()}))


for name, fn in (("_captures.txt", part1), ("_captures2.txt", part2)):
    lines = []
    fn(lines)
    text = "\n".join(f"{k} {json.dumps(v, default=str)}" for k, v in lines) + "\n"
    (Path(__file__).parent / name).write_text(text, encoding="utf-8")
    print("wrote", name)
