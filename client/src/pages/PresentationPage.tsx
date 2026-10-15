import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Sparkles,
  Users,
  Clock,
  Maximize2,
  Minimize2,
  Play,
  ArrowRight,
  Trophy,
  BarChart3,
} from "lucide-react";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import { getSocket } from "../services/socket";

interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

interface QuestionData {
  id: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  options_json: string;
  explanation_text?: string;
}

interface ParticipantData {
  id: number;
  nickname: string;
  avatar_seed: string;
  score: number;
  current_streak: number;
}

const OPTION_COLORS = ["#FFC72C", "#48A9C5", "#4C8C2B", "#B7312C"];
const OPTION_SHAPES = ["▲", "■", "●", "◆"];

export default function PresentationPage() {
  const { pin } = useParams<{ pin: string }>();

  const [session, setSession] = useState<{
    id: number;
    pin: string;
    status: string;
    current_question_index: number;
  } | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("lobby"); // 'lobby', 'question', 'results', 'leaderboard', 'podium'
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [totalAnswers, setTotalAnswers] = useState<number>(0);
  const [liveResults, setLiveResults] = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard] = useState<ParticipantData[]>([]);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [floatingReactions, setFloatingReactions] = useState<
    Array<{ id: number; emoji: string; left: number }>
  >([]);

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
    socket.emit("presenter:join", { pin });

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
      }) => {
        setSession(data.session);
        setParticipants(data.participants);
        setQuestions(data.questions);
        setCurrentQIndex(data.session.current_question_index || 0);
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
        leaderboard?: ParticipantData[];
        podium?: ParticipantData[];
      }) => {
        if (data.currentQuestionIndex !== undefined) {
          setCurrentQIndex(data.currentQuestionIndex);
        }
        setCurrentStep(data.currentStep);

        if (data.results) {
          setLiveResults(data.results);
        }
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
        }
        if (data.currentStep === "podium" || data.status === "finished") {
          if (data.podium) setLeaderboard(data.podium);
          // Lanzar lluvia de confeti corporativo Epiroc
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ["#FFC72C", "#001E32", "#48A9C5", "#FFFFFF"],
          });
        }
      },
    );

    socket.on("timer:tick", (data: { remaining: number }) => {
      setRemainingTime(data.remaining);
    });

    socket.on(
      "results:live_update",
      (data: { totalAnswers: number; results: Record<string, number> }) => {
        setTotalAnswers(data.totalAnswers);
        setLiveResults(data.results);
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
      socket.off("presenter:sync");
      socket.off("lobby:participants_update");
      socket.off("session:state_changed");
      socket.off("timer:tick");
      socket.off("results:live_update");
      socket.off("reaction:floating");
    };
  }, [pin]);

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
          </div>

          {/* Opciones en la pantalla grande */}
          <div className="grid grid-cols-2 gap-4">
            {parsedOptions.map((opt, idx) => (
              <div
                key={opt.id}
                className="bg-[#193750] border-2 border-[#425563] p-6 rounded-2xl flex items-center space-x-4 shadow-xl"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-black shadow"
                  style={{
                    backgroundColor: OPTION_COLORS[idx % OPTION_COLORS.length],
                    color: idx === 0 ? "#001E32" : "#FFFFFF",
                  }}
                >
                  {OPTION_SHAPES[idx % OPTION_SHAPES.length]}
                </div>
                <span className="text-xl font-bold text-white flex-1">
                  {opt.text}
                </span>
              </div>
            ))}
          </div>

          {/* Controles de avance para el presentador */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => handlePresenterAction("show_results")}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition"
            >
              <span>Cerrar Votación y Ver Resultados</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </main>
      )}

      {/* 3. RESULTS VIEW (GRÁFICOS EN VIVO) */}
      {currentStep === "results" && currentQ && (
        <main className="my-auto max-w-5xl w-full mx-auto space-y-6 py-4">
          <div className="bg-[#193750] border-2 border-[#425563] p-6 rounded-3xl text-center space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#FFC72C] font-bold">
              Distribución de Respuestas
            </span>
            <h2 className="text-3xl font-extrabold text-white">
              {currentQ.question_text}
            </h2>
          </div>

          {/* Gráfico de Barras SVG Dinámico */}
          <div className="bg-[#193750] border border-[#425563] p-8 rounded-3xl space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 h-64 items-end">
              {parsedOptions.map((opt, idx) => {
                const count = liveResults[opt.id] || 0;
                const maxCount = Math.max(...Object.values(liveResults), 1);
                const heightPct = Math.min(
                  100,
                  Math.round((count / maxCount) * 100),
                );

                return (
                  <div
                    key={opt.id}
                    className="flex flex-col items-center h-full justify-end space-y-2"
                  >
                    <span className="font-extrabold text-2xl text-white">
                      {count}
                    </span>
                    <div className="w-full bg-[#001E32] rounded-t-2xl p-1 h-48 flex items-end">
                      <div
                        className="w-full rounded-t-xl transition-all duration-700 ease-out flex items-center justify-center font-bold text-lg"
                        style={{
                          height: `${Math.max(10, heightPct)}%`,
                          backgroundColor: opt.is_correct
                            ? "#4C8C2B"
                            : OPTION_COLORS[idx % OPTION_COLORS.length],
                          color: "#FFFFFF",
                        }}
                      >
                        {opt.is_correct && "✓"}
                      </div>
                    </div>
                    <span className="text-center text-xs font-bold truncate max-w-[150px]">
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Explicación si aplica */}
          {currentQ.explanation_text && (
            <div className="bg-[#48A9C5]/10 border border-[#48A9C5] p-4 rounded-2xl text-sm text-[#ECEBE4]">
              <strong className="text-[#48A9C5]">Explicación:</strong>{" "}
              {currentQ.explanation_text}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => handlePresenterAction("show_leaderboard")}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition"
            >
              <span>Ver Tabla de Posiciones</span>
              <Trophy className="w-5 h-5" />
            </button>
          </div>
        </main>
      )}

      {/* 4. LEADERBOARD VIEW */}
      {currentStep === "leaderboard" && (
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

      {/* 5. PODIUM VIEW (FINAL DEL CUESTIONARIO) */}
      {(currentStep === "podium" || session?.status === "finished") && (
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
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-[#ECEBE4] opacity-50 py-2 border-t border-[#425563]/40">
        Epiroc Chile S.A.C. &bull; Epivox Sistema de Gamificación
      </footer>
    </div>
  );
}
