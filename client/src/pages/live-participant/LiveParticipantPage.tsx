import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSocket } from "../../services/socket";
import { QuestionData, ParticipantData, LastFeedbackData } from "./types";
import { LobbyView } from "./components/LobbyView";
import { CancelledView } from "./components/CancelledView";
import { PodiumSummaryView } from "./components/PodiumSummaryView";
import { ResultsFeedbackView } from "./components/ResultsFeedbackView";
import { QuestionAnswerPad } from "./components/QuestionAnswerPad";

export const LiveParticipantPage: React.FC = () => {
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
  const [lastFeedback, setLastFeedback] = useState<LastFeedbackData | null>(
    null,
  );
  const [participant, setParticipant] = useState<ParticipantData | null>(null);
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

    // 2. Reconexión automática de socket
    const handleConnect = () => {
      setIsConnected(true);
      requestSync();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // 3. Al desbloquear el celular o volver a la pestaña activa
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

    // 4. Heartbeat de respaldo cada 3.5 segundos
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
      sessionStorage.removeItem("epivox_participant");
      setSessionStatus("cancelled");
      setCurrentStep("cancelled");
      setCurrentQuestion(null);
      setRemainingTime(0);
    });

    socket.on("timer:tick", (data: { remaining: number }) => {
      setRemainingTime(data.remaining);
    });

    socket.on("timer:expired", () => {
      setRemainingTime(0);
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
      socket.off("timer:expired");
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
      remainingTime <= 0 ||
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

  // 1. Sala de espera
  if (sessionStatus === "lobby") {
    return (
      <LobbyView
        pin={pin}
        participant={participant}
        isConnected={isConnected}
        handleSendReaction={handleSendReaction}
      />
    );
  }

  // 2. Sesión Cancelada
  if (sessionStatus === "cancelled" || currentStep === "cancelled") {
    return <CancelledView />;
  }

  // 3. Podio / Resumen Final
  if (
    sessionStatus === "finished" ||
    currentStep === "podium" ||
    currentStep === "summary"
  ) {
    return (
      <PodiumSummaryView
        currentQuestion={currentQuestion}
        participant={participant}
      />
    );
  }

  // 4. Resultados de la pregunta
  if (currentStep === "results" || sessionStatus === "question_closed") {
    return (
      <ResultsFeedbackView
        currentQuestion={currentQuestion}
        participant={participant}
        selectedAnswer={selectedAnswer}
        lastFeedback={lastFeedback}
        isConnected={isConnected}
      />
    );
  }

  // 5. Pregunta Activa (Teclado de Respuestas)
  return (
    <QuestionAnswerPad
      currentQuestion={currentQuestion}
      participant={participant}
      remainingTime={remainingTime}
      hasAnswered={hasAnswered}
      hasSubmitted={hasSubmittedRef.current}
      selectedAnswer={selectedAnswer}
      selectedRating={selectedRating}
      setSelectedRating={setSelectedRating}
      textAnswer={textAnswer}
      setTextAnswer={setTextAnswer}
      isConnected={isConnected}
      pin={pin}
      handleAnswerSubmit={handleAnswerSubmit}
    />
  );
};

export default LiveParticipantPage;
