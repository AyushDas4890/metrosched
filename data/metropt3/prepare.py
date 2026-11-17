"""Turn the raw MetroPT-3 CSV into 30-minute feature windows for the compressor (APU) risk model.

Source: MetroPT-3 Dataset, UCI Machine Learning Repository, https://doi.org/10.24432/C5VW3R (CC BY 4.0).
Real sensor data from the air production unit of one Metro do Porto train, February to August 2020.

Usage (run once after downloading and extracting the zip into data/metropt3/raw/):
    python data/metropt3/prepare.py
Writes data/metropt3/windows.csv (small; committed). The raw CSV (208 MB) is not committed.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

HERE = Path(__file__).parent
RAW = HERE / "raw" / "MetroPT3(AirCompressor).csv"
OUT = HERE / "windows.csv"
WINDOW = "30min"

ANALOG = ["TP2", "TP3", "H1", "DV_pressure", "Reservoirs", "Oil_temperature", "Motor_current"]
DIGITAL = ["COMP", "DV_eletric", "Towers", "MPG", "LPS", "Pressure_switch", "Oil_level", "Caudal_impulses"]

# Failure reports published with the dataset (UCI page, "Failure Information"). All are air leaks.
FAILURES = [
    ("2020-04-18 00:00", "2020-04-18 23:59"),
    ("2020-05-29 23:30", "2020-05-30 06:00"),
    ("2020-06-05 10:00", "2020-06-07 14:30"),
    ("2020-07-15 14:30", "2020-07-15 19:00"),
]


def failure_label(starts: pd.Series, window: str = WINDOW) -> pd.Series:
    """1 if the window [start, start+window) overlaps any reported failure period, else 0."""
    ends = starts + pd.Timedelta(window)
    label = pd.Series(0, index=starts.index)
    for a, b in FAILURES:
        fa, fb = pd.Timestamp(a), pd.Timestamp(b)
        label[(starts < fb) & (ends > fa)] = 1
    return label


def aggregate(df: pd.DataFrame, window: str = WINDOW) -> pd.DataFrame:
    """Mean and standard deviation of analog sensors, mean (duty fraction) of digital signals, per window."""
    df = df.set_index(pd.to_datetime(df["timestamp"]))
    g = df[ANALOG + DIGITAL].resample(window)
    feats = pd.concat([g[ANALOG].mean().add_suffix("_mean"), g[ANALOG].std().add_suffix("_std"),
                       g[DIGITAL].mean().add_suffix("_mean"), g["TP2"].count().rename("samples")], axis=1)
    feats = feats[feats["samples"] >= 10].fillna(0.0)  # drop gaps where the logger was off
    feats = feats.reset_index().rename(columns={"timestamp": "window_start"})
    feats["failure"] = failure_label(feats["window_start"], window)
    return feats


def main() -> None:
    cols = ["timestamp"] + ANALOG + DIGITAL
    df = pd.read_csv(RAW, usecols=cols)
    out = aggregate(df)
    out["window_start"] = out["window_start"].dt.strftime("%Y-%m-%d %H:%M")
    out.round(4).to_csv(OUT, index=False)
    print(f"{len(df):,} rows -> {len(out):,} windows, {int(out['failure'].sum())} in failure periods -> {OUT}")


if __name__ == "__main__":
    main()
