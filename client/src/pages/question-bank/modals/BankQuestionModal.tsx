import React, { useState } from "react";
import { Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import Modal from "../../../components/Modal";
import { BankQuestion } from "../types";

interface BankQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingQuestion: BankQuestion | null;
  qText: string;
  setQText: (text: string) => void;
  qType: string;
  setQType: (type: string) => void;
  qTimeLimit: number;
  setQTimeLimit: (time: number) => void;
  qPoints: number;
  setQPoints: (points: number) => void;
  qExplanation: string;
  setQExplanation: (explanation: string) => void;
  qOptions: Array<{ id: string; text: string; is_correct: boolean }>;
  setQOptions: React.Dispatch<
    React.SetStateAction<
      Array<{ id: string; text: string; is_correct: boolean }>
    >
  >;
  hasFolders: boolean;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export const BankQuestionModal: React.FC<BankQuestionModalProps> = ({
  isOpen,
  onClose,
  editingQuestion,
  qText,
  setQText,
  qType,
  setQType,
  qTimeLimit,
  setQTimeLimit,
  qPoints,
  setQPoints,
  qExplanation,
  setQExplanation,
  qOptions,
  setQOptions,
  hasFolders,
  onSave,
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasFolders) {
      setValidationError(
        "Debes crear al menos una carpeta antes de añadir preguntas.",
      );
      return;
    }
    if (!qText.trim()) {
      setValidationError("El texto de la pregunta no puede estar vacío.");
      return;
    }
    setValidationError(null);
    await onSave(e);
  };

  const handleAddOption = () => {
    if (qOptions.length >= 6) return;
    setQOptions((prev) => [
      ...prev,
      { id: `opt-${Date.now()}`, text: "", is_correct: false },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (qOptions.length <= 2) return;
    setQOptions((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleOptionTextChange = (index: number, val: string) => {
    setQOptions((prev) =>
      prev.map((opt, idx) => (idx === index ? { ...opt, text: val } : opt)),
    );
  };

  const handleOptionCorrectToggle = (index: number) => {
    setQOptions((prev) =>
      prev.map((opt, idx) =>
        idx === index ? { ...opt, is_correct: !opt.is_correct } : opt,
      ),
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        editingQuestion ? "Editar Pregunta del Banco" : "Crear Nueva Pregunta"
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {validationError && (
          <div className="flex items-center gap-2 p-3 bg-[#B7312C]/10 border border-[#B7312C]/30 rounded-xl text-xs text-[#B7312C]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
            Enunciado de la Pregunta
          </label>
          <textarea
            required
            rows={2}
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="¿Cuál es la regla fundamental al operar equipos en interior mina?"
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Tipo de Pregunta
            </label>
            <select
              value={qType}
              onChange={(e) => setQType(e.target.value)}
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C] cursor-pointer"
            >
              <option value="multiple_choice">Quiz / Opción Múltiple</option>
              <option value="true_false">Verdadero o Falso</option>
              <option value="rating">Calificación Estrellas (1-5)</option>
              <option value="word_cloud">Nube de Palabras</option>
              <option value="likert">Escala Likert (1-5)</option>
              <option value="open_ended">Pregunta Abierta</option>
              <option value="ranking">Ranking / Orden</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Tiempo Límite (segundos)
            </label>
            <input
              type="number"
              min={10}
              max={300}
              value={qTimeLimit}
              onChange={(e) =>
                setQTimeLimit(parseInt(e.target.value, 10) || 30)
              }
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Puntos Base
            </label>
            <input
              type="number"
              min={0}
              max={5000}
              step={100}
              value={qPoints}
              onChange={(e) => setQPoints(parseInt(e.target.value, 10) || 0)}
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
            />
          </div>
        </div>

        {/* Opciones de respuesta para Quiz o Ranking */}
        {(qType === "multiple_choice" || qType === "ranking") && (
          <div className="space-y-2 pt-1 border-t border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                Alternativas de Respuesta
              </label>
              {qOptions.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-xs text-[#FFC72C] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir opción</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {qOptions.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  {qType === "multiple_choice" && (
                    <button
                      type="button"
                      onClick={() => handleOptionCorrectToggle(idx)}
                      className={`p-2 rounded-lg border transition cursor-pointer ${
                        opt.is_correct
                          ? "bg-[#4C8C2B] border-[#4C8C2B] text-white"
                          : "bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                      }`}
                      title={
                        opt.is_correct
                          ? "Marcada como correcta"
                          : "Marcar como correcta"
                      }
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    type="text"
                    required
                    value={opt.text}
                    onChange={(e) =>
                      handleOptionTextChange(idx, e.target.value)
                    }
                    placeholder={`Alternativa ${idx + 1}`}
                    className="flex-1 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
                  />
                  {qOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="p-2 text-[var(--text-muted)] hover:text-[#B7312C] rounded-lg transition cursor-pointer"
                      title="Eliminar opción"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
            Explicación / Retroalimentación (Opcional)
          </label>
          <textarea
            rows={2}
            value={qExplanation}
            onChange={(e) => setQExplanation(e.target.value)}
            placeholder="Aparecerá en pantalla tras responder para reforzar el aprendizaje..."
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-5 rounded-xl transition shadow cursor-pointer"
          >
            {editingQuestion ? "Guardar Cambios" : "Guardar en el Banco"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
