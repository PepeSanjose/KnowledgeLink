import { useContext, useEffect, useState } from "react";
import RoleContext from "./context/roleContext";
import { ROLES } from "./constants/roles";
import UsersPage from "./pages/UsersPage";
import ProjectsPage from "./pages/ProjectsPage";
import TeamsPage from "./pages/TeamsPage";

function App() {
  const { role, setRole } = useContext(RoleContext);
  const [view, setView] = useState("home"); // 'home' | 'users' | 'projects' | 'teams'
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (view !== "home") return;
    const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
    setLoading(true);
    setError("");
    fetch(`${API_BASE}/`)
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMessage(data?.message ?? JSON.stringify(data));
      })
      .catch((e) => setError(e.message || String(e)))
      .finally(() => setLoading(false));
  }, [view]);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Frontend React</h1>
        <nav style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setView("home")}
            style={view === "home" ? styles.activeBtn : styles.btn}
          >
            Inicio
          </button>
          <button
            onClick={() => setView("users")}
            style={view === "users" ? styles.activeBtn : styles.btn}
          >
            Usuarios
          </button>
          <button
            onClick={() => setView("projects")}
            style={view === "projects" ? styles.activeBtn : styles.btn}
          >
            Proyectos
          </button>
          <button
            onClick={() => setView("teams")}
            style={view === "teams" ? styles.activeBtn : styles.btn}
          >
            Equipos
          </button>
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <label htmlFor="role" style={{ color: "#555" }}>Rol actual:</label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: "6px 8px", border: "1px solid #ccc", borderRadius: 4 }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </header>

      <main>
        {view === "home" && (
          <div>
            {loading && <p>Cargando...</p>}
            {!loading && error && <p style={{ color: "crimson" }}>Error: {error}</p>}
            {!loading && !error && (
              <p>
                Backend dice: <strong>{message}</strong>
              </p>
            )}
            <hr />
            <small>
              Tip: Puedes configurar la variable VITE_API_URL (por ejemplo,
              http://localhost:8000) en un archivo .env para cambiar el backend
              objetivo sin tocar el código.
            </small>
          </div>
        )}

        {view === "users" && <UsersPage />}
        {view === "projects" && <ProjectsPage />}
        {view === "teams" && <TeamsPage />}
      </main>
    </div>
  );
}

const styles = {
  btn: {
    padding: "6px 10px",
    border: "1px solid #ccc",
    background: "#f8f9fa",
    borderRadius: 4,
    cursor: "pointer",
  },
  activeBtn: {
    padding: "6px 10px",
    border: "1px solid #0d6efd",
    background: "#e7f1ff",
    color: "#0d6efd",
    borderRadius: 4,
    cursor: "pointer",
    fontWeight: 600,
  },
};

export default App;
