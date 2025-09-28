from __future__ import annotations

import json
from typing import Dict, List

from app.ai.llm import get_llm_adapter, ASK_RESP_TEXT, REVIEW_TEXT
from app.ai.langgraph.state import InterviewState


def node_start(state: Dict) -> Dict:
    """
    Inicializa la entrevista: fija el prompt de responsabilidades.
    """
    s = InterviewState(**state)
    s.pending_step = "ask_resp"
    s.last_assistant = ASK_RESP_TEXT
    s.thread.append({"role": "assistant", "content": s.last_assistant})
    return s.model_dump()


def node_process_user(state: Dict) -> Dict:
    """
    Procesa el último mensaje del usuario con ayuda del LLM (o heurística),
    actualiza responsabilidades/tareas y decide el siguiente paso.
    """
    s = InterviewState(**state)
    user_text = (s.user_message or "").strip()
    if not user_text:
        # Nada que procesar: reitera la instrucción del paso pendiente
        s.last_assistant = s.last_assistant or (
            ASK_RESP_TEXT if s.pending_step == "ask_resp" else REVIEW_TEXT
        )
        return s.model_dump()

    # Guarda turno del usuario
    s.thread.append({"role": "user", "content": user_text})

    llm = get_llm_adapter()
    resps, tasks, assistant = llm.extract(s.pending_step, user_text, known_resps=s.responsabilidades or [])

    # Mezcla resultados
    if resps:
        s.merge_responsabilidades(resps)
    if tasks:
        s.merge_tareas(tasks)

    # Decidir siguiente paso y mensaje del asistente
    if s.pending_step == "ask_resp" and s.responsabilidades and not any(s.tareas.values()):
        s.pending_step = "ask_tasks"
        if not assistant:
            assistant = "Ahora indica tareas concretas por responsabilidad."
    elif s.pending_step == "ask_tasks" and s.ready_for_review():
        s.pending_step = "review"
        if not assistant:
            assistant = REVIEW_TEXT

    s.last_assistant = assistant or s.last_assistant or REVIEW_TEXT
    s.thread.append({"role": "assistant", "content": s.last_assistant})
    # Limpia mensaje temporal
    s.user_message = None
    return s.model_dump()


def node_persist_factory(db_session_getter, transfer_id: int):
    """
    Crea un nodo que persiste el estado en Transfer.manager_instructions (JSON).
    db_session_getter: callable -> Session (por ejemplo, sessionmaker())
    """
    from app.models.transfer import Transfer  # import tardío

    def _persist(state: Dict) -> Dict:
        s = InterviewState(**state)
        payload: Dict = {
            "responsabilidades": s.responsabilidades,
            "tareas": s.tareas,
            "pending_step": s.pending_step,
            "last_assistant": s.last_assistant,
            "thread": s.thread,
        }
        db = db_session_getter()
        try:
            t = db.get(Transfer, transfer_id)
            if not t:
                raise ValueError(f"Transfer {transfer_id} no encontrada")
            t.manager_instructions = json.dumps(payload, ensure_ascii=False)
            db.add(t)
            db.commit()
        finally:
            db.close()
        return s.model_dump()

    return _persist
