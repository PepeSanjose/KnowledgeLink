import { useEffect, useRef, useState } from "react";

export default function ChatPanel() {
  const [messages, setMessages] = useState(() => [
    {
      id: "m1",
      role: "assistant",
      content:
        "Hola, soy tu asistente de transferencias. Cuéntame qué necesitas y te ayudaré con el proceso.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function simulateAssistantReply(text) {
    const t = text.toLowerCase();
    if (t.includes("hola") || t.includes("buen")) {
      return "¡Hola! ¿Quieres iniciar o consultar un traspaso? Puedo registrar información básica y derivarla a un manager.";
    }
    if (t.includes("estado") || t.includes("cómo va") || t.includes("seguimiento")) {
      return "He registrado tu consulta de estado. Un manager revisará tu caso y te actualizará en breve.";
    }
    if (t.includes("traspaso") || t.includes("transferencia") || t.includes("puesto") || t.includes("saliente")) {
      return "Entendido. Para iniciar un traspaso, indícame el puesto afectado y cualquier instrucción relevante que debamos trasladar al manager.";
    }
    if (t.includes("gracias")) {
      return "A ti. ¿Puedo ayudarte con algo más relacionado con el traspaso?";
    }
    return "He anotado tu mensaje. Un responsable lo revisará y te daremos respuesta. ¿Deseas añadir más detalles?";
  }

  async function handleSend() {
    const text = input.trim();
    if (!text) return;
    setSending(true);
    const userMsg = {
      id: "u-" + Date.now(),
      role: "user",
      content: text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    // Simulación de respuesta (no hay backend de chat todavía)
    await new Promise((r) => setTimeout(r, 500));
    const reply = simulateAssistantReply(text);
    const botMsg = {
      id: "a-" + Date.now(),
      role: "assistant",
      content: reply,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, botMsg]);
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) handleSend();
    }
  }

  function clearChat() {
    if (!window.confirm("¿Vaciar conversación?")) return;
    setMessages([
      {
        id: "m1",
        role: "assistant",
        content:
          "Conversación reiniciada. ¿En qué puedo ayudarte con el traspaso?",
        ts: Date.now(),
      },
    ]);
  }

  return (
    <div style={wrap}>
      <div style={header}>
        <strong>Chat de Traspasos</strong>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button onClick={clearChat} style={btnSm}>Vaciar</button>
        </div>
      </div>

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
  gridTemplateRows: "auto 1fr auto",
  height: "calc(100vh - 160px)",
  border: "1px solid #e9ecef",
  borderRadius: 8,
  overflow: "hidden",
};

const header = {
  display: "flex",
  alignItems: "center",
  padding: "10px 12px",
  background: "#f8f9fa",
  borderBottom: "1px solid #e9ecef",
  gap: 8,
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

const bubble = {
  maxWidth: "72%",
  padding: "10px 12px",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
};
