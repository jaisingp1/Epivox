import React from "react";
import { CheckCircle2, Trophy } from "lucide-react";
import { ParticipantData, QuestionData } from "../types";

interface PodiumSummaryViewProps {
  currentQuestion: QuestionData | null;
  participant: ParticipantData | null;
}

export const PodiumSummaryView: React.FC<PodiumSummaryViewProps> = ({
  currentQuestion,
  participant,
}) => {
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
          <span className="font-extrabold text-xl text-[#FFC72C]">EPIVOX</span>
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
        <h1 className="text-3xl font-black text-white">¡Sesión Finalizada!</h1>
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
};
