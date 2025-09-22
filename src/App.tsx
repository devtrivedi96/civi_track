import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Auth } from "./components/Auth";
import { Dashboard } from "./pages/Dashboard";
import { ReportForm } from "./pages/ReportForm";
import { ReportDetail } from "./pages/ReportDetail";
import { MyReports } from "./pages/MyReports";
import { AdminDashboard } from "./pages/AdminDashboard";
import { useAuth } from "./hooks/useAuth";

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/report" element={<ReportForm />} />
        <Route path="/report/:id" element={<ReportDetail />} />
        <Route path="/my-reports" element={<MyReports />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
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
