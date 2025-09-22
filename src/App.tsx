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
import { Dashboard } from "./pages/Dashboard";
import { ReportForm } from "./pages/ReportForm";
import { ReportDetail } from "./pages/ReportDetail";
import { MyReports } from "./pages/MyReports";
import { AdminDashboard } from "./pages/AdminDashboard";
import { useAuth } from "./hooks/useAuth";

function AppContent() {
  const { user } = useAuth();

  return (
    <Routes>
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
      </Route>

      {/* Protected admin routes */}
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
        <Route index element={<AdminDashboard />} />
        <Route path="reports" element={<AdminDashboard />} />
        <Route path="report/:id" element={<ReportDetail />} />
      </Route>

      {/* Fallback route */}
      <Route
        path="*"
        element={<Navigate to={user ? "/" : "/auth"} replace />}
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
