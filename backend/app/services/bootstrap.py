from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import get_password_hash


def ensure_admin_user(db: Session, settings: Settings, logger: Optional[logging.Logger] = None) -> None:
    """
    Idempotent bootstrap: garantiza que existe un usuario administrador.
    - Si faltan ADMIN_EMAIL o ADMIN_PASSWORD en settings, no hace nada.
    - Si ya existe un usuario con ese email, no crea otro.
    """
    if not settings.ADMIN_EMAIL or not settings.ADMIN_PASSWORD:
        if logger:
            logger.warning("ADMIN_EMAIL o ADMIN_PASSWORD no están definidos. Omitiendo bootstrap de admin.")
        return

    # Import tardío para evitar problemas de orden de importación
    from app.models.user import User  # noqa: WPS433

    stmt = select(User).where(User.email == settings.ADMIN_EMAIL)
    existing = db.execute(stmt).scalar_one_or_none()
    if existing:
        if logger:
            logger.info("Usuario admin ya existe: %s", settings.ADMIN_EMAIL)
        return

    user = User(
        email=settings.ADMIN_EMAIL,
        hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
        full_name=settings.ADMIN_NAME,
        role=(settings.ADMIN_ROLE or "ADMIN"),
        is_active=True,
    )
    try:
        db.add(user)
        db.commit()
        if logger:
            logger.info("Usuario admin creado: %s", settings.ADMIN_EMAIL)
    except Exception as exc:  # pragma: no cover - protección básica
        db.rollback()
        if logger:
            logger.exception("Error creando usuario admin: %s", exc)
        raise
