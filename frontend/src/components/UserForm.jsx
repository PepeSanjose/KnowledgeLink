import { useEffect, useState } from "react";
import { ROLES } from "../constants/roles";

export default function UserForm({ mode = "create", initialData, onSubmit, onCancel }) {
  const isCreate = mode === "create";
  const [email, setEmail] = useState(initialData?.email || "");
  const [fullName, setFullName] = useState(initialData?.full_name || "");
  const [role, setRole] = useState(initialData?.role || "USER");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [error, setError] = useState("");

  useEffect(() => {
    setEmail(initialData?.email || "");
    setFullName(initialData?.full_name || "");
    setRole(initialData?.role || "USER");
    setIsActive(initialData?.is_active ?? true);
    setPassword("");
    setError("");
  }, [initialData, mode]);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("El email es obligatorio.");
      return;
    }
    if (isCreate && !password) {
      setError("La contraseña es obligatoria al crear.");
      return;
    }

    onSubmit({
      email,
      full_name: fullName,
      role,
      is_active: isActive,
      password: password || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
      <h3 style={{ margin: 0 }}>{isCreate ? "Crear usuario" : "Editar usuario"}</h3>

      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <label style={row}>
        <span style={label}>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={!isCreate}
          placeholder="usuario@dominio.com"
          style={input}
        />
      </label>

      <label style={row}>
        <span style={label}>Nombre</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Nombre completo"
          style={input}
        />
      </label>

      <label style={row}>
        <span style={label}>Rol</span>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={input}>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </label>

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

      <label style={row}>
        <span style={label}>{isCreate ? "Contraseña" : "Nueva contraseña"}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={isCreate ? "Obligatoria" : "Dejar vacío para no cambiar"}
          style={input}
        />
      </label>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="submit" style={{ background: "#0d6efd", color: "#fff", border: 0, padding: "8px 12px", borderRadius: 4 }}>
          {isCreate ? "Crear" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

const row = { display: "grid", gridTemplateColumns: "140px 1fr", alignItems: "center", gap: 8 };
const label = { color: "#333" };
const input = { padding: 8, border: "1px solid #ccc", borderRadius: 4 };
