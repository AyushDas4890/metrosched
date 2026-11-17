"""Override learner: adjusts soft-constraint weights from logged supervisor overrides.

Each override stores the train's feature vector at decision time and whether the
supervisor moved the train INTO revenue (label 1) or OUT of revenue (label 0).
A logistic regression on standardised features tells us which factors supervisors
value more (or less) than the current defaults; each coefficient scales its weight.
"""
from __future__ import annotations

import math

import numpy as np
from sklearn.linear_model import LogisticRegression

from optimizer.constraints import REVENUE, cleaning_due, open_noncritical_jobs
from optimizer.model import DEFAULT_WEIGHTS
from optimizer.snapshot import FleetSnapshot

MIN_OVERRIDES = 20
# feature name -> weight it informs. Signs are oriented so "higher = more revenue-worthy under defaults".
FEATURES = {"branding_need": "branding", "low_mileage": "mileage", "exit_bay": "shunting", "few_jobs": "maintenance"}


def features(snap: FleetSnapshot, train: dict) -> dict:
    kms = [t["cumulative_km"] for t in snap.trains if t.get("cumulative_km") is not None]
    mean_km = sum(kms) / len(kms) if kms else 0.0
    br = snap.branding.get(train["train_id"])
    bay = snap.bays.get(train.get("bay_id")) or {"position": 1}
    return {
        "branding_need": (br["min_hours_per_day"] + br["hours_shortfall_7d"]) if br else 0.0,
        "low_mileage": -(train["cumulative_km"] - mean_km) / 10_000 if train.get("cumulative_km") is not None else 0.0,
        "exit_bay": -(bay["position"] - 1),
        "few_jobs": -len(open_noncritical_jobs(snap, train["train_id"])),
        "cleaning_due": 1.0 if cleaning_due(snap, train) else 0.0,
    }


def learn_weights(overrides: list[dict]) -> tuple[dict, dict]:
    """Return (weights, info). Falls back to defaults when fewer than MIN_OVERRIDES."""
    usable = [o for o in overrides if o.get("features")]
    if len(usable) < MIN_OVERRIDES:
        return dict(DEFAULT_WEIGHTS), {"source": "default", "overrides": len(usable), "min_required": MIN_OVERRIDES}
    X = np.array([[o["features"].get(f, 0.0) for f in FEATURES] for o in usable], dtype=float)
    y = np.array([1 if o["to_assignment"] == REVENUE else 0 for o in usable])
    if len(set(y)) < 2:
        return dict(DEFAULT_WEIGHTS), {"source": "default", "overrides": len(usable), "note": "single-class overrides"}
    std = X.std(axis=0)
    std[std == 0] = 1.0
    model = LogisticRegression().fit((X - X.mean(axis=0)) / std, y)
    weights = dict(DEFAULT_WEIGHTS)
    coefs = {}
    for coef, (feat, wname) in zip(model.coef_[0], FEATURES.items()):
        coefs[feat] = round(float(coef), 3)
        weights[wname] = round(DEFAULT_WEIGHTS[wname] * min(4.0, max(0.25, math.exp(coef))), 3)
    return weights, {"source": "learned", "overrides": len(usable), "coefficients": coefs}
