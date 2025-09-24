import { createContext } from "react";

// Context simple para rol activo en la PoC
const RoleContext = createContext({
  role: "ADMIN",
  setRole: () => {},
});

export default RoleContext;
