from typing import Any, Dict, Tuple

from fastapi import Depends, Query
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import get_current_token_payload, require_roles  # re-export for convenience
from app.db.session import get_db


def get_settings_dep() -> Settings:
    """Provide app settings via dependency injection."""
    return get_settings()


def get_db_dep(db: Session = Depends(get_db)) -> Session:
    """Provide DB session via dependency injection."""
    return db


async def get_current_user_token(payload: Dict[str, Any] = Depends(get_current_token_payload)) -> Dict[str, Any]:
    """
    Returns the decoded JWT payload: {"sub": user_id, "role": role, ...}
    """
    return payload


def pagination_params(
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    size: int = Query(20, ge=1, le=100, description="Page size"),
) -> Tuple[int, int]:
    """Common pagination dependency."""
    return page, size


__all__ = [
    "get_settings_dep",
    "get_db_dep",
    "get_current_user_token",
    "require_roles",
    "pagination_params",
]
