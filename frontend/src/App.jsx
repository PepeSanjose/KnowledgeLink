import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
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
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Frontend React</h1>
      {loading && <p>Cargando...</p>}
      {!loading && error && (
        <p style={{ color: "crimson" }}>Error: {error}</p>
      )}
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
  );
}

export default App;
