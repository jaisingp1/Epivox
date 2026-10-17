import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Tv,
  MessageSquare,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
  Edit3,
} from "lucide-react";
import PageHeader from "../components/PageHeader";

interface ActivitySummary {
  id: number;
  title: string;
  category: string;
  activity_type: string;
  questions_count?: number;
  default_time_limit: number;
  updated_at: string;
}

interface HubStats {
  totalParticipants: number;
  accuracyRate: number | null;
  totalSessions: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [stats, setStats] = useState<HubStats>({
    totalParticipants: 0,
    accuracyRate: null,
    totalSessions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/epivox/activities").then((res) => res.json()),
      fetch("/api/epivox/hub/stats").then((res) => res.json()),
    ])
      .then(([actsData, statsData]) => {
        if (Array.isArray(actsData)) setActivities(actsData);
        if (statsData && typeof statsData.totalParticipants === "number") {
          setStats(statsData);
        }
      })
      .catch((err) => console.error("Error al cargar datos del hub:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleLaunchFirst = async (activityId: number) => {
    setIsLaunching(true);
    try {
      const res = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, mode: "live" }),
      });
      const data = await res.json();
      if (data.pin) {
        navigate(`/present/${data.pin}`);
      }
    } catch (err) {
      console.error("Error creando sesión:", err);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Epivox Hub"
        description="Plataforma Corporativa de Gamificación, Presentaciones Interactivas y Sondeos en Vivo de Epiroc."
        badge={
          <span className="px-3 py-1 bg-[#FFC72C]/15 border border-[#FFC72C]/40 text-[#FFC72C] text-xs font-bold rounded-full">
            Ecosistema Logistech
          </span>
        }
        actions={
          <div className="flex items-center gap-3">
            <Link
              to="/open-polls"
              className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#48A9C5]" />
              <span>Preguntas Abiertas</span>
            </Link>

            <Link
              to="/presentations"
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-5 rounded-xl transition shadow flex items-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-[#001E32]" />
              <span>Ver Presentaciones</span>
            </Link>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Presentaciones */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider">
              Presentaciones
            </span>
            <div className="p-2 bg-[#FFC72C]/15 rounded-xl text-[#FFC72C]">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--text-main)]">
            {activities.length}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Cuestionarios y sondeos
          </p>
        </div>

        {/* Preguntas Totales */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider">
              Preguntas Totales
            </span>
            <div className="p-2 bg-[#48A9C5]/15 rounded-xl text-[#48A9C5]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--text-main)]">
            {activities.reduce((acc, a) => acc + (a.questions_count || 0), 0)}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Diapositivas interactivas
          </p>
        </div>

        {/* Participantes */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider">
              Participantes
            </span>
            <div className="p-2 bg-[#86C8BC]/20 rounded-xl text-[var(--status-success)]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--text-main)]">
            {stats.totalParticipants}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {stats.totalParticipants === 1
              ? "Participante histórico"
              : "Participantes totales"}
          </p>
        </div>

        {/* Acierto y Feedback */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-[var(--text-subtle)]">
            <span className="text-xs font-bold uppercase tracking-wider">
              Acierto y Feedback
            </span>
            <div className="p-2 bg-[#86C8BC]/20 rounded-xl text-[var(--status-success)]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-[var(--status-success)]">
            {stats.accuracyRate !== null ? `${stats.accuracyRate}%` : "—"}
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            {stats.accuracyRate !== null
              ? "Promedio en sesiones"
              : "Sin sesiones evaluadas"}
          </p>
        </div>
      </div>

      {/* Recent Presentations List */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-black text-[var(--text-main)] tracking-wide">
              Presentaciones Disponibles
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Listado central de actividades gamificadas y sondeos de opinión
            </p>
          </div>
          <Link
            to="/presentations"
            className="text-xs font-bold text-[#FFC72C] hover:underline flex items-center gap-1.5 focus-visible:outline-none"
          >
            <span>Ver todas las presentaciones</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            Cargando presentaciones...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)]">
            No hay presentaciones registradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.slice(0, 6).map((act) => (
              <div
                key={act.id}
                className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] hover:border-[#FFC72C]/60 p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between space-y-4 group hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FFC72C]/15 text-[#FFC72C] border border-[#FFC72C]/30">
                      {act.category}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-semibold">
                      {act.questions_count || 0} diapositivas
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-[var(--text-main)] group-hover:text-[#FFC72C] transition-colors leading-snug">
                    {act.title}
                  </h4>
                  <p className="text-xs text-[var(--text-subtle)] line-clamp-2 leading-relaxed">
                    {act.activity_type === "open_poll"
                      ? "Sondeo abierto sin concurso para recopilar opiniones y proyectar en vivo."
                      : "Cuestionario gamificado con preguntas interactivas, tiempo de respuesta y podio."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
                  <Link
                    to={`/editor/${act.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#48A9C5] hover:underline"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </Link>

                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={() => handleLaunchFirst(act.id)}
                    className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#001E32]" />
                    <span>Lanzar en Vivo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
