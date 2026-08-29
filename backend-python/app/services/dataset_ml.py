from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_EVIDENCE_PATH = Path(__file__).resolve().parent.parent / "data" / "dataset_evidence.json"
_EVIDENCE_CACHE: dict[str, Any] = {"mtime": None, "data": {}}

# Habit id -> evidence feature on the sleep/doomscrolling dataset.
# risk=high: user value above the population median raises priority.
# risk=low: user value below the median raises priority (sleep hours, exercise).
# user_key: PlantState.behavior field. Missing user_key uses a population prior only.
HABIT_EVIDENCE: dict[str, dict[str, str]] = {
    "digital-curfew": {
        "feature": "bedtime_screen_time_minutes",
        "user_key": "bedtimeScreenMins",
        "risk": "high",
    },
    "zero-doomscroll": {
        "feature": "doomscroll_sessions_per_night",
        "user_key": "bedtimeScreenMins",
        "risk": "high",
        "proxy": "bedtime_screen_time_minutes",
    },
    "screen-free-meal": {
        "feature": "total_daily_screen_time_hours",
        "user_key": "bedtimeScreenMins",
        "risk": "high",
        "proxy": "bedtime_screen_time_minutes",
    },
    "20-20-20": {
        "feature": "total_daily_screen_time_hours",
        "user_key": "bedtimeScreenMins",
        "risk": "high",
        "proxy": "bedtime_screen_time_minutes",
    },
    "offline-hobby": {
        "feature": "total_daily_screen_time_hours",
        "user_key": "bedtimeScreenMins",
        "risk": "high",
        "proxy": "bedtime_screen_time_minutes",
    },
    "sleep-7": {"feature": "sleep_hours_per_night", "user_key": "sleepHours", "risk": "low"},
    "power-nap": {
        "feature": "daytime_fatigue_score",
        "user_key": "sleepHours",
        "risk": "low",
        "proxy": "sleep_hours_per_night",
    },
    "cool-dark": {
        "feature": "sleep_latency_minutes",
        "user_key": "bedtimeScreenMins",
        "risk": "high",
        "proxy": "bedtime_screen_time_minutes",
    },
    "early-caffeine": {"feature": "caffeine_intake_mg_per_day", "risk": "high"},
    "caffeine-cutoff": {"feature": "caffeine_intake_mg_per_day", "risk": "high"},
    "lemon-water": {"feature": "caffeine_intake_mg_per_day", "risk": "high"},
    "no-late-snacks": {"feature": "sleep_latency_minutes", "risk": "high"},
    "exercise-15": {"feature": "exercise_minutes_per_day", "risk": "low", "mental": "exercise"},
    "hiit": {"feature": "exercise_minutes_per_day", "risk": "low", "mental": "exercise"},
    "steps-5k": {"feature": "exercise_minutes_per_day", "risk": "low", "mental": "exercise"},
    "stairs": {"feature": "exercise_minutes_per_day", "risk": "low"},
    "stretch": {"feature": "exercise_minutes_per_day", "risk": "low"},
    "sun-walk": {"feature": "exercise_minutes_per_day", "risk": "low"},
    "lunch-walk": {"feature": "exercise_minutes_per_day", "risk": "low"},
    "meditate-10": {"feature": "anxiety_score", "risk": "high"},
    "box-breathing": {"feature": "anxiety_score", "risk": "high"},
    "gratitude": {"feature": "stress_score", "risk": "high"},
    "no-alcohol": {"feature": "sleep_quality_score", "risk": "low", "user_key": "sleepHours", "proxy": "sleep_hours_per_night"},
}


def load_evidence() -> dict[str, Any]:
    if not _EVIDENCE_PATH.exists():
        return {}
    mtime = _EVIDENCE_PATH.stat().st_mtime
    if _EVIDENCE_CACHE["mtime"] != mtime:
        _EVIDENCE_CACHE["data"] = json.loads(_EVIDENCE_PATH.read_text(encoding="utf-8"))
        _EVIDENCE_CACHE["mtime"] = mtime
    return _EVIDENCE_CACHE["data"]


