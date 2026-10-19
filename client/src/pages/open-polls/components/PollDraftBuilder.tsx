import React from "react";
import { MessageSquare, Plus, Trash2, Play } from "lucide-react";
import { DraftQuestion, CHART_TYPES } from "../types";

interface PollDraftBuilderProps {
  pollTitle: string;
  setPollTitle: (title: string) => void;
  draftQuestions: DraftQuestion[];
  handleAddQuestion: () => void;
  handleRemoveQuestion: (id: string) => void;
  handleUpdateDraft: (
    id: string,
    field: "questionText" | "chartType",
    value: string,
  ) => void;
  isLaunching: boolean;
  handleLaunchPoll: () => void;
}

export const PollDraftBuilder: React.FC<PollDraftBuilderProps> = ({
  pollTitle,
  setPollTitle,
  draftQuestions,
  handleAddQuestion,
  handleRemoveQuestion,
  handleUpdateDraft,
  isLaunching,
  handleLaunchPoll,
}) => {
  const validQuestionsCount = draftQuestions.filter((q) =>
    q.questionText.trim(),
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-xs uppercase font-black text-[#FFC72C] tracking-wider block">
            Título General del Sondeo
          </label>
          <input
            type="text"
            value={pollTitle}
            onChange={(e) => setPollTitle(e.target.value)}
            placeholder="Ej. Sondeo de Seguridad Faena Norte"
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] focus:border-[#FFC72C] rounded-2xl p-4 text-lg font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none transition"
          />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs uppercase font-black text-[#FFC72C] tracking-wider block">
                Set de Preguntas Abiertas ({draftQuestions.length})
              </span>
              <p className="text-xs text-[var(--text-muted)]">
                Los participantes irán respondiendo a medida que tú avances a la
                siguiente pregunta.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#FFC72C] border border-[#FFC72C]/40 font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar Otra Pregunta</span>
            </button>
          </div>

          {/* Lista de preguntas en borrador */}
          <div className="space-y-4">
            {draftQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-2xl p-5 space-y-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-black text-[#48A9C5] tracking-widest flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#48A9C5]" />
                    Pregunta #{idx + 1}
                  </span>
                  {draftQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="text-[var(--text-muted)] hover:text-[#B7312C] transition p-1 cursor-pointer"
                      title="Eliminar pregunta"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) =>
                    handleUpdateDraft(q.id, "questionText", e.target.value)
                  }
                  placeholder={`Escribe aquí la pregunta abierta #${idx + 1}...`}
                  className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] focus:border-[#FFC72C] rounded-xl p-3 text-base font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none transition leading-relaxed"
                />

                {/* Selector de gráfico para esta pregunta */}
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase font-bold text-[var(--text-muted)] tracking-wider block">
                    Visualización inicial para esta pregunta:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {CHART_TYPES.map((item) => {
                      const Icon = item.icon;
                      const isSelected = q.chartType === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            handleUpdateDraft(q.id, "chartType", item.id)
                          }
                          className={`p-2.5 rounded-xl border text-left transition flex items-center space-x-2 cursor-pointer ${
                            isSelected
                              ? "bg-[var(--surface-card)] border-[#FFC72C] text-[var(--text-main)] ring-1 ring-[#FFC72C] shadow-sm"
                              : "bg-[var(--surface-card)]/50 border-[var(--border-subtle)] text-[var(--text-subtle)] hover:border-[#48A9C5]"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isSelected
                                ? "text-[#FFC72C]"
                                : "text-[var(--text-muted)]"
                            }`}
                          />
                          <span className="font-bold text-xs truncate">
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          disabled={isLaunching || validQuestionsCount === 0}
          onClick={handleLaunchPoll}
          className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-4 rounded-2xl shadow-xl transition flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-[#001E32]" />
          <span>
            {isLaunching
              ? "Lanzando Sondeo en Vivo..."
              : `Lanzar Sondeo con ${validQuestionsCount} Pregunta(s)`}
          </span>
        </button>
      </div>
    </div>
  );
};
