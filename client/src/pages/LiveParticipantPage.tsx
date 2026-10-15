import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Heart,
  ThumbsUp,
  Flame,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { getSocket } from "../services/socket";

interface QuestionOption {
  id: string;
  text: string;
  color?: string;
}

interface QuestionData {
  id: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  options_json: string;
}

const SHAPES = [
  { shape: "▲", color: "bg-[#FFC72C] text-[#001E32]", label: "Triángulo" },
  { shape: "■", color: "bg-[#48A9C5] text-white", label: "Cuadrado" },
  { shape: "●", color: "bg-[#4C8C2B] text-white", label: "Círculo" },
  { shape: "◆", color: "bg-[#B7312C] text-white", label: "Rombo" },
];

export default function LiveParticipantPage() {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();

  const [sessionStatus, setSessionStatus] = useState<string>("lobby");
  const [currentStep, setCurrentStep] = useState<string>("lobby");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(
    null,
  );
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [lastFeedback, setLastFeedback] = useState<{
    isCorrect: boolean;
    pointsAwarded: number;
    newStreak: number;
  } | null>(null);
  const [participant, setParticipant] = useState<{
    id: number;
    nickname: string;
    score: number;
  } | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now(),
  );

  useEffect(() => {
    const stored = sessionStorage.getItem("epivox_participant");
    if (!stored) {
      navigate(`/join?pin=${pin || ""}`);
      return;
    }
    const part = JSON.parse(stored);
    setParticipant(part);

    const socket = getSocket();

    // Sincronización de eventos de sesión
    socket.on(
      "session:state_changed",
      (data: {
        status: string;
        currentStep: string;
        question?: QuestionData;
        podium?: Array<{ id: number; nickname: string; score: number }>;
      }) => {
        setSessionStatus(data.status);
        setCurrentStep(data.currentStep);

        if (data.status === "question_active" && data.question) {
          setCurrentQuestion(data.question);
          setRemainingTime(data.question.time_limit);
          setHasAnswered(false);
          setSelectedAnswer(null);
          setTextAnswer("");
          setLastFeedback(null);
          setQuestionStartTime(Date.now());
        }
      },
    );

    socket.on("timer:tick", (data: { remaining: number }) => {
      setRemainingTime(data.remaining);
    });

    socket.on(
      "answer:accepted",
      (data: {
        isCorrect: boolean;
        pointsAwarded: number;
        newStreak: number;
      }) => {
        setLastFeedback(data);
        setParticipant((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, score: prev.score + data.pointsAwarded };
          sessionStorage.setItem("epivox_participant", JSON.stringify(updated));
          return updated;
        });
      },
    );

    return () => {
      socket.off("session:state_changed");
      socket.off("timer:tick");
      socket.off("answer:accepted");
    };
  }, [pin, navigate]);

  const handleSendReaction = (emoji: string) => {
    if (!pin) return;
    const socket = getSocket();
    socket.emit("participant:reaction", { pin, emoji });
  };

  const handleAnswerSubmit = (payload: string) => {
    if (hasAnswered || !pin || !participant || !currentQuestion) return;
    const timeTakenMs = Date.now() - questionStartTime;
    setHasAnswered(true);
    setSelectedAnswer(payload);

    const socket = getSocket();
    socket.emit("participant:submit_answer", {
      pin,
      participantId: participant.id,
      questionId: currentQuestion.id,
      answerPayload: payload,
      timeTakenMs,
    });
  };

  // 1. Estado: SALA DE ESPERA (LOBBY)
  if (sessionStatus === "lobby") {
    return (
      <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-6">
        <header className="flex items-center justify-between py-2 border-b border-[#425563]">
          <span className="font-extrabold text-xl text-[#FFC72C]">EPIVOX</span>
          <span className="text-xs bg-[#193750] px-3 py-1 rounded-full border border-[#425563]">
            PIN: {pin}
          </span>
        </header>

        <main className="text-center space-y-6 my-auto">
          <div className="inline-block p-4 bg-[#FFC72C]/10 border-2 border-[#FFC72C] rounded-full animate-bounce">
            <Sparkles className="w-12 h-12 text-[#FFC72C]" />
          </div>
          <h1 className="text-3xl font-extrabold text-white">
            ¡Estás en la Sala!
          </h1>
          <p className="text-lg text-[#ECEBE4]">
            Hola,{" "}
            <span className="text-[#FFC72C] font-bold">
              {participant?.nickname}
            </span>
            .<br />
            Mira la pantalla grande mientras el presentador da inicio a la
            sesión.
          </p>

          <div className="pt-8">
            <p className="text-xs uppercase tracking-wider text-[#ECEBE4] mb-3 opacity-75">
              Envía una reacción a la pantalla:
            </p>
            <div className="flex justify-center space-x-3">
              {[
                { emoji: "👍", icon: ThumbsUp },
                { emoji: "❤️", icon: Heart },
                { emoji: "🔥", icon: Flame },
                { emoji: "💡", icon: Lightbulb },
              ].map((rec) => (
                <button
                  key={rec.emoji}
                  type="button"
                  onClick={() => handleSendReaction(rec.emoji)}
                  className="p-3 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-2xl rounded-2xl active:scale-95 transition shadow-lg"
                >
                  {rec.emoji}
                </button>
              ))}
            </div>
          </div>
        </main>

        <footer className="text-center text-xs text-[#ECEBE4] opacity-60">
          Epiroc Chile &bull; Experiencia Móvil de Participación
        </footer>
      </div>
    );
  }

  // 2. Estado: PODIO FINAL / JUEGO TERMINADO
  if (sessionStatus === "finished" || currentStep === "podium") {
    return (
      <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-6 text-center">
        <header className="py-2 border-b border-[#425563]">
          <span className="font-extrabold text-xl text-[#FFC72C]">EPIVOX</span>
        </header>

        <main className="my-auto space-y-6">
          <div className="inline-block p-5 bg-[#FFC72C] text-[#001E32] rounded-full shadow-2xl">
            <Trophy className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-black text-white">
            ¡Sesión Finalizada!
          </h1>
          <div className="bg-[#193750] border border-[#425563] p-6 rounded-2xl max-w-sm mx-auto shadow-xl space-y-2">
            <p className="text-sm text-[#ECEBE4]">Tu puntuación final:</p>
            <p className="text-4xl font-extrabold text-[#FFC72C]">
              {participant?.score || 0} pts
            </p>
            <p className="text-xs text-[#ECEBE4] opacity-80 pt-2">
              ¡Excelente participación! Consulta el podio en la pantalla
              principal.
            </p>
          </div>
        </main>

        <footer className="text-center text-xs text-[#ECEBE4] opacity-60">
          Gracias por participar con Epiroc
        </footer>
      </div>
    );
  }

  // 3. Estado: RESULTADOS DE LA PREGUNTA / REVELACIÓN
  if (currentStep === "results" || sessionStatus === "question_closed") {
    return (
      <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-6 text-center">
        <header className="flex justify-between items-center py-2 border-b border-[#425563]">
          <span className="text-sm text-[#ECEBE4]">
            Puntaje: {participant?.score || 0}
          </span>
          <span className="text-xs bg-[#193750] px-3 py-1 rounded-full text-[#FFC72C] font-bold">
            Tiempo Cerrado
          </span>
        </header>

        <main className="my-auto space-y-6 max-w-md mx-auto w-full">
          {lastFeedback ? (
            lastFeedback.isCorrect ? (
              <div className="bg-[#4C8C2B]/20 border-2 border-[#4C8C2B] p-6 rounded-3xl space-y-3">
                <CheckCircle2 className="w-16 h-16 text-[#4C8C2B] mx-auto" />
                <h2 className="text-3xl font-black text-white">¡Correcto!</h2>
                <p className="text-2xl font-extrabold text-[#FFC72C]">
                  +{lastFeedback.pointsAwarded} pts
                </p>
                {lastFeedback.newStreak > 1 && (
                  <p className="text-sm font-bold text-orange-400 flex items-center justify-center space-x-1">
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500 inline" />
                    <span>¡Racha de {lastFeedback.newStreak} aciertos!</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-[#B7312C]/20 border-2 border-[#B7312C] p-6 rounded-3xl space-y-3">
                <XCircle className="w-16 h-16 text-[#B7312C] mx-auto" />
                <h2 className="text-3xl font-black text-white">
                  ¡Ups, no era esa!
                </h2>
                <p className="text-sm text-[#ECEBE4]">
                  ¡Ánimo! Mantén la concentración para la siguiente.
                </p>
              </div>
            )
          ) : (
            <div className="bg-[#193750] border border-[#425563] p-6 rounded-3xl space-y-3">
              <Clock className="w-12 h-12 text-[#FFC72C] mx-auto" />
              <h2 className="text-2xl font-bold text-white">Tiempo Agotado</h2>
              <p className="text-sm text-[#ECEBE4]">
                Mira la respuesta correcta en la pantalla grande.
              </p>
            </div>
          )}
        </main>

        <footer className="text-center text-xs text-[#ECEBE4] opacity-60">
          Esperando que el presentador continúe...
        </footer>
      </div>
    );
  }

  // 4. Estado: PREGUNTA ACTIVA (RESPONDER)
  let parsedOptions: QuestionOption[] = [];
  try {
    parsedOptions = currentQuestion
      ? JSON.parse(currentQuestion.options_json)
      : [];
  } catch {
    parsedOptions = [];
  }

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-4">
      {/* Header con cronómetro */}
      <header className="flex items-center justify-between py-2 border-b border-[#425563]">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-[#FFC72C]" />
          <span className="font-mono text-xl font-black text-[#FFC72C]">
            {remainingTime}s
          </span>
        </div>
        <span className="text-sm font-bold text-white bg-[#193750] px-3 py-1 rounded-full border border-[#425563]">
          {participant?.nickname} ({participant?.score || 0} pts)
        </span>
      </header>

      {/* Cuerpo principal según si ya respondió o no */}
      <main className="my-auto max-w-md w-full mx-auto space-y-4">
        {hasAnswered ? (
          <div className="bg-[#193750] border-2 border-[#FFC72C] p-8 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-[#FFC72C]/20 text-[#FFC72C] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              ¡Respuesta Enviada!
            </h2>
            {selectedAnswer && (
              <p className="text-xs uppercase tracking-wider text-[#FFC72C] font-bold">
                Opción registrada: {selectedAnswer}
              </p>
            )}
            <p className="text-sm text-[#ECEBE4] opacity-80">
              Esperando a que el resto de los participantes terminen de
              responder...
            </p>
          </div>
        ) : (
          <>
            {/* Pregunta tipo: Verdadero / Falso */}
            {currentQuestion?.question_type === "true_false" && (
              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => handleAnswerSubmit("opt_t")}
                  className="bg-[#4C8C2B] hover:bg-[#3E7323] text-white font-black text-2xl py-8 rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center space-x-3"
                >
                  <CheckCircle2 className="w-8 h-8" />
                  <span>VERDADERO</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAnswerSubmit("opt_f")}
                  className="bg-[#B7312C] hover:bg-[#962824] text-white font-black text-2xl py-8 rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center space-x-3"
                >
                  <XCircle className="w-8 h-8" />
                  <span>FALSO</span>
                </button>
              </div>
            )}

            {/* Pregunta tipo: Selección Múltiple (4 Botones gigantes) */}
            {(currentQuestion?.question_type === "multiple_choice" ||
              !currentQuestion?.question_type) && (
              <div className="grid grid-cols-2 gap-3">
                {parsedOptions.map((opt, idx) => {
                  const shapeDef = SHAPES[idx % SHAPES.length];
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleAnswerSubmit(opt.id)}
                      className={`${shapeDef.color} font-extrabold text-lg p-6 rounded-2xl shadow-xl active:scale-95 transition flex flex-col items-center justify-center min-h-[140px]`}
                    >
                      <span className="text-3xl mb-1">{shapeDef.shape}</span>
                      <span className="text-center text-sm line-clamp-3">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pregunta tipo: Nube de Palabras / Abierta */}
            {(currentQuestion?.question_type === "word_cloud" ||
              currentQuestion?.question_type === "open_ended") && (
              <div className="bg-[#193750] border border-[#425563] p-6 rounded-2xl space-y-4">
                <label
                  htmlFor="word-input"
                  className="block text-sm text-[#ECEBE4] font-bold text-center"
                >
                  Escribe tu respuesta:
                </label>
                <input
                  id="word-input"
                  type="text"
                  maxLength={30}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Escribe aquí..."
                  className="w-full text-center text-xl font-bold py-3 px-4 rounded-xl bg-[#001E32] border-2 border-[#425563] focus:border-[#FFC72C] text-white focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!textAnswer.trim()}
                  onClick={() => handleAnswerSubmit(textAnswer.trim())}
                  className="w-full bg-[#FFC72C] text-[#001E32] font-black text-lg py-4 rounded-xl hover:bg-[#E6B327] transition shadow-lg disabled:opacity-50"
                >
                  Enviar Respuesta
                </button>
              </div>
            )}

            {/* Pregunta tipo: Likert / Escala */}
            {currentQuestion?.question_type === "likert" && (
              <div className="bg-[#193750] border border-[#425563] p-6 rounded-2xl space-y-4 text-center">
                <span className="block text-sm text-[#ECEBE4] font-bold">
                  Selecciona tu nivel de acuerdo (1 al 5):
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleAnswerSubmit(num.toString())}
                      className="bg-[#001E32] hover:bg-[#FFC72C] hover:text-[#001E32] text-white border-2 border-[#425563] font-black text-2xl py-6 rounded-xl transition shadow active:scale-95"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="text-center text-xs text-[#ECEBE4] opacity-50 py-1">
        Epiroc Epivox &bull; PIN: {pin}
      </footer>
    </div>
  );
}
