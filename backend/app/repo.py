"""Load/store fleet data and plans."""
from __future__ import annotations

import csv
import io
import json

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from . import models as M

TABLES = {
    "depots": M.Depot, "bays": M.Bay, "trainsets": M.Trainset, "certificates": M.Certificate,
    "job_cards": M.JobCard, "branding": M.BrandingContract,
}
INT_FIELDS = {"line", "position", "cars", "cumulative_km", "days_since_cleaning", "min_hours_per_day", "hours_shortfall_7d"}


def parse_upload(filename: str, raw: bytes) -> tuple[str, object]:
    stem, _, ext = filename.rpartition(".")
    stem = stem.rsplit("/", 1)[-1].rsplit("\\", 1)[-1]
    if ext.lower() == "csv":
        rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
        rows = [{k: (int(v) if k in INT_FIELDS else v) for k, v in r.items()} for r in rows]
        return stem, rows
    return stem, json.loads(raw)


def ingest(db: Session, data: dict) -> dict:
    """Replace each provided table with the given rows. Unknown keys are rejected."""
    counts = {}
    unknown = set(data) - set(TABLES) - {"config"}
    if unknown:
        raise ValueError(f"unknown dataset(s): {sorted(unknown)}")
    if "config" in data:
        for k, v in data["config"].items():
            db.merge(M.Config(key=k, value=str(v)))
        counts["config"] = len(data["config"])
    for key in TABLES:  # dependency order
        if key in data:
            db.execute(delete(TABLES[key]))
            db.add_all(TABLES[key](**row) for row in data[key])
            counts[key] = len(data[key])
    db.commit()
    return counts


def _rows(db: Session, model) -> list[dict]:
    cols = [c.name for c in model.__table__.columns if c.name != "id"]
    return [{c: getattr(r, c) for c in cols} for r in db.scalars(select(model))]


def load_dataset(db: Session) -> dict:
    data = {key: _rows(db, model) for key, model in TABLES.items()}
    data["config"] = {c.key: c.value for c in db.scalars(select(M.Config))}
    return data


def has_data(db: Session) -> bool:
    return db.scalar(select(M.Trainset).limit(1)) is not None
