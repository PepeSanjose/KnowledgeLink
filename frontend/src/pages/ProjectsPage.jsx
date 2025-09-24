import { useEffect, useMemo, useState } from "react";
import useApi from "../api/useApi";
import ProjectForm from "../components/ProjectForm";

export default function ProjectsPage() {
  const { get, post, put, del, role } = useApi();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const canCreateEdit = role === "ADMIN" || role === "MANAGEMENT";
  const canDelete = role === "ADMIN";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await get(`/projects?page=${page}&size=${size}`);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, role]);

  const filtered = useMemo(() => {
    if (!filter) return items;
    const f = filter.toLowerCase();
    return items.filter((p) => String(p.name || "").toLowerCase().includes(f));
  }, [items, filter]);

  function openCreate() {
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!window.confirm("¿Eliminar este proyecto?")) return;
    try {
      await del(`/projects/${id}`);
      await load();
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  async function handleSubmit(form) {
    try {
      if (editItem) {
        await put(`/projects/${editItem.id}`, form);
      } else {
        await post("/projects", form);
      }
      setShowForm(false);
      setEditItem(null);
      await load();
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Filtrar por nombre..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: 8, flex: "0 0 280px" }}
        />
        <span style={{ color: "#666" }}>Total: {total}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            ◀ Anterior
          </button>
          <span>Página {page}</span>
          <button disabled={page * size >= total || loading} onClick={() => setPage((p) => p + 1)}>
            Siguiente ▶
          </button>
        </div>
        {canCreateEdit && (
          <button
            onClick={openCreate}
            style={{ background: "#0d6efd", color: "#fff", padding: "8px 12px", border: 0, borderRadius: 4 }}
          >
            + Crear proyecto
          </button>
        )}
      </div>

      {loading && <p>Cargando proyectos...</p>}
      {!loading && error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!loading && !error && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Nombre</th>
              <th style={th}>Descripción</th>
              <th style={th}>Activo</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td style={td}>{p.id}</td>
                <td style={td}>{p.name}</td>
                <td style={td}>{p.description || "-"}</td>
                <td style={td}>{String(p.is_active)}</td>
                <td style={td}>
                  {canCreateEdit ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(p)}>Editar</button>
                      {canDelete && (
                        <button onClick={() => handleDelete(p.id)} style={{ color: "white", background: "crimson" }}>
                          Eliminar
                        </button>
                      )}
                    </div>
                  ) : (
                    <em>-</em>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td style={td} colSpan={5}>
                  Sin resultados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <ProjectForm
              mode={editItem ? "edit" : "create"}
              initialData={editItem || { name: "", description: "", is_active: true }}
              onCancel={() => {
                setShowForm(false);
                setEditItem(null);
              }}
              onSubmit={handleSubmit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const th = { borderBottom: "1px solid #ddd", textAlign: "left", padding: "8px" };
const td = { borderBottom: "1px solid #eee", padding: "8px" };

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
};

const modalCard = {
  background: "#fff",
  borderRadius: 8,
  padding: 16,
  minWidth: 420,
  maxWidth: 560,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};
