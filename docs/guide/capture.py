"""Re-capture the real API outputs quoted in guide.html. Run from the project root:
    .venv\\Scripts\\python docs\\guide\\capture.py
Uses a fresh temporary database, so the app runs on the MetroPT-3 fleet (no uploads).
Writes docs/guide/_captures.txt (plan, reasons, what-ifs) and _captures2.txt (endpoint samples).
"""
import json
import os
import sys
import tempfile
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path[:0] = [str(ROOT / "backend")]

from fastapi.testclient import TestClient  # noqa: E402

from app.main import create_app  # noqa: E402


def client():
    return TestClient(create_app("sqlite:///" + os.path.join(tempfile.mkdtemp(), "g.db")))


def part1(out):
    c = client()
    out.append(("DATA_STATUS", c.get("/data/status").json()))
    p = c.post("/plan/generate", json={}).json()
    out.append(("PLAN_META", {k: p[k] for k in ("plan_id", "feasible", "objective", "solve_seconds", "weights", "data_source")}))
    out.append(("COUNTS", dict(Counter(i["assignment"] for i in p["items"]))))
    out.append(("BY_ASSIGNMENT", {a: [i["train_id"] for i in p["items"] if i["assignment"] == a] for a in ("REVENUE", "STANDBY", "IBL")}))
    for tid in ("TS-08", "TS-05", "TS-21", "TS-09", "TS-03"):
        out.append(("ITEM " + tid, next(i for i in p["items"] if i["train_id"] == tid)))
    for sc in ({"type": "cert_expire", "train_id": "TS-07", "kind": "ROLLING_STOCK"}, {"type": "critical_job", "train_id": "TS-12"},
               {"type": "required_revenue", "value": 16}, {"type": "crews_absent", "count": 1}):
        r = c.post("/plan/simulate", json={"scenarios": [sc]})
        body = r.json()
        out.append(("SIM " + sc["type"], body if r.status_code != 200 else
                    {"feasible": body["scenario"]["feasible"], "changes": [(x["train_id"], x["before"], x["after"]) for x in body["changes"]]}))
    out.append(("APU_MODEL", c.get("/apu/model").json()))
    out.append(("KB_TS21", c.get("/kb/train/TS-21").json()))


def part2(out):
    c = client()
    out.append(("HEALTH", c.get("/health").json()))
    p = c.post("/plan/generate", json={}).json()
    out.append(("PLAN_BY_ID", {k: v for k, v in c.get(f"/plan/{p['plan_id']}").json().items() if k != "items"}))
    out.append(("OVERRIDE", c.post("/plan/override", json={"train_id": "TS-22", "to_assignment": "REVENUE", "reason": "Special event service"}).json()))
    out.append(("HISTORY", c.get("/plan/history").json()[:1]))
    out.append(("WEIGHTS", c.get("/ml/weights").json()))
    out.append(("FLEET_TS21", next(t for t in c.get("/fleet/status").json()["trains"] if t["train_id"] == "TS-21")))
    out.append(("KB_SEARCH", c.get("/kb/search", params={"q": "pressure below 7 bar", "k": 2}).json()))
    bad = c.post("/data/ingest", json={"nonsense": []})
    out.append(("INGEST_BAD", {"status": bad.status_code, "body": bad.json()}))


for name, fn in (("_captures.txt", part1), ("_captures2.txt", part2)):
    lines = []
    fn(lines)
    text = "\n".join(f"{k} {json.dumps(v, default=str)}" for k, v in lines) + "\n"
    (Path(__file__).parent / name).write_text(text, encoding="utf-8")
    print("wrote", name)
