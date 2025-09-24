import { useContext, useMemo } from "react";
import RoleContext from "../context/roleContext";

function buildBaseUrl() {
  const base = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
  return `${base}/api/v1`;
}

export default function useApi() {
  const { role, token } = useContext(RoleContext);
  const baseUrl = useMemo(buildBaseUrl, []);

  async function request(path, { method = "GET", body, headers } = {}) {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Role": role,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
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
    return data;
  }

  return {
    get: (path) => request(path, { method: "GET" }),
    post: (path, body) => request(path, { method: "POST", body }),
    put: (path, body) => request(path, { method: "PUT", body }),
    del: (path) => request(path, { method: "DELETE" }),
    baseUrl,
    role,
  };
}
