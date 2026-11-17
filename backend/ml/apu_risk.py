"""Compressor (APU) failure risk from real MetroPT-3 sensor data.

MetroPT-3 (UCI, https://doi.org/10.24432/C5VW3R, CC BY 4.0) holds 1 Hz sensor readings from the air
production unit of one Metro do Porto train, Feb-Aug 2020, with four reported air-leak failures.
data/metropt3/prepare.py turns it into 30-minute windows with a 0/1 `failure` label.

A random forest scores each window. Scores are out-of-fold: every window is scored by a model trained
on the *other* months only, so a failure is never scored by a model that has seen it.

MetroSched's fleet is synthetic, and MetroPT-3 covers a single train. To give every trainset realistic
compressor data, each trainset is assigned a (seeded) 12-hour slice of the real timeline. The slice's
highest window score is that train's risk. This mapping of real data onto synthetic trains is an assumption.
"""
from __future__ import annotations

import random
from functools import lru_cache
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import average_precision_score, roc_auc_score
from sklearn.model_selection import LeaveOneGroupOut, cross_val_predict

ROOT = Path(__file__).resolve().parents[2]
WINDOWS = ROOT / "data" / "metropt3" / "windows.csv"
SCORES = ROOT / "data" / "metropt3" / "window_risk.csv"
SOURCE = "MetroPT-3 (UCI ML Repository, doi:10.24432/C5VW3R, CC BY 4.0)"
SLICE_WINDOWS = 24  # 24 x 30 min = 12 hours
N_FAULTY = 3        # trainsets given a slice that contains a reported failure
ALERT_AT = 0.5


def feature_columns(df: pd.DataFrame) -> list[str]:
    return [c for c in df.columns if c.endswith("_mean") or c.endswith("_std")]


def _model() -> RandomForestClassifier:
    return RandomForestClassifier(n_estimators=200, max_depth=8, min_samples_leaf=3,
                                  class_weight="balanced", random_state=0, n_jobs=-1)


def score_windows(windows: pd.DataFrame) -> pd.DataFrame:
    """Out-of-fold failure probability per window, grouping folds by calendar month."""
    X = windows[feature_columns(windows)].to_numpy()
    y = windows["failure"].to_numpy()
    months = pd.to_datetime(windows["window_start"]).dt.month.to_numpy()
    proba = cross_val_predict(_model(), X, y, groups=months, cv=LeaveOneGroupOut(), method="predict_proba")[:, 1]
    return pd.DataFrame({"window_start": windows["window_start"], "failure": y, "risk": np.round(proba, 4)})


def evaluate(scores: pd.DataFrame) -> dict:
    y, p = scores["failure"].to_numpy(), scores["risk"].to_numpy()
    events = event_ranges(scores)
    return {
        "windows": int(len(scores)),
        "failure_windows": int(y.sum()),
        "roc_auc": round(float(roc_auc_score(y, p)), 3),
        "average_precision": round(float(average_precision_score(y, p)), 3),
        "recall_at_0_5": round(float(((p >= ALERT_AT) & (y == 1)).sum() / max(1, y.sum())), 3),
        "false_alarm_rate_at_0_5": round(float(((p >= ALERT_AT) & (y == 0)).sum() / max(1, (y == 0).sum())), 4),
        "events_detected": sum(1 for a, b in events if scores["risk"].iloc[a:b + 1].max() >= ALERT_AT),
        "events": len(events),
    }


def event_ranges(scores: pd.DataFrame) -> list[tuple[int, int]]:
    """(first, last) row index of each contiguous run of failure windows."""
    idx = np.flatnonzero(scores["failure"].to_numpy())
    if not len(idx):
        return []
    runs, start = [], idx[0]
    for prev, cur in zip(idx, idx[1:]):
        if cur != prev + 1:
            runs.append((start, prev))
            start = cur
    runs.append((start, idx[-1]))
    return runs


@lru_cache(maxsize=1)
def load_scores() -> pd.DataFrame | None:
    """Cached window scores; computed from windows.csv (and saved) on first use. None if data is missing."""
    if SCORES.exists():
        return pd.read_csv(SCORES)
    if not WINDOWS.exists():
        return None
    scores = score_windows(pd.read_csv(WINDOWS))
    scores.to_csv(SCORES, index=False)
    return scores


@lru_cache(maxsize=1)
def load_windows() -> pd.DataFrame | None:
    """The 30-minute feature windows (same row order as the scores)."""
    return pd.read_csv(WINDOWS) if WINDOWS.exists() else None


def slice_stats(start: int, windows: pd.DataFrame | None = None) -> dict:
    """Real per-slice operating statistics, reported under their own names (not mapped onto other fleet data)."""
    windows = load_windows() if windows is None else windows
    if windows is None:
        return {}
    sl = windows.iloc[start:start + SLICE_WINDOWS]
    return {
        # DV electric is on while the compressor works under load, so its mean is the loaded share of time.
        "duty": round(float(sl["DV_eletric_mean"].mean()), 3),
        # LPS is on while air pressure is below 7 bar; mean x 30 min = minutes below 7 bar in each window.
        "low_pressure_minutes": round(float(sl["LPS_mean"].sum() * 30), 1),
        "oil_temp_max": round(float(sl["Oil_temperature_mean"].max()), 1),
    }


def assign_slices(train_ids: list[str], seed: int = 471, scores: pd.DataFrame | None = None) -> dict[str, dict]:
    """Deterministically map each trainset to a 12-hour slice of the real MetroPT-3 timeline."""
    scores = load_scores() if scores is None else scores
    if scores is None or not train_ids:
        return {}
    rng = random.Random(seed)
    n = len(scores)
    failure = scores["failure"].to_numpy()
    events = event_ranges(scores)
    ids = sorted(train_ids)
    faulty = rng.sample(ids, k=min(N_FAULTY, len(ids), len(events)))
    event_for = dict(zip(faulty, rng.sample(events, k=len(faulty))))
    # Failure-free slice starts, kept a day away from any failure so "normal" trains are clearly normal.
    near = np.convolve(failure, np.ones(2 * SLICE_WINDOWS + 1), mode="same") > 0
    clean_starts = [s for s in range(0, n - SLICE_WINDOWS) if not near[s:s + SLICE_WINDOWS].any()]

    out = {}
    for tid in ids:
        if tid in event_for:
            a, _ = event_for[tid]
            start = max(0, min(n - SLICE_WINDOWS, a - rng.randint(0, SLICE_WINDOWS // 2)))
        else:
            start = rng.choice(clean_starts)
        sl = scores.iloc[start:start + SLICE_WINDOWS]
        peak = sl["risk"].idxmax()
        out[tid] = {
            "risk": round(float(sl["risk"].max()), 3),
            "slice_start": str(sl["window_start"].iloc[0]),
            "slice_end": str(sl["window_start"].iloc[-1]),
            "peak_window": str(scores.loc[peak, "window_start"]),
            "reported_failure_in_slice": bool(sl["failure"].any()),
            "source": SOURCE,
            **slice_stats(start),
        }
    return out


if __name__ == "__main__":
    s = score_windows(pd.read_csv(WINDOWS))
    s.to_csv(SCORES, index=False)
    print(evaluate(s))
