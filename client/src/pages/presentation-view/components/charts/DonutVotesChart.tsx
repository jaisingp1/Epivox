import { PieChart, Check } from "lucide-react";
import type { QuestionData, QuestionOption } from "../../types";
import { OPTION_COLORS } from "../../types";
import {
  getOptionVotes,
  isOptionCorrect,
  checkIsItemCorrect,
} from "../../utils/presentationHelpers";

interface DonutVotesChartProps {
  parsedOptions: QuestionOption[];
  liveResults: Record<string, number>;
  totalAnswers: number;
  showCorrectAnswers?: boolean;
  currentQ?: QuestionData;
}

export default function DonutVotesChart({
  parsedOptions,
  liveResults,
  totalAnswers,
  showCorrectAnswers = false,
  currentQ,
}: DonutVotesChartProps) {
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

  const sum = entries.reduce((a, b) => a + b.count, 0) || 1;
  if (entries.length === 0 || entries.every((e) => e.count === 0)) {
    return (
      <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex items-center justify-center">
        <div className="text-center text-[#ECEBE4]/60 py-10 w-full">
          <PieChart className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2 animate-pulse" />
          <p className="text-lg font-bold text-white">
            Esperando respuestas para calcular porcentajes...
          </p>
        </div>
      </div>
    );
  }

  let acc = 0;
  const segments = entries.map((e, idx) => {
    const pct = (e.count / sum) * 100;
    const start = acc;
    acc += pct;
    const color = e.isCorrect
      ? "#4C8C2B"
      : OPTION_COLORS[idx % OPTION_COLORS.length];
    return {
      ...e,
      pct: Math.round(pct),
      color,
      start,
      end: acc,
    };
  });

  const gradientStr = segments
    .map((s) => `${s.color} ${s.start}% ${s.end}%`)
    .join(", ");

  return (
    <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex flex-col sm:flex-row items-center justify-around gap-6">
      <div
        style={{ background: `conic-gradient(${gradientStr})` }}
        className="relative w-48 h-48 rounded-full flex items-center justify-center shadow-2xl shrink-0"
      >
        <div className="w-28 h-28 bg-[#193750] rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-2xl font-black text-white">{totalAnswers}</span>
          <span className="text-[10px] text-[#ECEBE4]/60 uppercase tracking-widest font-bold">
            Votos
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-w-sm w-full">
        {segments.map((s) => (
          <div
            key={s.label}
            className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
              s.isCorrect
                ? "bg-[#4C8C2B]/20 border-2 border-[#4C8C2B] shadow-[0_0_15px_rgba(76,140,43,0.3)] ring-1 ring-[#4C8C2B]"
                : "bg-[#001E32] border-[#425563]"
            }`}
          >
            <div className="flex items-center space-x-2 truncate">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: s.color }}
              />
              <span
                className={`text-xs truncate ${
                  s.isCorrect
                    ? "font-extrabold text-white"
                    : "font-bold text-[#ECEBE4]"
                }`}
              >
                {s.label}
              </span>
              {s.isCorrect && (
                <span className="text-[10px] uppercase font-black tracking-wider text-[#86C8BC] bg-[#4C8C2B]/40 border border-[#4C8C2B] px-1.5 py-0.5 rounded shadow-sm inline-flex items-center gap-1 shrink-0">
                  <Check className="w-3 h-3 text-[#86C8BC]" />
                  Correcta
                </span>
              )}
            </div>
            <span
              className={`text-xs font-mono font-extrabold pl-2 shrink-0 ${
                s.isCorrect ? "text-[#86C8BC]" : "text-[#FFC72C]"
              }`}
            >
              {s.count} ({s.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
