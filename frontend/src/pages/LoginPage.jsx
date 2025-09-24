import { useContext, useState } from "react";
import RoleContext from "../context/roleContext";

export default function LoginPage() {
  const { login } = useContext(RoleContext);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 380, margin: "64px auto", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ margin: 0 }}>Iniciar sesión</h2>
      <p style={{ marginTop: -8, color: "#555" }}>
        Introduce tu email y contraseña. Esta PoC devuelve un rol desde el backend en el token.
      </p>

      {error && (
        <div style={{ background: "#fdecea", color: "#b71c1c", padding: "8px 12px", border: "1px solid #f5c6cb", borderRadius: 4 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#333" }}>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
            placeholder="tu@email.com"
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span style={{ fontSize: 13, color: "#333" }}>Contraseña</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
            placeholder="••••••••"
          />
        </label>

        <button type="submit" disabled={loading} style={styles.primaryBtn}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <small style={{ color: "#666" }}>
        Consejo: en esta PoC, cualquier combinación válida devolverá un token. El rol se incluye en el token.
      </small>
    </div>
  );
}

const styles = {
  input: {
    padding: "8px 10px",
    border: "1px solid #ccc",
    borderRadius: 4,
    outline: "none",
  },
  primaryBtn: {
    padding: "8px 12px",
    border: "1px solid #0d6efd",
    background: "#0d6efd",
    color: "white",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 600,
  },
};
