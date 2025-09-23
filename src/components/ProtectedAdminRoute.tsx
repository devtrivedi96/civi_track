import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ADMIN_EMAILS = [
  "admin@civitrack.gov.in",
  // Add more admin emails as needed
];

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { user, profile, loading } = useAuth();

  console.log("ProtectedAdminRoute - User:", user?.email);
  console.log("ProtectedAdminRoute - Profile:", profile);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Allow access if user is either an admin or an official
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || "");
  const isOfficial = profile && profile.role === "official";

  if (!user || (!isAdmin && !isOfficial)) {
    console.log("Access denied - redirecting to login");
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
