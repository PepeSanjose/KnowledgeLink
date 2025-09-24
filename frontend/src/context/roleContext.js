import { createContext } from "react";

// Contexto de autenticación/rol para la PoC
const RoleContext = createContext({
  role: null,
  setRole: () => {},
  token: null,
  userEmail: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export default RoleContext;
