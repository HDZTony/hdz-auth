from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class AuthSettings:
    supabase_url: str
    supabase_key: str
    service_role_key: str | None = None
    auth_cookie_name: str = "auth_token"
    debug: bool = False

    @classmethod
    def from_env(cls) -> AuthSettings:
        url = os.getenv("SUPABASE_URL", "").strip()
        key = os.getenv("SUPABASE_KEY", "").strip()
        service = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip() or None
        debug = os.getenv("HDZ_AUTH_DEBUG", "").lower() in {"1", "true", "yes"}
        return cls(
            supabase_url=url,
            supabase_key=key,
            service_role_key=service,
            debug=debug,
        )

    def is_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_key)
