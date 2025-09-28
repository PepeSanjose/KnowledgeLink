from __future__ import annotations

from typing import Dict, Callable

from langgraph.graph import StateGraph, START, END  # type: ignore

from app.ai.langgraph.nodes import (
    node_start,
    node_process_user,
    node_persist_factory,
)


def build_start_app(db_session_getter: Callable, transfer_id: int):
    """
    Grafo para iniciar la entrevista (primer turno del asistente).
    START -> start -> persist -> END
    """
    graph = StateGraph(Dict)  # tipo de estado dict (serializable)
    graph.add_node("start", node_start)
    graph.add_node("persist", node_persist_factory(db_session_getter, transfer_id))

    graph.add_edge(START, "start")
    graph.add_edge("start", "persist")
    graph.add_edge("persist", END)
    return graph.compile()


def build_message_app(db_session_getter: Callable, transfer_id: int):
    """
    Grafo para procesar un mensaje del usuario.
    START -> process_user -> persist -> END
    """
    graph = StateGraph(Dict)
    graph.add_node("process_user", node_process_user)
    graph.add_node("persist", node_persist_factory(db_session_getter, transfer_id))

    graph.add_edge(START, "process_user")
    graph.add_edge("process_user", "persist")
    graph.add_edge("persist", END)
    return graph.compile()
