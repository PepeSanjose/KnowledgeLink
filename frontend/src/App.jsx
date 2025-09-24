import { useContext, useEffect, useState } from "react";
import RoleContext from "./context/roleContext";
import UsersPage from "./pages/UsersPage";
import ProjectsPage from "./pages/ProjectsPage";
import TeamsPage from "./pages/TeamsPage";
import LoginPage from "./pages/LoginPage";
import TransfersPage from "./pages/TransfersPage";

function App() {
  const { role, isAuthenticated, userEmail, logout } = useContext(RoleContext);
  const [view, setView] = useState("home"); // 'home' | 'users' | 'projects' | 'teams'
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Control de visibilidad de tabs según rol
  const canView = (tab) => {
    const up = String(role || "").toUpperCase();
    const adminOrMgmt = up === "ADMIN" || up === "MANAGEMENT";
    switch (tab) {
      case "users":
        return adminOrMgmt;
      case "projects":
      case "teams":
      case "home":
        return adminOrMgmt;
      case "transfers":
        return true; // visible para todos los roles
      default:
        return true;
    }
  };

  // Ajustar vista por rol:
  // - USER: la pantalla de inicio será "transfers"
  // - Otros roles: si la vista actual no es visible, volver a "home"
  useEffect(() => {
    const up = String(role || "").toUpperCase();
    if (up === "USER") {
      setView("transfers");
    } else if (!canView(view)) {
      setView("home");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

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

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24, display: "grid", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Frontend React</h1>
        <nav style={{ display: "flex", gap: 8 }}>
          {canView("home") && (
            <button
              onClick={() => setView("home")}
              style={view === "home" ? styles.activeBtn : styles.btn}
            >
              Inicio
            </button>
          )}
          {canView("users") && (
            <button
              onClick={() => setView("users")}
              style={view === "users" ? styles.activeBtn : styles.btn}
            >
              Usuarios
            </button>
          )}
          {canView("projects") && (
            <button
              onClick={() => setView("projects")}
              style={view === "projects" ? styles.activeBtn : styles.btn}
            >
              Proyectos
            </button>
          )}
          {canView("teams") && (
            <button
              onClick={() => setView("teams")}
              style={view === "teams" ? styles.activeBtn : styles.btn}
            >
              Equipos
            </button>
          )}
          {canView("transfers") && (
            <button
              onClick={() => setView("transfers")}
              style={view === "transfers" ? styles.activeBtn : styles.btn}
            >
              Transferencias
            </button>
          )}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#555" }}>
            {userEmail ? `Usuario: ${userEmail}` : "Usuario desconocido"} · Rol: {role || "N/A"}
          </span>
          <button
            onClick={logout}
            style={{ padding: "6px 8px", border: "1px solid #dc3545", background: "#f8d7da", color: "#842029", borderRadius: 4, cursor: "pointer" }}
          >
            Salir
          </button>
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

        {view === "users" && canView("users") && <UsersPage />}
        {view === "projects" && canView("projects") && <ProjectsPage />}
        {view === "teams" && canView("teams") && <TeamsPage />}
        {view === "transfers" && canView("transfers") && <TransfersPage />}
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
