import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedOfficialRouteProps {
  children: React.ReactNode;
}

export function ProtectedOfficialRoute({
  children,
}: ProtectedOfficialRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !profile) {
    return <Navigate to="/auth" />;
  }

  if (profile.role !== "official") {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}
