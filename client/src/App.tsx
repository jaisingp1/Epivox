import { useState } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Play,
  Smartphone,
  Trophy,
  BookOpen,
  Edit3,
  BarChart2,
} from "lucide-react";
import JoinPage from "./pages/JoinPage";
import LiveParticipantPage from "./pages/LiveParticipantPage";
import PresentationPage from "./pages/PresentationPage";
import PresenterRemotePage from "./pages/PresenterRemotePage";
import ActivityEditorPage from "./pages/ActivityEditorPage";
import TemplatesPage from "./pages/TemplatesPage";
import SessionReportPage from "./pages/SessionReportPage";

function HomePage() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleStartSession = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: 1, mode: "live" }),
      });
      const data = await res.json();
      if (data.pin) {
        navigate(`/present/${data.pin}`);
      }
    } catch (err) {
      console.error("Error creando sesión:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col items-center justify-center p-6 selection:bg-[#FFC72C] selection:text-[#001E32]">
      <div className="max-w-3xl w-full bg-[#193750] border-2 border-[#425563] rounded-3xl p-8 md:p-10 shadow-2xl text-center space-y-8 animate-in fade-in duration-300">
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-[#FFC72C] text-[#001E32] rounded-2xl shadow-xl animate-pulse-subtle">
            <Sparkles className="w-12 h-12" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-wider text-white">
            EPIVOX
          </h1>
          <p className="text-[#ECEBE4] text-base md:text-lg font-medium max-w-lg">
            Plataforma Corporativa de Gamificación y Presentaciones Interactivas
          </p>
        </div>

        {/* Acciones Principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleStartSession}
            disabled={isCreating}
            className="flex items-center justify-center space-x-3 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-4 px-6 rounded-2xl transition duration-200 shadow-xl text-base active:scale-95 disabled:opacity-50"
          >
            <Play className="w-5 h-5 fill-[#001E32]" />
            <span>{isCreating ? "Iniciando..." : "Lanzar Presentación"}</span>
          </button>

          <Link
            to="/join"
            className="flex items-center justify-center space-x-3 bg-[#48A9C5] hover:bg-[#3B8FA8] text-white font-extrabold py-4 px-6 rounded-2xl transition duration-200 shadow-xl text-base active:scale-95"
          >
            <Smartphone className="w-5 h-5" />
            <span>Unirse como Móvil (PIN)</span>
          </Link>
        </div>

        {/* Módulos de Creación y Analítica */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Link
            to="/editor/1"
            className="flex flex-col items-center justify-center p-4 bg-[#001E32]/70 hover:bg-[#001E32] border border-[#425563] hover:border-[#FFC72C] rounded-2xl transition group text-center"
          >
            <Edit3 className="w-6 h-6 text-[#FFC72C] group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-sm text-white">
              Editor de Diapositivas
            </span>
            <span className="text-[11px] text-[#ECEBE4]/60 mt-1">
              Crear y personalizar preguntas
            </span>
          </Link>

          <Link
            to="/templates"
            className="flex flex-col items-center justify-center p-4 bg-[#001E32]/70 hover:bg-[#001E32] border border-[#425563] hover:border-[#48A9C5] rounded-2xl transition group text-center"
          >
            <BookOpen className="w-6 h-6 text-[#48A9C5] group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-sm text-white">
              Banco de Plantillas
            </span>
            <span className="text-[11px] text-[#ECEBE4]/60 mt-1">
              Cuestionarios prediseñados
            </span>
          </Link>

          <Link
            to="/reports/1"
            className="flex flex-col items-center justify-center p-4 bg-[#001E32]/70 hover:bg-[#001E32] border border-[#425563] hover:border-[#4C8C2B] rounded-2xl transition group text-center"
          >
            <BarChart2 className="w-6 h-6 text-[#4C8C2B] group-hover:scale-110 transition-transform mb-2" />
            <span className="font-bold text-sm text-white">
              Reportes y Analíticas
            </span>
            <span className="text-[11px] text-[#ECEBE4]/60 mt-1">
              KPIs, acierto y exportación Excel
            </span>
          </Link>
        </div>

        {/* Info de sesión lista */}
        <div className="bg-[#001E32]/60 border border-[#425563] p-4 rounded-2xl text-left space-y-2 text-sm text-[#ECEBE4]">
          <div className="flex items-center space-x-2 text-[#FFC72C] font-bold">
            <Trophy className="w-4 h-4" />
            <span>Plantilla Maestra Activa:</span>
          </div>
          <p className="text-xs text-[#ECEBE4] opacity-90 pl-6">
            "Seguridad Operacional y Cultura Epiroc" (Opción Múltiple,
            Verdadero/Falso, Nube de Palabras, Escala Likert con Podio 3D y
            Confetti).
          </p>
        </div>

        <div className="pt-2 text-xs text-[#ECEBE4] opacity-60">
          Ecosistema Logistech &bull; Epiroc Chile S.A.C.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/live/:pin" element={<LiveParticipantPage />} />
      <Route path="/present/:pin" element={<PresentationPage />} />
      <Route path="/remote/:pin" element={<PresenterRemotePage />} />
      <Route path="/editor/:id" element={<ActivityEditorPage />} />
      <Route path="/templates" element={<TemplatesPage />} />
      <Route path="/reports/:id" element={<SessionReportPage />} />
      <Route path="/reports" element={<SessionReportPage />} />
    </Routes>
  );
}
