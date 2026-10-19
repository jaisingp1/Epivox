import React from "react";
import { AlertCircle } from "lucide-react";
import Modal from "../../../components/Modal";

interface DeleteConfirmModalProps {
  target: { type: "folder" | "question"; id: number; title: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  target,
  onClose,
  onConfirm,
}) => {
  return (
    <Modal
      isOpen={Boolean(target)}
      onClose={onClose}
      title="Confirmar Eliminación"
      maxWidth="sm"
    >
      <div className="space-y-4 text-center p-2">
        <div className="w-12 h-12 rounded-full bg-[#B7312C]/20 border border-[#B7312C] text-[#B7312C] mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-[var(--text-main)]">
            ¿Eliminar{" "}
            {target?.type === "folder" ? "esta carpeta" : "esta pregunta"}?
          </h4>
          <p className="text-xs text-[var(--text-subtle)] mt-1 font-mono">
            "{target?.title}"
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] hover:bg-[var(--surface-hover)] font-bold text-xs rounded-xl cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-[#B7312C] hover:bg-[#962622] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </Modal>
  );
};
