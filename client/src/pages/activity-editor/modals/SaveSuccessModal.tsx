import { CheckCircle2, ArrowLeft } from "lucide-react";
import Modal from "../../../components/Modal";

interface SaveSuccessModalProps {
  isOpen: boolean;
  activityTitle: string;
  onClose: () => void;
  onNavigateToPresentations: () => void;
}

export default function SaveSuccessModal({
  isOpen,
  activityTitle,
  onClose,
  onNavigateToPresentations,
}: SaveSuccessModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="¡Actividad Guardada con Éxito!"
      description="Todos los cambios y diapositivas han sido sincronizados correctamente en la base de datos."
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-[var(--surface-subtle)] text-[var(--text-subtle)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Seguir Editando
          </button>
          <button
            type="button"
            onClick={onNavigateToPresentations}
            className="px-5 py-2.5 bg-[#FFC72C] text-[#001E32] rounded-xl text-xs font-black shadow hover:bg-[#E6B327] transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Presentaciones</span>
          </button>
        </div>
      }
    >
      <div className="flex items-center space-x-3 text-[#4C8C2B]">
        <CheckCircle2 className="w-6 h-6 shrink-0" />
        <span className="text-sm font-semibold text-[var(--text-main)]">
          Tu actividad "{activityTitle}" está lista para ser presentada en vivo
          o editada en cualquier momento.
        </span>
      </div>
    </Modal>
  );
}
