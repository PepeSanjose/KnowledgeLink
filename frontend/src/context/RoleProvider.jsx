import { useCallback, useEffect, useMemo, useState } from "react";
import RoleContext from "./roleContext";

// Almacenamos sólo el token; el rol/email se derivan del payload del token (base64-url en PoC)
const STORAGE_KEY = "auth_token";

function decodeBase64Url(b64url) {
  try {
    // Normalizar base64 url-safe
    let base64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    // Añadir padding si falta
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export default function RoleProvider({ children }) {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  const refreshFromServer = useCallback(async (tok) => {
    try {
      const base = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const res = await fetch(`${base}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) return;
      const me = await res.json();
      setRole((me.role || "").toUpperCase() || null);
      setUserEmail(me.email || null);
    } catch {
      // Ignorar errores de red/401
    }
  }, []);

  // Inicializar sesión desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const payload = decodeBase64Url(saved);
      if (payload) {
        setToken(saved);
        setRole((payload.role || "").toUpperCase() || null);
        setUserEmail(payload.sub || null);
        // Refrescar datos reales desde backend
        refreshFromServer(saved);
      } else {
        // Token inválido en almacenamiento: limpiar
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [refreshFromServer]);

  const isAuthenticated = !!token;

  const login = useCallback(async (email, password) => {
    const base = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
    const url = `${base}/api/v1/auth/login`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    if (!res.ok) {
      const message = (data && data.detail) || data || `HTTP ${res.status}`;
      throw new Error(message);
    }

    const receivedToken = data?.access_token;
    if (!receivedToken) throw new Error("Token ausente en la respuesta");
    const payload = decodeBase64Url(receivedToken);
    if (!payload) throw new Error("Token inválido");

    localStorage.setItem(STORAGE_KEY, receivedToken);
    setToken(receivedToken);
    setRole((payload.role || "").toUpperCase() || null);
    setUserEmail(payload.sub || null);
    // Confirmar rol/email reales desde backend
    await refreshFromServer(receivedToken);
  }, [refreshFromServer]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setRole(null);
    setUserEmail(null);
  }, []);

  const value = useMemo(
    () => ({
      role,
      setRole, // se mantiene para compatibilidad con componentes existentes
      token,
      userEmail,
      isAuthenticated,
      login,
      logout,
    }),
    [role, token, userEmail, isAuthenticated, login, logout]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
