from pydantic import BaseModel, Field


class Resources(BaseModel):
    water: float
    sun: float
    fertilizer: float


class Behavior(BaseModel):
    bedtimeScreenMins: float = 20
    sleepHours: float = 7.5


class Weather(BaseModel):
    tempC: float = 22
    cloudCover: float = 30
    code: int = 0
    isDay: bool | None = None
    precipitation: float | None = None


class PlantState(BaseModel):
    resources: Resources
    hp: float = 100
    lastTick: float
    growthAccumulated: float = 8
    seasonStart: float
    anchors: list[str] = Field(default_factory=list)
    weather: Weather | None = None
    behavior: Behavior | None = None
    deck: list[dict] = Field(default_factory=list)
    deckDate: str | None = None
    dailySnapshots: list[dict] = Field(default_factory=list)
    plantName: str | None = None


class TickRequest(BaseModel):
    state: PlantState
    nowMs: float | None = None


class PredictRequest(BaseModel):
    resources: Resources
    weather: Weather | None = None
    behavior: Behavior | None = None
    anchors: list[str] = Field(default_factory=list)
