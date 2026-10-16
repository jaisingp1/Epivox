import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  Smartphone,
  Tv,
  MessageSquare,
  Users,
  Layers,
  ArrowRight,
  TrendingUp,
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

export default function HomePage() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    fetch("/api/epivox/activities")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setActivities(data);
      })
      .catch((err) => console.error("Error al cargar actividades:", err))
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
    <div className="space-y-8 animate-in fade-in duration-300">
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
              className="bg-[#193750] hover:bg-[#254F72] text-[#ECEBE4] hover:text-white border border-[#425563] font-bold text-sm py-2.5 px-4 rounded-xl transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-[#48A9C5]" />
              <span>Preguntas Abiertas (Mentimeter)</span>
            </Link>

            <Link
              to="/presentations"
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-2.5 px-5 rounded-xl transition shadow-lg flex items-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-[#001E32]" />
              <span>Ver Presentaciones</span>
            </Link>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#193750] border border-[#425563]/60 p-5 rounded-2xl shadow space-y-2">
          <div className="flex items-center justify-between text-[#ECEBE4]/70">
            <span className="text-xs font-bold uppercase tracking-wider">
              Presentaciones
            </span>
            <div className="p-2 bg-[#FFC72C]/10 rounded-xl text-[#FFC72C]">
              <Tv className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {activities.length}
          </div>
          <p className="text-xs text-[#ECEBE4]/60">Cuestionarios y sondeos</p>
        </div>

        <div className="bg-[#193750] border border-[#425563]/60 p-5 rounded-2xl shadow space-y-2">
          <div className="flex items-center justify-between text-[#ECEBE4]/70">
            <span className="text-xs font-bold uppercase tracking-wider">
              Preguntas Totales
            </span>
            <div className="p-2 bg-[#48A9C5]/10 rounded-xl text-[#48A9C5]">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {activities.reduce((acc, a) => acc + (a.questions_count || 0), 0)}
          </div>
          <p className="text-xs text-[#ECEBE4]/60">Diapositivas interactivas</p>
        </div>

        <div className="bg-[#193750] border border-[#425563]/60 p-5 rounded-2xl shadow space-y-2">
          <div className="flex items-center justify-between text-[#ECEBE4]/70">
            <span className="text-xs font-bold uppercase tracking-wider">
              Participantes
            </span>
            <div className="p-2 bg-[#4C8C2B]/10 rounded-xl text-[#4C8C2B]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">500+</div>
          <p className="text-xs text-[#ECEBE4]/60">Capacidad simultánea</p>
        </div>

        <div className="bg-[#193750] border border-[#425563]/60 p-5 rounded-2xl shadow space-y-2">
          <div className="flex items-center justify-between text-[#ECEBE4]/70">
            <span className="text-xs font-bold uppercase tracking-wider">
              Acierto y Feedback
            </span>
            <div className="p-2 bg-[#86C8BC]/10 rounded-xl text-[#86C8BC]">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">92.4%</div>
          <p className="text-xs text-[#ECEBE4]/60">Promedio de retención</p>
        </div>
      </div>

      {/* Hero Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-[#193750] to-[#0F2D44] border-2 border-[#FFC72C]/50 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FFC72C] text-[#001E32] flex items-center justify-center font-black shadow-lg">
              <Play className="w-6 h-6 fill-[#001E32]" />
            </div>
            <h3 className="text-xl font-black text-white">
              Lanzar Presentación en Vivo
            </h3>
            <p className="text-sm text-[#ECEBE4]/80 leading-relaxed">
              Inicia una sesión interactiva gamificada con podio 3D, tiempo de
              respuesta y ranking de participantes.
            </p>
          </div>
          <Link
            to="/presentations"
            className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow active:scale-95"
          >
            <span>Ir al Catálogo de Presentaciones</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-[#193750] to-[#0F2D44] border-2 border-[#48A9C5]/50 p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#48A9C5] text-white flex items-center justify-center font-black shadow-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white">
              Preguntas Abiertas (Mentimeter)
            </h3>
            <p className="text-sm text-[#ECEBE4]/80 leading-relaxed">
              Sondeos instantáneos sin concurso. Recopila opiniones y proyecta
              en Nube de Palabras, Barras o Muro de Ideas.
            </p>
          </div>
          <Link
            to="/open-polls"
            className="w-full bg-[#48A9C5] hover:bg-[#3B8FA8] text-white font-black py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow active:scale-95"
          >
            <span>Lanzar Pregunta Abierta</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-gradient-to-br from-[#193750] to-[#0F2D44] border-2 border-[#425563] p-6 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#001E32] border border-[#425563] text-[#ECEBE4] flex items-center justify-center font-black shadow-lg">
              <Smartphone className="w-6 h-6 text-[#FFC72C]" />
            </div>
            <h3 className="text-xl font-black text-white">
              Unirse como Móvil (PIN)
            </h3>
            <p className="text-sm text-[#ECEBE4]/80 leading-relaxed">
              Permite a los asistentes ingresar a cualquier sesión activa
              digitando el PIN de 6 dígitos desde sus teléfonos.
            </p>
          </div>
          <Link
            to="/join"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#001E32] hover:bg-[#193750] text-[#FFC72C] border-2 border-[#FFC72C]/40 font-black py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition shadow active:scale-95"
          >
            <span>Abrir Pantalla Móvil</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Presentations List */}
      <div className="bg-[#193750] border border-[#425563]/60 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#425563]/40">
          <div>
            <h2 className="text-xl font-black text-white">
              Presentaciones Disponibles
            </h2>
            <p className="text-xs text-[#ECEBE4]/70">
              Listado central de actividades gamificadas y sondeos
            </p>
          </div>
          <Link
            to="/presentations"
            className="text-xs font-bold text-[#FFC72C] hover:underline flex items-center gap-1"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-[#ECEBE4]/60">
            Cargando presentaciones...
          </div>
        ) : activities.length === 0 ? (
          <div className="p-8 text-center text-[#ECEBE4]/60">
            No hay presentaciones registradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activities.slice(0, 4).map((act) => (
              <div
                key={act.id}
                className="bg-[#001E32] border border-[#425563]/60 hover:border-[#FFC72C]/60 p-5 rounded-2xl transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FFC72C]/10 text-[#FFC72C] border border-[#FFC72C]/20">
                      {act.category}
                    </span>
                    <span className="text-xs text-[#ECEBE4]/60 font-semibold">
                      {act.questions_count || 0} diapositivas
                    </span>
                  </div>
                  <h4 className="text-lg font-extrabold text-white group-hover:text-[#FFC72C] transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-[#ECEBE4]/70 line-clamp-2">
                    {act.activity_type === "open_poll"
                      ? "Pregunta Abierta sin concurso (estilo Mentimeter) para recopilar opiniones en tiempo real."
                      : "Cuestionario gamificado con preguntas de selección, verdadero/falso y podio."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#425563]/30">
                  <Link
                    to={`/editor/${act.id}`}
                    className="text-xs font-bold text-[#48A9C5] hover:underline"
                  >
                    Editar Contenido
                  </Link>

                  <button
                    type="button"
                    disabled={isLaunching}
                    onClick={() => handleLaunchFirst(act.id)}
                    className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow"
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
