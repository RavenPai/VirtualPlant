"""Import Virtual Plant workflows into n8n Cloud. Reads N8N_BASE_URL and N8N_API_KEY from repo .env."""
from __future__ import annotations

import json
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / "n8n" / "workflows"


def load_env(path: Path) -> dict[str, str]:
    values = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, val = line.split("=", 1)
        values[key.strip()] = val.strip()
    return values


def request(method: str, url: str, key: str, body: dict | None = None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "X-N8N-API-KEY": key,
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode("utf-8") or "{}"
            return res.status, json.loads(raw)
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8", errors="replace")
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError:
            payload = {"message": raw[:500]}
        return err.code, payload


def payload_from_file(path: Path) -> dict:
    raw = json.loads(path.read_text(encoding="utf-8"))
    return {
        "name": raw["name"],
        "nodes": raw["nodes"],
        "connections": raw["connections"],
        "settings": raw.get("settings") or {"executionOrder": "v1"},
    }


def main() -> None:
    env = load_env(ROOT / ".env")
    base = env.get("N8N_BASE_URL", "").rstrip("/")
    key = env.get("N8N_API_KEY", "")
    if not base or not key:
        raise SystemExit("N8N_BASE_URL and N8N_API_KEY must be set in .env")

    status, listed = request("GET", f"{base}/api/v1/workflows?limit=50", key)
    if status >= 400:
        raise SystemExit(f"List workflows failed ({status}): {listed}")

    existing = {item["name"]: item["id"] for item in listed.get("data", listed if isinstance(listed, list) else [])}
    print(f"Connected. Existing workflows: {len(existing)}")

    for file in sorted(WORKFLOWS.glob("*.json")):
        body = payload_from_file(file)
        name = body["name"]
        if name in existing:
            print(f"skip {name} (already exists)")
            continue
        status, created = request("POST", f"{base}/api/v1/workflows", key, body)
        if status >= 400:
            print(f"create failed {name} ({status}): {created}")
            continue
        wf_id = created.get("id")
        print(f"created {name} id={wf_id}")
        act_status, act_body = request("POST", f"{base}/api/v1/workflows/{wf_id}/activate", key, {})
        if act_status >= 400:
            print(f"  activate skipped ({act_status}): {act_body}")
        else:
            print("  activated")


if __name__ == "__main__":
    main()
