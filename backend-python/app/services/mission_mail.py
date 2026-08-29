from __future__ import annotations

import html

from app.services.habits import HABIT_MAP

SLOTS = {
    "anchor": "Anchor",
    "weather": "Weather",
    "ai": "Today’s mission",
}

RESOURCES = {
    "water": "Water · hydration",
    "sun": "Sun · movement & light",
    "fertilizer": "Fertilizer · sleep, food, unplug",
}

APP_URL = "https://virtualplanty.netlify.app"


def _lines(deck: list) -> list[dict]:
    rows = []
    for card in deck or []:
        habit = HABIT_MAP.get(card.get("habitId") or card.get("habit_id") or "")
        if not habit:
            continue
        rows.append(
            {
                "slot": SLOTS.get(card.get("slot"), "Mission"),
                "name": habit["name"],
                "resource": RESOURCES.get(habit["resource"], habit["resource"]),
                "gain": habit.get("gain", 0),
                "done": bool(card.get("done")),
            }
        )
    return rows


def build_digest(body: dict) -> dict:
    plant = (body.get("plantName") or body.get("plant_name") or "your plant").strip() or "your plant"
    to = (body.get("email") or body.get("to") or "").strip()
    rows = _lines(body.get("deck") or [])
    if not rows:
        rows = [
            {"slot": "Mission", "name": "Drink water, move a little, and protect your sleep tonight", "resource": "All three bars", "gain": 0, "done": False},
        ]

    plant_html = html.escape(plant)
    items = []
    for row in rows:
        detail = " · already done" if row["done"] else f" · +{html.escape(str(row['gain']))}% to the plant"
        items.append(
            "<li style='margin:0 0 10px;padding:10px 12px;background:#24361c;border-radius:12px;color:#f4f7f0'>"
            f"<div style='font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#bef264'>{html.escape(str(row['slot']))}</div>"
            f"<div style='font-size:16px;font-weight:700;margin-top:4px'>{html.escape(str(row['name']))}</div>"
            f"<div style='font-size:12px;color:#c9ddb8;margin-top:4px'>{html.escape(str(row['resource']))}{detail}</div>"
            "</li>"
        )
    list_html = "".join(items)
    list_text = "\n".join(
        f"- [{row['slot']}] {row['name']} ({row['resource']})" + (" ✓" if row["done"] else "")
        for row in rows
    )

    subject = f"Today’s healthy-life missions for {plant}"
    html_body = f"""
<div style="font-family:Georgia,serif;background:#0c1209;padding:24px;color:#f4f7f0">
  <p style="letter-spacing:.2em;text-transform:uppercase;font-size:11px;color:#c9ddb8">Virtual Plant</p>
  <h1 style="font-size:26px;margin:8px 0 12px">Feed {plant_html} with today’s real life.</h1>
  <p style="line-height:1.5;color:#e4eedc">These are your six missions. Completing them on
    <a href="{APP_URL}" style="color:#bef264">virtualplanty.netlify.app</a>
    waters, suns, and fertilizes the tree.</p>
  <ol style="padding:0;list-style:none;margin:20px 0">{list_html}</ol>
  <p style="font-size:13px;color:#c9ddb8">Hydration → Water · Movement → Sun · Sleep, food, and less doomscrolling → Fertilizer.</p>
</div>
"""
    text = (
        f"Virtual Plant — today’s missions for {plant}\n\n{list_text}\n\n"
        f"Open the app: {APP_URL}\n"
        "Hydration feeds Water. Movement feeds Sun. Sleep and unplugging feed Fertilizer."
    )
    return {"to": to, "subject": subject, "html": html_body.strip(), "text": text, "missions": rows}
