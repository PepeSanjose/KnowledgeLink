from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# tokenUrl debe existir en la API (auth.login), lo montaremos en /api/v1/auth/login
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    role: str,
    expires_minutes: int | None = None,
    extra_claims: dict[str, Any] | None = None,
) -> str:
    settings = get_settings()
    expire_delta = timedelta(
        minutes=expires_minutes if expires_minutes is not None else settings.JWT_EXPIRES_MIN
    )
    now = datetime.now(tz=timezone.utc)
    to_encode: dict[str, Any] = {
        "sub": subject,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + expire_delta).timestamp()),
    }
    if extra_claims:
        to_encode.update(extra_claims)
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def decode_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])


async def get_current_token_payload(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    try:
        return decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_roles(*roles: Iterable[str]) -> Callable[[dict[str, Any]], dict[str, Any]]:
    """
    Dependencia para rutas protegidas por rol.
    Uso:
        @router.get("/admin", dependencies=[Depends(require_roles("ADMIN"))])
    """
    def _dep(payload: dict[str, Any] = Depends(get_current_token_payload)) -> dict[str, Any]:
        role = payload.get("role")
        if roles and role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return payload

    return _dep
