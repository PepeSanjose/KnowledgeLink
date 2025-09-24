import { useMemo, useState } from "react";
import RoleContext from "./roleContext";

// Nota: Este archivo SOLO exporta un componente (para cumplir la regla react-refresh)
export default function RoleProvider({ children }) {
  const [role, setRole] = useState("ADMIN");
  const value = useMemo(() => ({ role, setRole }), [role]);
  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}
