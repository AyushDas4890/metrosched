"""Seeded synthetic data generator for MetroSched.

All per-train values are synthetic. See docs/ASSUMPTIONS.md.

Usage:
    python data/generator.py                      # 25 trains, 1 depot -> data/seed/
    python data/generator.py --trains 40 --depots 2 --out data/seed40
"""
from __future__ import annotations

import argparse
import csv
import json
import random
from datetime import date, timedelta
from pathlib import Path

SERVICE_DATE = date(2026, 11, 1)
CERT_KINDS = {"ROLLING_STOCK": 30, "SIGNALLING": 60, "TELECOM": 90}
ADVERTISERS = ["Lulu Mall", "Kerala Tourism", "Malabar Gold", "Federal Bank", "Milma", "Cochin Shipyard"]
JOB_DESCRIPTIONS = [
    ("Brake pad wear check", "HIGH"),
    ("HVAC filter replacement", "LOW"),
    ("Door actuator fault", "CRITICAL"),
    ("Bogie bearing temperature alarm", "CRITICAL"),
    ("Saloon lighting fault", "LOW"),
    ("Pantograph inspection", "HIGH"),
    ("CCTV camera offline", "LOW"),
]
DEPOT_NAMES = ["Muttom", "Depot-B"]
LINES_PER_DEPOT = 3
IBL_BAYS = 6


def generate(n_trains: int = 25, n_depots: int = 1, seed: int = 471) -> dict:
    rng = random.Random(seed)
    depots = [{"depot_id": f"D{i + 1}", "name": DEPOT_NAMES[i]} for i in range(n_depots)]

    trains_per_depot = [n_trains // n_depots + (1 if i < n_trains % n_depots else 0) for i in range(n_depots)]
    bays, trainsets, certificates, job_cards, branding = [], [], [], [], []
    tnum = 0
    wo = 100000
    for d, count in zip(depots, trains_per_depot):
        depth = -(-count // LINES_PER_DEPOT)  # ceil
        stabling = []
        for line in range(1, LINES_PER_DEPOT + 1):
            for pos in range(1, depth + 1):
                bay = {"bay_id": f"{d['depot_id']}-L{line}-P{pos}", "depot_id": d["depot_id"],
                       "line": line, "position": pos, "kind": "STABLING"}
                bays.append(bay)
                stabling.append(bay)
        for i in range(1, IBL_BAYS + 1):
            bays.append({"bay_id": f"{d['depot_id']}-IBL{i}", "depot_id": d["depot_id"],
                         "line": 0, "position": i, "kind": "IBL"})
        rng.shuffle(stabling)
        for k in range(count):
            tnum += 1
            tid = f"TS-{tnum:02d}"
            trainsets.append({
                "train_id": tid, "depot_id": d["depot_id"], "cars": 3,
                "cumulative_km": rng.randint(180_000, 260_000),
                "bay_id": stabling[k]["bay_id"],
                "days_since_cleaning": rng.randint(0, 5),
            })
            for kind, validity in CERT_KINDS.items():
                # Most certs valid; ~6% expired before the service date.
                offset = rng.randint(-3, validity) if rng.random() < 0.06 else rng.randint(2, validity)
                certificates.append({"train_id": tid, "kind": kind,
                                     "valid_until": (SERVICE_DATE + timedelta(days=offset)).isoformat()})
            for _ in range(rng.randint(0, 3)):
                desc, prio = rng.choice(JOB_DESCRIPTIONS)
                wo += 1
                status = "OPEN" if rng.random() < (0.35 if prio == "CRITICAL" else 0.6) else "CLOSED"
                job_cards.append({"wonum": f"WO{wo}", "assetnum": tid, "description": desc,
                                  "wopriority": prio, "status": status,
                                  "reportdate": (SERVICE_DATE - timedelta(days=rng.randint(1, 20))).isoformat()})
    for t in rng.sample(trainsets, k=max(1, len(trainsets) // 3)):
        branding.append({"contract_id": f"BR-{t['train_id']}", "train_id": t["train_id"],
                         "advertiser": rng.choice(ADVERTISERS),
                         "min_hours_per_day": rng.choice([8, 10, 12, 14]),
                         "hours_shortfall_7d": rng.randint(0, 20)})

    config = {
        "service_date": SERVICE_DATE.isoformat(),
        "required_revenue": round(n_trains * 0.72),
        "min_standby": max(2, n_trains // 12),
        "cleaning_slots": 6 * n_depots,
        "ibl_capacity": IBL_BAYS * n_depots,
        "cleaning_due_days": 3,
    }
    return {"config": config, "depots": depots, "bays": bays, "trainsets": trainsets,
            "certificates": certificates, "job_cards": job_cards, "branding": branding}


def write(data: dict, out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    for key, value in data.items():
        if key == "job_cards":
            with open(out / "job_cards.csv", "w", newline="") as f:
                w = csv.DictWriter(f, fieldnames=["wonum", "assetnum", "description", "wopriority", "status", "reportdate"])
                w.writeheader()
                w.writerows(value)
        else:
            (out / f"{key}.json").write_text(json.dumps(value, indent=2))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--trains", type=int, default=25)
    p.add_argument("--depots", type=int, default=1)
    p.add_argument("--seed", type=int, default=471)
    p.add_argument("--out", default=str(Path(__file__).parent / "seed"))
    a = p.parse_args()
    write(generate(a.trains, a.depots, a.seed), Path(a.out))
    print(f"wrote {a.trains} trains / {a.depots} depot(s) to {a.out}")
