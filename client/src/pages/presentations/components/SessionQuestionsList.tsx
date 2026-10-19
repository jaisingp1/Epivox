import { useState, useMemo } from "react";
import {
  ListOrdered,
  CheckCircle2,
  Radio,
  Clock,
  ArrowRightCircle,
  Play,
} from "lucide-react";
import type { SessionQuestionItem } from "../types";
import { getQuestionTypeBadge } from "../utils/excelHelper";

interface SessionQuestionsListProps {
  currentQuestions: SessionQuestionItem[];
  activeQIndex: number;
  isLobby: boolean;
  pastQuestionsCount: number;
  pendingQuestionsCount: number;
  onPresenterAction: (action: string, targetQuestionIndex?: number) => void;
}

export default function SessionQuestionsList({
  currentQuestions,
  activeQIndex,
  isLobby,
  pastQuestionsCount,
  pendingQuestionsCount,
  onPresenterAction,
}: SessionQuestionsListProps) {
  const [questionListFilter, setQuestionListFilter] = useState<
    "all" | "completed" | "pending"
  >("all");

  const filteredQuestionList = useMemo(() => {
    return currentQuestions
      .map((q, idx) => {
        let status: "completed" | "current" | "next" | "pending";
        if (!isLobby && idx < activeQIndex) {
          status = "completed";
        } else if (!isLobby && idx === activeQIndex) {
          status = "current";
        } else if (idx === (isLobby ? 0 : activeQIndex + 1)) {
          status = "next";
        } else {
          status = "pending";
        }
        return { ...q, index: idx, status };
      })
      .filter((item) => {
        if (questionListFilter === "completed")
          return item.status === "completed";
        if (questionListFilter === "pending")
          return item.status === "pending" || item.status === "next";
        return true;
      });
  }, [currentQuestions, activeQIndex, isLobby, questionListFilter]);

  return (
    <div className="md:col-span-3 bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-5 rounded-2xl space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#FFC72C]/15 border border-[#FFC72C]/40 text-[#FFC72C] rounded-xl">
            <ListOrdered className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-main)] flex items-center gap-2">
              <span>Listado y Secuencia de Preguntas</span>
              <span className="text-xs font-mono bg-[var(--surface-card)] text-[var(--text-subtle)] px-2 py-0.5 rounded-full border border-[var(--border-subtle)]">
                {currentQuestions.length} diapositivas
              </span>
            </h3>
            <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[#4C8C2B] font-bold">
                <CheckCircle2 className="w-3 h-3" />
                {pastQuestionsCount} realizadas
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-[#FFC72C] font-bold">
                <Radio className="w-3 h-3 animate-pulse" />
                {isLobby ? 0 : 1} en curso
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-[#48A9C5] font-bold">
                <Clock className="w-3 h-3" />
                {pendingQuestionsCount} faltan por mostrar
              </span>
            </div>
          </div>
        </div>

        {/* Filtros de Pestaña */}
        <div className="flex items-center gap-1 bg-[var(--surface-card)] p-1 rounded-xl border border-[var(--border-subtle)] shrink-0 text-xs">
          <button
            type="button"
            onClick={() => setQuestionListFilter("all")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              questionListFilter === "all"
                ? "bg-[#FFC72C] text-[#001E32]"
                : "text-[var(--text-subtle)] hover:text-[var(--text-main)]"
            }`}
          >
            Todas ({currentQuestions.length})
          </button>
          <button
            type="button"
            onClick={() => setQuestionListFilter("completed")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              questionListFilter === "completed"
                ? "bg-[#4C8C2B] text-white"
                : "text-[var(--text-subtle)] hover:text-[var(--text-main)]"
            }`}
          >
            Realizadas ({pastQuestionsCount})
          </button>
          <button
            type="button"
            onClick={() => setQuestionListFilter("pending")}
            className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
              questionListFilter === "pending"
                ? "bg-[#48A9C5] text-[#001E32]"
                : "text-[var(--text-subtle)] hover:text-[var(--text-main)]"
            }`}
          >
            Por Mostrar ({pendingQuestionsCount})
          </button>
        </div>
      </div>

      {/* Lista Desplegable de Preguntas */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {filteredQuestionList.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] italic text-center py-4">
            No hay preguntas para mostrar en esta categoría.
          </p>
        ) : (
          filteredQuestionList.map((q) => {
            const badge = getQuestionTypeBadge(q.question_type);
            return (
              <div
                key={q.id}
                className={`p-3 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                  q.status === "current"
                    ? "bg-[var(--surface-card)] border-[#FFC72C] shadow-sm ring-1 ring-[#FFC72C]/40"
                    : q.status === "next"
                      ? "bg-[var(--surface-card)] border-[#48A9C5]/50"
                      : q.status === "completed"
                        ? "bg-[var(--surface-card)] border-[#4C8C2B]/30 opacity-80"
                        : "bg-[var(--surface-card)] border-[var(--border-subtle)]"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="font-mono font-black text-sm text-[#FFC72C] shrink-0 w-6">
                    #{q.index + 1}
                  </span>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {q.status === "completed" && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#4C8C2B] bg-[#4C8C2B]/15 border border-[#4C8C2B]/40 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Realizada
                        </span>
                      )}
                      {q.status === "current" && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#FFC72C] bg-[#FFC72C]/15 border border-[#FFC72C]/40 px-2 py-0.5 rounded-full animate-pulse">
                          <Radio className="w-3 h-3" />
                          En Vivo Ahora
                        </span>
                      )}
                      {q.status === "next" && (
                        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#48A9C5] bg-[#48A9C5]/15 border border-[#48A9C5]/40 px-2 py-0.5 rounded-full">
                          <ArrowRightCircle className="w-3 h-3" />
                          Siguiente Pregunta
                        </span>
                      )}
                      {q.status === "pending" && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--surface-subtle)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3" />
                          Falta por Mostrar
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}
                      >
                        {badge.label}
                      </span>

                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        {q.time_limit}s
                      </span>
                    </div>

                    <p className="font-bold text-[var(--text-main)] text-sm truncate">
                      {q.question_text}
                    </p>
                  </div>
                </div>

                {/* Botón de Salto / Proyección Rápida */}
                <div className="shrink-0 self-end sm:self-center">
                  {q.status === "current" ? (
                    <span className="text-[11px] font-extrabold text-[#FFC72C] bg-[#FFC72C]/10 border border-[#FFC72C]/30 px-3 py-1.5 rounded-lg flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      En Pantalla
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        onPresenterAction("jump_to_question", q.index)
                      }
                      className="text-xs font-bold bg-[var(--surface-subtle)] hover:bg-[#FFC72C] text-[var(--text-main)] hover:text-[#001E32] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Lanzar Diapositiva</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
