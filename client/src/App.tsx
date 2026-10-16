import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import HomePage from "./pages/HomePage";
import PresentationsPage from "./pages/PresentationsPage";
import OpenPollsPage from "./pages/OpenPollsPage";
import TemplatesPage from "./pages/TemplatesPage";
import SessionReportPage from "./pages/SessionReportPage";
import ActivityEditorPage from "./pages/ActivityEditorPage";
import PresentationPage from "./pages/PresentationPage";
import PresenterRemotePage from "./pages/PresenterRemotePage";
import JoinPage from "./pages/JoinPage";
import LiveParticipantPage from "./pages/LiveParticipantPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import AdminUsersPage from "./pages/AdminUsersPage";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Rutas Públicas de Acceso y Recuperación */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Rutas Protegidas con AppLayout y Sidebar */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hub"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/presentations"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PresentationsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/open-polls"
          element={
            <ProtectedRoute>
              <AppLayout>
                <OpenPollsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <AppLayout>
                <TemplatesPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SessionReportPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <SessionReportPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Editor de diapositivas (Protegido) */}
        <Route
          path="/editor/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ActivityEditorPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Módulo de Administración de Usuarios (Solo Super Admin) */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <AppLayout>
                <AdminUsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Pantalla de Proyección 16:9 (Proyector / Teams) */}
        <Route path="/present/:pin" element={<PresentationPage />} />

        {/* Control Remoto para el Presentador */}
        <Route path="/remote/:pin" element={<PresenterRemotePage />} />

        {/* Experiencia Móvil de Participantes (100% pública por PIN, sin login) */}
        <Route path="/join" element={<JoinPage />} />
        <Route path="/live/:pin" element={<LiveParticipantPage />} />
      </Routes>
    </AuthProvider>
  );
}
