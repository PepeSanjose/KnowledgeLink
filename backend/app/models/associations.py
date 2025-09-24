from __future__ import annotations

from sqlalchemy import Table, Column, Integer, ForeignKey, UniqueConstraint

from app.db.base import Base


# Tabla de relación: managers asignados a un equipo
team_managers = Table(
    "team_managers",
    Base.metadata,
    Column("team_id", Integer, ForeignKey("teams.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    UniqueConstraint("team_id", "user_id", name="uq_team_manager"),
)
