import { useEffect, useRef, useState } from "react";
import useApi from "../api/useApi";

export default function ChatPanel() {
  const { post } = useApi();

  const [transferIdInput, setTransferIdInput] = useState("");
  const [activeTransferId, setActiveTransferId] = useState(null);
  const [pendingStep, setPendingStep] = useState(null);

  const [messages, setMessages] = useState(() => [
    {
      id: "m1",
      role: "assistant",
      content:
        "Hola, soy tu asistente de transferencias. Indica el ID de la transferencia y pulsa Iniciar para comenzar la entrevista.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function threadToMessages(thread = []) {
    const now = Date.now();
    return thread.map((t, i) => ({
      id: `${t.role}-${now}-${i}`,
      role: t.role,
      content: t.content,
      ts: now + i,
    }));
  }

  async function handleStart() {
    const idNum = Number(transferIdInput);
    if (!idNum || Number.isNaN(idNum) || idNum <= 0) {
      setError("Introduce un ID de transferencia válido (número).");
      return;
    }
    setSending(true);
    setError("");
    try {
      const data = await post(`/chat-transfer/${idNum}/start`, {});
      const thread = data?.state?.thread || [];
      const msgs = threadToMessages(thread);
      const assistant = data?.assistant;
      const merged =
        assistant && (!msgs.length || msgs[msgs.length - 1]?.content !== assistant)
          ? [...msgs, { id: "a-" + Date.now(), role: "assistant", content: assistant, ts: Date.now() }]
          : msgs.length
          ? msgs
          : [
              {
                id: "a-" + Date.now(),
                role: "assistant",
                content: assistant || "Para empezar, dime 2–5 responsabilidades principales.",
                ts: Date.now(),
              },
            ];
      setMessages(merged);
      setActiveTransferId(idNum);
      setPendingStep(data?.pending_step || null);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setSending(false);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;

    setError("");

    // Si no hay entrevista iniciada aún, intenta iniciarla automáticamente si hay ID
    if (!activeTransferId) {
      await handleStart();
      if (!activeTransferId && !Number(transferIdInput)) {
        setError("Indica un ID de transferencia válido y pulsa Iniciar.");
        return;
      }
    }
    const currentId = activeTransferId || Number(transferIdInput);
    if (!currentId) {
      setError("Indica un ID de transferencia válido y pulsa Iniciar.");
      return;
    }

    setSending(true);
    const userMsg = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const data = await post(`/chat-transfer/${currentId}/message`, { message: text });
      // Sincroniza con el hilo devuelto por el backend para evitar duplicados
      const thread = data?.state?.thread || [];
      const synced = threadToMessages(thread);
      const assistant = data?.assistant;
      const merged =
        assistant && (!synced.length || synced[synced.length - 1]?.content !== assistant)
          ? [...synced, { id: "a-" + Date.now(), role: "assistant", content: assistant, ts: Date.now() }]
          : synced;

      setMessages(merged);
      setPendingStep(data?.pending_step || null);
      setActiveTransferId(currentId);
    } catch (e) {
      // En caso de error, revertimos el mensaje del usuario añadido arriba
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setInput(text);
      setError(e.message || String(e));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  }

  function clearChat() {
    if (!window.confirm("¿Vaciar conversación local? (No borra el estado guardado en el servidor)")) return;
    setMessages([
      {
        id: "m1",
        role: "assistant",
        content:
          "Conversación reiniciada. Indica el ID de transferencia y pulsa Iniciar para continuar.",
        ts: Date.now(),
      },
    ]);
    setError("");
  }

  return (
    <div style={wrap}>
      <div style={header}>
        <strong>Chat de Traspasos</strong>
        <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
          <input
            type="number"
            placeholder="ID transferencia"
            value={transferIdInput}
            onChange={(e) => setTransferIdInput(e.target.value)}
            style={idInput}
          />
          <button onClick={handleStart} disabled={sending || !transferIdInput} style={btnPrimary}>
            {sending && !activeTransferId ? "Iniciando..." : activeTransferId ? "Reiniciar" : "Iniciar"}
          </button>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          {pendingStep && <span style={{ color: "#555", fontSize: 12 }}>Paso: {pendingStep}</span>}
          <button onClick={clearChat} style={btnSm}>Vaciar</button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "8px 12px", background: "#fdecea", color: "#b71c1c", border: "1px solid #f5c6cb" }}>
          {error}
        </div>
      )}

      <div style={scrollArea}>
        {messages.map((m) => (
          <div key={m.id} style={{ display: "flex", marginBottom: 8, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              style={{
                ...bubble,
                background: m.role === "user" ? "#0d6efd" : "#f1f3f5",
                color: m.role === "user" ? "#fff" : "#111",
                borderTopLeftRadius: m.role === "user" ? 12 : 4,
                borderTopRightRadius: m.role === "user" ? 4 : 12,
              }}
            >
              <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>
                {m.role === "user" ? "Tú" : "Asistente"}
              </div>
              <div style={{ whiteSpace: "pre-wrap" }}>{m.content}</div>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div style={inputBar}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
          style={textArea}
          rows={2}
        />
        <button onClick={handleSend} disabled={sending || !input.trim()} style={sendBtn}>
          {sending ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </div>
  );
}

const wrap = {
  display: "grid",
  gridTemplateRows: "auto auto 1fr auto",
  height: "calc(100vh - 160px)",
  border: "1px solid #e9ecef",
  borderRadius: 8,
  overflow: "hidden",
  background: "#fff",
};

const header = {
  display: "flex",
  alignItems: "center",
  padding: "10px 12px",
  background: "#f8f9fa",
  borderBottom: "1px solid #e9ecef",
  gap: 8,
};

const idInput = {
  width: 160,
  padding: "6px 8px",
  border: "1px solid #ced4da",
  borderRadius: 6,
};

const scrollArea = {
  padding: 12,
  overflowY: "auto",
  background: "#fff",
};

const inputBar = {
  display: "flex",
  gap: 8,
  padding: 12,
  borderTop: "1px solid #e9ecef",
  background: "#f8f9fa",
};

const textArea = {
  flex: 1,
  padding: 8,
  borderRadius: 6,
  border: "1px solid #ced4da",
  resize: "none",
  fontFamily: "inherit",
};

const sendBtn = {
  padding: "8px 14px",
  border: "1px solid #0d6efd",
  background: "#0d6efd",
  color: "#fff",
  borderRadius: 6,
  cursor: "pointer",
};

const btnSm = {
  padding: "6px 8px",
  border: "1px solid #adb5bd",
  background: "#fff",
  borderRadius: 6,
  cursor: "pointer",
};

const btnPrimary = {
  padding: "6px 10px",
  border: "1px solid #0d6efd",
  background: "#0d6efd",
  color: "#fff",
  borderRadius: 6,
  cursor: "pointer",
};

const bubble = {
  maxWidth: "72%",
  padding: "10px 12px",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
};
