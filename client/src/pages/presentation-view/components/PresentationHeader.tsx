import { Sparkles, Users, Maximize2, Minimize2, XCircle } from "lucide-react";

interface PresentationHeaderProps {
  pin: string | undefined;
  participantsCount: number;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenCancelModal: () => void;
}

export default function PresentationHeader({
  pin,
  participantsCount,
  isFullscreen,
  onToggleFullscreen,
  onOpenCancelModal,
}: PresentationHeaderProps) {
  return (
    <header className="flex items-center justify-between py-3 border-b border-[#425563]/60">
      <div className="flex items-center space-x-4">
        <div className="p-2.5 bg-[#FFC72C] text-[#001E32] rounded-xl shadow-lg">
          <Sparkles className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-wider text-white">
            EPIVOX
          </h1>
          <p className="text-xs text-[#ECEBE4] opacity-80">
            Epiroc Presentación en Vivo
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="bg-[#193750] border border-[#FFC72C] px-5 py-2 rounded-xl text-center shadow">
          <span className="block text-[10px] uppercase font-bold text-[#ECEBE4]">
            PIN de Acceso
          </span>
          <span className="font-mono text-3xl font-black text-[#FFC72C] tracking-widest">
            {pin}
          </span>
        </div>

        <div className="flex items-center space-x-2 bg-[#193750] px-4 py-2 rounded-xl border border-[#425563]">
          <Users className="w-5 h-5 text-[#48A9C5]" />
          <span className="font-bold text-lg">{participantsCount}</span>
          <span className="text-xs text-[#ECEBE4] hidden sm:inline">
            conectados
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="p-3 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-white rounded-xl transition cursor-pointer"
          title="Pantalla Completa"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5" />
          ) : (
            <Maximize2 className="w-5 h-5" />
          )}
        </button>

        {/* Botón Cancelar / Terminar Sesión */}
        <button
          type="button"
          onClick={onOpenCancelModal}
          className="px-3.5 py-2.5 bg-[#B7312C]/20 hover:bg-[#B7312C]/40 border border-[#B7312C]/60 text-white rounded-xl transition flex items-center gap-2 cursor-pointer shadow active:scale-95"
          title="Cancelar o Cerrar Presentación"
        >
          <XCircle className="w-5 h-5 text-[#B7312C]" />
          <span className="text-xs font-bold text-white hidden sm:inline">
            Cancelar Sesión
          </span>
        </button>
      </div>
    </header>
  );
}
