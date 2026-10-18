import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Users,
  Clock,
  Maximize2,
  Minimize2,
  Play,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Trophy,
  BarChart3,
  TrendingUp,
  Cloud,
  LayoutGrid,
  PieChart,
  Star,
  XCircle,
  AlertCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import { getSocket } from "../services/socket";
import EpirocOptionIcon from "../components/EpirocOptionIcon";
import Modal from "../components/Modal";

interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
  isCorrect?: boolean;
}

interface QuestionData {
  id: number;
  question_text: string;
  question_type: string;
  chart_type?: string;
  time_limit: number;
  options_json: string;
  explanation_text?: string;
  correct_answer_value?: string;
}

interface ParticipantData {
  id: number;
  nickname: string;
  avatar_seed: string;
  score: number;
  current_streak: number;
}

interface RawAnswerItem {
  id: number;
  nickname: string;
  answer_payload: string;
  department: string | null;
}

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

export default function PresentationPage() {
  const { pin } = useParams<{ pin: string }>();

  const [session, setSession] = useState<{
    id: number;
    pin: string;
    status: string;
    current_question_index: number;
    session_mode?: string;
  } | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("lobby"); // 'lobby', 'question', 'results', 'leaderboard', 'podium'
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [totalAnswers, setTotalAnswers] = useState<number>(0);
  const [liveResults, setLiveResults] = useState<Record<string, number>>({});
  const [rawAnswers, setRawAnswers] = useState<RawAnswerItem[]>([]);
  const [overrideChartType, setOverrideChartType] = useState<string | null>(
    null,
  );
  const [leaderboard, setLeaderboard] = useState<ParticipantData[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [floatingReactions, setFloatingReactions] = useState<
    Array<{ id: number; emoji: string; left: number }>
  >([]);
  const navigate = useNavigate();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelPresentation = async () => {
    if (!pin) return;
    setIsCancelling(true);
    try {
      const socket = getSocket();
      socket.emit("presenter:action", { pin, action: "cancel_session" });
      await fetch(`/api/epivox/sessions/${pin}/cancel`, { method: "POST" });
    } catch (err) {
      console.error("Error al cancelar presentación:", err);
    } finally {
      setIsCancelling(false);
      setIsCancelModalOpen(false);
      navigate("/presentations");
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (
        pin &&
        session?.status !== "finished" &&
        session?.status !== "cancelled"
      ) {
        navigator.sendBeacon(`/api/epivox/sessions/${pin}/cancel`);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pin, session?.status]);

  useEffect(() => {
    if (!pin) return;

    // Generar código QR para unirse directo con el PIN
    const joinUrl = `${window.location.origin}/join?pin=${pin}`;
    QRCode.toDataURL(joinUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#001E32", light: "#FFC72C" },
    })
      .then(setQrCodeDataUrl)
      .catch(console.error);

    const socket = getSocket();
    const handlePresenterConnect = () => {
      socket.emit("presenter:join", { pin });
    };
    handlePresenterConnect();
    socket.on("connect", handlePresenterConnect);

    socket.on(
      "presenter:sync",
      (data: {
        session: {
          id: number;
          pin: string;
          status: string;
          current_question_index: number;
        };
        participants: ParticipantData[];
        questions: QuestionData[];
        liveResults?: Record<string, number>;
        rawAnswers?: RawAnswerItem[];
        totalAnswers?: number;
      }) => {
        setSession(data.session);
        setParticipants(data.participants);
        setQuestions(data.questions);
        setCurrentQIndex(data.session.current_question_index || 0);
        if (data.liveResults) setLiveResults(data.liveResults);
        if (data.rawAnswers) setRawAnswers(data.rawAnswers);
        if (data.totalAnswers !== undefined) setTotalAnswers(data.totalAnswers);
        if (
          data.session.status === "in_progress" ||
          data.session.status === "question_active"
        ) {
          setCurrentStep("question");
        }
      },
    );

    socket.on(
      "lobby:participants_update",
      (data: { participants: ParticipantData[] }) => {
        setParticipants(data.participants);
      },
    );

    socket.on(
      "session:state_changed",
      (data: {
        status: string;
        currentStep: string;
        currentQuestionIndex?: number;
        results?: Record<string, number>;
        rawAnswers?: RawAnswerItem[];
        totalAnswers?: number;
        leaderboard?: ParticipantData[];
        podium?: ParticipantData[];
        isOpenPoll?: boolean;
      }) => {
        if (data.currentQuestionIndex !== undefined) {
          setCurrentQIndex(data.currentQuestionIndex);
        }
        setCurrentStep(data.currentStep);

        if (data.results) {
          setLiveResults(data.results);
        }
        if (data.rawAnswers) {
          setRawAnswers(data.rawAnswers);
        }
        if (data.totalAnswers !== undefined) {
          setTotalAnswers(data.totalAnswers);
        }
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        if (data.currentStep === "podium" || data.status === "finished") {
          if (data.podium) setLeaderboard(data.podium);
          if (!data.isOpenPoll) {
            // Solo confeti para quiz con podio
            confetti({
              particleCount: 150,
              spread: 90,
              origin: { y: 0.6 },
              colors: ["#FFC72C", "#001E32", "#48A9C5", "#FFFFFF"],
            });
          }
        }
      },
    );

    socket.on("timer:tick", (data: { remaining: number }) => {
      setRemainingTime(data.remaining);
    });

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
        setOverrideChartType(data.chartType);
      },
    );

    socket.on("reaction:floating", (data: { emoji: string }) => {
      const id = Date.now() + Math.random();
      const left = Math.floor(Math.random() * 80) + 10;
      setFloatingReactions((prev) => [
        ...prev,
        { id, emoji: data.emoji, left },
      ]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
      }, 2500);
    });

    return () => {
      socket.off("connect", handlePresenterConnect);
      socket.off("presenter:sync");
      socket.off("lobby:participants_update");
      socket.off("session:state_changed");
      socket.off("timer:tick");
      socket.off("results:live_update");
      socket.off("chart_type:updated");
      socket.off("reaction:floating");
    };
  }, [pin]);

  const handleChartTypeChange = (newType: string) => {
    setOverrideChartType(newType);
    if (!pin || !questions[currentQIndex]) return;
    const socket = getSocket();
    socket.emit("presenter:set_chart_type", {
      pin,
      questionId: questions[currentQIndex].id,
      chartType: newType,
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(console.error);
    }
  };

  const handlePresenterAction = (action: string) => {
    if (!pin) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin,
      action,
      questionIndex: currentQIndex,
    });
  };

  const currentQ = questions[currentQIndex];
  let parsedOptions: QuestionOption[] = [];
  try {
    parsedOptions = currentQ ? JSON.parse(currentQ.options_json) : [];
  } catch {
    parsedOptions = [];
  }

  const isOpenQuestion =
    parsedOptions.length === 0 ||
    currentQ?.question_type === "word_cloud" ||
    currentQ?.question_type === "open_ended" ||
    currentQ?.question_type === "rating" ||
    session?.session_mode === "poll";

  const isOptionCorrect = (opt: QuestionOption): boolean => {
    if (opt.isCorrect !== undefined) return Boolean(opt.isCorrect);
    if (opt.is_correct !== undefined) return Boolean(opt.is_correct);
    if (currentQ?.correct_answer_value) {
      const target = currentQ.correct_answer_value
        .toString()
        .trim()
        .toLowerCase();
      const optId = (opt.id || "").toString().trim().toLowerCase();
      const optText = (opt.text || "").toString().trim().toLowerCase();
      if (optId === target || optText === target) return true;
      if (
        target === "true" &&
        (optId === "true" || optText.includes("verdadero"))
      )
        return true;
      if (
        target === "false" &&
        (optId === "false" || optText.includes("falso"))
      )
        return true;
    }
    return false;
  };

  const getOptionVotes = (
    opt: QuestionOption,
    results: Record<string, number>,
  ): number => {
    if (!results || Object.keys(results).length === 0) return 0;

    const optIdLower = (opt.id || "").toString().trim().toLowerCase();
    const optTextLower = (opt.text || "").toString().trim().toLowerCase();

    let total = 0;
    let matched = false;

    for (const [k, v] of Object.entries(results)) {
      const kLower = k.toString().trim().toLowerCase();

      // Coincidencia exacta o en minúsculas por ID
      if (kLower === optIdLower) {
        total += Number(v) || 0;
        matched = true;
        continue;
      }

      // Coincidencia por texto de la opción
      if (optTextLower && kLower === optTextLower) {
        total += Number(v) || 0;
        matched = true;
        continue;
      }

      // Mapeo especial Verdadero / Falso
      if (optIdLower === "true" || optTextLower.includes("verdadero")) {
        if (
          kLower === "true" ||
          kLower === "opt_t" ||
          kLower.includes("verdadero")
        ) {
          total += Number(v) || 0;
          matched = true;
          continue;
        }
      }
      if (optIdLower === "false" || optTextLower.includes("falso")) {
        if (
          kLower === "false" ||
          kLower === "opt_f" ||
          kLower.includes("falso")
        ) {
          total += Number(v) || 0;
          matched = true;
          continue;
        }
      }
    }

    if (matched) return total;
    return results[opt.id] !== undefined ? Number(results[opt.id]) : 0;
  };

  const renderRatingVisualization = () => {
    // Calcular conteos por estrella: 1 a 5
    const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let totalVotes = 0;
    let weightedSum = 0;

    Object.entries(liveResults).forEach(([key, count]) => {
      const num = parseInt(key, 10);
      if (num >= 1 && num <= 5) {
        starCounts[num] = (starCounts[num] || 0) + count;
        totalVotes += count;
        weightedSum += num * count;
      }
    });

    const averageRating = totalVotes > 0 ? weightedSum / totalVotes : 0;

    return (
      <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl shadow-2xl space-y-6 w-full max-w-4xl mx-auto animate-in fade-in">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#425563]/60 pb-6">
          <div className="text-center md:text-left space-y-1">
            <span className="text-xs font-black uppercase tracking-wider text-[#FFC72C]">
              Calificación Promedio del Público
            </span>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <span className="text-5xl font-black text-white font-mono">
                {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(averageRating) && averageRating > 0
                          ? "text-[#FFC72C] fill-[#FFC72C] drop-shadow-[0_0_8px_rgba(255,199,44,0.6)]"
                          : "text-[#425563]"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#ECEBE4]/70 font-semibold block">
                  de 5.0 estrellas posibles
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#001E32] border border-[#425563] px-6 py-3 rounded-2xl text-center">
            <span className="text-2xl font-black text-[#48A9C5] block font-mono">
              {totalVotes}
            </span>
            <span className="text-[11px] text-[#ECEBE4]/70 uppercase font-bold tracking-wider">
              {totalVotes === 1 ? "Calificación" : "Calificaciones"}
            </span>
          </div>
        </div>

        {/* Barras de distribución por estrellas (5 a 1) */}
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((starVal) => {
            const count = starCounts[starVal] || 0;
            const pct =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            return (
              <div
                key={starVal}
                className="flex items-center gap-4 text-xs font-bold"
              >
                <div className="w-24 flex items-center justify-end gap-1.5 shrink-0 text-[#ECEBE4]">
                  <span>{starVal}</span>
                  <Star className="w-4 h-4 text-[#FFC72C] fill-[#FFC72C]" />
                </div>

                <div className="flex-1 bg-[#001E32] h-7 rounded-xl overflow-hidden border border-[#425563]/60 relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#FFC72C] to-[#E6B327] rounded-xl transition-all duration-700 shadow"
                    style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                  />
                  {count > 0 && (
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-extrabold text-[#001E32]">
                      {count} {count === 1 ? "voto" : "votos"}
                    </span>
                  )}
                </div>

                <div className="w-16 text-right font-mono font-extrabold text-[#ECEBE4]/80 shrink-0">
                  {pct}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderActiveVisualization = () => {
    const effectiveType =
      overrideChartType ||
      currentQ?.chart_type ||
      (currentQ?.question_type === "word_cloud" ? "word_cloud" : "bar");

    return (
      <div className="space-y-4 w-full animate-in fade-in">
        {/* Selector de gráfico en vivo estilo Mentimeter */}
        <div className="flex items-center justify-between bg-[#193750] border border-[#425563] px-5 py-2.5 rounded-2xl">
          <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider">
            Visualización en Vivo
          </span>
          <div className="flex items-center gap-1.5 bg-[#001E32] p-1 rounded-xl border border-[#425563] flex-wrap">
            {[
              { type: "word_cloud", label: "Nube", icon: Cloud },
              { type: "bar", label: "Barras", icon: BarChart3 },
              { type: "line", label: "Líneas", icon: TrendingUp },
              { type: "cards", label: "Muro", icon: LayoutGrid },
              { type: "donut", label: "Dona", icon: PieChart },
            ].map((item) => {
              const Icon = item.icon;
              const active = effectiveType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => handleChartTypeChange(item.type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    active
                      ? "bg-[#FFC72C] text-[#001E32] shadow font-black scale-105"
                      : "text-[#ECEBE4]/70 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gráfico 1: Nube de Palabras */}
        {effectiveType === "word_cloud" && (
          <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[340px] flex flex-wrap items-center justify-center gap-3.5 content-center">
            {Object.keys(liveResults).length === 0 ? (
              <div className="text-center text-[#ECEBE4]/60 space-y-2 py-8">
                <Cloud className="w-16 h-16 mx-auto text-[#48A9C5] opacity-50 animate-pulse" />
                <p className="text-lg font-black text-white">
                  Esperando que el público envíe sus respuestas...
                </p>
                <p className="text-xs text-[#ECEBE4]/60">
                  Las palabras aparecerán y crecerán dinámicamente aquí en
                  tiempo real.
                </p>
              </div>
            ) : (
              Object.entries(liveResults).map(([word, count], i) => {
                const maxC = Math.max(...Object.values(liveResults), 1);
                const scale = Math.min(3.2, 1.2 + (count / maxC) * 2.0);
                const color = OPTION_COLORS[i % OPTION_COLORS.length];
                return (
                  <span
                    key={word}
                    style={{ fontSize: `${scale}rem`, color }}
                    className="font-black px-4 py-1.5 bg-[#001E32]/80 border border-[#425563]/80 rounded-2xl shadow-xl transition-all hover:scale-110 cursor-default select-none animate-in fade-in"
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

        {/* Gráfico 2: Muro de Ideas / Tarjetas */}
        {effectiveType === "cards" && (
          <div className="bg-[#193750] border-2 border-[#425563] p-6 rounded-3xl max-h-[400px] overflow-y-auto space-y-4">
            {rawAnswers.length === 0 &&
            Object.keys(liveResults).length === 0 ? (
              <div className="text-center text-[#ECEBE4]/60 py-10">
                <LayoutGrid className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2 animate-pulse" />
                <p className="text-lg font-bold text-white">
                  Esperando respuestas del público...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rawAnswers.length > 0
                  ? rawAnswers.map((ans) => (
                      <div
                        key={ans.id}
                        className="bg-[#001E32] border border-[#425563] p-4 rounded-2xl shadow space-y-2 flex flex-col justify-between"
                      >
                        <p className="text-base font-bold text-white leading-relaxed">
                          "{ans.answer_payload}"
                        </p>
                        <div className="flex items-center justify-between text-xs text-[#ECEBE4]/60 border-t border-[#425563]/40 pt-2">
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
                        className="bg-[#001E32] border border-[#425563] p-4 rounded-2xl shadow space-y-2 flex flex-col justify-between"
                      >
                        <p className="text-base font-bold text-white leading-relaxed">
                          "{ans}"
                        </p>
                        <div className="flex items-center justify-between text-xs text-[#ECEBE4]/60 border-t border-[#425563]/40 pt-2">
                          <span className="font-semibold text-[#FFC72C]">
                            Aporte #{i + 1}
                          </span>
                          <span>{count} menciones</span>
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>
        )}

        {/* Gráfico 3: Líneas */}
        {effectiveType === "line" && (
          <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex flex-col justify-between space-y-4">
            {Object.keys(liveResults).length === 0 ? (
              <div className="text-center text-[#ECEBE4]/60 py-10">
                <TrendingUp className="w-16 h-16 mx-auto text-[#48A9C5] opacity-50 mb-2 animate-pulse" />
                <p className="text-lg font-bold text-white">
                  Esperando respuestas para trazar la tendencia...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end gap-3 h-52 border-b-2 border-l-2 border-[#425563] p-4">
                  {Object.entries(liveResults).map(([label, count], idx) => {
                    const maxCount = Math.max(...Object.values(liveResults), 1);
                    const pct = Math.min(
                      100,
                      Math.round((count / maxCount) * 100),
                    );
                    const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                    return (
                      <div
                        key={label}
                        className="flex-1 flex flex-col items-center justify-end h-full"
                      >
                        <span className="text-xs font-bold text-[#FFC72C] mb-1">
                          {count}
                        </span>
                        <div
                          style={{
                            height: `${Math.max(12, pct)}%`,
                            backgroundColor: color,
                          }}
                          className="w-full rounded-t-lg transition-all duration-500"
                        />
                        <span className="text-[10px] text-[#ECEBE4]/80 truncate max-w-[80px] mt-2 font-bold">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gráfico 4: Dona (Pure CSS con conic-gradient, sin SVG tags) */}
        {effectiveType === "donut" && (
          <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex flex-col sm:flex-row items-center justify-around gap-6">
            {(() => {
              const entries = Object.entries(liveResults).map(([k, v]) => ({
                label: k,
                count: v,
              }));
              const sum = entries.reduce((a, b) => a + b.count, 0) || 1;
              if (entries.length === 0) {
                return (
                  <div className="text-center text-[#ECEBE4]/60 py-10 w-full">
                    <PieChart className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2 animate-pulse" />
                    <p className="text-lg font-bold text-white">
                      Esperando respuestas para calcular porcentajes...
                    </p>
                  </div>
                );
              }
              let acc = 0;
              const segments = entries.map((e, idx) => {
                const pct = (e.count / sum) * 100;
                const start = acc;
                acc += pct;
                return {
                  ...e,
                  pct: Math.round(pct),
                  color: OPTION_COLORS[idx % OPTION_COLORS.length],
                  start,
                  end: acc,
                };
              });
              const gradientStr = segments
                .map((s) => `${s.color} ${s.start}% ${s.end}%`)
                .join(", ");
              return (
                <>
                  <div
                    style={{ background: `conic-gradient(${gradientStr})` }}
                    className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-2xl shrink-0"
                  >
                    <div className="w-28 h-28 bg-[#193750] rounded-full flex flex-col items-center justify-center shadow-inner">
                      <span className="text-2xl font-black text-white">
                        {totalAnswers}
                      </span>
                      <span className="text-[10px] text-[#ECEBE4]/60 uppercase tracking-widest font-bold">
                        Votos
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 max-w-sm w-full">
                    {segments.map((s) => (
                      <div
                        key={s.label}
                        className="flex items-center justify-between bg-[#001E32] p-2.5 rounded-xl border border-[#425563]"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className="text-xs font-bold text-white truncate">
                            {s.label}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#FFC72C] shrink-0">
                          {s.pct}% ({s.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Gráfico 5: Barras en Vivo */}
        {effectiveType === "bar" && (
          <div className="bg-[#193750] border-2 border-[#425563] p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
            {(() => {
              const optionsList: QuestionOption[] =
                parsedOptions.length > 0
                  ? parsedOptions
                  : Object.keys(liveResults).map((k) => ({
                      id: k,
                      text: k,
                    }));

              const totalVotes = Object.values(liveResults).reduce(
                (a, b) => a + b,
                0,
              );
              const maxVotes = Math.max(
                ...optionsList.map((o) => getOptionVotes(o, liveResults)),
                1,
              );

              if (optionsList.length === 0) {
                return (
                  <div className="text-center text-[#ECEBE4]/60 py-10">
                    <BarChart3 className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2 animate-pulse" />
                    <p className="text-lg font-bold text-white">
                      Esperando respuestas del público para graficar...
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-[#ECEBE4]/80 px-2 border-b border-[#425563]/50 pb-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-[#FFC72C]" />
                      <span className="font-extrabold uppercase tracking-wider text-white">
                        Votación en Vivo
                      </span>
                    </div>
                    <span className="bg-[#001E32] px-3 py-1 rounded-full border border-[#425563] font-bold text-[#FFC72C]">
                      {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
                    </span>
                  </div>

                  <div className="flex items-end justify-around gap-3 sm:gap-6 h-64 sm:h-72 pt-6 pb-2 border-b-2 border-[#425563]">
                    {optionsList.map((opt, idx) => {
                      const count = getOptionVotes(opt, liveResults);
                      const pct =
                        totalVotes > 0
                          ? Math.round((count / totalVotes) * 100)
                          : 0;
                      const barHeightPct =
                        totalVotes > 0 && maxVotes > 0
                          ? Math.round((count / maxVotes) * 100)
                          : 0;
                      const barColor =
                        OPTION_COLORS[idx % OPTION_COLORS.length];

                      return (
                        <div
                          key={opt.id}
                          className="flex-1 flex flex-col items-center justify-end h-full max-w-[130px] sm:max-w-[160px] min-w-0"
                        >
                          <div className="flex flex-col items-center justify-center mb-2 transition-all duration-500">
                            <span
                              className={`text-2xl sm:text-3xl font-black leading-none ${
                                count > 0
                                  ? "text-white"
                                  : "text-[#ECEBE4]/40 text-lg sm:text-xl"
                              }`}
                            >
                              {count}
                            </span>
                            {totalVotes > 0 && (
                              <span
                                className={`text-[11px] sm:text-xs font-black mt-1 px-2 py-0.5 rounded-full ${
                                  count > 0
                                    ? "bg-[#001E32] text-[#FFC72C] border border-[#425563]"
                                    : "text-[#ECEBE4]/30"
                                }`}
                              >
                                {pct}%
                              </span>
                            )}
                          </div>

                          <div className="w-full flex items-end justify-center h-40 sm:h-48">
                            <div
                              className={`w-full max-w-[70px] sm:max-w-[85px] rounded-t-2xl transition-all duration-700 ease-out relative flex items-start justify-center ${
                                count > 0 ? "shadow-lg" : ""
                              }`}
                              style={{
                                height:
                                  count > 0
                                    ? `${Math.max(12, Math.min(100, barHeightPct))}%`
                                    : "6px",
                                backgroundColor:
                                  count > 0 ? barColor : "#001E32",
                                border:
                                  count === 0 ? "1px solid #425563" : undefined,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-start justify-around gap-3 sm:gap-6 pt-1">
                    {optionsList.map((opt, idx) => {
                      const barColor =
                        OPTION_COLORS[idx % OPTION_COLORS.length];
                      return (
                        <div
                          key={opt.id}
                          className="flex-1 flex flex-col items-center text-center max-w-[130px] sm:max-w-[160px] min-w-0 space-y-1.5"
                        >
                          <span
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow shrink-0"
                            style={{
                              backgroundColor: barColor,
                              color: idx === 0 ? "#001E32" : "#FFFFFF",
                            }}
                          >
                            {opt.id && opt.id.length <= 2 ? opt.id : idx + 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-white line-clamp-3 leading-snug break-words">
                            {opt.text}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-8 relative overflow-hidden select-none">
      {/* Reacciones Flotantes animadas */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {floatingReactions.map((reac) => (
          <span
            key={reac.id}
            className="absolute bottom-10 text-4xl animate-bounce"
            style={{ left: `${reac.left}%` }}
          >
            {reac.emoji}
          </span>
        ))}
      </div>

      {/* Barra Superior Corporativa */}
      <header className="flex items-center justify-between py-3 border-b border-[#425563]/60">
        <div className="flex items-center space-x-4">
          <div className="p-2.5 bg-[#FFC72C] text-[#001E32] rounded-xl shadow-lg">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider text-white">
              EPIVOX
            </h1>
            <p className="text-xs text-[#ECEBE4] opacity-80">
              Epiroc Presentación en Vivo
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="bg-[#193750] border border-[#FFC72C] px-5 py-2 rounded-xl text-center shadow">
            <span className="block text-[10px] uppercase font-bold text-[#ECEBE4]">
              PIN de Acceso
            </span>
            <span className="font-mono text-3xl font-black text-[#FFC72C] tracking-widest">
              {pin}
            </span>
          </div>

          <div className="flex items-center space-x-2 bg-[#193750] px-4 py-2 rounded-xl border border-[#425563]">
            <Users className="w-5 h-5 text-[#48A9C5]" />
            <span className="font-bold text-lg">{participants.length}</span>
            <span className="text-xs text-[#ECEBE4] hidden sm:inline">
              conectados
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-3 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-white rounded-xl transition"
            title="Pantalla Completa"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>

          {/* Botón Cancelar / Terminar Sesión */}
          <button
            type="button"
            onClick={() => setIsCancelModalOpen(true)}
            className="px-3.5 py-2.5 bg-[#B7312C]/20 hover:bg-[#B7312C]/40 border border-[#B7312C]/60 text-white rounded-xl transition flex items-center gap-2 cursor-pointer shadow active:scale-95"
            title="Cancelar o Cerrar Presentación"
          >
            <XCircle className="w-5 h-5 text-[#B7312C]" />
            <span className="text-xs font-bold text-white hidden sm:inline">
              Cancelar Sesión
            </span>
          </button>
        </div>
      </header>

      {/* 1. LOBBY VIEW (SALA DE ESPERA) */}
      {currentStep === "lobby" && (
        <main className="my-auto max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
          {/* Instrucciones y QR */}
          <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-8 text-center space-y-4 shadow-2xl">
            <h2 className="text-3xl font-extrabold text-white">
              Únete desde tu móvil
            </h2>
            <p className="text-[#ECEBE4] text-base">
              Escanea el código QR o entra a{" "}
              <span className="text-[#FFC72C] font-bold">/join</span> e ingresa
              el PIN{" "}
              <span className="font-mono font-bold text-[#FFC72C]">{pin}</span>
            </p>
            {qrCodeDataUrl ? (
              <div className="inline-block p-3 bg-white rounded-2xl shadow-xl">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR PIN ${pin}`}
                  className="w-48 h-48 mx-auto"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-[#001E32] rounded-2xl mx-auto flex items-center justify-center text-[#ECEBE4]">
                Generando QR...
              </div>
            )}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handlePresenterAction("start_game")}
                className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xl py-4 rounded-xl shadow-xl transition active:scale-95 flex items-center justify-center space-x-2"
              >
                <Play className="w-6 h-6 fill-[#001E32]" />
                <span>Iniciar Cuestionario</span>
              </button>
            </div>
          </div>

          {/* Participantes Conectados en Tiempo Real */}
          <div className="bg-[#193750]/60 border border-[#425563] rounded-3xl p-6 h-[440px] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#425563]">
              <span className="font-bold text-lg text-white">
                Participantes en Sala
              </span>
              <span className="text-xs bg-[#FFC72C] text-[#001E32] font-extrabold px-3 py-1 rounded-full">
                {participants.length} listos
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pt-4 flex flex-wrap gap-2 content-start">
              {participants.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#ECEBE4] opacity-50 space-y-2">
                  <Users className="w-12 h-12" />
                  <p className="text-sm">
                    Esperando que se unan los participantes...
                  </p>
                </div>
              ) : (
                participants.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center space-x-2 bg-[#001E32] border border-[#425563] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow animate-pulse-subtle"
                  >
                    <span>{p.nickname}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {/* 2. QUESTION VIEW (PREGUNTA ACTIVA) */}
      {currentStep === "question" && currentQ && (
        <main className="my-auto max-w-5xl w-full mx-auto space-y-8 py-4">
          <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl text-center shadow-2xl relative space-y-4">
            <span className="inline-block text-xs uppercase tracking-widest bg-[#FFC72C] text-[#001E32] font-black px-4 py-1 rounded-full">
              Pregunta {currentQIndex + 1} de {questions.length}
            </span>
            <h2 className="text-4xl font-extrabold text-white leading-tight">
              {currentQ.question_text}
            </h2>

            <div className="flex items-center justify-center space-x-8 pt-2">
              <div className="flex items-center space-x-2 bg-[#001E32] border border-[#425563] px-4 py-2 rounded-xl">
                <Clock className="w-6 h-6 text-[#FFC72C]" />
                <span className="font-mono text-2xl font-black text-[#FFC72C]">
                  {remainingTime}s
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-[#001E32] border border-[#425563] px-4 py-2 rounded-xl">
                <BarChart3 className="w-6 h-6 text-[#48A9C5]" />
                <span className="text-xl font-bold">
                  {totalAnswers} / {participants.length} respuestas
                </span>
              </div>
            </div>

            {/* Aviso cuando todos han respondido */}
            {participants.length > 0 && totalAnswers >= participants.length && (
              <div className="inline-flex items-center gap-2.5 bg-[#4C8C2B]/20 border-2 border-[#4C8C2B] text-white px-5 py-2.5 rounded-2xl shadow-xl animate-bounce">
                <CheckCircle2 className="w-5 h-5 text-[#86C8BC]" />
                <span className="text-base font-extrabold text-[#86C8BC]">
                  ¡Todos los participantes han respondido! ({totalAnswers}/
                  {participants.length})
                </span>
                <span className="text-xs text-[#ECEBE4]/80 hidden sm:inline">
                  &bull; Puedes continuar con el tiempo o cerrar la pregunta
                  ahora.
                </span>
              </div>
            )}
          </div>

          {/* Opciones en la pantalla grande - Soporte dinámico para 2 a 6 opciones o Rating */}
          {currentQ.question_type === "rating" ? (
            renderRatingVisualization()
          ) : parsedOptions.length > 0 ? (
            <div
              className={`grid gap-3 w-full ${
                parsedOptions.length >= 5
                  ? "grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-2"
              } max-h-[52vh] overflow-y-auto pr-2`}
            >
              {parsedOptions.map((opt, idx) => (
                <div
                  key={opt.id}
                  className="bg-[#193750] border-2 border-[#425563] p-4 lg:p-5 rounded-2xl flex items-center space-x-3.5 shadow-xl transition"
                >
                  <div className="shrink-0">
                    <EpirocOptionIcon index={idx} size="lg" />
                  </div>
                  <span className="text-lg lg:text-xl font-bold text-white flex-1 leading-snug">
                    {opt.text}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            /* PREGUNTA ABIERTA EN VIVO: GRÁFICO EN TIEMPO REAL DIRECTO EN PANTALLA */
            renderActiveVisualization()
          )}

          {/* Controles de avance para el presentador */}
          <div className="flex items-center justify-between pt-4">
            {currentQIndex > 0 ? (
              <button
                type="button"
                onClick={() => handlePresenterAction("prev_question")}
                className="bg-[#193750] hover:bg-[#254F72] text-white border border-[#425563] font-bold text-base py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Pregunta Anterior</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {isOpenQuestion ? (
                currentQIndex + 1 < questions.length ? (
                  <button
                    type="button"
                    onClick={() => handlePresenterAction("next_question")}
                    className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95"
                  >
                    <span>
                      Siguiente Pregunta ({currentQIndex + 2}/{questions.length}
                      )
                    </span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handlePresenterAction("finish_session")}
                    className="bg-[#4C8C2B] hover:bg-[#3D7022] text-white font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95"
                  >
                    <span>Finalizar Sondeo</span>
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => handlePresenterAction("show_results")}
                  className={`bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95 ${
                    participants.length > 0 &&
                    totalAnswers >= participants.length
                      ? "ring-4 ring-[#86C8BC] ring-offset-2 ring-offset-[#001E32] animate-pulse"
                      : ""
                  }`}
                >
                  <span>Cerrar Votación y Ver Resultados</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </main>
      )}

      {/* 3. RESULTS VIEW (GRÁFICOS EN VIVO ESTILO MENTIMETER O CALIFICACIÓN) */}
      {currentStep === "results" && currentQ && (
        <main className="my-auto max-w-5xl w-full mx-auto space-y-6 py-4">
          <div className="bg-[#193750] border-2 border-[#425563] p-6 rounded-3xl text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#FFC72C] font-bold">
              {currentQ.question_type === "rating"
                ? "Calificación de la Audiencia • Resumen Final"
                : "Distribución de Respuestas • Modo Audiencia"}
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              {currentQ.question_text}
            </h2>

            {/* Barra de Alternar Gráficos en Vivo (Mentimeter Style - solo para sondeos no rating) */}
            {currentQ.question_type !== "rating" && (
              <div className="flex items-center justify-center gap-2 pt-3 flex-wrap">
                {[
                  { type: "bar", label: "Barras", icon: BarChart3 },
                  { type: "line", label: "Líneas", icon: TrendingUp },
                  {
                    type: "word_cloud",
                    label: "Nube de Palabras",
                    icon: Cloud,
                  },
                  { type: "cards", label: "Muro de Ideas", icon: LayoutGrid },
                  { type: "donut", label: "Dona", icon: PieChart },
                ].map((item) => {
                  const Icon = item.icon;
                  const active =
                    (overrideChartType ||
                      currentQ.chart_type ||
                      (currentQ.question_type === "word_cloud"
                        ? "word_cloud"
                        : "bar")) === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleChartTypeChange(item.type)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition ${
                        active
                          ? "bg-[#FFC72C] text-[#001E32] shadow-lg scale-105"
                          : "bg-[#001E32] text-[#ECEBE4]/70 hover:text-white border border-[#425563]"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gráfico Especial: Calificación con Estrellas */}
          {currentQ.question_type === "rating" && renderRatingVisualization()}

          {/* Gráfico 1: Nube de Palabras (Word Cloud) */}
          {(overrideChartType ||
            currentQ.chart_type ||
            (currentQ.question_type === "word_cloud"
              ? "word_cloud"
              : "bar")) === "word_cloud" && (
            <div className="bg-[#193750] border border-[#425563] p-8 rounded-3xl min-h-[300px] flex flex-wrap items-center justify-center gap-3.5 content-center">
              {Object.keys(liveResults).length === 0 ? (
                <div className="text-center text-[#ECEBE4]/60 space-y-2">
                  <Cloud className="w-12 h-12 mx-auto text-[#48A9C5] opacity-50" />
                  <p className="text-sm font-semibold">
                    No se han recibido palabras aún.
                  </p>
                </div>
              ) : (
                Object.entries(liveResults).map(([word, count], i) => {
                  const maxC = Math.max(...Object.values(liveResults), 1);
                  const scale = Math.min(2.8, 1 + (count / maxC) * 1.8);
                  const color = OPTION_COLORS[i % OPTION_COLORS.length];
                  return (
                    <span
                      key={word}
                      style={{
                        fontSize: `${scale}rem`,
                        color,
                      }}
                      className="font-black px-4 py-1.5 bg-[#001E32]/80 border border-[#425563]/80 rounded-2xl shadow-xl transition-all hover:scale-110 cursor-default select-none animate-in fade-in"
                    >
                      {word}{" "}
                      <span className="text-xs opacity-70 font-bold">
                        ({count})
                      </span>
                    </span>
                  );
                })
              )}
            </div>
          )}

          {/* Gráfico 2: Muro de Tarjetas / Feed de Ideas (Mentimeter Thoughts) */}
          {(overrideChartType || currentQ.chart_type) === "cards" && (
            <div className="bg-[#193750] border border-[#425563] p-6 rounded-3xl max-h-[380px] overflow-y-auto space-y-4">
              {rawAnswers.length === 0 &&
              Object.keys(liveResults).length === 0 ? (
                <div className="text-center text-[#ECEBE4]/60 py-10">
                  <LayoutGrid className="w-12 h-12 mx-auto text-[#FFC72C] opacity-50 mb-2" />
                  <p className="text-sm">Esperando respuestas del público...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {rawAnswers.length > 0
                    ? rawAnswers.map((ans) => (
                        <div
                          key={ans.id}
                          className="bg-[#001E32] border border-[#425563] p-4 rounded-2xl shadow space-y-2 flex flex-col justify-between"
                        >
                          <p className="text-base font-bold text-white leading-relaxed">
                            "{ans.answer_payload}"
                          </p>
                          <div className="flex items-center justify-between text-xs text-[#ECEBE4]/60 border-t border-[#425563]/40 pt-2">
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
                          className="bg-[#001E32] border border-[#425563] p-4 rounded-2xl shadow space-y-2 flex flex-col justify-between"
                        >
                          <p className="text-base font-bold text-white leading-relaxed">
                            "{ans}"
                          </p>
                          <div className="flex items-center justify-between text-xs text-[#ECEBE4]/60 border-t border-[#425563]/40 pt-2">
                            <span className="font-semibold text-[#FFC72C]">
                              Respuesta #{i + 1}
                            </span>
                            <span>{count} menciones</span>
                          </div>
                        </div>
                      ))}
                </div>
              )}
            </div>
          )}

          {/* Gráfico 3: Líneas (Line Chart continuo) */}
          {(overrideChartType || currentQ.chart_type) === "line" && (
            <div className="bg-[#193750] border border-[#425563] p-8 rounded-3xl min-h-[300px] flex flex-col justify-between space-y-4">
              {(() => {
                const entries =
                  parsedOptions.length > 0
                    ? parsedOptions.map((o) => ({
                        label: o.text,
                        count: getOptionVotes(o, liveResults),
                      }))
                    : Object.entries(liveResults).map(([k, v]) => ({
                        label: k,
                        count: v,
                      }));
                const maxVal = Math.max(...entries.map((e) => e.count), 1);
                const width = 600;
                const height = 180;
                const points = entries.map((e, idx) => {
                  const x = (idx / Math.max(entries.length - 1, 1)) * width;
                  const y = height - (e.count / maxVal) * (height - 30) - 15;
                  return `${x},${y}`;
                });
                const polylineStr = points.join(" ");

                return (
                  <div className="w-full space-y-4">
                    <svg
                      viewBox={`-20 -20 ${width + 40} ${height + 40}`}
                      className="w-full h-44 overflow-visible"
                    >
                      {/* Línea de cuadrícula base */}
                      <line
                        x1="0"
                        y1={height}
                        x2={width}
                        y2={height}
                        stroke="#425563"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      {/* Polilínea trazada */}
                      {entries.length > 1 && (
                        <polyline
                          fill="none"
                          stroke="#FFC72C"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={polylineStr}
                        />
                      )}
                      {/* Puntos circulares en cada coordenada */}
                      {entries.map((e, idx) => {
                        const x =
                          (idx / Math.max(entries.length - 1, 1)) * width;
                        const y =
                          height - (e.count / maxVal) * (height - 30) - 15;
                        return (
                          <g key={e.label}>
                            <circle
                              cx={x}
                              cy={y}
                              r="7"
                              fill="#001E32"
                              stroke="#FFC72C"
                              strokeWidth="4"
                            />
                            <text
                              x={x}
                              y={y - 12}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              fontSize="13"
                              fontWeight="bold"
                            >
                              {e.count}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                    <div className="flex justify-between text-xs font-bold text-[#ECEBE4]/80 px-2">
                      {entries.map((e) => (
                        <span
                          key={e.label}
                          className="truncate max-w-[120px] text-center"
                        >
                          {e.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Gráfico 4: Dona / Circular (Donut Chart) */}
          {(overrideChartType || currentQ.chart_type) === "donut" && (
            <div className="bg-[#193750] border border-[#425563] p-8 rounded-3xl min-h-[300px] flex flex-col md:flex-row items-center justify-around gap-6">
              {(() => {
                const entries =
                  parsedOptions.length > 0
                    ? parsedOptions.map((o) => ({
                        id: o.id,
                        label: o.text,
                        count: getOptionVotes(o, liveResults),
                      }))
                    : Object.entries(liveResults).map(([k, v]) => ({
                        id: k,
                        label: k,
                        count: v,
                      }));
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
                    <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
                      <div
                        className="w-full h-full rounded-full shadow-2xl transition-all duration-700"
                        style={{ background: conicBackground }}
                      />
                      <div className="absolute w-24 h-24 rounded-full bg-[#001E32] flex flex-col items-center justify-center shadow-inner">
                        <span className="text-2xl font-black text-white">
                          {totalAnswers}
                        </span>
                        <span className="block text-[10px] text-[#ECEBE4]/60 uppercase tracking-widest font-bold">
                          Votos
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 max-w-sm w-full">
                      {legendItems.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between bg-[#001E32] p-2.5 rounded-xl border border-[#425563]"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0"
                              style={{ backgroundColor: s.color }}
                            />
                            <span className="text-xs font-bold text-white truncate">
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
              })()}
            </div>
          )}

          {/* Gráfico 5: Barras Tradicional (Por defecto y para opciones múltiples) */}
          {(!overrideChartType || overrideChartType === "bar") &&
            (currentQ.chart_type === "bar" ||
              !["line", "word_cloud", "cards", "donut"].includes(
                currentQ.chart_type || "",
              )) && (
              <div className="bg-[#193750] border-2 border-[#425563] p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
                {(() => {
                  const optionsList: QuestionOption[] =
                    parsedOptions.length > 0
                      ? parsedOptions
                      : Object.keys(liveResults).map((k) => ({
                          id: k,
                          text: k,
                          isCorrect: false,
                        }));

                  const totalVotes = Object.values(liveResults).reduce(
                    (a, b) => a + b,
                    0,
                  );
                  const maxVotes = Math.max(
                    ...optionsList.map((o) => getOptionVotes(o, liveResults)),
                    1,
                  );

                  return (
                    <div className="space-y-4">
                      {/* Cabecera del Gráfico con Resumen */}
                      <div className="flex items-center justify-between text-xs text-[#ECEBE4]/80 px-2 border-b border-[#425563]/50 pb-3">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#FFC72C]" />
                          <span className="font-extrabold uppercase tracking-wider text-white">
                            Distribución de Votos
                          </span>
                        </div>
                        <span className="bg-[#001E32] px-3 py-1 rounded-full border border-[#425563] font-bold text-[#FFC72C]">
                          {totalVotes}{" "}
                          {totalVotes === 1
                            ? "voto registrado"
                            : "votos registrados"}
                        </span>
                      </div>

                      {/* Área Principal del Gráfico de Barras con Eje X */}
                      <div className="flex items-end justify-around gap-3 sm:gap-6 h-72 sm:h-80 pt-6 pb-2 border-b-2 border-[#425563]">
                        {optionsList.map((opt, idx) => {
                          const count = getOptionVotes(opt, liveResults);
                          const pct =
                            totalVotes > 0
                              ? Math.round((count / totalVotes) * 100)
                              : 0;
                          const isCorrect = isOptionCorrect(opt);

                          // Altura relativa proporcional al máximo de votos
                          const barHeightPct =
                            totalVotes > 0 && maxVotes > 0
                              ? Math.round((count / maxVotes) * 100)
                              : 0;

                          const barColor = isCorrect
                            ? "#4C8C2B"
                            : OPTION_COLORS[idx % OPTION_COLORS.length];

                          return (
                            <div
                              key={opt.id}
                              className="flex-1 flex flex-col items-center justify-end h-full max-w-[130px] sm:max-w-[160px] min-w-0"
                            >
                              {/* Valor y porcentaje flotando SOBRE la barra */}
                              <div className="flex flex-col items-center justify-center mb-2 transition-all duration-500">
                                <span
                                  className={`text-2xl sm:text-3xl font-black leading-none ${
                                    count > 0
                                      ? "text-white scale-105"
                                      : "text-[#ECEBE4]/40 text-lg sm:text-xl"
                                  }`}
                                >
                                  {count}
                                </span>
                                {totalVotes > 0 && (
                                  <span
                                    className={`text-[11px] sm:text-xs font-black mt-1 px-2 py-0.5 rounded-full ${
                                      count > 0
                                        ? "bg-[#001E32] text-[#FFC72C] border border-[#425563]"
                                        : "text-[#ECEBE4]/30"
                                    }`}
                                  >
                                    {pct}%
                                  </span>
                                )}
                              </div>

                              {/* La Barra Auténtica que crece desde el fondo */}
                              <div className="w-full flex items-end justify-center h-44 sm:h-52">
                                <div
                                  className={`w-full max-w-[70px] sm:max-w-[85px] rounded-t-2xl transition-all duration-700 ease-out relative flex items-start justify-center ${
                                    isCorrect && count > 0
                                      ? "ring-4 ring-[#4C8C2B]/60 shadow-[0_0_25px_rgba(76,140,43,0.5)]"
                                      : count > 0
                                        ? "shadow-lg"
                                        : ""
                                  }`}
                                  style={{
                                    height:
                                      count > 0
                                        ? `${Math.max(12, Math.min(100, barHeightPct))}%`
                                        : "6px",
                                    backgroundColor:
                                      count > 0 ? barColor : "#001E32",
                                    border:
                                      count === 0
                                        ? "1px solid #425563"
                                        : undefined,
                                  }}
                                >
                                  {isCorrect && count > 0 && (
                                    <div className="mt-2 bg-[#001E32]/90 text-white px-2 py-0.5 rounded-full text-xs font-black flex items-center gap-1 shadow">
                                      <span>✓</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Etiquetas de las Opciones DEBAJO del Eje X */}
                      <div className="flex items-start justify-around gap-3 sm:gap-6 pt-1">
                        {optionsList.map((opt, idx) => {
                          const isCorrect = isOptionCorrect(opt);
                          const barColor = isCorrect
                            ? "#4C8C2B"
                            : OPTION_COLORS[idx % OPTION_COLORS.length];

                          return (
                            <div
                              key={opt.id}
                              className="flex-1 flex flex-col items-center text-center max-w-[130px] sm:max-w-[160px] min-w-0 space-y-1.5"
                            >
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span
                                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow shrink-0"
                                  style={{
                                    backgroundColor: barColor,
                                    color:
                                      idx === 0 && !isCorrect
                                        ? "#001E32"
                                        : "#FFFFFF",
                                  }}
                                >
                                  {opt.id && opt.id.length <= 2
                                    ? opt.id
                                    : idx + 1}
                                </span>
                                {isCorrect && (
                                  <span className="text-[10px] uppercase font-black tracking-wider text-[#86C8BC] bg-[#4C8C2B]/30 border border-[#4C8C2B] px-1.5 py-0.5 rounded shadow-sm">
                                    Correcta
                                  </span>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-white line-clamp-3 leading-snug break-words">
                                {opt.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          {/* Explicación si aplica */}
          {currentQ.explanation_text && (
            <div className="bg-[#48A9C5]/10 border border-[#48A9C5] p-4 rounded-2xl text-sm text-[#ECEBE4]">
              <strong className="text-[#48A9C5]">Explicación:</strong>{" "}
              {currentQ.explanation_text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            {isOpenQuestion ? (
              currentQIndex + 1 < questions.length ? (
                <button
                  type="button"
                  onClick={() => handlePresenterAction("next_question")}
                  className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95"
                >
                  <span>Siguiente Pregunta</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePresenterAction("finish_session")}
                  className="bg-[#4C8C2B] hover:bg-[#3D7022] text-white font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95"
                >
                  <span>Finalizar Sondeo</span>
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              )
            ) : (
              <button
                type="button"
                onClick={() => handlePresenterAction("show_leaderboard")}
                className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition"
              >
                <span>Ver Tabla de Posiciones</span>
                <Trophy className="w-5 h-5" />
              </button>
            )}
          </div>
        </main>
      )}

      {/* 4. LEADERBOARD VIEW (SOLO PARA CUESTIONARIOS GAMIFICADOS) */}
      {!isOpenQuestion && currentStep === "leaderboard" && (
        <main className="my-auto max-w-3xl w-full mx-auto space-y-6 py-6 text-center">
          <div className="space-y-1">
            <div className="inline-block p-3 bg-[#FFC72C] text-[#001E32] rounded-2xl shadow-lg mb-2">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-4xl font-black text-white">
              Tabla de Posiciones
            </h2>
            <p className="text-sm text-[#ECEBE4] opacity-80">
              Top 5 participantes más rápidos y acertados
            </p>
          </div>

          <div className="bg-[#193750] border border-[#425563] rounded-3xl p-6 shadow-2xl space-y-3">
            {leaderboard.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-[#001E32] border border-[#425563] p-4 rounded-2xl text-lg font-bold"
              >
                <div className="flex items-center space-x-4">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                      idx === 0
                        ? "bg-[#FFC72C] text-[#001E32]"
                        : idx === 1
                          ? "bg-gray-300 text-black"
                          : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-[#193750] text-[#ECEBE4]"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className="text-white">{p.nickname}</span>
                </div>
                <span className="font-mono text-xl text-[#FFC72C] font-extrabold">
                  {p.score} pts
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => handlePresenterAction("next_question")}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition"
            >
              <span>
                {currentQIndex + 1 < questions.length
                  ? "Siguiente Pregunta"
                  : "Ver Podio Final"}
              </span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </main>
      )}

      {/* 5. VISTA FINAL: RESUMEN DE SONDEO O PODIO DE GAMIFICACIÓN */}
      {(currentStep === "summary" ||
        currentStep === "podium" ||
        session?.status === "finished") &&
        (isOpenQuestion ? (
          <main className="my-auto max-w-4xl w-full mx-auto space-y-8 py-8 text-center animate-in fade-in">
            <div className="inline-block p-6 bg-[#48A9C5]/20 border-2 border-[#48A9C5] text-[#48A9C5] rounded-full shadow-2xl">
              <CheckCircle2 className="w-16 h-16 mx-auto" />
            </div>
            <div className="space-y-3">
              <h2 className="text-5xl font-black text-white">
                ¡Sondeo de Opinión Concluido!
              </h2>
              <p className="text-xl text-[#FFC72C] font-bold">
                Gracias a todos los asistentes por participar y compartir sus
                ideas.
              </p>
              <p className="text-base text-[#ECEBE4]/80 max-w-xl mx-auto">
                Las respuestas han sido recolectadas en tiempo real. Todas las
                opiniones quedan consolidadas para el informe de la sesión.
              </p>
            </div>
            <div className="pt-6 flex justify-center gap-4">
              <Link
                to="/open-polls"
                className="inline-flex items-center space-x-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-base py-3.5 px-8 rounded-xl shadow-xl transition active:scale-95"
              >
                <span>Volver a Preguntas Abiertas</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center space-x-2 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-white font-bold text-base py-3.5 px-8 rounded-xl transition"
              >
                <span>Ir al Hub</span>
              </Link>
            </div>
          </main>
        ) : (
          <main className="my-auto max-w-4xl w-full mx-auto space-y-8 py-6 text-center">
            <div className="space-y-2">
              <h2 className="text-5xl font-black text-white">
                🏆 Podio de Ganadores
              </h2>
              <p className="text-lg text-[#FFC72C] font-bold">
                ¡Felicitaciones a los mejores puntajes de Epiroc!
              </p>
            </div>

            {/* Podio 3D/2D */}
            <div className="flex justify-center items-end space-x-4 h-72 pt-8">
              {/* 2do Lugar */}
              {leaderboard[1] && (
                <div className="flex flex-col items-center w-48 space-y-2">
                  <span className="font-bold text-lg text-white truncate max-w-[180px]">
                    {leaderboard[1].nickname}
                  </span>
                  <span className="font-mono text-sm text-[#FFC72C]">
                    {leaderboard[1].score} pts
                  </span>
                  <div className="w-full bg-gray-400 text-black font-black text-4xl h-40 rounded-t-3xl flex items-center justify-center shadow-2xl border-2 border-white">
                    2
                  </div>
                </div>
              )}

              {/* 1er Lugar (Más Alto) */}
              {leaderboard[0] && (
                <div className="flex flex-col items-center w-52 space-y-2">
                  <div className="p-2 bg-[#FFC72C] text-[#001E32] rounded-full shadow-xl">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <span className="font-extrabold text-xl text-white truncate max-w-[200px]">
                    {leaderboard[0].nickname}
                  </span>
                  <span className="font-mono text-base text-[#FFC72C] font-black">
                    {leaderboard[0].score} pts
                  </span>
                  <div className="w-full bg-[#FFC72C] text-[#001E32] font-black text-5xl h-56 rounded-t-3xl flex items-center justify-center shadow-2xl border-4 border-white">
                    1
                  </div>
                </div>
              )}

              {/* 3er Lugar */}
              {leaderboard[2] && (
                <div className="flex flex-col items-center w-48 space-y-2">
                  <span className="font-bold text-lg text-white truncate max-w-[180px]">
                    {leaderboard[2].nickname}
                  </span>
                  <span className="font-mono text-sm text-[#FFC72C]">
                    {leaderboard[2].score} pts
                  </span>
                  <div className="w-full bg-amber-700 text-white font-black text-4xl h-28 rounded-t-3xl flex items-center justify-center shadow-2xl border-2 border-amber-500">
                    3
                  </div>
                </div>
              )}
            </div>

            <div className="pt-8">
              <Link
                to="/"
                className="inline-flex items-center space-x-2 bg-[#193750] hover:bg-[#254F72] border border-[#FFC72C] text-white font-bold py-3 px-8 rounded-xl shadow-xl transition"
              >
                <span>Volver al Inicio</span>
              </Link>
            </div>
          </main>
        ))}

      {/* Footer */}
      <footer className="text-center text-xs text-[#ECEBE4] opacity-50 py-2 border-t border-[#425563]/40">
        Epiroc Chile S.A.C. &bull; Epivox Sistema de Gamificación
      </footer>

      {/* Modal de Confirmación para Cancelar Presentación */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="¿Cancelar Presentación Activa?"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[#B7312C]/10 border border-[#B7312C]/30 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-[#B7312C] shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5">
              <p className="font-bold text-[#A32823] dark:text-[#FFA6A3] text-sm">
                Esta acción detendrá la sesión para todos los participantes.
              </p>
              <p className="text-[#001E32] dark:text-[#ECEBE4] leading-relaxed">
                Los alumnos conectados (PIN:{" "}
                <strong className="font-mono bg-[#FFC72C] text-[#001E32] px-1.5 py-0.5 rounded font-black">
                  {pin}
                </strong>
                ) ya no verán preguntas activas y su pantalla mostrará que la
                presentación ha finalizado.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCancelModalOpen(false)}
              className="px-4 py-2.5 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-xs font-bold text-white rounded-xl transition cursor-pointer"
            >
              Continuar Presentación
            </button>
            <button
              type="button"
              onClick={handleCancelPresentation}
              disabled={isCancelling}
              className="px-5 py-2.5 bg-[#B7312C] hover:bg-[#A32823] text-white text-xs font-black rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>
                {isCancelling ? "Cancelando..." : "Sí, Cancelar Presentación"}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
