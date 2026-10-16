import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Sparkles,
  Play,
  SkipForward,
  Users,
  Clock,
  Trophy,
  CheckSquare,
  CheckCircle2,
  Radio,
  ArrowRightCircle,
  ListOrdered,
} from "lucide-react";
import { getSocket } from "../services/socket";

interface QuestionData {
  id: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  explanation_text?: string;
}

export default function PresenterRemotePage() {
  const { pin } = useParams<{ pin: string }>();

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("lobby");
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [totalAnswers, setTotalAnswers] = useState<number>(0);

  useEffect(() => {
    if (!pin) return;
    const socket = getSocket();
    socket.emit("presenter:join", { pin });

    socket.on(
      "presenter:sync",
      (data: {
        session: { current_question_index: number; status: string };
        participants: unknown[];
        questions: QuestionData[];
      }) => {
        setQuestions(data.questions);
        setCurrentQIndex(data.session.current_question_index || 0);
        setParticipantsCount(data.participants.length);
      },
    );

    socket.on("lobby:participants_update", (data: { count: number }) => {
      setParticipantsCount(data.count);
    });

    socket.on(
      "session:state_changed",
      (data: { currentStep: string; currentQuestionIndex?: number }) => {
        setCurrentStep(data.currentStep);
        if (data.currentQuestionIndex !== undefined) {
          setCurrentQIndex(data.currentQuestionIndex);
        }
      },
    );

    socket.on("timer:tick", (data: { remaining: number }) => {
      setRemainingTime(data.remaining);
    });

    socket.on("results:live_update", (data: { totalAnswers: number }) => {
      setTotalAnswers(data.totalAnswers);
    });

    return () => {
      socket.off("presenter:sync");
      socket.off("lobby:participants_update");
      socket.off("session:state_changed");
      socket.off("timer:tick");
      socket.off("results:live_update");
    };
  }, [pin]);

  const [listFilter, setListFilter] = useState<"all" | "completed" | "pending">(
    "all",
  );
  const [isListExpanded, setIsListExpanded] = useState<boolean>(true);

  const handleAction = (action: string, targetQuestionIndex?: number) => {
    if (!pin) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin,
      action,
      questionIndex:
        targetQuestionIndex !== undefined ? targetQuestionIndex : currentQIndex,
    });
  };

  const isLobby = currentStep === "lobby";
  const currentQ = questions[currentQIndex];
  const nextQ = isLobby ? questions[0] : questions[currentQIndex + 1];

  const pastCount = isLobby ? 0 : currentQIndex;
  const pendingCount = isLobby
    ? questions.length
    : Math.max(0, questions.length - (currentQIndex + 1));

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-4 selection:bg-[#FFC72C] selection:text-[#001E32]">
      {/* Header Remoto */}
      <header className="flex items-center justify-between py-2 border-b border-[#425563]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-[#FFC72C] text-[#001E32] rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-lg text-white">
            EPIVOX CONTROL REMOTO
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-mono text-sm bg-[#193750] border border-[#FFC72C] text-[#FFC72C] px-3 py-1 rounded-lg font-bold">
            PIN: {pin}
          </span>
          <span className="flex items-center space-x-1 text-xs text-[#ECEBE4]">
            <Users className="w-4 h-4 text-[#48A9C5]" />
            <span>{participantsCount}</span>
          </span>
        </div>
      </header>

      {/* Main Control Panel */}
      <main className="my-auto max-w-lg w-full mx-auto space-y-4 py-2">
        {/* Estado actual / Cronómetro */}
        <div className="bg-[#193750] border border-[#425563] p-4 rounded-2xl flex items-center justify-between shadow-xl">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#FFC72C] tracking-wider block">
              Fase Actual
            </span>
            <span className="text-xl font-black capitalize text-white">
              {currentStep}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-[#ECEBE4] tracking-wider block">
              Tiempo / Respuestas
            </span>
            <div className="flex items-center space-x-2 justify-end">
              <Clock className="w-4 h-4 text-[#FFC72C]" />
              <span className="font-mono text-xl font-bold text-[#FFC72C]">
                {remainingTime}s
              </span>
              <span className="text-xs text-[#ECEBE4]">
                ({totalAnswers} votos)
              </span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Diapositiva Actual */}
        <div className="bg-[#193750] border-2 border-[#425563] p-5 rounded-2xl space-y-2 shadow-xl">
          <span className="text-xs font-bold text-[#FFC72C] uppercase tracking-wider">
            Pregunta {currentQIndex + 1} de {questions.length}
          </span>
          <h2 className="text-lg font-extrabold text-white leading-snug">
            {currentQ?.question_text || "Esperando inicio..."}
          </h2>

          {currentQ?.explanation_text && (
            <div className="text-xs bg-[#001E32] border border-[#425563] p-2.5 rounded-xl text-[#ECEBE4] mt-2">
              <strong className="text-[#48A9C5]">
                Nota Privada del Orador:
              </strong>{" "}
              {currentQ.explanation_text}
            </div>
          )}
        </div>

        {/* Vista previa siguiente diapositiva */}
        <div className="bg-[#193750] border-2 border-[#48A9C5]/60 p-3.5 rounded-2xl text-xs space-y-1.5 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 font-extrabold uppercase tracking-wider text-[#48A9C5]">
              <ArrowRightCircle className="w-3.5 h-3.5" />
              {isLobby
                ? "Próxima a Lanzar: Pregunta #1"
                : nextQ
                  ? `Siguiente Pregunta (#${currentQIndex + 2} de ${questions.length})`
                  : "Fin del Cuestionario"}
            </span>
            {nextQ && (
              <span className="text-[10px] bg-[#48A9C5]/15 text-[#48A9C5] px-2 py-0.5 rounded-full font-bold">
                ⏱ {nextQ.time_limit}s
              </span>
            )}
          </div>
          <p className="font-bold text-white text-sm truncate">
            {nextQ
              ? nextQ.question_text
              : "No hay más preguntas pendientes. Al avanzar se mostrará el Podio."}
          </p>
        </div>

        {/* Botonera de Acciones Maestras */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {currentStep === "lobby" && (
            <button
              type="button"
              onClick={() => handleAction("start_game")}
              className="col-span-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-4 rounded-xl shadow-xl text-lg flex items-center justify-center space-x-2 active:scale-95 transition"
            >
              <Play className="w-6 h-6 fill-[#001E32]" />
              <span>Lanzar Primera Pregunta</span>
            </button>
          )}

          {currentStep === "question" && (
            <>
              <button
                type="button"
                onClick={() => handleAction("show_results")}
                className="col-span-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-extrabold py-4 rounded-xl shadow-xl text-lg flex items-center justify-center space-x-2 active:scale-95 transition"
              >
                <CheckSquare className="w-6 h-6" />
                <span>Cerrar Votación y Mostrar Resultados</span>
              </button>
            </>
          )}

          {currentStep === "results" && (
            <button
              type="button"
              onClick={() => handleAction("show_leaderboard")}
              className="col-span-2 bg-[#48A9C5] hover:bg-[#3B8FA8] text-white font-extrabold py-4 rounded-xl shadow-xl text-lg flex items-center justify-center space-x-2 active:scale-95 transition"
            >
              <Trophy className="w-6 h-6" />
              <span>Mostrar Tabla de Posiciones</span>
            </button>
          )}

          {currentStep === "leaderboard" && (
            <button
              type="button"
              onClick={() => handleAction("next_question")}
              className="col-span-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-4 rounded-xl shadow-xl text-lg flex items-center justify-center space-x-2 active:scale-95 transition"
            >
              <SkipForward className="w-6 h-6" />
              <span>
                {currentQIndex + 1 < questions.length
                  ? "Siguiente Pregunta"
                  : "Finalizar y Podio"}
              </span>
            </button>
          )}
        </div>

        {/* Panel Desplegable: Listado Completo de Preguntas */}
        <div className="bg-[#193750] border border-[#425563] p-4 rounded-2xl space-y-3 shadow-xl">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#425563]/60">
            <button
              type="button"
              onClick={() => setIsListExpanded(!isListExpanded)}
              className="flex items-center gap-2 text-left"
            >
              <ListOrdered className="w-4 h-4 text-[#FFC72C]" />
              <span className="font-extrabold text-sm text-white">
                Listado de Diapositivas ({questions.length})
              </span>
            </button>

            {/* Filtros de Pestaña */}
            <div className="flex items-center gap-1 bg-[#001E32] p-1 rounded-xl text-[11px]">
              <button
                type="button"
                onClick={() => setListFilter("all")}
                className={`px-2 py-0.5 rounded-lg font-bold transition ${
                  listFilter === "all"
                    ? "bg-[#FFC72C] text-[#001E32]"
                    : "text-[#ECEBE4]/60"
                }`}
              >
                Todas ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setListFilter("completed")}
                className={`px-2 py-0.5 rounded-lg font-bold transition ${
                  listFilter === "completed"
                    ? "bg-[#4C8C2B] text-white"
                    : "text-[#ECEBE4]/60"
                }`}
              >
                Hechas ({pastCount})
              </button>
              <button
                type="button"
                onClick={() => setListFilter("pending")}
                className={`px-2 py-0.5 rounded-lg font-bold transition ${
                  listFilter === "pending"
                    ? "bg-[#48A9C5] text-[#001E32]"
                    : "text-[#ECEBE4]/60"
                }`}
              >
                Faltan ({pendingCount})
              </button>
            </div>
          </div>

          {isListExpanded && (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {questions
                .map((q, idx) => {
                  let status: "completed" | "current" | "next" | "pending";
                  if (!isLobby && idx < currentQIndex) {
                    status = "completed";
                  } else if (!isLobby && idx === currentQIndex) {
                    status = "current";
                  } else if (idx === (isLobby ? 0 : currentQIndex + 1)) {
                    status = "next";
                  } else {
                    status = "pending";
                  }
                  return { ...q, index: idx, status };
                })
                .filter((item) => {
                  if (listFilter === "completed")
                    return item.status === "completed";
                  if (listFilter === "pending")
                    return item.status === "pending" || item.status === "next";
                  return true;
                })
                .map((q) => (
                  <div
                    key={q.id}
                    className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 text-xs ${
                      q.status === "current"
                        ? "bg-[#001E32] border-[#FFC72C] ring-1 ring-[#FFC72C]/40"
                        : q.status === "next"
                          ? "bg-[#001E32] border-[#48A9C5]/50"
                          : q.status === "completed"
                            ? "bg-[#001E32]/70 border-[#4C8C2B]/30 opacity-75"
                            : "bg-[#001E32]/50 border-[#425563]/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="font-mono font-bold text-xs text-[#FFC72C] shrink-0">
                        #{q.index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {q.status === "completed" && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-[#4C8C2B]">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Hecha
                            </span>
                          )}
                          {q.status === "current" && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-[#FFC72C] animate-pulse">
                              <Radio className="w-2.5 h-2.5" /> En Vivo
                            </span>
                          )}
                          {q.status === "next" && (
                            <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-[#48A9C5]">
                              <ArrowRightCircle className="w-2.5 h-2.5" /> Siguiente
                            </span>
                          )}
                          {q.status === "pending" && (
                            <span className="flex items-center gap-0.5 text-[9px] text-[#ECEBE4]/50">
                              <Clock className="w-2.5 h-2.5" /> Pendiente
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-white text-xs truncate">
                          {q.question_text}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {q.status === "current" ? (
                        <span className="text-[10px] text-[#FFC72C] font-black">
                          Activa
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleAction("jump_to_question", q.index)
                          }
                          className="text-[11px] font-bold bg-[#001E32] hover:bg-[#FFC72C] text-[#ECEBE4] hover:text-[#001E32] px-2 py-1 rounded-lg border border-[#425563] transition flex items-center gap-1 shadow"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>Lanzar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>

      <footer className="text-center text-xs text-[#ECEBE4] opacity-50 py-1">
        Epiroc Epivox &bull; Modo Control Remoto Móvil
      </footer>
    </div>
  );
}
