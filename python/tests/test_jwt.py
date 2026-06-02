import pytest
from hdz_auth.jwt import extract_user_id_from_jwt


def _jwt(payload: dict) -> str:
    import base64
    import json

    header = base64.urlsafe_b64encode(json.dumps({"alg": "HS256"}).encode()).decode().rstrip("=")
    body = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    return f"{header}.{body}.sig"


def test_extract_user_id():
    token = _jwt({"sub": "abc-123"})
    assert extract_user_id_from_jwt(token) == "abc-123"

def test_invalid_token():
    assert extract_user_id_from_jwt("not-a-jwt") is None
