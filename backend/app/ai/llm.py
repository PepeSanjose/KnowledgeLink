from __future__ import annotations

import json
import os
import re
from typing import Dict, List, Literal, Tuple

try:
    # Optional: only used if OPENAI_API_KEY is available
    from langchain_openai import ChatOpenAI  # type: ignore
    from langchain_core.messages import SystemMessage, HumanMessage  # type: ignore
except Exception:  # pragma: no cover
    ChatOpenAI = None  # type: ignore


Step = Literal["ask_resp", "ask_tasks", "review"]


SYSTEM_PROMPT = """Eres un asistente de entrevistas para traspasos (transfer learning) en español.
Tu tarea es estructurar las respuestas del usuario en:
- responsabilidades (lista de strings cortos, 2-7)
- tareas (diccionario: clave=responsabilidad, valor=lista de 2-7 tareas específicas y accionables)
Devuelve SIEMPRE un JSON válido con la forma:
{"responsabilidades": [...], "tareas": {"Resp 1": ["tarea A","tarea B"], ...}, "mensajes": {"assistant": "texto siguiente"}}
No añadas explicaciones ni texto fuera de JSON.
Si el usuario solo aporta una parte (p.ej. responsabilidades), completa solo ese bloque.
"""

ASK_RESP_TEXT = (
    "Para empezar, dime entre 2 y 5 RESPONSABILIDADES principales del puesto o persona. "
    "Usa viñetas o frases cortas (ej.: '- Coordinación de equipo')."
)

ASK_TASKS_TEXT = (
    "Perfecto. Ahora, para cada responsabilidad, lista entre 3 y 7 TAREAS concretas y accionables. "
    "Puedes responder en formato:\n"
    "- Responsabilidad X:\n  - Tarea 1\n  - Tarea 2\n- Responsabilidad Y: ..."
)

REVIEW_TEXT = (
    "Revisión: así queda el resumen. ¿Deseas añadir/corregir algo?\n"
    "- Responsabilidades y tareas almacenadas."
)


def _fallback_parse_responsabilities(text: str) -> List[str]:
    lines = [l.strip("-•* ").strip() for l in text.splitlines()]
    cands = [l for l in lines if l and len(l.split()) <= 12]
    # Heurística: primeras 5 líneas con contenido
    return cands[:5]


def _fallback_parse_tasks(text: str, known_resps: List[str]) -> Dict[str, List[str]]:
    # Busca bloques por "Responsabilidad:" o por encabezados línea vacía
    tasks: Dict[str, List[str]] = {}
    current: str | None = None

    # Intenta formato "Responsabilidad: ..."
    resp_pattern = re.compile(r"^(?:-?\s*)?(?:Responsabilidad|Resp)\s*[:\-]\s*(.+)$", re.I)

    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        m = resp_pattern.match(line)
        if m:
            current = m.group(1).strip()
            tasks.setdefault(current, [])
            continue
        if line.startswith("- ") or line.startswith("* "):
            item = line[2:].strip()
            if current:
                tasks.setdefault(current, []).append(item)
            elif known_resps:
                # Si no hay encabezado, atribuir a la primera responsabilidad que no tenga muchas tareas
                target = min(known_resps, key=lambda r: len(tasks.get(r, [])))
                tasks.setdefault(target, []).append(item)

    # Si no detectó estructura, como fallback reparte bullets simples
    if not tasks and known_resps:
        bullets = [l[2:].strip() for l in text.splitlines() if l.strip().startswith("- ")]
        if bullets:
            per = max(1, len(bullets) // max(1, len(known_resps)))
            i = 0
            for r in known_resps:
                tasks[r] = bullets[i : i + per] or []
                i += per
            # resto
            rest = bullets[i:]
            for j, b in enumerate(rest):
                tasks[known_resps[j % len(known_resps)]].append(b)

    # Limita longitud
    for k, v in list(tasks.items()):
        tasks[k] = v[:7]
    return tasks


class LLMAdapter:
    """Pequeño adaptador a LLM con fallback determinista sin clave."""

    def __init__(self) -> None:
        self.has_openai = bool(os.environ.get("OPENAI_API_KEY")) and ChatOpenAI is not None
        self._llm = None
        if self.has_openai:
            # Modelo ligero para estructura; configurable por env var OPENAI_MODEL si se desea
            model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
            self._llm = ChatOpenAI(model=model, temperature=0.1)  # type: ignore

    def _call_openai(self, user_text: str) -> Tuple[List[str], Dict[str, List[str]], str]:
        assert self._llm is not None
        msgs = [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=user_text)]
        out = self._llm.invoke(msgs)  # type: ignore
        content = out.content if hasattr(out, "content") else str(out)
        try:
            data = json.loads(content)
        except Exception:
            # Intenta extraer bloque JSON con regex
            m = re.search(r"\{.*\}", content, re.S)
            data = json.loads(m.group(0)) if m else {}

        responsabilidades = list(map(str, data.get("responsabilidades", []) or []))[:7]
        tareas_raw = data.get("tareas", {}) or {}
        tareas: Dict[str, List[str]] = {str(k): [str(x) for x in (v or [])][:7] for k, v in tareas_raw.items()}
        assistant = str(data.get("mensajes", {}).get("assistant") or "")
        return responsabilidades, tareas, assistant

    def extract(self, step: Step, user_text: str, known_resps: List[str] | None = None) -> Tuple[List[str], Dict[str, List[str]], str]:
        """
        Devuelve (responsabilidades, tareas, assistant_next_text).
        Si no hay clave de OpenAI, usa un parser heurístico.
        """
        if self.has_openai:
            try:
                resps, tasks, assistant = self._call_openai(user_text)
                if not assistant:
                    assistant = ASK_TASKS_TEXT if step == "ask_resp" else REVIEW_TEXT
                return resps, tasks, assistant
            except Exception:
                # cae al fallback
                pass

        # Fallback determinista
        resps: List[str] = []
        tasks: Dict[str, List[str]] = {}

        if step == "ask_resp":
            resps = _fallback_parse_responsabilities(user_text)
            assistant = ASK_TASKS_TEXT if resps else "No identifiqué responsabilidades. Reformula con viñetas, por favor."
        elif step == "ask_tasks":
            k = known_resps or []
            tasks = _fallback_parse_tasks(user_text, k)
            assistant = REVIEW_TEXT if tasks else "No pude extraer tareas. Usa '- Tarea ...' bajo cada responsabilidad."
        else:
            assistant = REVIEW_TEXT

        return resps, tasks, assistant


def get_llm_adapter() -> LLMAdapter:
    return LLMAdapter()
