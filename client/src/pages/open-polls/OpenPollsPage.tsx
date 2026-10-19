import React, { useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2 } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { getSocket } from "../../services/socket";
import { DraftQuestion, SessionQuestion } from "./types";
import { PollDraftBuilder } from "./components/PollDraftBuilder";
import { LivePollHeader } from "./components/LivePollHeader";
import { LivePollVisualizer } from "./components/LivePollVisualizer";
import { QrCodeModal } from "./modals/QrCodeModal";

import { useOpenPollSocket } from "./hooks/useOpenPollSocket";

export const OpenPollsPage: React.FC = () => {
  // Configuración del set de preguntas previo al lanzamiento
  const [pollTitle, setPollTitle] = useState(
    "Sondeo de Opinión y Feedback en Vivo",
  );
  const [draftQuestions, setDraftQuestions] = useState<DraftQuestion[]>([
    {
      id: "q-1",
      questionText:
        "¿Qué iniciativa o idea propones para fortalecer la seguridad en nuestras faenas?",
      chartType: "word_cloud",
    },
    {
      id: "q-2",
      questionText:
        "¿Cuál es el principal desafío operativo que enfrentas en tu día a día?",
      chartType: "bar",
    },
  ]);
  const [isLaunching, setIsLaunching] = useState(false);

  // Sesión activa y WebSockets gestionados mediante hook
  const {
    activeSession,
    setActiveSession,
    sessionQuestions,
    setSessionQuestions,
    currentQIndex,
    setCurrentQIndex,
    sessionStatus,
    activeParticipants,
    totalAnswers,
    liveResults,
    rawAnswers,
    activeChartType,
    setActiveChartType,
    clearSession,
  } = useOpenPollSocket();

  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [ephemeralActivityId, setEphemeralActivityId] = useState<number | null>(
    null,
  );

  // Manejo de preguntas en borrador
  const handleAddQuestion = () => {
    const newId = `q-${Date.now()}`;
    setDraftQuestions((prev) => [
      ...prev,
      {
        id: newId,
        questionText: "",
        chartType: "word_cloud",
      },
    ]);
  };

  const handleRemoveQuestion = (id: string) => {
    if (draftQuestions.length <= 1) return;
    setDraftQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleUpdateDraft = (
    id: string,
    field: "questionText" | "chartType",
    value: string,
  ) => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  // Lanzar el set completo de sondeos abiertos
  const handleLaunchPoll = async () => {
    const validQuestions = draftQuestions.filter(
      (q) => q.questionText.trim().length > 0,
    );
    if (validQuestions.length === 0) return;

    setIsLaunching(true);
    try {
      // 1. Crear actividad de tipo open_poll
      const actRes = await fetch("/api/epivox/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pollTitle.trim().substring(0, 80) || "Sondeo de Opinión",
          category: "Sondeo Mentimeter",
          activity_type: "open_poll",
          default_time_limit: 120,
          default_points: 0,
        }),
      });
      const activity = await actRes.json();
      if (activity?.id) {
        setEphemeralActivityId(activity.id);
      }

      // 2. Crear cada una de las preguntas abiertas del set
      const createdQuestions: SessionQuestion[] = [];
      for (let i = 0; i < validQuestions.length; i++) {
        const dq = validQuestions[i];
        const qRes = await fetch(
          `/api/epivox/activities/${activity.id}/questions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sort_order: i + 1,
              question_text: dq.questionText.trim(),
              question_type: "word_cloud",
              chart_type: dq.chartType,
              time_limit: 120,
              points_base: 0,
              options_json: "[]",
            }),
          },
        );
        const q = await qRes.json();
        createdQuestions.push(q);
      }

      // 3. Crear sesión en vivo
      const sessRes = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: activity.id, mode: "live" }),
      });
      const session = await sessRes.json();

      if (session && session.pin) {
        setActiveSession({ id: session.id, pin: session.pin });
        setSessionQuestions(createdQuestions);
        setCurrentQIndex(0);
        if (createdQuestions[0]?.chart_type) {
          setActiveChartType(createdQuestions[0].chart_type);
        }

        const socket = getSocket();
        socket.emit("presenter:join", { pin: session.pin });
        socket.emit("presenter:action", {
          pin: session.pin,
          action: "start_game",
          questionIndex: 0,
        });
      }
    } catch (err) {
      console.error("Error al lanzar sondeo:", err);
    } finally {
      setIsLaunching(false);
    }
  };

  const handleNextQuestion = () => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "next_question",
    });
  };

  const handlePrevQuestion = () => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "prev_question",
    });
  };

  const handleJumpToQuestion = (idx: number) => {
    if (!activeSession || idx === currentQIndex) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "jump_to_question",
      questionIndex: idx,
    });
  };

  const handleFinishSession = () => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "finish_session",
    });
  };

  const handlePushCurrentQuestion = () => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action: "jump_to_question",
      questionIndex: currentQIndex,
    });
  };

  const handleSwitchChart = (newChartType: string) => {
    setActiveChartType(newChartType);
    if (!activeSession) return;
    const activeQ = sessionQuestions[currentQIndex];
    if (!activeQ) return;
    const socket = getSocket();
    socket.emit("presenter:set_chart_type", {
      pin: activeSession.pin,
      questionId: activeQ.id,
      chartType: newChartType,
    });
  };

  const handleCopyLink = () => {
    if (!activeSession) return;
    const link = `${window.location.origin}/join?pin=${activeSession.pin}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenQR = async () => {
    if (!activeSession) return;
    const link = `${window.location.origin}/join?pin=${activeSession.pin}`;
    try {
      const qr = await QRCode.toDataURL(link, {
        width: 300,
        margin: 1,
        color: { dark: "#001E32", light: "#FFC72C" },
      });
      setQrModalUrl(qr);
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetSession = () => {
    if (ephemeralActivityId) {
      fetch(`/api/epivox/activities/${ephemeralActivityId}`, {
        method: "DELETE",
      }).catch((err) => console.error("Error al limpiar sondeo efímero:", err));
      setEphemeralActivityId(null);
    }
    clearSession();
  };

  const currentActiveQuestion = sessionQuestions[currentQIndex] || null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Preguntas Abiertas (Estilo Mentimeter)"
        description="Sondeos de opinión e ideas en vivo con soporte para un set de preguntas sucesivas. Los participantes responden desde su móvil sin necesidad de volver a ingresar el PIN."
        breadcrumbs={[
          { label: "Epivox", href: "/" },
          { label: "Preguntas Abiertas" },
        ]}
        badge={
          <span className="px-3 py-1 bg-[#48A9C5]/15 border border-[#48A9C5]/40 text-[#48A9C5] text-xs font-bold rounded-full">
            Modo Audiencia
          </span>
        }
      />

      {!activeSession ? (
        <PollDraftBuilder
          pollTitle={pollTitle}
          setPollTitle={setPollTitle}
          draftQuestions={draftQuestions}
          handleAddQuestion={handleAddQuestion}
          handleRemoveQuestion={handleRemoveQuestion}
          handleUpdateDraft={handleUpdateDraft}
          isLaunching={isLaunching}
          handleLaunchPoll={handleLaunchPoll}
        />
      ) : (
        <div className="space-y-6">
          <LivePollHeader
            pin={activeSession.pin}
            copiedLink={copiedLink}
            activeParticipantsCount={activeParticipants.length}
            totalAnswers={totalAnswers}
            sessionQuestions={sessionQuestions}
            currentQIndex={currentQIndex}
            handleCopyLink={handleCopyLink}
            handleOpenQR={handleOpenQR}
            handlePushCurrentQuestion={handlePushCurrentQuestion}
            handleJumpToQuestion={handleJumpToQuestion}
            handleResetSession={handleResetSession}
          />

          {sessionStatus === "finished" ? (
            <div className="bg-[var(--surface-card)] border-2 border-[#4C8C2B] rounded-3xl p-10 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-[#4C8C2B]/15 border-2 border-[#4C8C2B] text-[#4C8C2B] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-3xl font-black text-[var(--text-main)]">
                ¡Sondeo de Opinión Concluido!
              </h3>
              <p className="text-base text-[var(--text-subtle)] max-w-xl mx-auto">
                Todas las preguntas fueron presentadas y las respuestas del
                público han sido registradas exitosamente.
              </p>
              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetSession}
                  className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 px-6 rounded-xl transition shadow-sm cursor-pointer"
                >
                  Crear Nuevo Sondeo
                </button>
              </div>
            </div>
          ) : (
            <LivePollVisualizer
              currentActiveQuestion={currentActiveQuestion}
              currentQIndex={currentQIndex}
              totalQuestions={sessionQuestions.length}
              activeChartType={activeChartType}
              pin={activeSession.pin}
              totalAnswers={totalAnswers}
              liveResults={liveResults}
              rawAnswers={rawAnswers}
              handleSwitchChart={handleSwitchChart}
              handlePrevQuestion={handlePrevQuestion}
              handleNextQuestion={handleNextQuestion}
              handleFinishSession={handleFinishSession}
            />
          )}
        </div>
      )}

      <QrCodeModal
        qrModalUrl={qrModalUrl}
        onClose={() => setQrModalUrl(null)}
      />
    </div>
  );
};

export default OpenPollsPage;
