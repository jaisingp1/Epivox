import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Play,
  Copy,
  Check,
  QrCode,
  Tv,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Cloud,
  LayoutGrid,
  PieChart,
  Users,
  RotateCcw,
  RefreshCw,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import QRCode from "qrcode";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import { getSocket } from "../services/socket";

const OPTION_COLORS = [
  "#FFC72C", // Epiroc Yellow
  "#48A9C5", // Epiroc Light Blue
  "#4C8C2B", // Epiroc Green
  "#B7312C", // Epiroc Red
  "#612C51", // Epiroc Violet
  "#D86018", // Epiroc Orange
  "#86C8BC", // Epiroc Electric Green
  "#77746E", // Epiroc Dark Grey
];

const CHART_TYPES = [
  {
    id: "word_cloud",
    name: "Nube de Palabras",
    desc: "Palabras con tamaño según frecuencia",
    icon: Cloud,
  },
  {
    id: "bar",
    name: "Barras",
    desc: "Histograma de conteo por respuesta",
    icon: BarChart3,
  },
  {
    id: "line",
    name: "Líneas",
    desc: "Distribución continua o tendencia",
    icon: TrendingUp,
  },
  {
    id: "cards",
    name: "Muro de Ideas",
    desc: "Tarjetas en vivo tipo brainstorming",
    icon: LayoutGrid,
  },
  {
    id: "donut",
    name: "Dona Circular",
    desc: "Proporciones porcentuales",
    icon: PieChart,
  },
];

interface RawAnswerItem {
  id: number;
  nickname: string;
  answer_payload: string;
  department: string | null;
}

interface DraftQuestion {
  id: string;
  questionText: string;
  chartType: string;
}

interface SessionQuestion {
  id: number;
  question_text: string;
  question_type: string;
  chart_type?: string;
  time_limit: number;
}

