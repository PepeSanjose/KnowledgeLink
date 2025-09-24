from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Literal


RoleLiteral = Literal["ADMIN", "MANAGEMENT", "USER"]


class UserBase(BaseModel):
    email: EmailStr
    full_name: str | None = None
    role: RoleLiteral = "USER"
    is_active: bool = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str | None = None
    role: RoleLiteral = "USER"


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: RoleLiteral | None = None
    password: str | None = None
    is_active: bool | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
