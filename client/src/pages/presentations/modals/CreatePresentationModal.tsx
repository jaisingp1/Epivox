import { useState } from "react";
import Modal from "../../../components/Modal";

interface CreatePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, category: string, type: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function CreatePresentationModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: CreatePresentationModalProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Presentaciones");
  const [newType, setNewType] = useState("quiz");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await onSubmit(newTitle.trim(), newCategory, newType);
    setNewTitle("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Crear Nueva Presentación"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
            Título de la Presentación
          </label>
          <input
            type="text"
            required
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ej. Procedimientos de Seguridad en Faena"
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
            Categoría
          </label>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
          >
            <option value="Presentaciones">Presentaciones</option>
            <option value="Capacitación">Capacitación</option>
            <option value="Seguridad">Seguridad / LOTO</option>
            <option value="Operaciones">Operaciones Faena</option>
            <option value="Cultura">Cultura y Clima</option>
            <option value="Inducción">Inducción</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
            Tipo de Dinámica
          </label>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
          >
            <option value="quiz">
              🎮 Quiz Gamificado (Puntos, tiempo y podio)
            </option>
            <option value="interactive_presentation">
              📊 Presentación Interactiva (Sondeos y feedback sin podio)
            </option>
          </select>
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
            disabled={isSubmitting || !newTitle.trim()}
            className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-5 rounded-xl transition shadow disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Creando..." : "Crear Presentación"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
