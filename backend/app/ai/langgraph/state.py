from __future__ import annotations

from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# Pasos del flujo de entrevista
Step = Literal["ask_resp", "ask_tasks", "review"]


class ChatTurn(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class InterviewState(BaseModel):
    """
    Estado simplificado del flujo de entrevista para una transferencia.
    Se serializa en JSON dentro de Transfer.manager_instructions (PoC).
    """
    responsabilidades: List[str] = Field(default_factory=list)
    tareas: Dict[str, List[str]] = Field(default_factory=dict)  # {responsabilidad: [tareas]}
    pending_step: Step = "ask_resp"
    last_assistant: Optional[str] = None
    thread: List[ChatTurn] = Field(default_factory=list)

    # Campo temporal solo para la ejecución del grafo (no se persiste)
    user_message: Optional[str] = None

    def merge_responsabilidades(self, nuevas: List[str]) -> None:
        if not nuevas:
            return
        seen = set(self.responsabilidades)
        for r in nuevas:
            if r not in seen:
                self.responsabilidades.append(r)
                seen.add(r)

    def merge_tareas(self, nuevas: Dict[str, List[str]]) -> None:
        for resp, ts in (nuevas or {}).items():
            if not ts:
                continue
            bucket = self.tareas.setdefault(resp, [])
            # añade evitando duplicados, corta a 7
            for t in ts:
                if t not in bucket:
                    bucket.append(t)
            self.tareas[resp] = bucket[:7]

    def ready_for_review(self) -> bool:
        if not self.responsabilidades:
            return False
        # Todas las responsabilidades con ≥1 tarea
        for r in self.responsabilidades:
            if not self.tareas.get(r):
                return False
        return True
