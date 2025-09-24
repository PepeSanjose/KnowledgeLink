import { useEffect, useMemo, useState } from "react";
import useApi from "../api/useApi";
import TeamForm from "../components/TeamForm";

export default function TeamsPage() {
  const { get, post, put, del, role } = useApi();
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
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

  async function loadProjects() {
    try {
      const data = await get(`/projects?page=1&size=1000`);
      const list = Array.isArray(data?.items) ? data.items : [];
      setProjects(list);
      if (!selectedProject && list.length > 0) {
        setSelectedProject(String(list[0].id));
      }
    } catch (e) {
      // no bloquear por error en proyectos, pero mostrar si no hay ninguno
      console.error(e);
    }
  }

  async function loadTeams() {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      q.set("page", String(page));
      q.set("size", String(size));
      if (selectedProject) q.set("project_id", String(selectedProject));
      const data = await get(`/teams?${q.toString()}`);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, role, selectedProject]);

  const filtered = useMemo(() => {
    if (!filter) return items;
    const f = filter.toLowerCase();
    return items.filter((t) => String(t.name || "").toLowerCase().includes(f));
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
    if (!window.confirm("¿Eliminar este equipo?")) return;
    try {
      await del(`/teams/${id}`);
      await loadTeams();
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  async function handleSubmit(form) {
    try {
      if (editItem) {
        await put(`/teams/${editItem.id}`, form);
      } else {
        await post("/teams", form);
      }
      setShowForm(false);
      setEditItem(null);
      await loadTeams();
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <select
          value={selectedProject}
          onChange={(e) => { setSelectedProject(e.target.value); setPage(1); }}
          style={{ padding: 8 }}
        >
          <option value="">Todos los proyectos</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

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

        {canCreateEdit && projects.length > 0 && (
          <button
            onClick={openCreate}
            style={{ background: "#0d6efd", color: "#fff", padding: "8px 12px", border: 0, borderRadius: 4 }}
          >
            + Crear equipo
          </button>
        )}
      </div>

      {projects.length === 0 && (
        <p style={{ color: "#555" }}>No hay proyectos creados. Crea un proyecto primero para poder crear equipos.</p>
      )}

      {loading && <p>Cargando equipos...</p>}
      {!loading && error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!loading && !error && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Nombre</th>
              <th style={th}>Proyecto</th>
              <th style={th}>Activo</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td style={td}>{t.id}</td>
                <td style={td}>{t.name}</td>
                <td style={td}>{projects.find((p) => p.id === t.project_id)?.name || t.project_id}</td>
                <td style={td}>{String(t.is_active)}</td>
                <td style={td}>
                  {canCreateEdit ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => openEdit(t)}>Editar</button>
                      {canDelete && (
                        <button onClick={() => handleDelete(t.id)} style={{ color: "white", background: "crimson" }}>
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
                <td style={td} colSpan={5}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <div style={modalOverlay}>
          <div style={modalCard}>
            <TeamForm
              mode={editItem ? "edit" : "create"}
              initialData={editItem || { name: "", description: "", project_id: selectedProject ? Number(selectedProject) : undefined, is_active: true }}
              projects={projects}
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
