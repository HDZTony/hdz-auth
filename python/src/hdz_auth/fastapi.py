from __future__ import annotations

import logging
from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from supabase import Client, create_client

from hdz_auth.config import AuthSettings
from hdz_auth.token import extract_token_from_request

logger = logging.getLogger(__name__)

_credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


@dataclass
class AuthDependencies:
    """FastAPI dependency callables backed by one Supabase client."""

    settings: AuthSettings
    supabase: Client | None
    oauth2_scheme: OAuth2PasswordBearer
    get_current_user_and_token: object
    get_current_user: object
    get_current_user_token: object
    get_optional_user_and_token: object


def create_auth_dependencies(settings: AuthSettings | None = None) -> AuthDependencies:
    resolved = settings or AuthSettings.from_env()
    supabase: Client | None = None
    if resolved.is_configured():
        supabase = create_client(resolved.supabase_url, resolved.supabase_key)

    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

    async def get_current_user_and_token(
        request: Request,
        token: str | None = Depends(oauth2_scheme),
    ) -> tuple[str, str]:
        return await _verify_request(request, token, resolved, supabase)

    async def get_current_user(
        request: Request,
        token: str | None = Depends(oauth2_scheme),
    ) -> str:
        user_id, _ = await _verify_request(request, token, resolved, supabase)
        return user_id

    async def get_current_user_token(
        request: Request,
        token: str | None = Depends(oauth2_scheme),
    ) -> str:
        jwt = _extract_token(request, token, resolved)
        if not jwt:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return jwt

    async def get_optional_user_and_token(
        request: Request,
        token: str | None = Depends(oauth2_scheme),
    ) -> tuple[str | None, str | None]:
        jwt = _extract_token(request, token, resolved)
        if not jwt or not supabase:
            return (None, None)
        try:
            user_response = supabase.auth.get_user(jwt)
            if not user_response.user:
                return (None, None)
            return (user_response.user.id, jwt)
        except Exception:
            return (None, None)

    return AuthDependencies(
        settings=resolved,
        supabase=supabase,
        oauth2_scheme=oauth2_scheme,
        get_current_user_and_token=get_current_user_and_token,
        get_current_user=get_current_user,
        get_current_user_token=get_current_user_token,
        get_optional_user_and_token=get_optional_user_and_token,
    )


def _extract_token(request: Request, oauth2_token: str | None, settings: AuthSettings) -> str | None:
    jwt = extract_token_from_request(request, oauth2_token=oauth2_token, settings=settings)
    if settings.debug:
        logger.info("[hdz-auth] path=%s token=%s", request.url.path, "present" if jwt else "missing")
    return jwt


async def _verify_request(
    request: Request,
    token: str | None,
    settings: AuthSettings,
    supabase: Client | None,
) -> tuple[str, str]:
    jwt = _extract_token(request, token, settings)
    if not supabase:
        logger.error("[hdz-auth] Supabase client not configured")
        raise HTTPException(status_code=500, detail="Auth configuration missing")
    if not jwt:
        raise _credentials_exception
    try:
        user_response = supabase.auth.get_user(jwt)
        if not user_response.user:
            raise _credentials_exception
        return (user_response.user.id, jwt)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[hdz-auth] verify failed: %s", exc)
        raise _credentials_exception from exc
