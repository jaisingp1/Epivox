import React from "react";
import { TrendingUp } from "lucide-react";
import { OPTION_COLORS } from "../../types";

interface PollLineChartProps {
  liveResults: Record<string, number>;
}

export const PollLineChart: React.FC<PollLineChartProps> = ({
  liveResults,
}) => {
  if (Object.keys(liveResults).length === 0) {
    return (
      <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-col justify-between">
        <div className="text-center text-[var(--text-muted)] py-10 my-auto">
          <TrendingUp className="w-16 h-16 mx-auto text-[#48A9C5] opacity-50 mb-2" />
          <p className="text-base font-bold text-[var(--text-main)]">
            Esperando respuestas para trazar la línea de tendencia...
          </p>
        </div>
      </div>
    );
  }

  const entries = Object.entries(liveResults).map(([k, v]) => ({
    label: k,
    count: v,
  }));
  const maxVal = Math.max(...entries.map((e) => e.count), 1);

  return (
    <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-col justify-between">
      <div className="w-full space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 items-end h-52">
          {entries.map((e, idx) => {
            const heightPct = Math.min(
              100,
              Math.round((e.count / maxVal) * 100),
            );
            const color = OPTION_COLORS[idx % OPTION_COLORS.length];
            return (
              <div
                key={e.label}
                className="flex flex-col items-center h-full justify-end space-y-2"
              >
                <span className="font-bold text-sm text-[var(--text-main)]">
                  {e.count}
                </span>
                <div className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-t-xl p-1 h-40 flex items-end">
                  <div
                    className="w-full rounded-t-lg transition-all duration-700 ease-out"
                    style={{
                      height: `${Math.max(12, heightPct)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="text-center text-xs font-bold text-[var(--text-main)] truncate max-w-[120px]">
                  {e.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
