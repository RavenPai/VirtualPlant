from __future__ import annotations

import os

import httpx

from app.services.mission_mail import build_digest


def _supabase_keys() -> tuple[str, str]:
    url = (os.environ.get("SUPABASE_URL") or "").rstrip("/")
    key = (
        os.environ.get("SUPABASE_ANON_KEY")
        or os.environ.get("SUPABASE_PUBLISHABLE_KEY")
        or os.environ.get("SUPABASE_KEY")
        or ""
    )
    return url, key


def user_from_bearer(authorization: str | None) -> dict | None:
    url, key = _supabase_keys()
    if not url or not key or not authorization:
        return None
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        return None
    response = httpx.get(
        f"{url}/auth/v1/user",
        headers={"Authorization": f"Bearer {token}", "apikey": key},
        timeout=15,
    )
    if response.status_code != 200:
        return None
    data = response.json()
    if not data.get("email") or data.get("is_anonymous"):
        return None
    return data


def send_resend(digest: dict) -> bool | None:
    api_key = os.environ.get("RESEND_API_KEY")
    from_addr = os.environ.get("EMAIL_FROM") or "Virtual Plant <beth.t@example.com>"
    if not api_key:
        return None
    to = (digest.get("to") or "").strip()
    if not to or "@" not in to:
        return False
    response = httpx.post(
        "https://api.resend.com/emails",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "from": from_addr,
            "to": [to],
            "subject": digest["subject"],
            "html": digest["html"],
            "text": digest["text"],
        },
        timeout=20,
    )
    return response.status_code in (200, 201)


def send_digest_to_user(body: dict, authorization: str | None) -> dict:
    user = user_from_bearer(authorization)
    if not user:
        return {"error": "unauthorized"}
    digest = build_digest({**body, "email": user["email"], "to": user["email"]})
    sent = send_resend(digest)
    if sent is None:
        return {"error": "not_configured"}
    if not sent:
        return {"error": "send_failed"}
    return {"ok": True, "to": digest["to"]}
