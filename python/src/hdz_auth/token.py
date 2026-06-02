from __future__ import annotations

import re

from fastapi import Request

from hdz_auth.config import AuthSettings

_BEARER_RE = re.compile(r"^Bearer\s+(.+)$", re.IGNORECASE)
_SB_COOKIE_RE = re.compile(r"sb-[^-]+-auth-token=([^;]+)")


def extract_bearer_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    match = _BEARER_RE.match(authorization.strip())
    return match.group(1) if match else None


def extract_token_from_request(
    request: Request,
    *,
    oauth2_token: str | None = None,
    settings: AuthSettings | None = None,
) -> str | None:
    """
    Resolve JWT from request in priority order:
    1. OAuth2PasswordBearer dependency value
    2. Authorization header
    3. auth_token cookie (web page refresh)
    4. Supabase default sb-*-auth-token cookie
    """
    if oauth2_token:
        return oauth2_token

    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    bearer = extract_bearer_token(auth_header)
    if bearer:
        return bearer

    cookie_name = settings.auth_cookie_name if settings else "auth_token"
    cookie_token = request.cookies.get(cookie_name)
    if cookie_token:
        return cookie_token

    cookies = request.headers.get("Cookie") or request.headers.get("cookie")
    if cookies:
        match = _SB_COOKIE_RE.search(cookies)
        if match:
            return match.group(1)

    return None
