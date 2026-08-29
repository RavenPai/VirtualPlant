import json
from pathlib import Path

_HABITS_PATH = Path(__file__).resolve().parent.parent / "data" / "habits.json"
HABITS = json.loads(_HABITS_PATH.read_text(encoding="utf-8"))
HABIT_MAP = {h["id"]: h for h in HABITS}
