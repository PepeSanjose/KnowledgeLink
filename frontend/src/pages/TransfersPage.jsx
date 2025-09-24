import { useEffect, useMemo, useState } from "react";
import useApi from "../api/useApi";
import TransferForm from "../components/TransferForm";
import ChatPanel from "../components/ChatPanel";

export default function TransfersPage() {
  const { get, post, put, del, role } = useApi();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
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
  const isManager = role === "ADMIN" || role === "MANAGEMENT";

  async function loadUsers() {
    try {
      const data = await get(`/users?page=1&size=100`);
      const list = Array.isArray(data?.items) ? data.items : [];
      setUsers(list);
      return list;
    } catch (e) {
      console.error(e);
      setUsers([]);
      return [];
    }
  }

  async function loadTransfers() {
    setLoading(true);
    setError("");
    try {
      const data = await get(`/transfers?page=${page}&size=${size}`);
      setItems(Array.isArray(data?.items) ? data.items : []);
      setTotal(typeof data?.total === "number" ? data.total : 0);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isManager) return;
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager]);

  useEffect(() => {
    if (!isManager) {
      // no cargar transferencias para USER
      return;
    }
    loadTransfers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, role, isManager]);

  const filtered = useMemo(() => {
    if (!filter) return items;
    const f = filter.toLowerCase();
    return items.filter((t) => String(t.position || "").toLowerCase().includes(f));
  }, [items, filter]);

  async function openCreate() {
    await loadUsers();
    setEditItem(null);
    setShowForm(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setShowForm(true);
  }

  async function handleDelete(id) {
    if (!canDelete) return;
    if (!window.confirm("¿Eliminar esta transferencia?")) return;
    try {
      await del(`/transfers/${id}`);
      await loadTransfers();
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  async function handleSubmit(form) {
    try {
      if (editItem) {
        await put(`/transfers/${editItem.id}`, form);
      } else {
        await post("/transfers", form);
      }
      setShowForm(false);
      setEditItem(null);
      await loadTransfers();
    } catch (e) {
      alert(e.message || String(e));
    }
  }

  const findUserLabel = (id) => {
    const u = users.find((x) => x.id === id);
    if (!u) return id;
    return (u.full_name || u.email) + " (" + u.email + ")";
    };

  if (!isManager) {
    return <ChatPanel />;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Filtrar por puesto..."
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
            + Nueva transferencia
          </button>
        )}
      </div>

      {loading && <p>Cargando transferencias...</p>}
      {!loading && error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!loading && !error && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Puesto</th>
              <th style={th}>Persona saliente</th>
              <th style={th}>Creado</th>
              <th style={th}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td style={td}>{t.id}</td>
                <td style={td}>{t.position}</td>
                <td style={td}>{findUserLabel(t.outgoing_user_id)}</td>
                <td style={td}>{new Date(t.created_at).toLocaleString()}</td>
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
            <TransferForm
              mode={editItem ? "edit" : "create"}
              initialData={editItem || { position: "", outgoing_user_id: undefined, manager_instructions: "" }}
              users={users}
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
  maxWidth: 720,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};
