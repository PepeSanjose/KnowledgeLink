from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class TransferBase(BaseModel):
    position: str
    outgoing_user_id: int
    manager_instructions: str


class TransferCreate(TransferBase):
    pass


class TransferUpdate(BaseModel):
    position: str | None = None
    outgoing_user_id: int | None = None
    manager_instructions: str | None = None


class TransferRead(TransferBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
