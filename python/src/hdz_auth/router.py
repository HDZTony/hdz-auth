from __future__ import annotations

import hashlib
import logging
import os

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from hdz_auth.config import AuthSettings

logger = logging.getLogger(__name__)


class GoogleNativeAuthRequest(BaseModel):
    """Native Google sign-in without idToken (UniApp / some mobile SDKs)."""

    email: str
    google_user_id: str
    name: str = ""


def create_auth_router(
    settings: AuthSettings | None = None,
    *,
    prefix: str = "/api/auth",
    tags: list[str] | None = None,
) -> APIRouter:
    resolved = settings or AuthSettings.from_env()
    router = APIRouter(prefix=prefix, tags=tags or ["auth"])

    @router.post("/google-native")
    async def google_native_auth(body: GoogleNativeAuthRequest) -> dict[str, str]:
        supabase_url = resolved.supabase_url or os.getenv("SUPABASE_URL", "")
        service_role_key = resolved.service_role_key or os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

        if not supabase_url or not service_role_key:
            raise HTTPException(status_code=500, detail="Server auth configuration missing")

        password = hashlib.sha256(
            f"google-native:{body.google_user_id}:{service_role_key[:32]}".encode()
        ).hexdigest()

        admin_headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            create_resp = await client.post(
                f"{supabase_url}/auth/v1/admin/users",
                headers=admin_headers,
                json={
                    "email": body.email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {
                        "full_name": body.name,
                        "name": body.name,
                        "google_user_id": body.google_user_id,
                        "avatar_url": "",
                    },
                    "app_metadata": {
                        "provider": "google",
                        "providers": ["google"],
                    },
                },
            )

            if create_resp.status_code in (200, 201):
                logger.info("[hdz-auth] google-native created user: %s", body.email)
            elif create_resp.status_code == 422:
                logger.info("[hdz-auth] google-native user exists: %s", body.email)
                users_resp = await client.get(
                    f"{supabase_url}/auth/v1/admin/users",
                    headers=admin_headers,
                    params={"page": 1, "per_page": 1000},
                )
                user_id = None
                if users_resp.status_code == 200:
                    for user in users_resp.json().get("users", []):
                        if user.get("email") == body.email:
                            user_id = user["id"]
                            break
                if not user_id:
                    raise HTTPException(status_code=500, detail="User lookup failed")
                await client.put(
                    f"{supabase_url}/auth/v1/admin/users/{user_id}",
                    headers=admin_headers,
                    json={
                        "password": password,
                        "email_confirm": True,
                        "user_metadata": {
                            "full_name": body.name,
                            "name": body.name,
                            "google_user_id": body.google_user_id,
                        },
                    },
                )
            else:
                logger.error(
                    "[hdz-auth] google-native create failed: %s %s",
                    create_resp.status_code,
                    create_resp.text,
                )
                raise HTTPException(status_code=500, detail="Failed to create user")

            signin_resp = await client.post(
                f"{supabase_url}/auth/v1/token?grant_type=password",
                headers={"apikey": service_role_key, "Content-Type": "application/json"},
                json={"email": body.email, "password": password},
            )
            if signin_resp.status_code != 200:
                logger.error(
                    "[hdz-auth] google-native sign-in failed: %s %s",
                    signin_resp.status_code,
                    signin_resp.text,
                )
                raise HTTPException(status_code=500, detail="Authentication failed")

            session = signin_resp.json()
            return {
                "access_token": session["access_token"],
                "refresh_token": session["refresh_token"],
            }

    return router
