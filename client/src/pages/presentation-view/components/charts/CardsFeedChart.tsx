import { LayoutGrid, CheckCircle2 } from "lucide-react";
import type { QuestionData, QuestionOption, RawAnswerItem } from "../../types";
import {
  getOptionVotes,
  isOptionCorrect,
  checkIsItemCorrect,
} from "../../utils/presentationHelpers";

interface CardsFeedChartProps {
  rawAnswers: RawAnswerItem[];
  liveResults: Record<string, number>;
  parsedOptions: QuestionOption[];
  showCorrectAnswers?: boolean;
  currentQ?: QuestionData;
}

export default function CardsFeedChart({
  rawAnswers,
  liveResults,
  parsedOptions,
  showCorrectAnswers = false,
  currentQ,
}: CardsFeedChartProps) {
  const hasOptions = parsedOptions.length > 0;
  const hasRaw = rawAnswers.length > 0;
  const hasResults = Object.keys(liveResults).length > 0;

  if (!hasOptions && !hasRaw && !hasResults) {
    return (
      <div className="bg-[#193750] border-2 border-[#425563] p-6 rounded-3xl min-h-[300px] flex items-center justify-center">
        <div className="text-center text-[#ECEBE4]/60 py-10">
          <LayoutGrid className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2 animate-pulse" />
          <p className="text-lg font-bold text-white">
            Esperando respuestas del público...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#193750] border-2 border-[#425563] p-6 rounded-3xl max-h-[400px] overflow-y-auto space-y-4">
      {hasOptions ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {parsedOptions.map((opt, i) => {
            const isCorrect =
              showCorrectAnswers && isOptionCorrect(opt, currentQ);
            const votes = getOptionVotes(opt, liveResults);
            return (
              <div
                key={opt.id || i}
                className={`p-4 rounded-2xl shadow space-y-2 flex flex-col justify-between transition ${
                  isCorrect
                    ? "bg-[#4C8C2B]/15 border-2 border-[#4C8C2B] shadow-[0_0_20px_rgba(76,140,43,0.35)] ring-1 ring-[#4C8C2B]"
                    : "bg-[#001E32] border border-[#425563]"
                }`}
              >
                {isCorrect && (
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#86C8BC] bg-[#4C8C2B]/30 border border-[#4C8C2B] px-2 py-0.5 rounded-lg w-fit">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#86C8BC]" />
                    <span>Respuesta Correcta</span>
                  </div>
                )}
                <p className="text-base font-bold text-white leading-relaxed">
                  {opt.text}
                </p>
                <div className="flex items-center justify-between text-xs text-[#ECEBE4]/60 border-t border-[#425563]/40 pt-2">
                  <span className="font-semibold text-[#FFC72C]">
                    Opción {String.fromCharCode(65 + i)}
                  </span>
                  <span className="font-mono font-bold text-[#86C8BC]">
                    {votes} {votes === 1 ? "voto" : "votos"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {hasRaw
            ? rawAnswers.map((ans) => {
                const isCorrect =
                  showCorrectAnswers &&
                  checkIsItemCorrect(ans.answer_payload, currentQ);
                return (
                  <div
                    key={ans.id}
                    className={`p-4 rounded-2xl shadow space-y-2 flex flex-col justify-between transition ${
                      isCorrect
                        ? "bg-[#4C8C2B]/15 border-2 border-[#4C8C2B] shadow-[0_0_20px_rgba(76,140,43,0.35)] ring-1 ring-[#4C8C2B]"
                        : "bg-[#001E32] border border-[#425563]"
                    }`}
                  >
                    {isCorrect && (
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#86C8BC] bg-[#4C8C2B]/30 border border-[#4C8C2B] px-2 py-0.5 rounded-lg w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#86C8BC]" />
                        <span>Respuesta Correcta</span>
                      </div>
                    )}
                    <p className="text-base font-bold text-white leading-relaxed">
                      "{ans.answer_payload}"
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#ECEBE4]/60 border-t border-[#425563]/40 pt-2">
                      <span className="font-semibold text-[#FFC72C]">
                        {ans.nickname}
                      </span>
                      {ans.department && <span>{ans.department}</span>}
                    </div>
                  </div>
                );
              })
            : Object.entries(liveResults).map(([ans, count], i) => {
                const isCorrect =
                  showCorrectAnswers && checkIsItemCorrect(ans, currentQ);
                return (
                  <div
                    key={ans}
                    className={`p-4 rounded-2xl shadow space-y-2 flex flex-col justify-between transition ${
                      isCorrect
                        ? "bg-[#4C8C2B]/15 border-2 border-[#4C8C2B] shadow-[0_0_20px_rgba(76,140,43,0.35)] ring-1 ring-[#4C8C2B]"
                        : "bg-[#001E32] border border-[#425563]"
                    }`}
                  >
                    {isCorrect && (
                      <div className="flex items-center gap-1.5 text-xs font-black text-[#86C8BC] bg-[#4C8C2B]/30 border border-[#4C8C2B] px-2 py-0.5 rounded-lg w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#86C8BC]" />
                        <span>Respuesta Correcta</span>
                      </div>
                    )}
                    <p className="text-base font-bold text-white leading-relaxed">
                      "{ans}"
                    </p>
                    <div className="flex items-center justify-between text-xs text-[#ECEBE4]/60 border-t border-[#425563]/40 pt-2">
                      <span className="font-semibold text-[#FFC72C]">
                        Aporte #{i + 1}
                      </span>
                      <span>{count} menciones</span>
                    </div>
                  </div>
                );
              })}
        </div>
      )}
    </div>
  );
}
