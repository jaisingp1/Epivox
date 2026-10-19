import { BarChart3 } from "lucide-react";
import type { QuestionData, QuestionOption } from "../../types";
import { OPTION_COLORS } from "../../types";
import {
  getOptionVotes,
  isOptionCorrect,
  checkIsItemCorrect,
} from "../../utils/presentationHelpers";

interface BarVotesChartProps {
  parsedOptions: QuestionOption[];
  liveResults: Record<string, number>;
  showCorrectAnswers?: boolean;
  currentQ?: QuestionData;
}

export default function BarVotesChart({
  parsedOptions,
  liveResults,
  showCorrectAnswers = false,
  currentQ,
}: BarVotesChartProps) {
  const optionsList: QuestionOption[] =
    parsedOptions.length > 0
      ? parsedOptions
      : Object.keys(liveResults).map((k) => ({
          id: k,
          text: k,
          isCorrect: showCorrectAnswers && checkIsItemCorrect(k, currentQ),
        }));

  const totalVotes = Object.values(liveResults).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(
    ...optionsList.map((o) => getOptionVotes(o, liveResults)),
    1,
  );

  if (optionsList.length === 0) {
    return (
      <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[300px] flex items-center justify-center">
        <div className="text-center text-[#ECEBE4]/60 py-10">
          <BarChart3 className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2 animate-pulse" />
          <p className="text-lg font-bold text-white">
            Esperando respuestas del público para graficar...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#193750] border-2 border-[#425563] p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#ECEBE4]/80 px-2 border-b border-[#425563]/50 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#FFC72C]" />
            <span className="font-extrabold uppercase tracking-wider text-white">
              Distribución de Votos
            </span>
          </div>
          <span className="bg-[#001E32] px-3 py-1 rounded-full border border-[#425563] font-bold text-[#FFC72C]">
            {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
          </span>
        </div>

        <div className="flex items-end justify-around gap-3 sm:gap-6 h-64 sm:h-72 pt-6 pb-2 border-b-2 border-[#425563]">
          {optionsList.map((opt, idx) => {
            const count = getOptionVotes(opt, liveResults);
            const pct =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isCorrect =
              showCorrectAnswers && isOptionCorrect(opt, currentQ);
            const barHeightPct =
              totalVotes > 0 && maxVotes > 0
                ? Math.round((count / maxVotes) * 100)
                : 0;
            const barColor = isCorrect
              ? "#4C8C2B"
              : OPTION_COLORS[idx % OPTION_COLORS.length];

            return (
              <div
                key={opt.id}
                className="flex-1 flex flex-col items-center justify-end h-full max-w-[130px] sm:max-w-[160px] min-w-0"
              >
                <div className="flex flex-col items-center justify-center mb-2 transition-all duration-500">
                  <span
                    className={`text-2xl sm:text-3xl font-black leading-none ${
                      count > 0
                        ? "text-white"
                        : "text-[#ECEBE4]/40 text-lg sm:text-xl"
                    }`}
                  >
                    {count}
                  </span>
                  {totalVotes > 0 && (
                    <span
                      className={`text-[11px] sm:text-xs font-black mt-1 px-2 py-0.5 rounded-full ${
                        count > 0
                          ? "bg-[#001E32] text-[#FFC72C] border border-[#425563]"
                          : "text-[#ECEBE4]/30"
                      }`}
                    >
                      {pct}%
                    </span>
                  )}
                </div>

                <div className="w-full flex items-end justify-center h-40 sm:h-48">
                  <div
                    className={`w-full max-w-[70px] sm:max-w-[85px] rounded-t-2xl transition-all duration-700 ease-out relative flex items-start justify-center ${
                      isCorrect && count > 0
                        ? "ring-4 ring-[#4C8C2B]/60 shadow-[0_0_25px_rgba(76,140,43,0.5)]"
                        : count > 0
                          ? "shadow-lg"
                          : ""
                    }`}
                    style={{
                      height:
                        count > 0
                          ? `${Math.max(12, Math.min(100, barHeightPct))}%`
                          : "6px",
                      backgroundColor: count > 0 ? barColor : "#001E32",
                      border: count === 0 ? "1px solid #425563" : undefined,
                    }}
                  >
                    {isCorrect && count > 0 && (
                      <div className="mt-2 bg-[#001E32]/90 text-white px-2 py-0.5 rounded-full text-xs font-black flex items-center gap-1 shadow">
                        <span>✓</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-start justify-around gap-3 sm:gap-6 pt-1">
          {optionsList.map((opt, idx) => {
            const isCorrect =
              showCorrectAnswers && isOptionCorrect(opt, currentQ);
            const barColor = isCorrect
              ? "#4C8C2B"
              : OPTION_COLORS[idx % OPTION_COLORS.length];
            return (
              <div
                key={opt.id}
                className="flex-1 flex flex-col items-center text-center max-w-[130px] sm:max-w-[160px] min-w-0 space-y-1.5"
              >
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow shrink-0"
                    style={{
                      backgroundColor: barColor,
                      color: idx === 0 && !isCorrect ? "#001E32" : "#FFFFFF",
                    }}
                  >
                    {opt.id && opt.id.length <= 2 ? opt.id : idx + 1}
                  </span>
                  {isCorrect && (
                    <span className="text-[10px] uppercase font-black tracking-wider text-[#86C8BC] bg-[#4C8C2B]/30 border border-[#4C8C2B] px-1.5 py-0.5 rounded shadow-sm">
                      Correcta
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold text-white line-clamp-3 leading-snug break-words">
                  {opt.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
