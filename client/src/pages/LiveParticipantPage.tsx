import { useState, useEffect, useRef } from "react";
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
  Star,
  AlertCircle,
} from "lucide-react";
import { getSocket } from "../services/socket";
import EpirocOptionIcon, {
  EPIROC_OPTION_CONFIGS,
} from "../components/EpirocOptionIcon";

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
  correct_answer_value?: string;
  explanation_text?: string;
}

function ConnectionBanner({ isConnected }: { isConnected: boolean }) {
  if (isConnected) return null;
  return (
    <div className="bg-[#B7312C] text-white text-xs font-bold py-1.5 px-3 rounded-lg text-center shadow-lg animate-pulse my-2">
      Reconectando con la presentación en vivo...
    </div>
  );
}

function getCorrectAnswerDisplay(q: QuestionData | null): string | null {
  if (!q) return null;
  try {
    const options: QuestionOption[] = JSON.parse(q.options_json || "[]");

    // 1. Buscar en opciones marcadas como correctas
    const markedCorrect = options.find((opt) =>
      Boolean(opt.is_correct ?? opt.isCorrect),
    );
    if (markedCorrect && markedCorrect.text) {
      return markedCorrect.text;
    }

    // 2. Buscar si coincide con correct_answer_value
    if (q.correct_answer_value) {
      const val = q.correct_answer_value.trim().toLowerCase();
      const match = options.find(
        (opt) =>
          (opt.id && opt.id.toLowerCase() === val) ||
          (opt.text && opt.text.toLowerCase() === val),
      );
      if (match) return match.text;

      // Casos Verdadero / Falso
      if (q.question_type === "true_false") {
        if (
          val === "true" ||
          val === "verdadero" ||
          val === "opt_t" ||
          val === "a"
        )
          return "Verdadero";
        if (
          val === "false" ||
          val === "falso" ||
          val === "opt_f" ||
          val === "b"
        )
          return "Falso";
      }

      return q.correct_answer_value;
    }

    // Caso Verdadero/Falso con opción id 'true' / 'false'
    if (q.question_type === "true_false") {
      const tOpt = options.find((o) => o.id === "true" || o.id === "A");
      if (tOpt?.is_correct || tOpt?.isCorrect) return "Verdadero";
      const fOpt = options.find((o) => o.id === "false" || o.id === "B");
      if (fOpt?.is_correct || fOpt?.isCorrect) return "Falso";
    }

    return null;
  } catch {
    return q.correct_answer_value || null;
  }
}

function getSelectedAnswerDisplay(
  selectedId: string | null,
  q: QuestionData | null,
): string | null {
  if (!selectedId || !q) return null;
  try {
    const options: QuestionOption[] = JSON.parse(q.options_json || "[]");
    const found = options.find(
      (opt) => opt.id.toLowerCase() === selectedId.toLowerCase(),
    );
    if (found) return found.text;

    if (q.question_type === "true_false") {
      const clean = selectedId.toLowerCase();
      if (clean === "true" || clean === "a" || clean === "opt_t")
        return "Verdadero";
      if (clean === "false" || clean === "b" || clean === "opt_f")
        return "Falso";
    }

    return selectedId;
  } catch {
    return selectedId;
  }
}

