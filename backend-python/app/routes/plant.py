from fastapi import APIRouter

from app.models.schemas import PlantState, PredictRequest, TickRequest
from app.services import plant_engine as engine

router = APIRouter(prefix="/v1")


@router.post("/decay")
def decay(body: TickRequest):
    now = body.nowMs
    state = body.state.model_dump()
    if now is None:
        from datetime import datetime, timezone

        now = datetime.now(tz=timezone.utc).timestamp() * 1000
    return engine.apply_decay(state, now)


@router.post("/growth")
def growth(body: PlantState):
    resources = body.resources.model_dump()
    return {
        "dailyGrowthRate": engine.daily_growth_rate(resources),
        "health": engine.health_of(resources, body.hp),
        "status": engine.plant_state(resources, body.hp),
        "stage": engine.growth_stage(engine.season_day(body.seasonStart, body.lastTick)),
    }


@router.post("/classify")
def classify(body: dict):
    snapshots = body.get("dailySnapshots") or body.get("snapshots") or []
    c_season = engine.average_consistency(snapshots)
    return {"cSeason": c_season, "classification": engine.classify_season(c_season)}


@router.post("/tick")
def tick(body: TickRequest):
    return engine.tick(body.state.model_dump(), body.nowMs)


@router.post("/predict-tasks")
def predict_tasks(body: PredictRequest):
    state = {
        "resources": body.resources.model_dump(),
        "weather": body.weather.model_dump() if body.weather else None,
        "behavior": body.behavior.model_dump() if body.behavior else None,
        "anchors": body.anchors,
    }
    deck = engine.build_deck(state)
    scores = engine.ml_priority_scores(state["resources"], state.get("behavior"))[:8]
    return {
        "deck": deck,
        "rule": "2 anchors + 2 weather + 2 AI priority",
        "priorityScores": [{"id": h["id"], "score": h["score"]} for h in scores],
    }


@router.post("/season-consistency")
def season_consistency(body: dict):
    snapshots = body.get("dailySnapshots") or body.get("snapshots") or []
    c_season = engine.average_consistency(snapshots)
    return {"cSeason": c_season, "classification": engine.classify_season(c_season)}
