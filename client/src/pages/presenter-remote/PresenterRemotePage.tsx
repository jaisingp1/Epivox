import { useParams } from "react-router-dom";
import { usePresenterRemoteSocket } from "./hooks/usePresenterRemoteSocket";
import { RemoteHeader } from "./components/RemoteHeader";
import { RemoteControlCard } from "./components/RemoteControlCard";
import { RemoteQuestionsList } from "./components/RemoteQuestionsList";

export default function PresenterRemotePage() {
  const { pin } = useParams<{ pin: string }>();

  const {
    questions,
    currentQIndex,
    currentStep,
    remainingTime,
    participantsCount,
    totalAnswers,
    handleAction,
  } = usePresenterRemoteSocket(pin);

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-4 selection:bg-[#FFC72C] selection:text-[#001E32]">
      {/* Header Remoto */}
      <RemoteHeader pin={pin} participantsCount={participantsCount} />

      {/* Main Control Panel */}
      <main className="my-auto max-w-lg w-full mx-auto space-y-4 py-2">
        <RemoteControlCard
          currentStep={currentStep}
          remainingTime={remainingTime}
          totalAnswers={totalAnswers}
          currentQIndex={currentQIndex}
          questions={questions}
          onAction={handleAction}
        />

        <RemoteQuestionsList
          questions={questions}
          currentQIndex={currentQIndex}
          currentStep={currentStep}
          onJumpToQuestion={(idx) => handleAction("jump_to_question", idx)}
        />
      </main>

      <footer className="text-center text-xs text-[#ECEBE4] opacity-50 py-1">
        Epiroc Epivox &bull; Modo Control Remoto Móvil
      </footer>
    </div>
  );
}
