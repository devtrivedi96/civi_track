import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProtectedAdminRoute } from "./components/ProtectedAdminRoute";
import { Layout } from "./components/Layout";
import { Auth } from "./components/Auth";
import { AdminAuth } from "./components/AdminAuth";
import { PublicLayout } from "./components/PublicLayout";
import { Dashboard } from "./pages/Dashboard";
import { ReportForm } from "./pages/ReportForm";
import { ReportDetail } from "./pages/ReportDetail";
import { MyReports } from "./pages/MyReports";
import { AdminDashboard } from "./pages/AdminDashboard";
import { ManageOfficials } from "./pages/ManageOfficials";
import { Gamification } from "./pages/Gamification";
import { PublicDashboard } from "./pages/PublicDashboard";
import { useAuth } from "./hooks/useAuth";

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public browsing route for guests */}
      <Route
        path="/public"
        element={
          <PublicLayout>
            <PublicDashboard />
          </PublicLayout>
        }
      />
      <Route
        path="/public/report/:id"
        element={
          <PublicLayout>
            <ReportDetail />
          </PublicLayout>
        }
      />
      {/* Public routes */}
      <Route
        path="/auth"
        element={!user ? <Auth /> : <Navigate to="/" replace />}
      />
      <Route path="/admin/login" element={<AdminAuth />} />

      {/* Protected user routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="report" element={<ReportForm />} />
        <Route path="report/:id" element={<ReportDetail />} />
        <Route path="my-reports" element={<MyReports />} />
        <Route path="gamification" element={<Gamification />} />
      </Route>

      {/* Protected admin and official routes */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute>
            <Layout>
              <Outlet />
            </Layout>
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="officials" element={<ManageOfficials />} />
        <Route path="gamification" element={<Gamification />} />
      </Route>

      {/* Redirect /official/dashboard to /admin/dashboard for officials */}
      <Route
        path="/official/dashboard"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      {/* Fallback route */}
      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/auth"} replace />}
      />
    </Routes>
  );
}

function App() {
  console.log("Firebase Config:", {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  });
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
