import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import QRCode from "qrcode";
import { getSocket } from "../../services/socket";

import type {
  FloatingReaction,
  ParticipantData,
  QuestionData,
  QuestionOption,
  RawAnswerItem,
  SessionData,
} from "./types";
import PresentationHeader from "./components/PresentationHeader";
import LobbyStepView from "./components/LobbyStepView";
import QuestionStepView from "./components/QuestionStepView";
import ResultsStepView from "./components/ResultsStepView";
import LeaderboardStepView from "./components/LeaderboardStepView";
import PodiumSummaryStepView from "./components/PodiumSummaryStepView";
import CancelPresentationModal from "./modals/CancelPresentationModal";

export default function PresentationPage() {
  const { pin } = useParams<{ pin: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionData | null>(null);
  const [participants, setParticipants] = useState<ParticipantData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>("lobby");
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
    FloatingReaction[]
  >([]);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    setOverrideChartType(null);
  }, [currentQIndex]);

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
        session: SessionData;
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
      <PresentationHeader
        pin={pin}
        participantsCount={participants.length}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onOpenCancelModal={() => setIsCancelModalOpen(true)}
      />

      {/* 1. LOBBY VIEW (SALA DE ESPERA) */}
      {currentStep === "lobby" && (
        <LobbyStepView
          pin={pin}
          qrCodeDataUrl={qrCodeDataUrl}
          participants={participants}
          onStartGame={() => handlePresenterAction("start_game")}
        />
      )}

      {/* 2. QUESTION VIEW (PREGUNTA ACTIVA) */}
      {currentStep === "question" && currentQ && (
        <QuestionStepView
          currentQ={currentQ}
          currentQIndex={currentQIndex}
          totalQuestions={questions.length}
          remainingTime={remainingTime}
          totalAnswers={totalAnswers}
          participants={participants}
          parsedOptions={parsedOptions}
          liveResults={liveResults}
          rawAnswers={rawAnswers}
          overrideChartType={overrideChartType}
          onChartTypeChange={handleChartTypeChange}
          isOpenQuestion={isOpenQuestion}
          onPresenterAction={handlePresenterAction}
        />
      )}

      {/* 3. RESULTS VIEW (GRÁFICOS EN VIVO ESTILO MENTIMETER O CALIFICACIÓN) */}
      {currentStep === "results" && currentQ && (
        <ResultsStepView
          currentQ={currentQ}
          currentQIndex={currentQIndex}
          totalQuestions={questions.length}
          totalAnswers={totalAnswers}
          parsedOptions={parsedOptions}
          liveResults={liveResults}
          rawAnswers={rawAnswers}
          overrideChartType={overrideChartType}
          onChartTypeChange={handleChartTypeChange}
          isOpenQuestion={isOpenQuestion}
          onPresenterAction={handlePresenterAction}
        />
      )}

      {/* 4. LEADERBOARD VIEW (SOLO PARA CUESTIONARIOS GAMIFICADOS) */}
      {!isOpenQuestion && currentStep === "leaderboard" && (
        <LeaderboardStepView
          leaderboard={leaderboard}
          currentQIndex={currentQIndex}
          totalQuestions={questions.length}
          onNextQuestion={() => handlePresenterAction("next_question")}
        />
      )}

      {/* 5. VISTA FINAL: RESUMEN DE SONDEO O PODIO DE GAMIFICACIÓN */}
      {(currentStep === "summary" ||
        currentStep === "podium" ||
        session?.status === "finished") && (
        <PodiumSummaryStepView
          isOpenQuestion={isOpenQuestion}
          leaderboard={leaderboard}
        />
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-[#ECEBE4] opacity-50 py-2 border-t border-[#425563]/40">
        Epiroc Chile S.A.C. &bull; Epivox Sistema de Gamificación
      </footer>

      {/* Modal de Confirmación para Cancelar Presentación */}
      <CancelPresentationModal
        isOpen={isCancelModalOpen}
        pin={pin}
        isCancelling={isCancelling}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelPresentation}
      />
    </div>
  );
}
