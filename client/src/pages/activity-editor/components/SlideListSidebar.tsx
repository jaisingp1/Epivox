import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  Upload,
} from "lucide-react";
import type { QuestionItem } from "../types";

interface SlideListSidebarProps {
  questions: QuestionItem[];
  selectedQuestionIndex: number;
  onSelectQuestion: (index: number) => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onDeleteQuestionClick: (index: number) => void;
  onAddQuestion: () => void;
  onOpenBankPicker: () => void;
  onOpenExcelModal: () => void;
}

export default function SlideListSidebar({
  questions,
  selectedQuestionIndex,
  onSelectQuestion,
  onMoveQuestion,
  onDeleteQuestionClick,
  onAddQuestion,
  onOpenBankPicker,
  onOpenExcelModal,
}: SlideListSidebarProps) {
  return (
    <aside className="w-72 bg-[var(--surface-card)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
      <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
          Diapositivas ({questions.length})
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenBankPicker}
            className="flex items-center space-x-1 bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#001E32] dark:text-[#FFC72C] border border-[var(--border-subtle)] text-xs font-bold py-1.5 px-2 rounded-lg transition active:scale-95 shadow-sm cursor-pointer"
            title="Escoger desde Banco de Preguntas"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#FFC72C]" />
            <span>Banco</span>
          </button>

          <button
            type="button"
            onClick={onOpenExcelModal}
            className="flex items-center space-x-1 bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#48A9C5] border border-[#48A9C5]/40 text-xs font-bold py-1.5 px-2 rounded-lg transition active:scale-95 shadow-sm cursor-pointer"
            title="Subir preguntas masivas desde Excel (.xlsx)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={onAddQuestion}
            className="flex items-center space-x-1 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] text-xs font-black py-1.5 px-2 rounded-lg transition active:scale-95 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {questions.map((q, idx) => {
          const isSelected = idx === selectedQuestionIndex;
          return (
            <div
              key={q.id || idx}
              onClick={() => onSelectQuestion(idx)}
              className={`group relative p-3 rounded-xl border-2 transition cursor-pointer flex flex-col gap-1.5 ${
                isSelected
                  ? "bg-[var(--surface-subtle)] border-[#FFC72C] shadow-sm"
                  : "bg-[var(--surface-card)] border-[var(--border-subtle)] hover:border-[#425563]"
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#FFC72C]">
                  #{idx + 1}
                </span>
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] bg-[var(--surface-subtle)] px-1.5 py-0.5 rounded border border-[var(--border-subtle)]">
                  {q.question_type.replace("_", " ")}
                </span>
              </div>

              <p className="text-xs font-semibold text-[var(--text-main)] line-clamp-2">
                {q.question_text || "¿Sin pregunta redactada?"}
              </p>

              {/* Reorder & delete mini buttons */}
              <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] text-[var(--text-muted)]">
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveQuestion(idx, "up");
                    }}
                    disabled={idx === 0}
                    aria-label="Subir diapositiva"
                    className="hover:text-[#FFC72C] disabled:opacity-20 p-1 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveQuestion(idx, "down");
                    }}
                    disabled={idx === questions.length - 1}
                    aria-label="Bajar diapositiva"
                    className="hover:text-[#FFC72C] disabled:opacity-20 p-1 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteQuestionClick(idx);
                  }}
                  aria-label="Eliminar diapositiva"
                  className="hover:text-[#B7312C] p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
