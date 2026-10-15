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

  const handleAction = (action: string) => {
    if (!pin) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin,
      action,
      questionIndex: currentQIndex,
    });
  };

  const currentQ = questions[currentQIndex];
  const nextQ = questions[currentQIndex + 1];

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
        {nextQ && (
          <div className="bg-[#001E32]/70 border border-[#425563] p-3 rounded-xl text-xs text-[#ECEBE4] flex items-center justify-between">
            <span className="opacity-75">Siguiente:</span>
            <span className="font-bold truncate max-w-[280px] text-white">
              {nextQ.question_text}
            </span>
          </div>
        )}

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
      </main>

      <footer className="text-center text-xs text-[#ECEBE4] opacity-50 py-1">
        Epiroc Epivox &bull; Modo Control Remoto Móvil
      </footer>
    </div>
  );
}
