"""Shared Supabase auth for Fashion, Wormhole, and FastAPI services."""

from hdz_auth.config import AuthSettings
from hdz_auth.fastapi import AuthDependencies, create_auth_dependencies
from hdz_auth.jwt import extract_user_id_from_jwt
from hdz_auth.router import create_auth_router
from hdz_auth.token import extract_bearer_token, extract_token_from_request

__all__ = [
    "AuthSettings",
    "AuthDependencies",
    "create_auth_dependencies",
    "create_auth_router",
    "extract_user_id_from_jwt",
    "extract_bearer_token",
    "extract_token_from_request",
]
