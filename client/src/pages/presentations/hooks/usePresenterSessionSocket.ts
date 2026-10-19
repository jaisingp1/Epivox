import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { getSocket } from "../../../services/socket";
import type {
  ActiveSessionData,
  ParticipantInfo,
  SessionQuestionItem,
} from "../types";

export function usePresenterSessionSocket() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(
    null,
  );
  const [activeParticipants, setActiveParticipants] = useState<
    ParticipantInfo[]
  >([]);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [liveResults, setLiveResults] = useState<Record<string, number>>({});
  const [remainingTime, setRemainingTime] = useState(30);
  const [currentQuestions, setCurrentQuestions] = useState<
    SessionQuestionItem[]
  >([]);

  // Detectar y montar automáticamente sesión activa si viene por query param ?sessionPin=XXXX
  useEffect(() => {
    const sessionPin = searchParams.get("sessionPin");
    if (sessionPin && (!activeSession || activeSession.pin !== sessionPin)) {
      fetch(`/api/epivox/sessions/${sessionPin}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.session) {
            setActiveSession({
              id: data.session.id,
              pin: data.session.pin,
              status: data.session.status,
              current_question_index: data.session.current_question_index || 0,
              current_step: data.session.current_step || "lobby",
              activity_id: data.session.activity_id,
            });
            const socket = getSocket();
            socket.emit("presenter:join", { pin: data.session.pin });
          }
        })
        .catch((err) =>
          console.error("Error al restaurar sesión activa por PIN:", err),
        );
    }
  }, [searchParams, activeSession]);

  // WebSockets para monitoreo en vivo de la sesión seleccionada
  useEffect(() => {
    if (!activeSession) return;
    const socket = getSocket();
    const pin = activeSession.pin;

    socket.emit("presenter:join", { pin });

    socket.on(
      "presenter:sync",
      (data: {
        session: ActiveSessionData;
        participants: ParticipantInfo[];
        questions: SessionQuestionItem[];
        totalAnswers?: number;
        liveResults?: Record<string, number>;
      }) => {
        setActiveSession(data.session);
        setActiveParticipants(data.participants || []);
        setCurrentQuestions(data.questions || []);
        if (data.totalAnswers !== undefined) setTotalAnswers(data.totalAnswers);
        if (data.liveResults) setLiveResults(data.liveResults);
      },
    );

    socket.on(
      "lobby:participants_update",
      (data: { participants: ParticipantInfo[] }) => {
        setActiveParticipants(data.participants || []);
      },
    );

    socket.on(
      "results:live_update",
      (data: { totalAnswers: number; results: Record<string, number> }) => {
        setTotalAnswers(data.totalAnswers);
        setLiveResults(data.results);
      },
    );

    socket.on(
      "session:state_changed",
      (data: {
        status: string;
        currentStep: string;
        currentQuestionIndex?: number;
        results?: Record<string, number>;
        totalAnswers?: number;
      }) => {
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                current_step: data.currentStep,
                current_question_index:
                  data.currentQuestionIndex !== undefined
                    ? data.currentQuestionIndex
                    : prev.current_question_index,
              }
            : null,
        );
        if (data.results) setLiveResults(data.results);
        if (data.totalAnswers !== undefined) setTotalAnswers(data.totalAnswers);
      },
    );

    socket.on("timer:tick", (data: { remaining: number }) => {
      setRemainingTime(data.remaining);
    });

    return () => {
      socket.off("presenter:sync");
      socket.off("lobby:participants_update");
      socket.off("results:live_update");
      socket.off("session:state_changed");
      socket.off("timer:tick");
    };
  }, [activeSession?.pin]);

  const clearActiveSession = () => {
    setActiveSession(null);
    setSearchParams({});
  };

  return {
    activeSession,
    setActiveSession,
    activeParticipants,
    totalAnswers,
    liveResults,
    remainingTime,
    currentQuestions,
    clearActiveSession,
  };
}
