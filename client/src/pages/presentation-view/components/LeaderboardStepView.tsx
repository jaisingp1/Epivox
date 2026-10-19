import { Trophy, ArrowRight } from "lucide-react";
import type { ParticipantData } from "../types";

interface LeaderboardStepViewProps {
  leaderboard: ParticipantData[];
  currentQIndex: number;
  totalQuestions: number;
  onNextQuestion: () => void;
}

export default function LeaderboardStepView({
  leaderboard,
  currentQIndex,
  totalQuestions,
  onNextQuestion,
}: LeaderboardStepViewProps) {
  return (
    <main className="my-auto max-w-3xl w-full mx-auto space-y-6 py-6 text-center">
      <div className="space-y-1">
        <div className="inline-block p-3 bg-[#FFC72C] text-[#001E32] rounded-2xl shadow-lg mb-2">
          <Trophy className="w-10 h-10" />
        </div>
        <h2 className="text-4xl font-black text-white">Tabla de Posiciones</h2>
        <p className="text-sm text-[#ECEBE4] opacity-80">
          Top 5 participantes más rápidos y acertados
        </p>
      </div>

      <div className="bg-[#193750] border border-[#425563] rounded-3xl p-6 shadow-2xl space-y-3">
        {leaderboard.map((p, idx) => (
          <div
            key={p.id}
            className="flex items-center justify-between bg-[#001E32] border border-[#425563] p-4 rounded-2xl text-lg font-bold"
          >
            <div className="flex items-center space-x-4">
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
                  idx === 0
                    ? "bg-[#FFC72C] text-[#001E32]"
                    : idx === 1
                      ? "bg-gray-300 text-black"
                      : idx === 2
                        ? "bg-amber-700 text-white"
                        : "bg-[#193750] text-[#ECEBE4]"
                }`}
              >
                {idx + 1}
              </span>
              <span className="text-white">{p.nickname}</span>
            </div>
            <span className="font-mono text-xl text-[#FFC72C] font-extrabold">
              {p.score} pts
            </span>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNextQuestion}
          className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition cursor-pointer"
        >
          <span>
            {currentQIndex + 1 < totalQuestions
              ? "Siguiente Pregunta"
              : "Ver Podio Final"}
          </span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </main>
  );
}
