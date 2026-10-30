"""In-memory fleet snapshot consumed by the optimizer (independent of the DB)."""
from __future__ import annotations

import copy
from dataclasses import dataclass, field
from datetime import date


@dataclass
class FleetSnapshot:
    service_date: date
    required_revenue: int
    min_standby: int
    cleaning_slots: int
    ibl_capacity: int
    cleaning_due_days: int
    depots: list[dict]
    bays: dict[str, dict]
    trains: list[dict]
    certificates: dict[str, list[dict]] = field(default_factory=dict)
    job_cards: dict[str, list[dict]] = field(default_factory=dict)
    branding: dict[str, dict] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: dict) -> "FleetSnapshot":
        cfg = data["config"]
        certs: dict[str, list[dict]] = {}
        for c in data["certificates"]:
            certs.setdefault(c["train_id"], []).append(c)
        jobs: dict[str, list[dict]] = {}
        for j in data["job_cards"]:
            jobs.setdefault(j["assetnum"], []).append(j)
        return cls(
            service_date=date.fromisoformat(cfg["service_date"]),
            required_revenue=int(cfg["required_revenue"]),
            min_standby=int(cfg["min_standby"]),
            cleaning_slots=int(cfg["cleaning_slots"]),
            ibl_capacity=int(cfg["ibl_capacity"]),
            cleaning_due_days=int(cfg.get("cleaning_due_days", 3)),
            depots=list(data["depots"]),
            bays={b["bay_id"]: b for b in data["bays"]},
            trains=sorted(data["trainsets"], key=lambda t: t["train_id"]),
            certificates=certs,
            job_cards=jobs,
            branding={b["train_id"]: b for b in data["branding"]},
        )

    def copy(self) -> "FleetSnapshot":
        return copy.deepcopy(self)

    def train(self, train_id: str) -> dict:
        for t in self.trains:
            if t["train_id"] == train_id:
                return t
        raise KeyError(train_id)
