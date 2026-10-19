import React from "react";
import {
  Search,
  Layers,
  Clock,
  Award,
  Edit3,
  Trash2,
  CheckCircle2,
  Star,
  Sparkles,
  Sliders,
  HelpCircle,
  BarChart3,
  Folder,
} from "lucide-react";
import { BankQuestion } from "../types";

interface QuestionBankGridProps {
  questions: BankQuestion[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  typeFilter: string;
  setTypeFilter: (type: string) => void;
  onEditQuestion: (q: BankQuestion) => void;
  onDeleteQuestionConfirm: (q: BankQuestion) => void;
}

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }
> = {
  multiple_choice: {
    label: "Quiz / Opción Múltiple",
    icon: Layers,
    color: "#FFC72C",
  },
  true_false: {
    label: "Verdadero o Falso",
    icon: CheckCircle2,
    color: "#4C8C2B",
  },
  rating: { label: "Calificación Estrellas", icon: Star, color: "#FFC72C" },
  word_cloud: { label: "Nube de Palabras", icon: Sparkles, color: "#48A9C5" },
  likert: { label: "Escala Likert", icon: Sliders, color: "#86C8BC" },
  open_ended: { label: "Pregunta Abierta", icon: HelpCircle, color: "#D86018" },
  ranking: { label: "Ranking / Orden", icon: BarChart3, color: "#612C51" },
};

export const QuestionBankGrid: React.FC<QuestionBankGridProps> = ({
  questions,
  isLoading,
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  onEditQuestion,
  onDeleteQuestionConfirm,
}) => {
  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por pregunta o tema..."
            className="w-full pl-9 pr-4 py-2 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] focus:border-[#FFC72C] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none transition"
          />
        </div>

        {/* Chips de Filtro por Tipo */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              typeFilter === "all"
                ? "bg-[#FFC72C] text-[#001E32] shadow-sm font-extrabold"
                : "bg-[var(--surface-subtle)] text-[var(--text-subtle)] hover:text-[var(--text-main)]"
            }`}
          >
            Todos ({questions.length})
          </button>

          {Object.entries(TYPE_CONFIG).map(([typeKey, cfg]) => {
            const isCur = typeFilter === typeKey;
            const Icon = cfg.icon;
            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => setTypeFilter(typeKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isCur
                    ? "bg-[#FFC72C] text-[#001E32] shadow-sm font-extrabold"
                    : "bg-[var(--surface-subtle)] text-[var(--text-subtle)] hover:text-[var(--text-main)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cfg.label.split(" / ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Preguntas */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[var(--text-muted)]">
          Cargando preguntas del banco...
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-12 text-center space-y-3">
          <Layers className="w-12 h-12 text-[var(--text-muted)] mx-auto opacity-40" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">
            No hay preguntas registradas
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            Esta carpeta está vacía o ningún ítem coincide con tu búsqueda.
            Puedes crear una nueva o importar desde Excel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {questions.map((q) => {
            const typeInfo =
              TYPE_CONFIG[q.question_type] || TYPE_CONFIG.multiple_choice;
            const TypeIcon = typeInfo.icon;

            let parsedOpts: Array<{
              id: string;
              text: string;
              is_correct: boolean;
            }> = [];
            try {
              parsedOpts = JSON.parse(q.options_json || "[]");
            } catch {
              parsedOpts = [];
            }

            return (
              <div
                key={q.id}
                className="bg-[var(--surface-card)] border border-[var(--border-subtle)] hover:border-[#FFC72C] rounded-2xl p-4 shadow-sm transition flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1.5 border"
                      style={{
                        backgroundColor: `${typeInfo.color}15`,
                        color: typeInfo.color,
                        borderColor: `${typeInfo.color}40`,
                      }}
                    >
                      <TypeIcon className="w-3 h-3" />
                      <span>{typeInfo.label}</span>
                    </span>

                    <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-bold">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-[#FFC72C]" />
                        {q.time_limit}s
                      </span>
                      {q.points_base > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Award className="w-3 h-3 text-[#48A9C5]" />
                          {q.points_base} pts
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-main)] leading-snug line-clamp-2">
                    {q.question_text}
                  </h3>

                  {/* Resumen de Opciones */}
                  {parsedOpts.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-[var(--border-subtle)]">
                      {parsedOpts.slice(0, 3).map((opt) => (
                        <div
                          key={opt.id}
                          className={`text-[11px] truncate px-2 py-1 rounded flex items-center gap-1.5 ${
                            opt.is_correct
                              ? "bg-[#4C8C2B]/10 text-[#4C8C2B] font-bold"
                              : "text-[var(--text-subtle)] bg-[var(--surface-subtle)]"
                          }`}
                        >
                          {opt.is_correct && (
                            <CheckCircle2 className="w-3 h-3 text-[#4C8C2B] shrink-0" />
                          )}
                          <span className="truncate">{opt.text}</span>
                        </div>
                      ))}
                      {parsedOpts.length > 3 && (
                        <span className="text-[10px] text-[var(--text-muted)] block pl-1">
                          +{parsedOpts.length - 3} opción(es) más
                        </span>
                      )}
                    </div>
                  )}

                  {q.explanation_text && (
                    <p className="text-[11px] text-[var(--text-muted)] italic line-clamp-2 bg-[var(--surface-subtle)] p-2 rounded-lg">
                      💡 {q.explanation_text}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 text-[11px] truncate max-w-[150px]">
                    <Folder className="w-3 h-3 text-[#FFC72C] shrink-0" />
                    <span className="truncate">
                      {q.folder_name || "Sin carpeta"}
                    </span>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditQuestion(q)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-[#FFC72C] hover:bg-[var(--surface-subtle)] rounded-lg transition cursor-pointer"
                      title="Editar pregunta"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteQuestionConfirm(q)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-[#B7312C] hover:bg-[#B7312C]/10 rounded-lg transition cursor-pointer"
                      title="Eliminar pregunta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
