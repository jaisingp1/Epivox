import React from "react";
import { PieChart } from "lucide-react";
import { OPTION_COLORS } from "../../types";

interface PollDonutChartProps {
  liveResults: Record<string, number>;
  totalAnswers: number;
}

export const PollDonutChart: React.FC<PollDonutChartProps> = ({
  liveResults,
  totalAnswers,
}) => {
  if (Object.keys(liveResults).length === 0) {
    return (
      <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-col md:flex-row items-center justify-around gap-6">
        <div className="text-center text-[var(--text-muted)] py-10">
          <PieChart className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2" />
          <p className="text-base font-bold text-[var(--text-main)]">
            Esperando respuestas para calcular proporciones...
          </p>
        </div>
      </div>
    );
  }

  const entries = Object.entries(liveResults).map(([k, v]) => ({
    id: k,
    label: k,
    count: v,
  }));
  const sum = entries.reduce((a, b) => a + b.count, 0) || 1;

  let cumulative = 0;
  const gradientSegments: string[] = [];
  const legendItems = entries.map((e, idx) => {
    const pct = (e.count / sum) * 100;
    const start = cumulative;
    const end = cumulative + pct;
    cumulative = end;
    const color = OPTION_COLORS[idx % OPTION_COLORS.length];
    gradientSegments.push(`${color} ${start}% ${end}%`);
    return {
      ...e,
      pct: Math.round(pct),
      color,
    };
  });

  const conicBackground = `conic-gradient(${gradientSegments.join(", ")})`;

  return (
    <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-8 rounded-2xl min-h-[340px] flex flex-col md:flex-row items-center justify-around gap-6">
      <div className="relative w-52 h-52 shrink-0 flex items-center justify-center">
        <div
          className="w-full h-full rounded-full shadow-lg transition-all duration-700"
          style={{ background: conicBackground }}
        />
        <div className="absolute w-28 h-28 rounded-full bg-[var(--surface-card)] border border-[var(--border-subtle)] flex flex-col items-center justify-center shadow-inner">
          <span className="text-3xl font-black text-[var(--text-main)]">
            {totalAnswers}
          </span>
          <span className="block text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-bold">
            Respuestas
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-w-sm w-full">
        {legendItems.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between bg-[var(--surface-card)] p-3 rounded-xl border border-[var(--border-subtle)]"
          >
            <div className="flex items-center space-x-2 truncate">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs font-bold text-[var(--text-main)] truncate">
                {s.label}
              </span>
            </div>
            <span className="text-xs font-extrabold text-[#FFC72C] pl-2 shrink-0">
              {s.count} ({s.pct}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
