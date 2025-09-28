from __future__ import annotations

import json
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db_dep  # roles opcionales en el futuro
from app.db.session import SessionLocal
from app.models.transfer import Transfer
from app.ai.langgraph.state import InterviewState
from app.ai.langgraph.flows import build_start_app, build_message_app

router = APIRouter(tags=["chat-transfer"])


def _load_state(t: Transfer) -> Dict[str, Any]:
    raw = (t.manager_instructions or "").strip()
    if not raw:
        return InterviewState().model_dump()
    try:
        data = json.loads(raw)
        # Normaliza al modelo
        s = InterviewState(
            responsabilidades=data.get("responsabilidades") or [],
            tareas=data.get("tareas") or {},
            pending_step=data.get("pending_step") or "ask_resp",
            last_assistant=data.get("last_assistant"),
            thread=[
                {"role": turn.get("role", "assistant"), "content": turn.get("content", "")}
                for turn in (data.get("thread") or [])
                if isinstance(turn, dict)
            ],
        )
        return s.model_dump()
    except Exception:
        # Si está corrupto, reinicia
        return InterviewState().model_dump()


class ChatMessage(BaseModel):
    message: str


@router.post("/{transfer_id}/start", response_model=dict)
def start_interview(
    transfer_id: int,
    db: Session = Depends(get_db_dep),
) -> dict:
    t = db.get(Transfer, transfer_id)
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer no encontrada")
    state = _load_state(t)

    app = build_start_app(lambda: SessionLocal(), transfer_id)
    out: Dict[str, Any] = app.invoke(state)  # type: ignore
    return {
        "assistant": out.get("last_assistant"),
        "pending_step": out.get("pending_step"),
        "responsabilidades": out.get("responsabilidades", []),
        "tareas": out.get("tareas", {}),
        "state": out,
    }


@router.post("/{transfer_id}/message", response_model=dict)
def user_message(
    transfer_id: int,
    payload: ChatMessage,
    db: Session = Depends(get_db_dep),
) -> dict:
    t = db.get(Transfer, transfer_id)
    if not t:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer no encontrada")

    state = _load_state(t)
    # Inserta el último mensaje del usuario en el estado
    s = InterviewState(**state)
    s.user_message = payload.message

    app = build_message_app(lambda: SessionLocal(), transfer_id)
    out: Dict[str, Any] = app.invoke(s.model_dump())  # type: ignore

    return {
        "assistant": out.get("last_assistant"),
        "pending_step": out.get("pending_step"),
        "responsabilidades": out.get("responsabilidades", []),
        "tareas": out.get("tareas", {}),
        "state": out,
    }
