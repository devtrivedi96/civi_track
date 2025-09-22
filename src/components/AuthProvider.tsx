import { ReactNode, useEffect } from "react";
import { AuthContext, useAuthProvider } from "../hooks/useAuth";
// ...existing code...

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuthProvider();

  useEffect(() => {
    // no-op: AuthProvider doesn't need Leaflet side-effects
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}
