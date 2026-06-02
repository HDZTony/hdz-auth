from __future__ import annotations

import base64
import json


def extract_user_id_from_jwt(token: str) -> str | None:
    """Extract Supabase user id (sub) from JWT without verification."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        padded = parts[1] + "=" * (-len(parts[1]) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded.encode()))
        return payload.get("sub")
    except Exception:
        return None
