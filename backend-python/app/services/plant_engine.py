from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

from app.services.habits import HABIT_MAP, HABITS

SEASON_DAYS = 90
BASE_DECAY = {"water": 0.4, "sun": 0.5, "fertilizer": 0.3}
RAIN_CODES = {51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99}
CLOUD_CODES = {1, 2, 3, 45, 48}


def clamp(n: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return min(hi, max(lo, n))


def local_date_key(dt: datetime) -> str:
    return dt.strftime("%Y-%m-%d")


def season_day(season_start_ms: float, now_ms: float) -> int:
    start = datetime.fromtimestamp(season_start_ms / 1000, tz=timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    current = datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    day = int((current - start).total_seconds() // 86400) + 1
    return int(clamp(day, 1, SEASON_DAYS))


def growth_stage(day: int) -> int:
    if day <= 15:
        return 1
    if day <= 45:
        return 2
    if day <= 75:
        return 3
    return 4


def weather_kind(code: int, temp_c: float) -> str:
    if temp_c >= 30:
        return "hot"
    if code in RAIN_CODES:
        return "rain"
    if code in CLOUD_CODES:
        return "cloud"
    return "clear"


def modifiers(weather: dict | None, behavior: dict | None) -> dict[str, float]:
    weather = weather or {}
    behavior = behavior or {}
    temp_c = weather.get("tempC", 22)
    cloud = weather.get("cloudCover", 30)
    m_temp = 1.35 if temp_c >= 32 else 1.2 if temp_c >= 28 else 0.85 if temp_c <= 4 else 1
    m_cloud = 1.3 if cloud >= 75 else 0.9 if cloud <= 20 else 1
    bedtime = behavior.get("bedtimeScreenMins", 0)
    sleep_hours = behavior.get("sleepHours", 7)
    m_screen = 1.4 if bedtime > 45 else 1
    m_sleep = 1.25 if sleep_hours < 6 else 1.1 if sleep_hours < 7 else 1
    return {"mTemp": m_temp, "mCloud": m_cloud, "mScreen": m_screen, "mSleep": m_sleep}


def daily_growth_rate(resources: dict) -> float:
    w, s, f = resources["water"], resources["sun"], resources["fertilizer"]
    return ((w + s + f) / 3) * (min(w, s, f) / 100)


def health_of(resources: dict, hp: float) -> float:
    return ((resources["water"] + resources["sun"] + resources["fertilizer"]) / 3) * (hp / 100)


def plant_state(resources: dict, hp: float) -> str:
    if hp <= 0:
        return "dead"
    if hp < 30:
        return "critical"
    if resources["water"] <= 0 or resources["sun"] <= 0 or resources["fertilizer"] <= 0:
        return "struggling"
    if resources["water"] > 50 and resources["sun"] > 50 and resources["fertilizer"] > 50:
        return "thriving"
    return "stable"


def classify_season(c_season: float) -> str:
    if c_season >= 80:
        return "grand"
    if c_season >= 50:
        return "standard"
    return "stunted"


def apply_decay(state: dict, now_ms: float) -> dict:
    next_state = deepcopy(state)
    hours = max(0.0, (now_ms - next_state["lastTick"]) / 3600000)
    if hours <= 0:
        return next_state
    mods = modifiers(next_state.get("weather"), next_state.get("behavior"))
    res = dict(next_state["resources"])
    res["water"] = clamp(res["water"] - BASE_DECAY["water"] * mods["mTemp"] * (hours / 24) * 100)
    res["sun"] = clamp(res["sun"] - BASE_DECAY["sun"] * mods["mCloud"] * (hours / 24) * 100)
    res["fertilizer"] = clamp(
        res["fertilizer"] - BASE_DECAY["fertilizer"] * mods["mScreen"] * mods["mSleep"] * (hours / 24) * 100
    )
    next_state["resources"] = res
    next_state["lastTick"] = now_ms
    return _apply_health(next_state, hours)


def _apply_health(state: dict, hours: float) -> dict:
    status = plant_state(state["resources"], state["hp"])
    hp = state["hp"]
    growth = daily_growth_rate(state["resources"])
    accumulated = state["growthAccumulated"]
    if status in ("struggling", "critical"):
        hp = clamp(hp - 18 * (hours / 24))
    elif status == "thriving":
        hp = clamp(hp + 4 * (hours / 24))
        accumulated = clamp(accumulated + growth * (hours / 24))
    else:
        accumulated = clamp(accumulated + growth * (hours / 24) * 0.7)
    state["hp"] = hp
    state["growthAccumulated"] = accumulated
    return state


def _pick_unique(pool: list[dict], used: set[str], count: int) -> list[dict]:
    chosen = []
    for habit in pool:
        if len(chosen) >= count:
            break
        if habit["id"] in used:
            continue
        chosen.append(habit)
        used.add(habit["id"])
    return chosen


def weather_tasks(weather: dict | None) -> list[dict]:
    kind = weather_kind(weather.get("code", 0) if weather else 0, weather.get("tempC", 22) if weather else 22)
    by_weather = [h for h in HABITS if h.get("weather") == kind]
    fallback = [h for h in HABITS if "Weather" in h["source"] or h["id"] in ("stretch", "herbal-tea")]
    return by_weather + fallback


def ml_priority_scores(resources: dict, behavior: dict | None) -> list[dict]:
    """Deficit-weighted priority scores (same 6-task product rule, Python/ML slot)."""
    behavior = behavior or {}
    doom_boost = 1.15 if behavior.get("bedtimeScreenMins", 0) > 45 else 1.0
    sleep_boost = 1.1 if behavior.get("sleepHours", 7) < 7 else 1.0
    ranked = []
    for habit in HABITS:
        deficit = 100 - resources[habit["resource"]]
        score = deficit * habit["gain"]
        if habit["resource"] == "fertilizer":
            score *= doom_boost * sleep_boost
        ranked.append({**habit, "score": score})
    ranked.sort(key=lambda h: h["score"], reverse=True)
    return ranked


def build_deck(state: dict) -> list[dict]:
    used: set[str] = set()
    anchors = [HABIT_MAP[i] for i in state.get("anchors") or [] if i in HABIT_MAP]
    for h in anchors:
        used.add(h["id"])
    weather = _pick_unique(weather_tasks(state.get("weather")), used, 2)
    deficit_order = sorted(state["resources"].items(), key=lambda kv: kv[1])
    ai: list[dict] = []
    scored = ml_priority_scores(state["resources"], state.get("behavior"))
    for resource, _ in deficit_order:
        if len(ai) >= 2:
            break
        pool = [h for h in scored if h["resource"] == resource]
        ai.extend(_pick_unique(pool, used, 1))
    if len(ai) < 2:
        ai.extend(_pick_unique(scored, used, 2 - len(ai)))
    cards = (
        [{"habitId": h["id"], "slot": "anchor", "done": False} for h in anchors]
        + [{"habitId": h["id"], "slot": "weather", "done": False} for h in weather]
        + [{"habitId": h["id"], "slot": "ai", "done": False} for h in ai]
    )
    return cards[:6]


def upsert_snapshot(snapshots: list[dict], snap: dict) -> list[dict]:
    next_list = list(snapshots or [])
    idx = next((i for i, s in enumerate(next_list) if s.get("date") == snap["date"]), None)
    if idx is None:
        next_list.append(snap)
    else:
        next_list[idx] = snap
    return next_list[-90:]


def snapshot_vector(state: dict, now_ms: float) -> dict:
    day = season_day(state["seasonStart"], now_ms)
    resources = state["resources"]
    return {
        "day": day,
        "date": local_date_key(datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc)),
        "health": health_of(resources, state["hp"]),
        "hp": state["hp"],
        "resources": dict(resources),
        "status": plant_state(resources, state["hp"]),
        "stage": growth_stage(day),
        "growthAccumulated": state["growthAccumulated"],
        "weather": deepcopy(state.get("weather")),
    }


def ensure_deck(state: dict, now_ms: float) -> dict:
    today = local_date_key(datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc))
    if state.get("deckDate") == today and len(state.get("deck") or []) == 6:
        return state
    state = deepcopy(state)
    state["dailySnapshots"] = upsert_snapshot(state.get("dailySnapshots") or [], snapshot_vector(state, now_ms))
    state["deckDate"] = today
    state["deck"] = build_deck(state)
    return state


def average_consistency(snapshots: list[dict]) -> float:
    if not snapshots:
        return 0.0
    return sum(s.get("health") or 0 for s in snapshots) / max(len(snapshots), 1)


def tick(state: dict, now_ms: float | None = None) -> dict:
    now_ms = now_ms if now_ms is not None else datetime.now(tz=timezone.utc).timestamp() * 1000
    next_state = apply_decay(state, now_ms)
    next_state = ensure_deck(next_state, now_ms)
    return next_state
