import { Cloud, Check } from "lucide-react";
import type { QuestionData, QuestionOption, RawAnswerItem } from "../../types";
import { OPTION_COLORS } from "../../types";
import {
  getOptionVotes,
  isOptionCorrect,
  checkIsItemCorrect,
} from "../../utils/presentationHelpers";
import {
  extractWordFrequencies,
  centerWeightedOrder,
  calculateWordScale,
  type WordCloudItem,
} from "../../../../utils/wordCloudHelper";

interface WordCloudChartProps {
  parsedOptions: QuestionOption[];
  liveResults: Record<string, number>;
  rawAnswers?: RawAnswerItem[];
  showCorrectAnswers?: boolean;
  currentQ?: QuestionData;
}

export default function WordCloudChart({
  parsedOptions,
  liveResults,
  rawAnswers,
  showCorrectAnswers = false,
  currentQ,
}: WordCloudChartProps) {
  const isPredefinedOptions =
    parsedOptions.length > 0 && currentQ?.question_type !== "word_cloud";

  const entries: WordCloudItem[] = isPredefinedOptions
    ? parsedOptions.map((o) => ({
        word: o.text,
        count: getOptionVotes(o, liveResults),
        isCorrect: showCorrectAnswers && isOptionCorrect(o, currentQ),
      }))
    : extractWordFrequencies(rawAnswers, liveResults).map((item) => ({
        ...item,
        isCorrect:
          showCorrectAnswers && checkIsItemCorrect(item.word, currentQ),
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
            Las palabras más frecuentes aparecerán y crecerán dinámicamente aquí
            en tiempo real.
          </p>
        </div>
      </div>
    );
  }

  const maxC = Math.max(...entries.map((e) => e.count), 1);
  const minC = Math.min(...entries.map((e) => e.count), 1);
  const orderedEntries = centerWeightedOrder(entries);

  return (
    <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl min-h-[320px] flex flex-wrap items-center justify-center gap-3.5 content-center">
      {orderedEntries.map((item, i) => {
        const scale = calculateWordScale(item.count, maxC, minC);
        const color = item.isCorrect
          ? "#4C8C2B"
          : OPTION_COLORS[i % OPTION_COLORS.length];
        const isHighFrequency = item.count >= maxC * 0.7 && maxC > 1;

        return (
          <span
            key={item.word}
            style={{
              fontSize: `${scale}rem`,
              color: item.isCorrect ? "#FFFFFF" : color,
            }}
            className={`px-4 py-1.5 rounded-2xl shadow-xl transition-all hover:scale-110 cursor-default select-none animate-in fade-in inline-flex items-center gap-1.5 ${
              isHighFrequency ? "font-black" : "font-bold"
            } ${
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
            <span className="text-xs opacity-75 font-semibold">
              ({item.count})
            </span>
          </span>
        );
      })}
    </div>
  );
}
