import { TrendingUp } from "lucide-react";
import type { QuestionData, QuestionOption } from "../../types";
import { OPTION_COLORS } from "../../types";
import {
  getOptionVotes,
  isOptionCorrect,
  checkIsItemCorrect,
} from "../../utils/presentationHelpers";

interface LinesTrendChartProps {
  parsedOptions: QuestionOption[];
  liveResults: Record<string, number>;
  showCorrectAnswers?: boolean;
  currentQ?: QuestionData;
}

export default function LinesTrendChart({
  parsedOptions,
  liveResults,
  showCorrectAnswers = false,
  currentQ,
}: LinesTrendChartProps) {
  const entries =
    parsedOptions.length > 0
      ? parsedOptions.map((o) => ({
          id: o.id,
          label: o.text,
          count: getOptionVotes(o, liveResults),
          isCorrect: showCorrectAnswers && isOptionCorrect(o, currentQ),
        }))
      : Object.entries(liveResults).map(([k, v]) => ({
          id: k,
          label: k,
          count: v,
          isCorrect: showCorrectAnswers && checkIsItemCorrect(k, currentQ),
        }));

  if (entries.length === 0 || entries.every((e) => e.count === 0)) {
    return (
      <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex items-center justify-center">
        <div className="text-center text-[#ECEBE4]/60 py-10">
          <TrendingUp className="w-16 h-16 mx-auto text-[#48A9C5] opacity-50 mb-2 animate-pulse" />
          <p className="text-lg font-bold text-white">
            Esperando respuestas para trazar la tendencia...
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count), 1);
  return (
    <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex flex-col justify-between space-y-4">
      <div className="space-y-4">
        <div className="flex items-end gap-3 h-52 border-b-2 border-l-2 border-[#425563] p-4">
          {entries.map((item, idx) => {
            const pct = Math.min(
              100,
              Math.round((item.count / maxCount) * 100),
            );
            const color = item.isCorrect
              ? "#4C8C2B"
              : OPTION_COLORS[idx % OPTION_COLORS.length];
            return (
              <div
                key={item.label}
                className="flex-1 flex flex-col items-center justify-end h-full"
              >
                <span className="text-xs font-bold text-[#FFC72C] mb-1">
                  {item.count}
                </span>
                <div
                  style={{
                    height: `${Math.max(12, pct)}%`,
                    backgroundColor: color,
                  }}
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    item.isCorrect ? "ring-2 ring-[#86C8BC]" : ""
                  }`}
                />
                <span className="text-[10px] text-[#ECEBE4]/80 truncate max-w-[80px] mt-2 font-bold">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
