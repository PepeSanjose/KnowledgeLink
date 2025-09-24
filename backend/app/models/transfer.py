from __future__ import annotations
from datetime import datetime

from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Transfer(Base):
  __tablename__ = "transfers"

  id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
  # Puesto al que pertenece la transferencia (texto libre para PoC)
  position: Mapped[str] = mapped_column(String(255), nullable=False)

  # Persona saliente (usuario existente y activo)
  outgoing_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
  outgoing_user = relationship("User", lazy="joined")

  # Instrucciones del manager para la IA
  manager_instructions: Mapped[str] = mapped_column(Text, nullable=False)

  created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
  updated_at: Mapped[datetime] = mapped_column(
      DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
  )