export default function LiveParticipantPage() {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();
  const hasSubmittedRef = useRef<boolean>(false);

  const [sessionStatus, setSessionStatus] = useState<string>("lobby");
  const [currentStep, setCurrentStep] = useState<string>("lobby");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(
    null,
  );
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [textAnswer, setTextAnswer] = useState<string>("");
  const [lastFeedback, setLastFeedback] = useState<{
    isCorrect: boolean;
    isPoll?: boolean;
    pointsAwarded: number;
    newStreak: number;
    explanationText?: string;
    correctAnswerValue?: string;
  } | null>(null);
  const [participant, setParticipant] = useState<{
    id: number;
    nickname: string;
    score: number;
  } | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(
    Date.now(),
  );

  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("epivox_participant");
    if (!stored) {
      navigate(`/join?pin=${pin || ""}`);
      return;
    }
    const part = JSON.parse(stored);
    setParticipant(part);

    const socket = getSocket();

    const requestSync = () => {
      if (!pin) return;
      socket.emit("participant:sync", {
        pin,
        participantId: part.id,
      });
    };

    // 1. Sincronización proactiva inicial
    requestSync();

    // 2. Reconexión automática de socket (vital para celulares al desbloquear pantalla o cambiar de red)
    const handleConnect = () => {
      setIsConnected(true);
      requestSync();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // 3. Al desbloquear el celular o volver a la pestaña activa (visibilitychange / focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!socket.connected) {
          socket.connect();
        }
        requestSync();
      }
    };

    const handleWindowFocus = () => {
      if (!socket.connected) {
        socket.connect();
      }
      requestSync();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleWindowFocus);

    // 4. Heartbeat de respaldo cada 3.5 segundos para evitar cualquier desincronización por paquetes perdidos
    const syncInterval = setInterval(() => {
      requestSync();
    }, 3500);

    // 5. Procesamiento de sincronización de estado completo
    socket.on(
      "participant:sync_state",
      (data: {
        status: string;
        currentStep: string;
        currentQuestionIndex: number;
        question?: QuestionData | null;
        remainingSeconds?: number;
        hasAnswered?: boolean;
      }) => {
        setIsConnected(true);
        setSessionStatus(data.status);
        setCurrentStep(data.currentStep);

        if (data.question) {
          setCurrentQuestion((prev) => {
            if (!prev || prev.id !== data.question?.id) {
              if (!data.hasAnswered) {
                hasSubmittedRef.current = false;
                setHasAnswered(false);
                setSelectedAnswer(null);
                setSelectedRating(0);
                setTextAnswer("");
                setLastFeedback(null);
              }
              setQuestionStartTime(Date.now());
            }
            return data.question || null;
          });
        }

        if (data.status === "question_active" && data.question) {
          if (data.remainingSeconds !== undefined) {
            setRemainingTime(data.remainingSeconds);
          }
          if (data.hasAnswered !== undefined) {
            setHasAnswered(!!data.hasAnswered);
            if (data.hasAnswered) {
              hasSubmittedRef.current = true;
            }
          }
        } else if (
          data.status === "question_closed" ||
          data.currentStep === "results"
        ) {
          hasSubmittedRef.current = true;
        }
      },
    );

    // 6. Sincronización reactiva por eventos emitidos por el presentador
    socket.on(
      "session:state_changed",
      (data: {
        status: string;
        currentStep: string;
        question?: QuestionData;
        podium?: Array<{ id: number; nickname: string; score: number }>;
      }) => {
        if (data.status === "cancelled" || data.currentStep === "cancelled") {
          hasSubmittedRef.current = true;
          setSessionStatus("cancelled");
          setCurrentStep("cancelled");
          setCurrentQuestion(null);
          setRemainingTime(0);
          return;
        }

        setSessionStatus(data.status);
        setCurrentStep(data.currentStep);

        if (data.question) {
          setCurrentQuestion(data.question);
        }

        if (data.status === "question_active" && data.question) {
          hasSubmittedRef.current = false;
          setRemainingTime(data.question.time_limit);
          setHasAnswered(false);
          setSelectedAnswer(null);
          setSelectedRating(0);
          setTextAnswer("");
          setLastFeedback(null);
          setQuestionStartTime(Date.now());
        } else if (
          data.status === "question_closed" ||
          data.currentStep === "results"
        ) {
          hasSubmittedRef.current = true;
        }
      },
    );

    socket.on("session:cancelled", () => {
      hasSubmittedRef.current = true;
      setSessionStatus("cancelled");
      setCurrentStep("cancelled");
      setCurrentQuestion(null);
      setRemainingTime(0);
    });

    socket.on("timer:tick", (data: { remaining: number }) => {
      setRemainingTime(data.remaining);
    });

    socket.on(
      "answer:accepted",
      (data: {
        isCorrect: boolean;
        isPoll?: boolean;
        pointsAwarded: number;
        newStreak: number;
        explanationText?: string;
        correctAnswerValue?: string;
      }) => {
        hasSubmittedRef.current = true;
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
      clearInterval(syncInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleWindowFocus);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("participant:sync_state");
      socket.off("session:state_changed");
      socket.off("session:cancelled");
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
    if (
      hasSubmittedRef.current ||
      hasAnswered ||
      !pin ||
      !participant ||
      !currentQuestion
    )
      return;
    hasSubmittedRef.current = true;
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

        <ConnectionBanner isConnected={isConnected} />

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

  // 1b. Estado: SESIÓN CANCELADA O FINALIZADA POR EL PRESENTADOR
  if (sessionStatus === "cancelled" || currentStep === "cancelled") {
    return (
      <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-6 text-center animate-in fade-in select-none">
        <header className="py-2 border-b border-[#425563]">
          <span className="font-extrabold text-xl text-[#FFC72C]">EPIVOX</span>
        </header>

        <main className="my-auto space-y-6 max-w-sm mx-auto">
          <div className="inline-block p-5 bg-[#B7312C]/20 text-[#B7312C] border-2 border-[#B7312C] rounded-full shadow-2xl">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-black text-white">
            Presentación Finalizada
          </h1>
          <div className="bg-[#193750] border border-[#425563] p-5 rounded-2xl shadow-xl space-y-2 text-center">
            <p className="text-sm font-bold text-[#ECEBE4]">
              El presentador ha cerrado o cancelado esta presentación.
            </p>
            <p className="text-xs text-[#ECEBE4]/70">
              Las preguntas ya no están activas y la sesión ha terminado.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("epivox_participant");
              navigate("/join");
            }}
            className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3.5 px-6 rounded-xl shadow-lg transition active:scale-95"
          >
            Unirse a otra Presentación
          </button>
        </main>

        <footer className="text-center text-xs text-[#ECEBE4] opacity-60">
          Epiroc Chile &bull; Experiencia Móvil de Participación
        </footer>
      </div>
    );
  }

  // 2. Estado: PODIO FINAL / SONDEO TERMINADO
  if (
    sessionStatus === "finished" ||
    currentStep === "podium" ||
    currentStep === "summary"
  ) {
    const isSurveyOrOpen =
      currentQuestion?.question_type === "word_cloud" ||
      currentQuestion?.question_type === "open_ended" ||
      currentQuestion?.question_type === "rating" ||
      (() => {
        try {
          return currentQuestion?.options_json
            ? JSON.parse(currentQuestion.options_json).length === 0
            : true;
        } catch {
          return true;
        }
      })();

    if (isSurveyOrOpen) {
      return (
        <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-6 text-center animate-in fade-in">
          <header className="py-2 border-b border-[#425563]">
            <span className="font-extrabold text-xl text-[#FFC72C]">
              EPIVOX
            </span>
          </header>

          <main className="my-auto space-y-6">
            <div className="inline-block p-5 bg-[#48A9C5]/20 text-[#48A9C5] border-2 border-[#48A9C5] rounded-full shadow-2xl">
              <CheckCircle2 className="w-16 h-16 mx-auto" />
            </div>
            <h1 className="text-3xl font-black text-white">
              ¡Sondeo Finalizado!
            </h1>
            <div className="bg-[#193750] border border-[#425563] p-6 rounded-2xl max-w-sm mx-auto shadow-xl space-y-2">
              <p className="text-base text-[#ECEBE4]">
                ¡Muchas gracias por tus ideas y opiniones!
              </p>
              <p className="text-xs text-[#ECEBE4] opacity-80 pt-2">
                El presentador está proyectando el resumen de respuestas en la
                pantalla principal.
              </p>
            </div>
          </main>

          <footer className="text-center text-xs text-[#ECEBE4] opacity-60">
            Epiroc Chile &bull; Experiencia Móvil de Participación
          </footer>
        </div>
      );
    }

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

        <ConnectionBanner isConnected={isConnected} />

        <main className="my-auto space-y-4 max-w-md mx-auto w-full">
          {currentQuestion?.question_text && (
            <div className="bg-[#193750] border border-[#425563] p-3.5 rounded-2xl text-center shadow-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC72C] block mb-1">
                Pregunta
              </span>
              <p className="text-sm font-bold text-white leading-snug">
                {currentQuestion.question_text}
              </p>
            </div>
          )}

          {(() => {
            const correctAnswerText = currentQuestion
              ? getCorrectAnswerDisplay(currentQuestion)
              : null;
            const userAnswerText =
              selectedAnswer && currentQuestion
                ? getSelectedAnswerDisplay(selectedAnswer, currentQuestion)
                : selectedAnswer;
            const explanation =
              lastFeedback?.explanationText ||
              currentQuestion?.explanation_text;

            if (lastFeedback) {
              const isPollOrOpen =
                lastFeedback.isPoll ||
                currentQuestion?.question_type === "word_cloud" ||
                currentQuestion?.question_type === "open_ended" ||
                currentQuestion?.question_type === "rating";

              if (isPollOrOpen) {
                return (
                  <div className="space-y-3">
                    <div className="bg-[#48A9C5]/20 border-2 border-[#48A9C5] p-5 rounded-3xl space-y-2 text-center shadow-lg">
                      <CheckCircle2 className="w-14 h-14 text-[#48A9C5] mx-auto" />
                      <h2 className="text-2xl font-black text-white">
                        ¡Respuesta Recibida!
                      </h2>
                      <p className="text-sm text-[#ECEBE4]">
                        Tu opinión ya se visualiza en la pantalla principal.
                      </p>
                    </div>

                    {userAnswerText && (
                      <div className="bg-[#193750] border border-[#425563] p-3 rounded-2xl text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#48A9C5] block mb-0.5">
                          Tu Aporte Registrado
                        </span>
                        <p className="text-sm font-black text-white">
                          {userAnswerText}
                        </p>
                      </div>
                    )}

                    {explanation && (
                      <div className="bg-[#193750] border border-[#FFC72C]/40 p-4 rounded-2xl text-left space-y-1.5 shadow-md">
                        <div className="flex items-center gap-2 text-[#FFC72C]">
                          <Lightbulb className="w-4 h-4 fill-[#FFC72C]/20" />
                          <span className="text-xs font-black uppercase tracking-wider">
                            Retroalimentación
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#ECEBE4] leading-relaxed">
                          {explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              }

              if (lastFeedback.isCorrect) {
                return (
                  <div className="space-y-3">
                    <div className="bg-[#4C8C2B]/20 border-2 border-[#4C8C2B] p-5 rounded-3xl space-y-2 text-center shadow-lg">
                      <CheckCircle2 className="w-14 h-14 text-[#4C8C2B] mx-auto" />
                      <h2 className="text-2xl font-black text-white">
                        ¡Correcto!
                      </h2>
                      <p className="text-2xl font-extrabold text-[#FFC72C]">
                        +{lastFeedback.pointsAwarded} pts
                      </p>
                      {lastFeedback.newStreak > 1 && (
                        <p className="text-sm font-bold text-[#FFC72C] flex items-center justify-center space-x-1">
                          <Flame className="w-5 h-5 text-orange-500 fill-orange-500 inline" />
                          <span>
                            ¡Racha de {lastFeedback.newStreak} aciertos!
                          </span>
                        </p>
                      )}
                    </div>

                    {correctAnswerText && (
                      <div className="bg-[#001E32]/90 border border-[#4C8C2B] p-3.5 rounded-2xl text-left flex items-start gap-3 shadow-md">
                        <div className="p-1.5 bg-[#4C8C2B]/20 rounded-lg text-[#4C8C2B] mt-0.5 shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-black uppercase text-[#86C8BC] tracking-wider block">
                            Respuesta Correcta
                          </span>
                          <p className="text-sm font-bold text-white break-words">
                            {correctAnswerText}
                          </p>
                        </div>
                      </div>
                    )}

                    {explanation && (
                      <div className="bg-[#193750] border border-[#FFC72C]/40 p-4 rounded-2xl text-left space-y-1.5 shadow-md">
                        <div className="flex items-center gap-2 text-[#FFC72C]">
                          <Lightbulb className="w-4 h-4 fill-[#FFC72C]/20" />
                          <span className="text-xs font-black uppercase tracking-wider">
                            Retroalimentación / Explicación
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#ECEBE4] leading-relaxed">
                          {explanation}
                        </p>
                      </div>
                    )}
                  </div>
                );
              }

              // Falló la respuesta
              return (
                <div className="space-y-3">
                  <div className="bg-[#B7312C]/20 border-2 border-[#B7312C] p-5 rounded-3xl space-y-2 text-center shadow-lg">
                    <XCircle className="w-14 h-14 text-[#B7312C] mx-auto" />
                    <h2 className="text-2xl font-black text-white">
                      ¡Ups, no era esa!
                    </h2>
                    <p className="text-xs text-[#ECEBE4]">
                      ¡Ánimo! Revisa la retroalimentación a continuación:
                    </p>
                  </div>

                  {userAnswerText && (
                    <div className="bg-[#001E32]/90 border border-[#B7312C]/60 p-3.5 rounded-2xl text-left flex items-start gap-3 shadow-md">
                      <div className="p-1.5 bg-[#B7312C]/20 rounded-lg text-[#B7312C] mt-0.5 shrink-0">
                        <XCircle className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase text-[#FFA6A3] tracking-wider block">
                          Tu Respuesta
                        </span>
                        <p className="text-sm font-bold text-white line-through opacity-80 break-words">
                          {userAnswerText}
                        </p>
                      </div>
                    </div>
                  )}

                  {correctAnswerText && (
                    <div className="bg-[#001E32]/90 border border-[#4C8C2B] p-3.5 rounded-2xl text-left flex items-start gap-3 shadow-md">
                      <div className="p-1.5 bg-[#4C8C2B]/20 rounded-lg text-[#4C8C2B] mt-0.5 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase text-[#86C8BC] tracking-wider block">
                          Respuesta Correcta
                        </span>
                        <p className="text-sm font-black text-white break-words">
                          {correctAnswerText}
                        </p>
                      </div>
                    </div>
                  )}

                  {explanation && (
                    <div className="bg-[#193750] border-2 border-[#FFC72C]/50 p-4 rounded-2xl text-left space-y-1.5 shadow-md">
                      <div className="flex items-center gap-2 text-[#FFC72C]">
                        <Lightbulb className="w-5 h-5 fill-[#FFC72C]/20" />
                        <span className="text-xs font-black uppercase tracking-wider">
                          Retroalimentación / Explicación
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#ECEBE4] leading-relaxed font-medium">
                        {explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            // Tiempo agotado sin respuesta
            return (
              <div className="space-y-3">
                <div className="bg-[#193750] border border-[#425563] p-5 rounded-3xl space-y-2 text-center shadow-lg">
                  <Clock className="w-12 h-12 text-[#FFC72C] mx-auto" />
                  <h2 className="text-2xl font-bold text-white">
                    Tiempo Agotado
                  </h2>
                  <p className="text-xs text-[#ECEBE4]">
                    No alcanzaste a enviar tu respuesta a tiempo.
                  </p>
                </div>

                {correctAnswerText && (
                  <div className="bg-[#001E32]/90 border border-[#4C8C2B] p-3.5 rounded-2xl text-left flex items-start gap-3 shadow-md">
                    <div className="p-1.5 bg-[#4C8C2B]/20 rounded-lg text-[#4C8C2B] mt-0.5 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase text-[#86C8BC] tracking-wider block">
                        Respuesta Correcta
                      </span>
                      <p className="text-sm font-black text-white break-words">
                        {correctAnswerText}
                      </p>
                    </div>
                  </div>
                )}

                {explanation && (
                  <div className="bg-[#193750] border-2 border-[#FFC72C]/50 p-4 rounded-2xl text-left space-y-1.5 shadow-md">
                    <div className="flex items-center gap-2 text-[#FFC72C]">
                      <Lightbulb className="w-5 h-5 fill-[#FFC72C]/20" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        Retroalimentación / Explicación
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#ECEBE4] leading-relaxed font-medium">
                      {explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
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

      <ConnectionBanner isConnected={isConnected} />

      {/* Cuerpo principal según si ya respondió o no */}
      <main className="my-auto max-w-md w-full mx-auto space-y-4">
        {hasAnswered ? (
          <div className="bg-[#193750] border-2 border-[#FFC72C] p-6 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-[#FFC72C]/20 text-[#FFC72C] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              ¡Respuesta Enviada!
            </h2>
            {currentQuestion?.question_text && (
              <div className="bg-[#001E32] border border-[#425563] p-3 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-[#FFC72C] tracking-wider block mb-0.5">
                  Pregunta respondida
                </span>
                <p className="text-xs text-white font-semibold">
                  {currentQuestion.question_text}
                </p>
              </div>
            )}
            {selectedAnswer && (
              <p className="text-xs uppercase tracking-wider text-[#FFC72C] font-bold">
                Opción registrada:{" "}
                {getSelectedAnswerDisplay(selectedAnswer, currentQuestion) ||
                  selectedAnswer}
              </p>
            )}
            <p className="text-sm text-[#ECEBE4] opacity-80">
              Esperando a que el resto de los participantes terminen de
              responder...
            </p>
          </div>
        ) : (
          <>
            {/* Tarjeta con el Enunciado de la Pregunta */}
            {currentQuestion?.question_text && (
              <div className="bg-[#193750] border-2 border-[#FFC72C]/70 p-4 rounded-2xl shadow-xl space-y-1 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFC72C] block">
                  Pregunta
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                  {currentQuestion.question_text}
                </h2>
              </div>
            )}
            {/* Pregunta tipo: Verdadero / Falso */}
            {currentQuestion?.question_type === "true_false" && (
              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  disabled={hasAnswered || hasSubmittedRef.current}
                  onClick={() => {
                    const optT = parsedOptions.find(
                      (o) =>
                        o.id === "true" ||
                        o.id === "A" ||
                        o.text?.toLowerCase().includes("verdadero"),
                    );
                    handleAnswerSubmit(optT ? optT.id : "true");
                  }}
                  className="bg-[#4C8C2B] hover:bg-[#3E7323] text-white font-black text-2xl py-8 rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-8 h-8" />
                  <span>VERDADERO</span>
                </button>
                <button
                  type="button"
                  disabled={hasAnswered || hasSubmittedRef.current}
                  onClick={() => {
                    const optF = parsedOptions.find(
                      (o) =>
                        o.id === "false" ||
                        o.id === "B" ||
                        o.text?.toLowerCase().includes("falso"),
                    );
                    handleAnswerSubmit(optF ? optF.id : "false");
                  }}
                  className="bg-[#B7312C] hover:bg-[#962824] text-white font-black text-2xl py-8 rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                  <XCircle className="w-8 h-8" />
                  <span>FALSO</span>
                </button>
              </div>
            )}

            {/* Pregunta tipo: Calificación con Estrellas (1-5 ⭐) */}
            {currentQuestion?.question_type === "rating" && (
              <div className="bg-[#193750] border-2 border-[#425563] p-6 rounded-3xl space-y-6 text-center shadow-2xl">
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC72C]">
                    Calificación de la Audiencia
                  </span>
                  <h3 className="text-base font-black text-white">
                    {currentQuestion.question_text}
                  </h3>
                </div>

                {/* 5 Estrellas Interactivas */}
                <div className="flex justify-center items-center gap-2 py-3">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= (selectedRating || 0);
                    return (
                      <button
                        key={starVal}
                        type="button"
                        disabled={hasAnswered || hasSubmittedRef.current}
                        onClick={() => setSelectedRating(starVal)}
                        className="p-1 transition-transform active:scale-90 hover:scale-110 focus:outline-none disabled:opacity-40"
                        aria-label={`${starVal} estrellas`}
                      >
                        <Star
                          className={`w-12 h-12 transition-all ${
                            isFilled
                              ? "text-[#FFC72C] fill-[#FFC72C] drop-shadow-[0_0_10px_rgba(255,199,44,0.7)]"
                              : "text-[#425563] hover:text-[#FFC72C]/40"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-[24px] text-xs font-bold text-[#ECEBE4]/80">
                  {selectedRating > 0 ? (
                    <span className="text-[#FFC72C] font-black text-sm">
                      {selectedRating === 1 &&
                        "★ 1 Estrella (Muy insatisfecho)"}
                      {selectedRating === 2 && "★★ 2 Estrellas (Insatisfecho)"}
                      {selectedRating === 3 && "★★★ 3 Estrellas (Neutral)"}
                      {selectedRating === 4 && "★★★★ 4 Estrellas (Satisfecho)"}
                      {selectedRating === 5 && "★★★★★ 5 Estrellas (Excelente)"}
                    </span>
                  ) : (
                    "Toca las estrellas para calificar"
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    selectedRating === 0 ||
                    hasAnswered ||
                    hasSubmittedRef.current
                  }
                  onClick={() => handleAnswerSubmit(String(selectedRating))}
                  className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-base py-3.5 rounded-xl transition shadow-xl disabled:opacity-40 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Star className="w-5 h-5 fill-[#001E32]" />
                  <span>
                    Enviar Calificación{" "}
                    {selectedRating > 0 ? `(${selectedRating} ⭐)` : ""}
                  </span>
                </button>
              </div>
            )}

            {/* Pregunta tipo: Selección Múltiple (adaptable para 2 a 6 opciones sin tapar ninguna) */}
            {(currentQuestion?.question_type === "multiple_choice" ||
              (!currentQuestion?.question_type &&
                currentQuestion?.question_type !== "rating")) && (
              <div className="grid grid-cols-2 gap-2.5 max-h-[56vh] overflow-y-auto p-1">
                {parsedOptions.map((opt, idx) => {
                  const cfg =
                    EPIROC_OPTION_CONFIGS[idx % EPIROC_OPTION_CONFIGS.length];
                  const is5thCentered = parsedOptions.length === 5 && idx === 4;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={hasAnswered || hasSubmittedRef.current}
                      onClick={() => handleAnswerSubmit(opt.id)}
                      className={`${cfg.bgColor} ${cfg.textColor} ${
                        is5thCentered ? "col-span-2" : ""
                      } font-extrabold p-3.5 rounded-2xl shadow-xl active:scale-95 transition flex flex-col items-center justify-center min-h-[95px] disabled:opacity-50`}
                    >
                      <div className="mb-1 flex items-center justify-center">
                        <EpirocOptionIcon index={idx} size="md" />
                      </div>
                      <span className="text-center text-sm line-clamp-3 leading-snug">
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
                  disabled={hasAnswered || hasSubmittedRef.current}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Escribe aquí..."
                  className="w-full text-center text-xl font-bold py-3 px-4 rounded-xl bg-[#001E32] border-2 border-[#425563] focus:border-[#FFC72C] text-white focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={
                    !textAnswer.trim() || hasAnswered || hasSubmittedRef.current
                  }
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
                      disabled={hasAnswered || hasSubmittedRef.current}
                      onClick={() => handleAnswerSubmit(num.toString())}
                      className="bg-[#001E32] hover:bg-[#FFC72C] hover:text-[#001E32] text-white border-2 border-[#425563] font-black text-2xl py-6 rounded-xl transition shadow active:scale-95 disabled:opacity-50"
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
