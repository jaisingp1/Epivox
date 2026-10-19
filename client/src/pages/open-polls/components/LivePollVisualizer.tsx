import React from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { CHART_TYPES, RawAnswerItem, SessionQuestion } from "../types";
import { PollWordCloudChart } from "./charts/PollWordCloudChart";
import { PollBarChart } from "./charts/PollBarChart";
import { PollLineChart } from "./charts/PollLineChart";
import { PollCardsChart } from "./charts/PollCardsChart";
import { PollDonutChart } from "./charts/PollDonutChart";

interface LivePollVisualizerProps {
  currentActiveQuestion: SessionQuestion | null;
  currentQIndex: number;
  totalQuestions: number;
  activeChartType: string;
  pin: string;
  totalAnswers: number;
  liveResults: Record<string, number>;
  rawAnswers: RawAnswerItem[];
  handleSwitchChart: (chartType: string) => void;
  handlePrevQuestion: () => void;
  handleNextQuestion: () => void;
  handleFinishSession: () => void;
}

export const LivePollVisualizer: React.FC<LivePollVisualizerProps> = ({
  currentActiveQuestion,
  currentQIndex,
  totalQuestions,
  activeChartType,
  pin,
  totalAnswers,
  liveResults,
  rawAnswers,
  handleSwitchChart,
  handlePrevQuestion,
  handleNextQuestion,
  handleFinishSession,
}) => {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
      {/* Encabezado de la Pregunta Activa y Controles de Cambio de Gráfico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <span className="inline-block text-[11px] uppercase font-black text-[#FFC72C] tracking-widest bg-[var(--surface-subtle)] px-3 py-1 rounded-full border border-[var(--border-subtle)]">
            Pregunta {currentQIndex + 1} de {totalQuestions}
          </span>
          <h3 className="text-2xl font-black text-[var(--text-main)] max-w-2xl leading-snug">
            {currentActiveQuestion?.question_text || "Pregunta en vivo..."}
          </h3>
        </div>

        {/* Toolbar: Alternar Gráfico en Vivo */}
        <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] p-1.5 rounded-2xl border border-[var(--border-subtle)] shrink-0 flex-wrap">
          {CHART_TYPES.map((item) => {
            const Icon = item.icon;
            const isCur = activeChartType === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSwitchChart(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isCur
                    ? "bg-[#FFC72C] text-[#001E32] shadow-sm font-extrabold"
                    : "text-[var(--text-subtle)] hover:text-[var(--text-main)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDERIZADOR 1: Nube de Palabras */}
      {activeChartType === "word_cloud" && (
        <PollWordCloudChart liveResults={liveResults} pin={pin} />
      )}

      {/* RENDERIZADOR 2: Barras */}
      {activeChartType === "bar" && <PollBarChart liveResults={liveResults} />}

      {/* RENDERIZADOR 3: Líneas */}
      {activeChartType === "line" && (
        <PollLineChart liveResults={liveResults} />
      )}

      {/* RENDERIZADOR 4: Muro de Ideas */}
      {activeChartType === "cards" && (
        <PollCardsChart rawAnswers={rawAnswers} liveResults={liveResults} />
      )}

      {/* RENDERIZADOR 5: Dona Circular */}
      {activeChartType === "donut" && (
        <PollDonutChart liveResults={liveResults} totalAnswers={totalAnswers} />
      )}

      {/* Barra de Navegación de Preguntas */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
        {currentQIndex > 0 ? (
          <button
            type="button"
            onClick={handlePrevQuestion}
            className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-sm py-3 px-5 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Pregunta Anterior</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {currentQIndex < totalQuestions - 1 ? (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 px-6 rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Siguiente Pregunta</span>
              <ArrowRight className="w-4 h-4 fill-[#001E32]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinishSession}
              className="bg-[#4C8C2B] hover:bg-[#3D7122] text-white font-black text-sm py-3 px-6 rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Finalizar Sondeo</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
