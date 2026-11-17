"""The default fleet: built only from real data, with no synthetic planning inputs.

- Fleet size (25 trainsets) and depot (Muttom) are public KMRL facts.
- Each trainset carries a 12-hour slice of real MetroPT-3 compressor data (ml/apu_risk.py): fault risk,
  minutes below 7 bar, loaded share of time.
- Certificates, job cards, branding, mileage, cleaning and bay positions have no public source, so they are
  left empty. The planner skips the rules that need them and reports them as not checked.

When real files are uploaded through /data/ingest, those are used instead (see app/main.py).
"""
from __future__ import annotations

import json
from datetime import date
from pathlib import Path

CONFIG = Path(__file__).resolve().parents[2] / "data" / "fleet_config.json"


def load_config() -> dict:
    cfg = {k: v for k, v in json.loads(CONFIG.read_text(encoding="utf-8")).items() if not k.startswith("_")}
    cfg["service_date"] = cfg.get("service_date") or date.today().isoformat()
    return cfg


def build() -> dict:
    cfg = load_config()
    n = int(cfg.pop("n_trains"))
    depot = cfg.pop("depot")
    trains = [{"train_id": f"TS-{i:02d}", "depot_id": "D1", "cars": 3,
               "cumulative_km": None, "bay_id": None, "days_since_cleaning": None} for i in range(1, n + 1)]
    return {"config": cfg, "depots": [{"depot_id": "D1", "name": depot}], "bays": [], "trainsets": trains,
            "certificates": [], "job_cards": [], "branding": []}