def dataset_status() -> dict[str, Any]:
    evidence = load_evidence()
    if not evidence:
        return {"ready": False, "sources": []}
    return {
        "ready": True,
        "generatedAt": evidence.get("generatedAt"),
        "sources": evidence.get("sources") or [],
        "sleepN": (evidence.get("sleep") or {}).get("n"),
        "mentalN": (evidence.get("mental") or {}).get("n"),
    }


def _percentile(value: float, quantiles: dict) -> float:
    qs = quantiles.get("q") or []
    vs = quantiles.get("v") or []
    if not qs or not vs or len(qs) != len(vs):
        return 0.5
    if value <= vs[0]:
        return float(qs[0])
    if value >= vs[-1]:
        return float(qs[-1])
    for i in range(1, len(vs)):
        lo, hi = vs[i - 1], vs[i]
        if value <= hi:
            span = (hi - lo) or 1e-9
            t = (value - lo) / span
            return float(qs[i - 1] + t * (qs[i] - qs[i - 1]))
    return float(qs[-1])


def _corr(evidence: dict, feature: str) -> float:
    sleep = evidence.get("sleep") or {}
    quality = abs(float((sleep.get("correlationsSleepQuality") or {}).get(feature) or 0))
    hours = abs(float((sleep.get("correlationsSleepHours") or {}).get(feature) or 0))
    return max(quality, hours)


def _mental_exercise_prior(evidence: dict) -> float:
    by_ex = (evidence.get("mental") or {}).get("happinessByExercise") or {}
    high = float(by_ex.get("High") or 0)
    low = float(by_ex.get("Low") or 0)
    if high <= 0 or low <= 0:
        return 0.0
    return max(0.0, (high - low) / high)


def habit_dataset_multiplier(habit_id: str, behavior: dict | None) -> float:
    """Scale a habit's ML score using Kaggle sleep/doomscroll + lifestyle evidence."""
    spec = HABIT_EVIDENCE.get(habit_id)
    evidence = load_evidence()
    if not spec or not evidence:
        return 1.0

    feature = spec["feature"]
    strength = _corr(evidence, feature)
    if spec.get("mental") == "exercise":
        strength = max(strength, _mental_exercise_prior(evidence) * 0.8)

    behavior = behavior or {}
    user_key = spec.get("user_key")
    compare_feature = spec.get("proxy") or feature
    quantiles = ((evidence.get("sleep") or {}).get("quantiles") or {}).get(compare_feature)

    if not user_key or user_key not in behavior or not quantiles:
        return 1.0 + 0.35 * strength

    percentile = _percentile(float(behavior[user_key]), quantiles)
    risk = percentile if spec["risk"] == "high" else 1.0 - percentile
    # Centered at the median: low-risk users keep a small prior, high-risk users get up to ~1.8x.
    return 1.0 + strength * (0.25 + 1.35 * max(0.0, risk - 0.45) / 0.55)


def user_risk_profile(behavior: dict | None) -> dict[str, Any]:
    evidence = load_evidence()
    behavior = behavior or {}
    sleep = evidence.get("sleep") or {}
    quantiles = sleep.get("quantiles") or {}
    profile: dict[str, Any] = {}
    if "bedtimeScreenMins" in behavior and "bedtime_screen_time_minutes" in quantiles:
        pct = _percentile(float(behavior["bedtimeScreenMins"]), quantiles["bedtime_screen_time_minutes"])
        profile["bedtimeScreenPercentile"] = round(pct, 3)
        profile["highBedtimeScreenRisk"] = pct >= 0.6
    if "sleepHours" in behavior and "sleep_hours_per_night" in quantiles:
        pct = _percentile(float(behavior["sleepHours"]), quantiles["sleep_hours_per_night"])
        profile["sleepHoursPercentile"] = round(pct, 3)
        profile["lowSleepRisk"] = pct <= 0.4
    return profile
