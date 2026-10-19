import React from "react";
import { Sparkles, ThumbsUp, Heart, Flame, Lightbulb } from "lucide-react";
import { ConnectionBanner } from "./ConnectionBanner";
import { ParticipantData } from "../types";

interface LobbyViewProps {
  pin: string | undefined;
  participant: ParticipantData | null;
  isConnected: boolean;
  handleSendReaction: (emoji: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  pin,
  participant,
  isConnected,
  handleSendReaction,
}) => {
  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-6">
      <header className="flex items-center justify-between py-2 border-b border-[#425563]">
        <span className="font-extrabold text-xl text-[#FFC72C]">EPIVOX</span>
        <span className="text-xs bg-[#193750] px-3 py-1 rounded-full border border-[#425563]">
          PIN: {pin}
        </span>
      </header>

      <ConnectionBanner isConnected={isConnected} />

      <main className="text-center space-y-6 my-auto">
        <div className="inline-block p-4 bg-[#FFC72C]/10 border-2 border-[#FFC72C] rounded-full animate-bounce">
          <Sparkles className="w-12 h-12 text-[#FFC72C]" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          ¡Estás en la Sala!
        </h1>
        <p className="text-lg text-[#ECEBE4]">
          Hola,{" "}
          <span className="text-[#FFC72C] font-bold">
            {participant?.nickname}
          </span>
          .<br />
          Mira la pantalla grande mientras el presentador da inicio a la sesión.
        </p>

        <div className="pt-8">
          <p className="text-xs uppercase tracking-wider text-[#ECEBE4] mb-3 opacity-75">
            Envía una reacción a la pantalla:
          </p>
          <div className="flex justify-center space-x-3">
            {[
              { emoji: "👍", icon: ThumbsUp },
              { emoji: "❤️", icon: Heart },
              { emoji: "🔥", icon: Flame },
              { emoji: "💡", icon: Lightbulb },
            ].map((rec) => (
              <button
                key={rec.emoji}
                type="button"
                onClick={() => handleSendReaction(rec.emoji)}
                className="p-3 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-2xl rounded-2xl active:scale-95 transition shadow-lg cursor-pointer"
              >
                {rec.emoji}
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-[#ECEBE4] opacity-60">
        Epiroc Chile &bull; Experiencia Móvil de Participación
      </footer>
    </div>
  );
};
