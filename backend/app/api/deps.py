from typing import Any, Dict, Tuple

from fastapi import Depends, Query, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db


def get_settings_dep() -> Settings:
    """Provide app settings via dependency injection."""
    return get_settings()


def get_db_dep(db: Session = Depends(get_db)) -> Session:
    """Provide DB session via dependency injection."""
    return db


# ---- Simple role handling for PoC (header-based) ----
ALLOWED_ROLES = {"ADMIN", "MANAGEMENT", "USER"}


def get_request_role(x_role: str | None = Header(default=None)) -> str:
    """
    Reads the acting role from the 'X-Role' header.
    - Allowed: ADMIN, MANAGEMENT, USER (case-insensitive)
    """
    if not x_role:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-Role header")
    role = x_role.strip().upper()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid role")
    return role


def require_roles(*roles: str):
    """
    Dependency to enforce roles without JWT (for local PoC).
    Usage:
        @router.post(..., dependencies=[Depends(require_roles("ADMIN", "MANAGEMENT"))])
    """
    def _dep(role: str = Depends(get_request_role)) -> str:
        if roles and role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return role
    return _dep




def pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
) -> Tuple[int, int]:
    """Common pagination dependency."""
    return page, size


__all__ = [
    "get_settings_dep",
    "get_db_dep",
    "pagination_params",
    "get_request_role",
    "require_roles",
]
