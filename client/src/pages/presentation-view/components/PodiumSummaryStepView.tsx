import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import AnimatedPodium from "../../../components/AnimatedPodium";
import type { ParticipantData } from "../types";

interface PodiumSummaryStepViewProps {
  isOpenQuestion: boolean;
  leaderboard: ParticipantData[];
}

export default function PodiumSummaryStepView({
  isOpenQuestion,
  leaderboard,
}: PodiumSummaryStepViewProps) {
  if (isOpenQuestion) {
    return (
      <main className="my-auto max-w-4xl w-full mx-auto space-y-8 py-8 text-center animate-in fade-in">
        <div className="inline-block p-6 bg-[#48A9C5]/20 border-2 border-[#48A9C5] text-[#48A9C5] rounded-full shadow-2xl">
          <CheckCircle2 className="w-16 h-16 mx-auto" />
        </div>
        <div className="space-y-3">
          <h2 className="text-5xl font-black text-white">
            ¡Sondeo de Opinión Concluido!
          </h2>
          <p className="text-xl text-[#FFC72C] font-bold">
            Gracias a todos los asistentes por participar y compartir sus ideas.
          </p>
          <p className="text-base text-[#ECEBE4]/80 max-w-xl mx-auto">
            Las respuestas han sido recolectadas en tiempo real. Todas las
            opiniones quedan consolidadas para el informe de la sesión.
          </p>
        </div>
        <div className="pt-6 flex justify-center gap-4">
          <Link
            to="/open-polls"
            className="inline-flex items-center space-x-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-base py-3.5 px-8 rounded-xl shadow-xl transition active:scale-95"
          >
            <span>Volver a Preguntas Abiertas</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-white font-bold text-base py-3.5 px-8 rounded-xl transition"
          >
            <span>Ir al Hub</span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="my-auto max-w-4xl w-full mx-auto space-y-8 py-6 text-center">
      <AnimatedPodium
        users={leaderboard.map((p) => ({
          id: p.id,
          name: p.nickname,
          score: p.score,
          avatar_seed: p.avatar_seed,
          streak: p.current_streak,
        }))}
      />

      <div className="pt-4">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 bg-[#193750] hover:bg-[#254F72] border border-[#FFC72C] text-white font-bold py-3 px-8 rounded-xl shadow-xl transition"
        >
          <span>Volver al Inicio</span>
        </Link>
      </div>
    </main>
  );
}
