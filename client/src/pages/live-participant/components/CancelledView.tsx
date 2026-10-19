import React from "react";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CancelledView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-6 text-center animate-in fade-in select-none">
      <header className="py-2 border-b border-[#425563]">
        <span className="font-extrabold text-xl text-[#FFC72C]">EPIVOX</span>
      </header>

      <main className="my-auto space-y-6 max-w-sm mx-auto">
        <div className="inline-block p-5 bg-[#B7312C]/20 text-[#B7312C] border-2 border-[#B7312C] rounded-full shadow-2xl">
          <AlertCircle className="w-16 h-16 mx-auto" />
        </div>
        <h1 className="text-2xl font-black text-white">
          Presentación Finalizada
        </h1>
        <div className="bg-[#193750] border border-[#425563] p-5 rounded-2xl shadow-xl space-y-2 text-center">
          <p className="text-sm font-bold text-[#ECEBE4]">
            El presentador ha cerrado o cancelado esta presentación.
          </p>
          <p className="text-xs text-[#ECEBE4]/70">
            Las preguntas ya no están activas y la sesión ha terminado.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("epivox_participant");
            navigate("/join");
          }}
          className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3.5 px-6 rounded-xl shadow-lg transition active:scale-95 cursor-pointer"
        >
          Unirse a otra Presentación
        </button>
      </main>

      <footer className="text-center text-xs text-[#ECEBE4] opacity-60">
        Epiroc Chile &bull; Experiencia Móvil de Participación
      </footer>
    </div>
  );
};
