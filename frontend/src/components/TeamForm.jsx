import { useEffect, useState } from "react";

export default function TeamForm({
  mode = "create",
  initialData,
  onSubmit,
  onCancel,
  projects = [], // [{id, name}]
  managers = [], // [{id, full_name, email, role}]
}) {
  const isCreate = mode === "create";
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [projectId, setProjectId] = useState(initialData?.project_id || projects[0]?.id || "");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const noProjects = projects.length === 0;
  const [selectedManagers, setSelectedManagers] = useState([]); // ids (string) seleccionados
  const [error, setError] = useState("");

  useEffect(() => {
    setName(initialData?.name || "");
    setDescription(initialData?.description || "");
    setProjectId(initialData?.project_id || projects[0]?.id || "");
    setIsActive(initialData?.is_active ?? true);
    setSelectedManagers([]);
    setError("");
  }, [initialData, mode, projects, managers]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (!projectId) {
      setError("Debes seleccionar un proyecto.");
      return;
    }
    if (isCreate && selectedManagers.length === 0) {
      setError("Debes asignar al menos un manager.");
      return;
    }
    if (isCreate) {
      const selectedDetails = managers.filter((m) => selectedManagers.includes(String(m.id)));
      const hasManagement = selectedDetails.some((m) => m.role === "MANAGEMENT");
      if (!hasManagement) {
        setError("Debe haber al menos un usuario con rol MANAGEMENT como manager.");
        return;
      }
    }

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      project_id: Number(projectId),
      is_active: isActive,
    };
    if (isCreate) {
      payload.managers_ids = selectedManagers.map((v) => Number(v));
    }

    onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>{isCreate ? "Crear equipo" : "Editar equipo"}</h3>
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <label style={row}>
        <span style={label}>Nombre</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={input}
          placeholder="Nombre del equipo"
        />
      </label>

      <label style={row}>
        <span style={label}>Proyecto</span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={input}
        >
          <option value="" disabled>Selecciona un proyecto</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      {noProjects && (
        <small style={{ color: "#b71c1c" }}>
          No hay proyectos. Ve a la pestaña "Proyectos" y crea uno para poder guardar el equipo.
        </small>
      )}

      <label style={row}>
        <span style={label}>Descripción</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ ...input, minHeight: 80 }}
          placeholder="Descripción (opcional)"
        />
      </label>

      {isCreate && (
        <label style={row}>
          <span style={label}>Manager(es)</span>
          <select
            multiple
            value={selectedManagers}
            onChange={(e) =>
              setSelectedManagers(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            style={input}
          >
            {managers.length === 0 ? (
              <option value="" disabled>No hay managers disponibles</option>
            ) : (
              managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {(m.full_name || m.email) + " (" + m.email + ")"}
                </option>
              ))
            )}
          </select>
        </label>
      )}

      {!isCreate && (
        <label style={row}>
          <span style={label}>Activo</span>
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
        </label>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button
          type="submit"
          disabled={noProjects}
          title={noProjects ? "Crea un proyecto primero" : undefined}
          style={primary}
        >
          Guardar
        </button>
      </div>
    </form>
  );
}

const row = { display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", gap: 8 };
const label = { color: "#333" };
const input = { padding: 8, border: "1px solid #ccc", borderRadius: 4 };
const primary = { background: "#0d6efd", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 4 };
