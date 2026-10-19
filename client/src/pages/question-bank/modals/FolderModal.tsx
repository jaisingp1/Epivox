import React from "react";
import Modal from "../../../components/Modal";
import { QuestionFolder, EPIROC_COLORS } from "../types";

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingFolder: QuestionFolder | null;
  folderName: string;
  setFolderName: (name: string) => void;
  folderDescription: string;
  setFolderDescription: (desc: string) => void;
  folderColor: string;
  setFolderColor: (color: string) => void;
  handleSaveFolder: (e: React.FormEvent) => void;
}

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  editingFolder,
  folderName,
  setFolderName,
  folderDescription,
  setFolderDescription,
  folderColor,
  setFolderColor,
  handleSaveFolder,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingFolder ? "Editar Carpeta" : "Crear Nueva Carpeta"}
      maxWidth="md"
    >
      <form onSubmit={handleSaveFolder} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
            Nombre de la Carpeta
          </label>
          <input
            type="text"
            required
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Ej. Procedimientos de Seguridad, LOTO, Minería Subterránea"
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
            Descripción (Opcional)
          </label>
          <textarea
            rows={2}
            value={folderDescription}
            onChange={(e) => setFolderDescription(e.target.value)}
            placeholder="Describe el contenido o temática de este grupo de preguntas..."
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-2">
            Color Identificador (Paleta Epiroc)
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {EPIROC_COLORS.map((c) => {
              const isSelected = folderColor === c.value;
              return (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFolderColor(c.value)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition border-2 cursor-pointer ${
                    isSelected
                      ? "border-white scale-110 shadow-md ring-2 ring-[#FFC72C]"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!folderName.trim()}
            className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-5 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
          >
            {editingFolder ? "Guardar Cambios" : "Crear Carpeta"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
