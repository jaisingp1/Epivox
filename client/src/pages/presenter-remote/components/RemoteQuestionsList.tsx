import React, { useState } from "react";
import {
  ListOrdered,
  CheckCircle2,
  Radio,
  ArrowRightCircle,
  Clock,
  Play,
} from "lucide-react";
import type { QuestionData, RemoteQuestionStatus } from "../types";

interface RemoteQuestionsListProps {
  questions: QuestionData[];
  currentQIndex: number;
  currentStep: string;
  onJumpToQuestion: (index: number) => void;
}

export const RemoteQuestionsList: React.FC<RemoteQuestionsListProps> = ({
  questions,
  currentQIndex,
  currentStep,
  onJumpToQuestion,
}) => {
  const [listFilter, setListFilter] = useState<"all" | "completed" | "pending">(
    "all",
  );
  const [isListExpanded, setIsListExpanded] = useState<boolean>(true);

  const isLobby = currentStep === "lobby";
  const pastCount = isLobby ? 0 : currentQIndex;
  const pendingCount = isLobby
    ? questions.length
    : Math.max(0, questions.length - (currentQIndex + 1));

  return (
    <div className="bg-[#193750] border border-[#425563] p-4 rounded-2xl space-y-3 shadow-xl">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#425563]/60">
        <button
          type="button"
          onClick={() => setIsListExpanded(!isListExpanded)}
          className="flex items-center gap-2 text-left cursor-pointer"
        >
          <ListOrdered className="w-4 h-4 text-[#FFC72C]" />
          <span className="font-extrabold text-sm text-white">
            Listado de Diapositivas ({questions.length})
          </span>
        </button>

        {/* Filtros de Pestaña */}
        <div className="flex items-center gap-1 bg-[#001E32] p-1 rounded-xl text-[11px]">
          <button
            type="button"
            onClick={() => setListFilter("all")}
            className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
              listFilter === "all"
                ? "bg-[#FFC72C] text-[#001E32]"
                : "text-[#ECEBE4]/60"
            }`}
          >
            Todas ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setListFilter("completed")}
            className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
              listFilter === "completed"
                ? "bg-[#4C8C2B] text-white"
                : "text-[#ECEBE4]/60"
            }`}
          >
            Hechas ({pastCount})
          </button>
          <button
            type="button"
            onClick={() => setListFilter("pending")}
            className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
              listFilter === "pending"
                ? "bg-[#48A9C5] text-[#001E32]"
                : "text-[#ECEBE4]/60"
            }`}
          >
            Faltan ({pendingCount})
          </button>
        </div>
      </div>

      {isListExpanded && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {questions
            .map((q, idx) => {
              let status: RemoteQuestionStatus;
              if (!isLobby && idx < currentQIndex) {
                status = "completed";
              } else if (!isLobby && idx === currentQIndex) {
                status = "current";
              } else if (idx === (isLobby ? 0 : currentQIndex + 1)) {
                status = "next";
              } else {
                status = "pending";
              }
              return { ...q, index: idx, status };
            })
            .filter((item) => {
              if (listFilter === "completed")
                return item.status === "completed";
              if (listFilter === "pending")
                return item.status === "pending" || item.status === "next";
              return true;
            })
            .map((q) => (
              <div
                key={q.id}
                className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2 text-xs ${
                  q.status === "current"
                    ? "bg-[#001E32] border-[#FFC72C] ring-1 ring-[#FFC72C]/40"
                    : q.status === "next"
                      ? "bg-[#001E32] border-[#48A9C5]/50"
                      : q.status === "completed"
                        ? "bg-[#001E32]/70 border-[#4C8C2B]/30 opacity-75"
                        : "bg-[#001E32]/50 border-[#425563]/40"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono font-bold text-xs text-[#FFC72C] shrink-0">
                    #{q.index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {q.status === "completed" && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-[#4C8C2B]">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Hecha
                        </span>
                      )}
                      {q.status === "current" && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-[#FFC72C] animate-pulse">
                          <Radio className="w-2.5 h-2.5" /> En Vivo
                        </span>
                      )}
                      {q.status === "next" && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black uppercase text-[#48A9C5]">
                          <ArrowRightCircle className="w-2.5 h-2.5" /> Siguiente
                        </span>
                      )}
                      {q.status === "pending" && (
                        <span className="flex items-center gap-0.5 text-[9px] text-[#ECEBE4]/50">
                          <Clock className="w-2.5 h-2.5" /> Pendiente
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-white text-xs truncate">
                      {q.question_text}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {q.status === "current" ? (
                    <span className="text-[10px] text-[#FFC72C] font-black">
                      Activa
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onJumpToQuestion(q.index)}
                      className="text-[11px] font-bold bg-[#001E32] hover:bg-[#FFC72C] text-[#ECEBE4] hover:text-[#001E32] px-2 py-1 rounded-lg border border-[#425563] transition flex items-center gap-1 shadow cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Lanzar</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
