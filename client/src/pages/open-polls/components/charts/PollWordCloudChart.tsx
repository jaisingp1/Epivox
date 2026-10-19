import React from "react";
import { Cloud } from "lucide-react";
import { OPTION_COLORS, RawAnswerItem } from "../../types";
import {
  extractWordFrequencies,
  centerWeightedOrder,
  calculateWordScale,
} from "../../../../utils/wordCloudHelper";

interface PollWordCloudChartProps {
  liveResults: Record<string, number>;
  rawAnswers?: RawAnswerItem[];
  pin: string;
}

export const PollWordCloudChart: React.FC<PollWordCloudChartProps> = ({
  liveResults,
  rawAnswers,
  pin,
}) => {
  const entries = extractWordFrequencies(rawAnswers, liveResults);

  if (entries.length === 0 || entries.every((e) => e.count === 0)) {
    return (
      <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-wrap items-center justify-center gap-4 content-center">
        <div className="text-center text-[var(--text-muted)] space-y-2 py-10">
          <Cloud className="w-16 h-16 mx-auto text-[#48A9C5] opacity-50 animate-pulse" />
          <p className="text-base font-bold text-[var(--text-main)]">
            Esperando que el público envíe sus respuestas...
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            Comparte el PIN {pin} para participar
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...entries.map((e) => e.count), 1);
  const minCount = Math.min(...entries.map((e) => e.count), 1);
  const orderedEntries = centerWeightedOrder(entries);

  return (
    <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-wrap items-center justify-center gap-4 content-center">
      {orderedEntries.map((item, i) => {
        const scale = calculateWordScale(item.count, maxCount, minCount);
        const color = OPTION_COLORS[i % OPTION_COLORS.length];
        const isHighFrequency = item.count >= maxCount * 0.7 && maxCount > 1;

        return (
          <span
            key={item.word}
            style={{ fontSize: `${scale}rem`, color }}
            className={`px-4 py-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-sm transition hover:scale-110 cursor-default select-none animate-in fade-in ${
              isHighFrequency ? "font-black" : "font-bold"
            }`}
          >
            {item.word}{" "}
            <span className="text-xs opacity-75 font-semibold">
              ({item.count})
            </span>
          </span>
        );
      })}
    </div>
  );
};
