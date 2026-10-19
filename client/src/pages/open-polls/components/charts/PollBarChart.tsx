import React from "react";
import { BarChart3 } from "lucide-react";
import { OPTION_COLORS } from "../../types";

interface PollBarChartProps {
  liveResults: Record<string, number>;
}

export const PollBarChart: React.FC<PollBarChartProps> = ({ liveResults }) => {
  if (Object.keys(liveResults).length === 0) {
    return (
      <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-6 sm:p-8 rounded-2xl min-h-[340px] space-y-6">
        <div className="w-full text-center text-[var(--text-muted)] py-10">
          <BarChart3 className="w-16 h-16 mx-auto text-[#FFC72C] opacity-50 mb-2" />
          <p className="text-base font-bold text-[var(--text-main)]">
            Esperando respuestas para graficar...
          </p>
        </div>
      </div>
    );
  }

  const totalVotes = Object.values(liveResults).reduce((a, b) => a + b, 0);
  const maxVotes = Math.max(...Object.values(liveResults), 1);
  const entries = Object.entries(liveResults);

  return (
    <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-6 sm:p-8 rounded-2xl min-h-[340px] space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] border-b border-[var(--border-subtle)] pb-2 px-1">
          <span className="font-extrabold uppercase tracking-wider text-[var(--text-main)]">
            Distribución de Respuestas
          </span>
          <span className="bg-[var(--surface-card)] px-3 py-1 rounded-full border border-[var(--border-subtle)] font-bold text-[#FFC72C]">
            {totalVotes} {totalVotes === 1 ? "voto" : "votos"}
          </span>
        </div>

        <div className="flex items-end justify-around gap-3 sm:gap-6 h-64 sm:h-72 pt-6 pb-2 border-b-2 border-[var(--border-subtle)]">
          {entries.map(([ans, count], idx) => {
            const pct =
              totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const barHeightPct =
              totalVotes > 0 && maxVotes > 0
                ? Math.round((count / maxVotes) * 100)
                : 0;
            const color = OPTION_COLORS[idx % OPTION_COLORS.length];

            return (
              <div
                key={ans}
                className="flex-1 flex flex-col items-center justify-end h-full max-w-[130px] sm:max-w-[160px] min-w-0"
              >
                <div className="flex flex-col items-center justify-center mb-2 transition-all duration-500">
                  <span
                    className={`text-2xl sm:text-3xl font-black leading-none ${
                      count > 0
                        ? "text-[var(--text-main)] scale-105"
                        : "text-[var(--text-muted)]/50 text-lg sm:text-xl"
                    }`}
                  >
                    {count}
                  </span>
                  {totalVotes > 0 && (
                    <span
                      className={`text-[11px] sm:text-xs font-black mt-1 px-2 py-0.5 rounded-full ${
                        count > 0
                          ? "bg-[var(--surface-card)] text-[#FFC72C] border border-[var(--border-subtle)]"
                          : "text-[var(--text-muted)]/40"
                      }`}
                    >
                      {pct}%
                    </span>
                  )}
                </div>

                <div className="w-full flex items-end justify-center h-40 sm:h-48">
                  <div
                    className={`w-full max-w-[70px] sm:max-w-[85px] rounded-t-2xl transition-all duration-700 ease-out relative flex items-start justify-center ${
                      count > 0 ? "shadow-lg" : ""
                    }`}
                    style={{
                      height:
                        count > 0
                          ? `${Math.max(12, Math.min(100, barHeightPct))}%`
                          : "6px",
                      backgroundColor:
                        count > 0 ? color : "var(--surface-card)",
                      border:
                        count === 0
                          ? "1px solid var(--border-subtle)"
                          : undefined,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-start justify-around gap-3 sm:gap-6 pt-1">
          {entries.map(([ans], idx) => {
            const color = OPTION_COLORS[idx % OPTION_COLORS.length];
            return (
              <div
                key={ans}
                className="flex-1 flex flex-col items-center text-center max-w-[130px] sm:max-w-[160px] min-w-0 space-y-1.5"
              >
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow shrink-0"
                  style={{
                    backgroundColor: color,
                    color: idx === 0 ? "#001E32" : "#FFFFFF",
                  }}
                >
                  {idx + 1}
                </span>
                <span className="text-xs sm:text-sm font-bold text-[var(--text-main)] line-clamp-3 leading-snug break-words">
                  {ans}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
