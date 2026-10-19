import { useState, useEffect } from "react";
import { getSocket } from "../../../services/socket";
import type { SessionQuestion, RawAnswerItem } from "../types";

export function useOpenPollSocket() {
  const [activeSession, setActiveSession] = useState<{
    id: number;
    pin: string;
  } | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>(
    [],
  );
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [sessionStatus, setSessionStatus] = useState<string>("lobby");
  const [activeParticipants, setActiveParticipants] = useState<
    Array<{ id: number; nickname: string }>
  >([]);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [liveResults, setLiveResults] = useState<Record<string, number>>({});
  const [rawAnswers, setRawAnswers] = useState<RawAnswerItem[]>([]);
  const [activeChartType, setActiveChartType] = useState<string>("word_cloud");

  // WebSockets para sincronización en tiempo real del sondeo multi-pregunta
  useEffect(() => {
    if (!activeSession) return;
    const socket = getSocket();
    const pin = activeSession.pin;

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
        if (data.question && data.question.chart_type) {
          setActiveChartType(data.question.chart_type);
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

  const clearSession = () => {
    setActiveSession(null);
    setSessionQuestions([]);
    setCurrentQIndex(0);
    setSessionStatus("lobby");
    setActiveParticipants([]);
    setTotalAnswers(0);
    setLiveResults({});
    setRawAnswers([]);
  };

  return {
    activeSession,
    setActiveSession,
    sessionQuestions,
    setSessionQuestions,
    currentQIndex,
    setCurrentQIndex,
    sessionStatus,
    setSessionStatus,
    activeParticipants,
    setActiveParticipants,
    totalAnswers,
    setTotalAnswers,
    liveResults,
    setLiveResults,
    rawAnswers,
    setRawAnswers,
    activeChartType,
    setActiveChartType,
    clearSession,
  };
}
