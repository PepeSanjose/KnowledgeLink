import { useEffect, useState } from "react";

export default function ProjectForm({ mode = "create", initialData, onSubmit, onCancel }) {
  const isCreate = mode === "create";
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setIsActive(initialData?.is_active ?? true);
    setError("");
  }, [initialData, mode]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      is_active: isActive,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>{isCreate ? "Crear proyecto" : "Editar proyecto"}</h3>
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <label style={row}>
        <span style={label}>Nombre</span>
        <input value={name} onChange={(e) => setName(e.target.value)} style={input} placeholder="Nombre del proyecto" />
      </label>

      <label style={row}>
        <span style={label}>Descripción</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...input, minHeight: 80 }} placeholder="Descripción (opcional)" />
      </label>

      {!isCreate && (
        <label style={row}>
          <span style={label}>Activo</span>
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        </label>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="submit" style={primary}>Guardar</button>
      </div>
    </form>
  );
}

const row = { display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", gap: 8 };
const label = { color: "#333" };
const input = { padding: 8, border: "1px solid #ccc", borderRadius: 4 };
const primary = { background: "#0d6efd", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 4 };
