from __future__ import annotations

from passlib.context import CryptContext
import base64
import json
import time

# Mínimo utilitario de contraseñas para PoC (sin JWT, sin OAuth)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str, role: str) -> str:
    """
    Simple PoC token generator (NOT secure for production).
    Encodes a JSON payload with subject/email and role in URL-safe base64.
    """
    payload = {"sub": subject, "role": role, "iat": int(time.time())}
    raw = json.dumps(payload).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8")


def decode_access_token(token: str) -> dict | None:
    """
    Decode URL-safe base64 token used in this PoC.
    Returns the payload dict or None if invalid.
    """
    try:
        raw = base64.urlsafe_b64decode(token.encode("utf-8"))
        payload = json.loads(raw.decode("utf-8"))
        if not isinstance(payload, dict):
            return None
        return payload
    except Exception:
        return None
