import React from "react";
import { LayoutGrid } from "lucide-react";
import { RawAnswerItem } from "../../types";

interface PollCardsChartProps {
  rawAnswers: RawAnswerItem[];
  liveResults: Record<string, number>;
}

export const PollCardsChart: React.FC<PollCardsChartProps> = ({
  rawAnswers,
  liveResults,
}) => {
  if (rawAnswers.length === 0 && Object.keys(liveResults).length === 0) {
    return (
      <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-6 rounded-2xl min-h-[340px]">
        <div className="text-center text-[var(--text-muted)] py-10">
          <LayoutGrid className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2" />
          <p className="text-base font-bold text-[var(--text-main)]">
            Esperando que los participantes envíen ideas...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-6 rounded-2xl min-h-[340px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rawAnswers.length > 0
          ? rawAnswers.map((ans) => (
              <div
                key={ans.id}
                className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm space-y-2 flex flex-col justify-between"
              >
                <p className="text-base font-bold text-[var(--text-main)] leading-relaxed">
                  "{ans.answer_payload}"
                </p>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2">
                  <span className="font-semibold text-[#FFC72C]">
                    {ans.nickname}
                  </span>
                  {ans.department && <span>{ans.department}</span>}
                </div>
              </div>
            ))
          : Object.entries(liveResults).map(([ans, count], i) => (
              <div
                key={ans}
                className="bg-[var(--surface-card)] border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm space-y-2 flex flex-col justify-between"
              >
                <p className="text-base font-bold text-[var(--text-main)] leading-relaxed">
                  "{ans}"
                </p>
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2">
                  <span className="font-semibold text-[#FFC72C]">
                    Respuesta #{i + 1}
                  </span>
                  <span>{count} votos</span>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};
