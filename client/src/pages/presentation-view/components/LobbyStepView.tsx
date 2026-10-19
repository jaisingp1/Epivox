import { Play, Users } from "lucide-react";
import type { ParticipantData } from "../types";

interface LobbyStepViewProps {
  pin: string | undefined;
  qrCodeDataUrl: string;
  participants: ParticipantData[];
  onStartGame: () => void;
}

export default function LobbyStepView({
  pin,
  qrCodeDataUrl,
  participants,
  onStartGame,
}: LobbyStepViewProps) {
  return (
    <main className="my-auto max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
      {/* Instrucciones y QR */}
      <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-8 text-center space-y-4 shadow-2xl">
        <h2 className="text-3xl font-extrabold text-white">
          Únete desde tu móvil
        </h2>
        <p className="text-[#ECEBE4] text-base">
          Escanea el código QR o entra a{" "}
          <span className="text-[#FFC72C] font-bold">/join</span> e ingresa el
          PIN <span className="font-mono font-bold text-[#FFC72C]">{pin}</span>
        </p>
        {qrCodeDataUrl ? (
          <div className="inline-block p-3 bg-white rounded-2xl shadow-xl">
            <img
              src={qrCodeDataUrl}
              alt={`QR PIN ${pin}`}
              className="w-48 h-48 mx-auto"
            />
          </div>
        ) : (
          <div className="w-48 h-48 bg-[#001E32] rounded-2xl mx-auto flex items-center justify-center text-[#ECEBE4]">
            Generando QR...
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={onStartGame}
            className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xl py-4 rounded-xl shadow-xl transition active:scale-95 flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-[#001E32]" />
            <span>Iniciar Cuestionario</span>
          </button>
        </div>
      </div>

      {/* Participantes Conectados en Tiempo Real */}
      <div className="bg-[#193750]/60 border border-[#425563] rounded-3xl p-6 h-[440px] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#425563]">
          <span className="font-bold text-lg text-white">
            Participantes en Sala
          </span>
          <span className="text-xs bg-[#FFC72C] text-[#001E32] font-extrabold px-3 py-1 rounded-full">
            {participants.length} listos
          </span>
        </div>

        <div className="flex-1 overflow-y-auto pt-4 flex flex-wrap gap-2 content-start">
          {participants.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#ECEBE4] opacity-50 space-y-2">
              <Users className="w-12 h-12" />
              <p className="text-sm">
                Esperando que se unan los participantes...
              </p>
            </div>
          ) : (
            participants.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center space-x-2 bg-[#001E32] border border-[#425563] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow animate-pulse-subtle"
              >
                <span>{p.nickname}</span>
              </span>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
