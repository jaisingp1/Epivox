import React from "react";
import { Cloud } from "lucide-react";
import { OPTION_COLORS } from "../../types";

interface PollWordCloudChartProps {
  liveResults: Record<string, number>;
  pin: string;
}

export const PollWordCloudChart: React.FC<PollWordCloudChartProps> = ({
  liveResults,
  pin,
}) => {
  if (Object.keys(liveResults).length === 0) {
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

  const maxCount = Math.max(...Object.values(liveResults), 1);

  return (
    <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-wrap items-center justify-center gap-4 content-center">
      {Object.entries(liveResults).map(([word, count], i) => {
        const scale = Math.min(3.2, 1.2 + (count / maxCount) * 2.0);
        const color = OPTION_COLORS[i % OPTION_COLORS.length];
        return (
          <span
            key={word}
            style={{ fontSize: `${scale}rem`, color }}
            className="font-black px-4 py-2 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl shadow-sm transition hover:scale-110 cursor-default select-none animate-in fade-in"
          >
            {word}{" "}
            <span className="text-xs opacity-75 font-bold">({count})</span>
          </span>
        );
      })}
    </div>
  );
};
