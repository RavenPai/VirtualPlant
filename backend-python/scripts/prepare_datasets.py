"""Download Kaggle habit datasets and write aggregate evidence for the ML deck.

Usage (from backend-python):
  .venv\\Scripts\\python.exe scripts\\prepare_datasets.py
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import kagglehub
from kagglehub import KaggleDatasetAdapter

ROOT = Path(__file__).resolve().parent.parent
OUT_PATH = ROOT / "app" / "data" / "dataset_evidence.json"

SLEEP_HANDLE = "harpartapsingh13/sleep-and-doomscrolling-habits-dataset"
SLEEP_FILE = "sleep_doomscrolling_habits.csv"
MENTAL_HANDLE = "atharvasoundankar/mental-health-and-lifestyle-habits-2019-2024"
MENTAL_FILE = "Mental_Health_Lifestyle_Dataset.csv"

SLEEP_FEATURES = [
    "bedtime_screen_time_minutes",
    "total_daily_screen_time_hours",
    "doomscroll_sessions_per_night",
    "sleep_hours_per_night",
    "sleep_latency_minutes",
    "caffeine_intake_mg_per_day",
    "anxiety_score",
    "stress_score",
    "sleep_quality_score",
    "daytime_fatigue_score",
    "phone_checks_per_night",
    "exercise_minutes_per_day",
    "weekly_sleep_debt_hours",
]


def _num(value) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if number != number:  # NaN
        return None
    return round(number, 6)


def _quantiles(series, steps=11) -> dict:
    clean = series.dropna()
    qs = [i / (steps - 1) for i in range(steps)]
    return {"q": qs, "v": [_num(clean.quantile(q)) for q in qs]}


def _corr_map(frame, target: str, columns: list[str]) -> dict[str, float]:
    out: dict[str, float] = {}
    for col in columns:
        if col == target or col not in frame.columns:
            continue
        value = frame[col].corr(frame[target])
        if value == value:  # not NaN
            out[col] = round(float(value), 4)
    return out


def _group_means(frame, key: str, values: list[str]) -> dict:
    grouped = frame.groupby(key, dropna=False)[values].mean(numeric_only=True)
    result = {}
    for label, row in grouped.iterrows():
        result[str(label)] = {k: _num(row[k]) for k in values if k in row}
    return result


def main() -> None:
    sleep_df = kagglehub.dataset_load(KaggleDatasetAdapter.PANDAS, SLEEP_HANDLE, SLEEP_FILE)
    mental_df = kagglehub.dataset_load(KaggleDatasetAdapter.PANDAS, MENTAL_HANDLE, MENTAL_FILE)

    print("First 5 sleep/doomscrolling records:")
    print(sleep_df.head())
    print("First 5 mental health/lifestyle records:")
    print(mental_df.head())

    sleep_quality_corr = _corr_map(sleep_df, "sleep_quality_score", SLEEP_FEATURES)
    sleep_hours_corr = _corr_map(sleep_df, "sleep_hours_per_night", SLEEP_FEATURES)

    mental_df = mental_df.copy()
    mental_df["_sleep_bin"] = pd.cut(
        mental_df["Sleep Hours"], [0, 5, 6, 7, 8, 20], labels=["<5", "5-6", "6-7", "7-8", "8+"]
    )
    mental_df["_screen_bin"] = pd.cut(
        mental_df["Screen Time per Day (Hours)"],
        [0, 3, 5, 7, 20],
        labels=["<3", "3-5", "5-7", "7+"],
    )

    evidence = {
        "generatedAt": datetime.now(tz=timezone.utc).isoformat(),
        "sources": [
            {
                "handle": SLEEP_HANDLE,
                "file": SLEEP_FILE,
                "rows": int(len(sleep_df)),
                "role": "Primary scorer: bedtime screens, doomscrolling, sleep quality",
            },
            {
                "handle": MENTAL_HANDLE,
                "file": MENTAL_FILE,
                "rows": int(len(mental_df)),
                "role": "Secondary prior: exercise level vs happiness",
            },
        ],
        "sleep": {
            "n": int(len(sleep_df)),
            "medians": {col: _num(sleep_df[col].median()) for col in SLEEP_FEATURES if col in sleep_df},
            "quantiles": {col: _quantiles(sleep_df[col]) for col in SLEEP_FEATURES if col in sleep_df},
            "correlationsSleepQuality": sleep_quality_corr,
            "correlationsSleepHours": sleep_hours_corr,
            "doomscroller": _group_means(
                sleep_df,
                "doomscroller",
                ["sleep_quality_score", "sleep_hours_per_night", "anxiety_score", "daytime_fatigue_score"],
            ),
            "bedtimeRoutine": _group_means(
                sleep_df, "bedtime_routine_type", ["sleep_quality_score", "sleep_hours_per_night"]
            ),
        },
        "mental": {
            "n": int(len(mental_df)),
            "happinessByExercise": {
                str(k): round(float(v), 4)
                for k, v in mental_df.groupby("Exercise Level")["Happiness Score"].mean().items()
            },
            "happinessBySleepBin": {
                str(k): round(float(v), 4)
                for k, v in mental_df.groupby("_sleep_bin", observed=True)["Happiness Score"].mean().items()
            },
            "happinessByScreenBin": {
                str(k): round(float(v), 4)
                for k, v in mental_df.groupby("_screen_bin", observed=True)["Happiness Score"].mean().items()
            },
            "note": "Happiness correlations in this set are weak; used only as a small exercise prior.",
        },
    }

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(evidence, indent=2, allow_nan=False), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
