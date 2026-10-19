import { useState, useEffect } from "react";
import { getSocket } from "../../../services/socket";
import type { QuestionData } from "../types";

export function usePresenterRemoteSocket(pin: string | undefined) {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("lobby");
  const [remainingTime, setRemainingTime] = useState<number>(30);
  const [participantsCount, setParticipantsCount] = useState<number>(0);
  const [totalAnswers, setTotalAnswers] = useState<number>(0);

  useEffect(() => {
    if (!pin) return;
    const socket = getSocket();

    const syncRemote = () => {
      socket.emit("presenter:join", { pin });
    };

    syncRemote();
    socket.on("connect", syncRemote);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        if (!socket.connected) socket.connect();
        syncRemote();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", syncRemote);

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
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", syncRemote);
      socket.off("connect", syncRemote);
      socket.off("presenter:sync");
      socket.off("lobby:participants_update");
      socket.off("session:state_changed");
      socket.off("timer:tick");
      socket.off("results:live_update");
    };
  }, [pin]);

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

  return {
    questions,
    currentQIndex,
    currentStep,
    remainingTime,
    participantsCount,
    totalAnswers,
    handleAction,
  };
}
