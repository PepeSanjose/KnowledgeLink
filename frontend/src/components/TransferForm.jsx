import { useEffect, useState } from "react";

export default function TransferForm({
  mode = "create",
  initialData,
  onSubmit,
  onCancel,
  users = [], // [{id, email, full_name, is_active}]
}) {
  const isCreate = mode === "create";
  const [position, setPosition] = useState(initialData?.position || "");
  const [outgoingUserId, setOutgoingUserId] = useState(initialData?.outgoing_user_id || "");
  const [managerInstructions, setManagerInstructions] = useState(initialData?.manager_instructions || "");
  const [error, setError] = useState("");

  useEffect(() => {
    setPosition(initialData?.position || "");
    setOutgoingUserId(initialData?.outgoing_user_id || "");
    setManagerInstructions(initialData?.manager_instructions || "");
    setError("");
  }, [initialData, mode, users]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!position.trim()) {
      setError("El puesto es obligatorio.");
      return;
    }
    if (!outgoingUserId) {
      setError("Debes seleccionar la persona saliente.");
      return;
    }
    if (!managerInstructions.trim()) {
      setError("Las indicaciones del manager son obligatorias.");
      return;
    }

    const payload = {
      position: position.trim(),
      outgoing_user_id: Number(outgoingUserId),
      manager_instructions: managerInstructions.trim(),
    };

    onSubmit(payload);
  }

  const activeUsers = users.filter((u) => u.is_active);

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>{isCreate ? "Nueva transferencia" : "Editar transferencia"}</h3>
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <label style={row}>
        <span style={label}>Puesto</span>
        <input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          style={input}
          placeholder="Ej. Desarrollador Backend"
        />
      </label>

      <label style={row}>
        <span style={label}>Persona saliente</span>
        <select
          value={outgoingUserId}
          onChange={(e) => setOutgoingUserId(e.target.value)}
          style={input}
        >
          <option value="" disabled>Selecciona un usuario</option>
          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {(u.full_name || u.email) + " (" + u.email + ")"}
            </option>
          ))}
        </select>
      </label>

      <label style={row}>
        <span style={label}>Indicaciones del manager</span>
        <textarea
          value={managerInstructions}
          onChange={(e) => setManagerInstructions(e.target.value)}
          style={{ ...input, minHeight: 120 }}
          placeholder="Describe objetivos, contexto, documentación y puntos clave para la IA"
        />
      </label>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="submit" style={primary}>Guardar</button>
      </div>
    </form>
  );
}

const row = { display: "grid", gridTemplateColumns: "180px 1fr", alignItems: "center", gap: 8 };
const label = { color: "#333" };
const input = { padding: 8, border: "1px solid #ccc", borderRadius: 4, outline: "none" };
const primary = { background: "#0d6efd", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 4 };
