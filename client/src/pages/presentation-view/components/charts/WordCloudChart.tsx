import { Cloud, Check } from "lucide-react";
import type { QuestionData, QuestionOption } from "../../types";
import { OPTION_COLORS } from "../../types";
import {
  getOptionVotes,
  isOptionCorrect,
  checkIsItemCorrect,
} from "../../utils/presentationHelpers";

interface WordCloudChartProps {
  parsedOptions: QuestionOption[];
  liveResults: Record<string, number>;
  showCorrectAnswers?: boolean;
  currentQ?: QuestionData;
}

export default function WordCloudChart({
  parsedOptions,
  liveResults,
  showCorrectAnswers = false,
  currentQ,
}: WordCloudChartProps) {
  const entries =
    parsedOptions.length > 0
      ? parsedOptions.map((o) => ({
          word: o.text,
          count: getOptionVotes(o, liveResults),
          isCorrect: showCorrectAnswers && isOptionCorrect(o, currentQ),
        }))
      : Object.entries(liveResults).map(([word, count]) => ({
          word,
          count,
          isCorrect: showCorrectAnswers && checkIsItemCorrect(word, currentQ),
        }));

  if (entries.length === 0 || entries.every((e) => e.count === 0)) {
    return (
      <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex items-center justify-center">
        <div className="text-center text-[#ECEBE4]/60 space-y-2 py-8">
          <Cloud className="w-16 h-16 mx-auto text-[#48A9C5] opacity-50 animate-pulse" />
          <p className="text-lg font-black text-white">
            Esperando que el público envíe sus respuestas...
          </p>
          <p className="text-xs text-[#ECEBE4]/60">
            Las palabras aparecerán y crecerán dinámicamente aquí en tiempo
            real.
          </p>
        </div>
      </div>
    );
  }

  const maxC = Math.max(...entries.map((e) => e.count), 1);
  return (
    <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex flex-wrap items-center justify-center gap-3.5 content-center">
      {entries.map((item, i) => {
        const scale = Math.min(3.2, 1.2 + (item.count / maxC) * 2.0);
        const color = item.isCorrect
          ? "#4C8C2B"
          : OPTION_COLORS[i % OPTION_COLORS.length];
        return (
          <span
            key={item.word}
            style={{
              fontSize: `${scale}rem`,
              color: item.isCorrect ? "#FFFFFF" : color,
            }}
            className={`font-black px-4 py-1.5 rounded-2xl shadow-xl transition-all hover:scale-110 cursor-default select-none animate-in fade-in inline-flex items-center gap-1.5 ${
              item.isCorrect
                ? "bg-[#4C8C2B]/40 border-2 border-[#4C8C2B] ring-2 ring-[#4C8C2B]/60 shadow-[0_0_25px_rgba(76,140,43,0.5)]"
                : "bg-[#001E32]/80 border border-[#425563]/80"
            }`}
          >
            {item.isCorrect && (
              <Check className="w-4 h-4 text-[#86C8BC] shrink-0" />
            )}
            <span>{item.word}</span>
            {item.isCorrect && (
              <span className="text-[10px] font-black uppercase tracking-wider text-[#86C8BC] bg-[#4C8C2B] px-1.5 py-0.5 rounded shadow">
                Correcta
              </span>
            )}
            <span className="text-xs opacity-75 font-bold">({item.count})</span>
          </span>
        );
      })}
    </div>
  );
}