export default function OpenPollsPage() {
  // Configuración del set de preguntas previo al lanzamiento
  const [pollTitle, setPollTitle] = useState("Sondeo de Opinión y Feedback en Vivo");
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    {
      id: "q-1",
      questionText: "¿Qué iniciativa o idea propones para fortalecer la seguridad en nuestras faenas?",
      chartType: "word_cloud",
    },
    {
      id: "q-2",
      questionText: "¿Cuál es el principal desafío operativo que enfrentas en tu día a día?",
      chartType: "bar",
    },
  ]);
  const [isLaunching, setIsLaunching] = useState(false);

  // Sesión activa del sondeo
  const [activeSession, setActiveSession] = useState<{
    id: number;
    pin: string;
  } | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [sessionStatus, setSessionStatus] = useState<string>("lobby");
  const [activeParticipants, setActiveParticipants] = useState<
    Array<{ id: number; nickname: string }>
  >([]);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [liveResults, setLiveResults] = useState<Record<string, number>>({});
  const [rawAnswers, setRawAnswers] = useState<RawAnswerItem[]>([]);
  const [activeChartType, setActiveChartType] = useState<string>("word_cloud");
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);

  // WebSockets para sincronización en tiempo real del sondeo multi-pregunta
  useEffect(() => {
    if (!activeSession) return;
    const socket = getSocket();
    const pin = activeSession.pin;

    socket.emit("presenter:join", { pin });

    socket.on(
      "presenter:sync",
      (data: {
        session: { id: number; pin: string; status: string; current_question_index: number };
        participants: Array<{ id: number; nickname: string }>;
        questions: SessionQuestion[];
        liveResults?: Record<string, number>;
        rawAnswers?: RawAnswerItem[];
        totalAnswers?: number;
      }) => {
        setActiveParticipants(data.participants || []);
        if (data.questions && data.questions.length > 0) {
          setSessionQuestions(data.questions);
          const qIdx = data.session.current_question_index ?? 0;
          setCurrentQIndex(qIdx);
          const activeQ = data.questions[qIdx];
          if (activeQ && activeQ.chart_type) {
            setActiveChartType(activeQ.chart_type);
          }
        }
        if (data.liveResults) setLiveResults(data.liveResults);
        if (data.rawAnswers) setRawAnswers(data.rawAnswers);
        if (data.totalAnswers !== undefined) setTotalAnswers(data.totalAnswers);
        setSessionStatus(data.session.status);
      },
    );

    socket.on(
      "lobby:participants_update",
      (data: { participants: Array<{ id: number; nickname: string }> }) => {
        setActiveParticipants(data.participants || []);
      },
    );

    socket.on(
      "session:state_changed",
      (data: {
        status: string;
        currentStep: string;
        currentQuestionIndex?: number;
        question?: SessionQuestion;
        results?: Record<string, number>;
        rawAnswers?: RawAnswerItem[];
        totalAnswers?: number;
      }) => {
        setSessionStatus(data.status);
        if (data.currentQuestionIndex !== undefined) {
          setCurrentQIndex(data.currentQuestionIndex);
        }
        if (data.question) {
          if (data.question.chart_type) {
            setActiveChartType(data.question.chart_type);
          }
        }
        if (data.results) setLiveResults(data.results);
        if (data.rawAnswers) setRawAnswers(data.rawAnswers);
        if (data.totalAnswers !== undefined) setTotalAnswers(data.totalAnswers);
      },
    );

    socket.on(
      "results:live_update",
      (data: {
        totalAnswers: number;
        results: Record<string, number>;
        answers?: RawAnswerItem[];
      }) => {
        setTotalAnswers(data.totalAnswers);
        setLiveResults(data.results);
        if (data.answers) setRawAnswers(data.answers);
      },
    );

    socket.on(
      "chart_type:updated",
      (data: { questionId: number; chartType: string }) => {
        setActiveChartType(data.chartType);
      },
    );

    return () => {
      socket.off("presenter:sync");
      socket.off("lobby:participants_update");
      socket.off("session:state_changed");
      socket.off("results:live_update");
      socket.off("chart_type:updated");
    };
  }, [activeSession?.pin]);

  // Manejo de preguntas en borrador
  const handleAddQuestion = () => {
    const newId = `q-${Date.now()}`;
    setDraftQuestions((prev) => [
      ...prev,
      {
        id: newId,
        questionText: "",
        chartType: "word_cloud",
      },
    ]);
  };

  const handleRemoveQuestion = (id: string) => {
    if (draftQuestions.length <= 1) return;
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateDraft = (
    id: string,
    field: "questionText" | "chartType",
    value: string,
  ) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  // Lanzar el set completo de sondeos abiertos
  const handleLaunchPoll = async () => {
    const validQuestions = draftQuestions.filter((q) => q.questionText.trim().length > 0);
    if (validQuestions.length === 0) return;

    setIsLaunching(true);
    try {
      // 1. Crear actividad de tipo open_poll
      const actRes = await fetch("/api/epivox/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pollTitle.trim().substring(0, 80) || "Sondeo de Opinión",
          category: "Sondeo Mentimeter",
          activity_type: "open_poll",
          default_time_limit: 120,
          default_points: 0,
        }),
      });
      const activity = await actRes.json();

      // 2. Crear cada una de las preguntas abiertas del set
      const createdQuestions: SessionQuestion[] = [];
      for (let i = 0; i < validQuestions.length; i++) {
        const dq = validQuestions[i];
        const qRes = await fetch(
          `/api/epivox/activities/${activity.id}/questions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sort_order: i + 1,
              question_text: dq.questionText.trim(),
              question_type: "word_cloud",
              chart_type: dq.chartType,
              time_limit: 120,
              points_base: 0,
              options_json: "[]",
            }),
          },
        );
        const q = await qRes.json();
        createdQuestions.push(q);
      }

      // 3. Crear sesión en vivo
      const sessRes = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: activity.id, mode: "live" }),
      });
      const session = await sessRes.json();

      if (session && session.pin) {
        setActiveSession({
          id: session.id,
          pin: session.pin,
        });
        setSessionQuestions(createdQuestions);
        setCurrentQIndex(0);
        if (createdQuestions[0]?.chart_type) {
          setActiveChartType(createdQuestions[0].chart_type);
        }

        // Conectar como presentador e iniciar la primera pregunta inmediatamente
        const socket = getSocket();
        socket.emit("presenter:join", { pin: session.pin });
        socket.emit("presenter:action", {
          pin: session.pin,
          action: "start_game",
          questionIndex: 0,
        });
      }
    } catch (err) {
      console.error("Error al lanzar sondeo:", err);
    } finally {
      setIsLaunching(false);
    }
  };

  // Navegación entre preguntas del set
  const handleNextQuestion = () => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "next_question",
    });
  };

  const handlePrevQuestion = () => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "prev_question",
    });
  };

  const handleJumpToQuestion = (idx: number) => {
    if (!activeSession || idx === currentQIndex) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "jump_to_question",
      questionIndex: idx,
    });
  };

  const handleFinishSession = () => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "finish_session",
    });
  };

  // Reenviar / forzar sincronización de la pregunta activa a los teléfonos conectados
  const handlePushCurrentQuestion = () => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "jump_to_question",
      questionIndex: currentQIndex,
    });
  };

  // Cambiar tipo de gráfico de la pregunta activa en tiempo real
  const handleSwitchChart = (newChartType: string) => {
    setActiveChartType(newChartType);
    if (!activeSession) return;
    const activeQ = sessionQuestions[currentQIndex];
    if (!activeQ) return;
    const socket = getSocket();
    socket.emit("presenter:set_chart_type", {
      pin: activeSession.pin,
      questionId: activeQ.id,
      chartType: newChartType,
    });
  };

  const handleCopyLink = () => {
    if (!activeSession) return;
    const link = `${window.location.origin}/join?pin=${activeSession.pin}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenQR = async () => {
    if (!activeSession) return;
    const link = `${window.location.origin}/join?pin=${activeSession.pin}`;
    try {
      const qr = await QRCode.toDataURL(link, {
        width: 300,
        margin: 1,
        color: { dark: "#001E32", light: "#FFC72C" },
      });
      setQrModalUrl(qr);
    } catch (err) {
      console.error(err);
    }
  };

  const currentActiveQuestion = sessionQuestions[currentQIndex] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Preguntas Abiertas (Estilo Mentimeter)"
        description="Sondeos de opinión e ideas en vivo con soporte para un set de preguntas sucesivas. Los participantes responden desde su móvil sin necesidad de volver a ingresar el PIN."
        breadcrumbs={[
          { label: "Epivox", href: "/" },
          { label: "Preguntas Abiertas" },
        ]}
        badge={
          <span className="px-3 py-1 bg-[#48A9C5]/15 border border-[#48A9C5]/40 text-[#48A9C5] text-xs font-bold rounded-full">
            Modo Audiencia
          </span>
        }
      />

      {/* CASO 1: Formulario de Configuración y Lanzamiento (Set de Preguntas) */}
      {!activeSession ? (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-xs uppercase font-black text-[#FFC72C] tracking-wider block">
                Título General del Sondeo
              </label>
              <input
                type="text"
                value={pollTitle}
                onChange={(e) => setPollTitle(e.target.value)}
                placeholder="Ej. Sondeo de Seguridad Faena Norte"
                className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] focus:border-[#FFC72C] rounded-2xl p-4 text-lg font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none transition"
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-black text-[#FFC72C] tracking-wider block">
                    Set de Preguntas Abiertas ({draftQuestions.length})
                  </span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Los participantes irán respondiendo a medida que tú avances a la siguiente pregunta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#FFC72C] border border-[#FFC72C]/40 font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Otra Pregunta</span>
                </button>
              </div>

              {/* Lista de preguntas en borrador */}
              <div className="space-y-4">
                {draftQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-black text-[#48A9C5] tracking-widest flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#48A9C5]" />
                        Pregunta #{idx + 1}
                      </span>
                      {draftQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(q.id)}
                          className="text-[var(--text-muted)] hover:text-[#B7312C] transition p-1 cursor-pointer"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) =>
                        handleUpdateDraft(q.id, "questionText", e.target.value)
                      }
                      placeholder={`Escribe aquí la pregunta abierta #${idx + 1}...`}
                      className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] focus:border-[#FFC72C] rounded-xl p-3 text-base font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none transition leading-relaxed"
                    />

                    {/* Selector de gráfico para esta pregunta */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                        Visualización inicial para esta pregunta:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {CHART_TYPES.map((item) => {
                          const Icon = item.icon;
                          const isSelected = q.chartType === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                handleUpdateDraft(q.id, "chartType", item.id)
                              }
                              className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 cursor-pointer ${
                                isSelected
                                  ? "bg-[var(--surface-card)] border-[#FFC72C] text-[var(--text-main)] ring-1 ring-[#FFC72C] shadow-sm"
                                  : "bg-[var(--surface-card)]/50 border-[var(--border-subtle)] text-[var(--text-subtle)] hover:border-[#48A9C5]"
                              }`}
                            >
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isSelected ? "text-[#FFC72C]" : "text-[var(--text-muted)]"
                                }`}
                              />
                              <span className="font-bold text-xs truncate">
                                {item.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={
                isLaunching ||
                draftQuestions.every((q) => !q.questionText.trim())
              }
              onClick={handleLaunchPoll}
              className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-4 rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-[#001E32]" />
              <span>
                {isLaunching
                  ? "Lanzando Sondeo en Vivo..."
                  : `Lanzar Sondeo con ${draftQuestions.filter((q) => q.questionText.trim()).length} Pregunta(s)`}
              </span>
            </button>
          </div>
        </div>
      ) : (
        /* CASO 2: MONITOR EN VIVO Y VISUALIZADOR MULTI-PREGUNTA */
        <div className="space-y-6">
          {/* Barra Superior con Enlace para Enviar y PIN */}
          <div className="bg-[var(--surface-card)] border-2 border-[#FFC72C] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4C8C2B] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4C8C2B]" />
                </span>
                <span className="text-xs uppercase font-black text-[#4C8C2B] tracking-widest">
                  Sondeo Abierto en Vivo
                </span>
              </div>
              <h2 className="text-2xl font-black text-[var(--text-main)]">
                PIN:{" "}
                <span className="text-[#FFC72C] font-mono tracking-widest">
                  {activeSession.pin}
                </span>
              </h2>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Botón Copiar Link */}
              <button
                type="button"
                onClick={handleCopyLink}
                className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#001E32] dark:text-[#FFC72C] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-[#4C8C2B]" />
                    <span className="text-[#4C8C2B]">¡Enlace Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link para Enviar</span>
                  </>
                )}
              </button>

              {/* Botón QR */}
              <button
                type="button"
                onClick={handleOpenQR}
                className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[#FFC72C]" />
                <span>QR</span>
              </button>

              {/* Botón Abrir Pantalla Proyector 16:9 */}
              <Link
                to={`/present/${activeSession.pin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Tv className="w-4 h-4 fill-[#001E32]" />
                <span>Abrir Proyector (16:9)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              {/* Botón Forzar Reenvío a Móviles */}
              <button
                type="button"
                onClick={handlePushCurrentQuestion}
                title="Sincronizar y forzar la apertura de la pregunta actual en todos los teléfonos"
                className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#48A9C5] border border-[#48A9C5]/40 font-bold text-xs py-2.5 px-3.5 rounded-xl transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#48A9C5]" />
                <span>Reenviar a Móviles</span>
              </button>

              {/* Nuevo Sondeo / Reiniciar */}
              <button
                type="button"
                onClick={() => {
                  setActiveSession(null);
                  setSessionQuestions([]);
                  setCurrentQIndex(0);
                }}
                className="bg-[#B7312C]/10 hover:bg-[#B7312C]/20 text-[#B7312C] border border-[#B7312C]/30 font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nuevo Sondeo</span>
              </button>
            </div>
          </div>

          {/* Enlace y Metadatos de Conexión */}
          <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FFC72C] shrink-0">
                Link de Participación:
              </span>
              <span className="font-mono text-[var(--text-main)] truncate font-semibold">
                {window.location.origin}/join?pin={activeSession.pin}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] shrink-0">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#48A9C5]" />
                <span className="font-bold text-[var(--text-main)]">{activeParticipants.length}</span> conectados
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-[#FFC72C]" />
                <span className="font-bold text-[var(--text-main)]">{totalAnswers}</span> respuestas
              </span>
            </div>
          </div>

          {/* Carrusel de Pestañas de Preguntas para el Presentador */}
          {sessionQuestions.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {sessionQuestions.map((sq, idx) => {
                const isCur = idx === currentQIndex;
                return (
                  <button
                    key={sq.id}
                    type="button"
                    onClick={() => handleJumpToQuestion(idx)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 border cursor-pointer ${
                      isCur
                        ? "bg-[#FFC72C] text-[#001E32] border-[#FFC72C] shadow-sm font-black"
                        : "bg-[var(--surface-card)] text-[var(--text-subtle)] border-[var(--border-subtle)] hover:border-[#48A9C5]"
                    }`}
                  >
                    <span>Pregunta {idx + 1}</span>
                    <span className="max-w-[140px] truncate text-[11px] opacity-75">
                      {sq.question_text}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Panel Principal de la Pregunta Activa */}
          {sessionStatus === "finished" ? (
            <div className="bg-[var(--surface-card)] border-2 border-[#4C8C2B] rounded-3xl p-10 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#4C8C2B]/15 border-2 border-[#4C8C2B] text-[#4C8C2B] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-[var(--text-main)]">
                ¡Sondeo de Opinión Concluido!
              </h3>
              <p className="text-base text-[var(--text-subtle)] max-w-xl mx-auto">
                Todas las preguntas fueron presentadas y las respuestas del público han sido registradas exitosamente.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSession(null);
                    setSessionQuestions([]);
                    setCurrentQIndex(0);
                  }}
                  className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 px-6 rounded-xl transition shadow-sm cursor-pointer"
                >
                  Crear Nuevo Sondeo
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
              {/* Encabezado de la Pregunta Activa y Controles de Cambio de Gráfico */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                <div className="space-y-1">
                  <span className="inline-block text-[11px] uppercase font-black text-[#FFC72C] tracking-widest bg-[var(--surface-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
                    Pregunta {currentQIndex + 1} de {sessionQuestions.length}
                  </span>
                  <h3 className="text-2xl font-black text-[var(--text-main)] max-w-2xl leading-snug">
                    {currentActiveQuestion?.question_text || "Pregunta en vivo..."}
                  </h3>
                </div>

                {/* Toolbar: Alternar Gráfico en Vivo (Mentimeter) */}
                <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] p-1.5 rounded-2xl border border-[var(--border-subtle)] shrink-0 flex-wrap">
                  {CHART_TYPES.map((item) => {
                    const Icon = item.icon;
                    const isCur = activeChartType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSwitchChart(item.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isCur
                            ? "bg-[#FFC72C] text-[#001E32] shadow-sm font-extrabold"
                            : "text-[var(--text-subtle)] hover:text-[var(--text-main)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* RENDERIZADOR 1: Nube de Palabras */}
              {activeChartType === "word_cloud" && (
                <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-wrap items-center justify-center gap-4 content-center">
                  {Object.keys(liveResults).length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] space-y-2 py-10">
                      <Cloud className="w-16 h-16 mx-auto text-[#48A9C5] opacity-50 animate-pulse" />
                      <p className="text-base font-bold text-[var(--text-main)]">
                        Esperando que el público envíe sus respuestas...
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Comparte el PIN {activeSession.pin} para participar
                      </p>
                    </div>
                  ) : (
                    Object.entries(liveResults).map(([word, count], i) => {
                      const maxCount = Math.max(...Object.values(liveResults), 1);
                      const scale = Math.min(3.2, 1.2 + (count / maxCount) * 2.0);
                      const color = OPTION_COLORS[i % OPTION_COLORS.length];
                      return (
                        <span
                          key={word}
                          style={{ fontSize: `${scale}rem`, color }}
                          className="font-black px-4 py-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-sm transition hover:scale-110 cursor-default select-none animate-in fade-in"
                        >
                          {word}{" "}
                          <span className="text-xs opacity-75 font-bold">
                            ({count})
                          </span>
                        </span>
                      );
                    })
                  )}
                </div>
              )}

              {/* RENDERIZADOR 2: Barras */}
              {activeChartType === "bar" && (
                <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex items-end">
                  {Object.keys(liveResults).length === 0 ? (
                    <div className="w-full text-center text-[var(--text-muted)] py-10">
                      <BarChart3 className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2" />
                      <p className="text-base font-bold text-[var(--text-main)]">
                        Esperando respuestas para graficar...
                      </p>
                    </div>
                  ) : (
                    <div className="w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 items-end h-64">
                      {Object.entries(liveResults).map(([ans, count], idx) => {
                        const maxCount = Math.max(...Object.values(liveResults), 1);
                        const heightPct = Math.min(
                          100,
                          Math.round((count / maxCount) * 100),
                        );
                        const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                        return (
                          <div
                            key={ans}
                            className="flex flex-col items-center h-full justify-end space-y-2"
                          >
                            <span className="font-extrabold text-lg text-[var(--text-main)]">
                              {count}
                            </span>
                            <div className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-t-xl p-1 h-48 flex items-end">
                              <div
                                className="w-full rounded-t-lg transition-all duration-700 ease-out"
                                style={{
                                  height: `${Math.max(12, heightPct)}%`,
                                  backgroundColor: color,
                                }}
                              />
                            </div>
                            <span className="text-center text-xs font-bold text-[var(--text-main)] truncate max-w-[120px]">
                              {ans}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* RENDERIZADOR 3: Líneas */}
              {activeChartType === "line" && (
                <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-col justify-between">
                  {Object.keys(liveResults).length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] py-10 my-auto">
                      <TrendingUp className="w-16 h-16 mx-auto text-[#48A9C5] opacity-50 mb-2" />
                      <p className="text-base font-bold text-[var(--text-main)]">
                        Esperando respuestas para trazar la línea de tendencia...
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const entries = Object.entries(liveResults).map(([k, v]) => ({
                        label: k,
                        count: v,
                      }));
                      const maxVal = Math.max(...entries.map((e) => e.count), 1);

                      return (
                        <div className="w-full space-y-6">
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 items-end h-52">
                            {entries.map((e, idx) => {
                              const heightPct = Math.min(
                                100,
                                Math.round((e.count / maxVal) * 100),
                              );
                              const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                              return (
                                <div
                                  key={e.label}
                                  className="flex flex-col items-center h-full justify-end space-y-2"
                                >
                                  <span className="font-bold text-sm text-[var(--text-main)]">
                                    {e.count}
                                  </span>
                                  <div className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-t-xl p-1 h-40 flex items-end">
                                    <div
                                      className="w-full rounded-t-lg transition-all duration-700 ease-out"
                                      style={{
                                        height: `${Math.max(12, heightPct)}%`,
                                        backgroundColor: color,
                                      }}
                                    />
                                  </div>
                                  <span className="text-center text-xs font-bold text-[var(--text-main)] truncate max-w-[120px]">
                                    {e.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              )}

              {/* RENDERIZADOR 4: Muro de Ideas (Brainstorming Cards) */}
              {activeChartType === "cards" && (
                <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-6 rounded-2xl min-h-[340px]">
                  {rawAnswers.length === 0 &&
                  Object.keys(liveResults).length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] py-10">
                      <LayoutGrid className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2" />
                      <p className="text-base font-bold text-[var(--text-main)]">
                        Esperando que los participantes envíen ideas...
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {rawAnswers.length > 0
                        ? rawAnswers.map((ans) => (
                            <div
                              key={ans.id}
                              className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm space-y-2 flex flex-col justify-between"
                            >
                              <p className="text-base font-bold text-[var(--text-main)] leading-relaxed">
                                "{ans.answer_payload}"
                              </p>
                              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2">
                                <span className="font-semibold text-[#FFC72C]">
                                  {ans.nickname}
                                </span>
                                {ans.department && <span>{ans.department}</span>}
                              </div>
                            </div>
                          ))
                        : Object.entries(liveResults).map(([ans, count], i) => (
                            <div
                              key={ans}
                              className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm space-y-2 flex flex-col justify-between"
                            >
                              <p className="text-base font-bold text-[var(--text-main)] leading-relaxed">
                                "{ans}"
                              </p>
                              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2">
                                <span className="font-semibold text-[#FFC72C]">
                                  Respuesta #{i + 1}
                                </span>
                                <span>{count} votos</span>
                              </div>
                            </div>
                          ))}
                    </div>
                  )}
                </div>
              )}

              {/* RENDERIZADOR 5: Dona Circular (CSS Conic-Gradient - Regla 5 Compliant) */}
              {activeChartType === "donut" && (
                <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-col md:flex-row items-center justify-around gap-6">
                  {Object.keys(liveResults).length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] py-10">
                      <PieChart className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2" />
                      <p className="text-base font-bold text-[var(--text-main)]">
                        Esperando respuestas para calcular proporciones...
                      </p>
                    </div>
                  ) : (
                    (() => {
                      const entries = Object.entries(liveResults).map(
                        ([k, v]) => ({
                          id: k,
                          label: k,
                          count: v,
                        }),
                      );
                      const sum = entries.reduce((a, b) => a + b.count, 0) || 1;

                      let cumulative = 0;
                      const gradientSegments: string[] = [];
                      const legendItems = entries.map((e, idx) => {
                        const pct = (e.count / sum) * 100;
                        const start = cumulative;
                        const end = cumulative + pct;
                        cumulative = end;
                        const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                        gradientSegments.push(`${color} ${start}% ${end}%`);
                        return {
                          ...e,
                          pct: Math.round(pct),
                          color,
                        };
                      });

                      const conicBackground = `conic-gradient(${gradientSegments.join(", ")})`;

                      return (
                        <>
                          <div className="relative w-52 h-52 shrink-0 flex items-center justify-center">
                            <div
                              className="w-full h-full rounded-full shadow-lg transition-all duration-700"
                              style={{ background: conicBackground }}
                            />
                            <div className="absolute w-28 h-28 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col items-center justify-center shadow-inner">
                              <span className="text-3xl font-black text-[var(--text-main)]">
                                {totalAnswers}
                              </span>
                              <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
                                Respuestas
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 max-w-sm w-full">
                            {legendItems.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center justify-between bg-[var(--surface-card)] p-3 rounded-xl border border-[var(--border-subtle)]"
                              >
                                <div className="flex items-center space-x-2 truncate">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full shrink-0"
                                    style={{ backgroundColor: s.color }}
                                  />
                                  <span className="text-xs font-bold text-[var(--text-main)] truncate">
                                    {s.label}
                                  </span>
                                </div>
                                <span className="text-xs font-extrabold text-[#FFC72C] pl-2 shrink-0">
                                  {s.count} ({s.pct}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Barra de Navegación de Preguntas (⬅️ Anterior | Siguiente ➡️) */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
                {currentQIndex > 0 ? (
                  <button
                    type="button"
                    onClick={handlePrevQuestion}
                    className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-sm py-3 px-5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Pregunta Anterior</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-3">
                  {currentQIndex < sessionQuestions.length - 1 ? (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 px-6 rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <span>Siguiente Pregunta</span>
                      <ArrowRight className="w-4 h-4 fill-[#001E32]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishSession}
                      className="bg-[#4C8C2B] hover:bg-[#3D7122] text-white font-black text-sm py-3 px-6 rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Finalizar Sondeo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal QR Code */}
      <Modal
        isOpen={Boolean(qrModalUrl)}
        onClose={() => setQrModalUrl(null)}
        title="Código QR del Sondeo"
        maxWidth="sm"
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
          {qrModalUrl && (
            <img
              src={qrModalUrl}
              alt="QR del Sondeo"
              className="w-64 h-64 rounded-2xl border-4 border-[#FFC72C] shadow-lg"
            />
          )}
          <p className="text-xs text-[var(--text-subtle)]">
            Los participantes se conectan una sola vez y van respondiendo todo el set de preguntas en vivo.
          </p>
          <button
            type="button"
            onClick={() => setQrModalUrl(null)}
            className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
