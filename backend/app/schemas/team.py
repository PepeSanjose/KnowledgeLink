from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TeamBase(BaseModel):
    name: str
    description: str | None = None
    project_id: int
    is_active: bool = True


class TeamCreate(TeamBase):
    # IDs de usuarios con rol MANAGEMENT a asignar como managers del equipo en la creación
    managers_ids: list[int]


class TeamUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    project_id: int | None = None
    is_active: bool | None = None


class TeamRead(TeamBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
