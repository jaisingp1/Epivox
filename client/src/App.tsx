import { Routes, Route } from "react-router-dom";
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

export default function App() {
  return (
    <Routes>
      {/* Rutas con Navegación y Sidebar Corporativo Logistech */}
      <Route
        path="/"
        element={
          <AppLayout>
            <HomePage />
          </AppLayout>
        }
      />
      <Route
        path="/hub"
        element={
          <AppLayout>
            <HomePage />
          </AppLayout>
        }
      />
      <Route
        path="/presentations"
        element={
          <AppLayout>
            <PresentationsPage />
          </AppLayout>
        }
      />
      <Route
        path="/open-polls"
        element={
          <AppLayout>
            <OpenPollsPage />
          </AppLayout>
        }
      />
      <Route
        path="/templates"
        element={
          <AppLayout>
            <TemplatesPage />
          </AppLayout>
        }
      />
      <Route
        path="/reports/:id"
        element={
          <AppLayout>
            <SessionReportPage />
          </AppLayout>
        }
      />
      <Route
        path="/reports"
        element={
          <AppLayout>
            <SessionReportPage />
          </AppLayout>
        }
      />

      {/* Editor de diapositivas (Dentro de AppLayout para conservar el Sidebar y menú principal) */}
      <Route
        path="/editor/:id"
        element={
          <AppLayout>
            <ActivityEditorPage />
          </AppLayout>
        }
      />

      {/* Pantalla de Proyección 16:9 (Proyector / Teams) */}
      <Route path="/present/:pin" element={<PresentationPage />} />

      {/* Control Remoto para el Presentador */}
      <Route path="/remote/:pin" element={<PresenterRemotePage />} />

      {/* Experiencia Móvil de Participantes */}
      <Route path="/join" element={<JoinPage />} />
      <Route path="/live/:pin" element={<LiveParticipantPage />} />
    </Routes>
  );
}
