import Modal from "../../../components/Modal";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  questionIndex: number | null;
  onClose: () => void;
  onConfirm: (index: number) => void;
}

export default function DeleteConfirmModal({
  isOpen,
  questionIndex,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Diapositiva"
      description="¿Estás seguro de que deseas eliminar esta diapositiva? Esta acción no se puede deshacer."
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-subtle)] text-[var(--text-subtle)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] rounded-xl text-xs font-bold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              if (questionIndex !== null) {
                onConfirm(questionIndex);
              }
            }}
            className="px-4 py-2 bg-[#B7312C] text-white rounded-xl text-xs font-bold hover:bg-[#A32823] cursor-pointer shadow-sm"
          >
            Confirmar Eliminación
          </button>
        </div>
      }
    >
      <p className="text-xs text-[var(--text-subtle)]">
        La diapositiva #{questionIndex !== null ? questionIndex + 1 : ""} será
        removida del cuestionario.
      </p>
    </Modal>
  );
}
