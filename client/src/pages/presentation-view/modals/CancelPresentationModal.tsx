import { AlertCircle, XCircle } from "lucide-react";
import Modal from "../../../components/Modal";

interface CancelPresentationModalProps {
  isOpen: boolean;
  pin: string | undefined;
  isCancelling: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function CancelPresentationModal({
  isOpen,
  pin,
  isCancelling,
  onClose,
  onConfirm,
}: CancelPresentationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¿Cancelar Presentación Activa?"
    >
      <div className="space-y-4">
        <div className="p-4 bg-[#B7312C]/10 border border-[#B7312C]/30 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-[#B7312C] shrink-0 mt-0.5" />
          <div className="text-xs space-y-1.5">
            <p className="font-bold text-[#A32823] dark:text-[#FFA6A3] text-sm">
              Esta acción detendrá la sesión para todos los participantes.
            </p>
            <p className="text-[#001E32] dark:text-[#ECEBE4] leading-relaxed">
              Los alumnos conectados (PIN:{" "}
              <strong className="font-mono bg-[#FFC72C] text-[#001E32] px-1.5 py-0.5 rounded font-black">
                {pin}
              </strong>
              ) ya no verán preguntas activas y su pantalla mostrará que la
              presentación ha finalizado.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-xs font-bold text-white rounded-xl transition cursor-pointer"
          >
            Continuar Presentación
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isCancelling}
            className="px-5 py-2.5 bg-[#B7312C] hover:bg-[#A32823] text-white text-xs font-black rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" />
            <span>
              {isCancelling ? "Cancelando..." : "Sí, Cancelar Presentación"}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
