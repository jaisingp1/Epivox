import {
  Cloud,
  BarChart3,
  TrendingUp,
  LayoutGrid,
  PieChart,
} from "lucide-react";
import type { QuestionData, QuestionOption, RawAnswerItem } from "../types";
import WordCloudChart from "./charts/WordCloudChart";
import CardsFeedChart from "./charts/CardsFeedChart";
import LinesTrendChart from "./charts/LinesTrendChart";
import DonutVotesChart from "./charts/DonutVotesChart";
import BarVotesChart from "./charts/BarVotesChart";

interface LiveChartsVisualizerProps {
  chartType: string;
  onChartTypeChange: (type: string) => void;
  liveResults: Record<string, number>;
  rawAnswers: RawAnswerItem[];
  parsedOptions: QuestionOption[];
  totalAnswers: number;
  showCorrectAnswers?: boolean;
  currentQ?: QuestionData;
}

export default function LiveChartsVisualizer({
  chartType,
  onChartTypeChange,
  liveResults,
  rawAnswers,
  parsedOptions,
  totalAnswers,
  showCorrectAnswers = false,
  currentQ,
}: LiveChartsVisualizerProps) {
  return (
    <div className="space-y-4 w-full animate-in fade-in">
      {/* Selector de gráfico en vivo estilo Mentimeter */}
      <div className="flex items-center justify-between bg-[#193750] border border-[#425563] px-5 py-2.5 rounded-2xl">
        <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider">
          Visualización en Vivo
        </span>
        <div className="flex items-center gap-1.5 bg-[#001E32] p-1 rounded-xl border border-[#425563] flex-wrap">
          {[
            { type: "word_cloud", label: "Nube", icon: Cloud },
            { type: "bar", label: "Barras", icon: BarChart3 },
            { type: "line", label: "Líneas", icon: TrendingUp },
            { type: "cards", label: "Muro", icon: LayoutGrid },
            { type: "donut", label: "Dona", icon: PieChart },
          ].map((item) => {
            const Icon = item.icon;
            const active = chartType === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() => onChartTypeChange(item.type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  active
                    ? "bg-[#FFC72C] text-[#001E32] shadow font-black scale-105"
                    : "text-[#ECEBE4]/70 hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {chartType === "word_cloud" && (
        <WordCloudChart
          parsedOptions={parsedOptions}
          liveResults={liveResults}
          rawAnswers={rawAnswers}
          showCorrectAnswers={showCorrectAnswers}
          currentQ={currentQ}
        />
      )}

      {chartType === "cards" && (
        <CardsFeedChart
          rawAnswers={rawAnswers}
          liveResults={liveResults}
          parsedOptions={parsedOptions}
          showCorrectAnswers={showCorrectAnswers}
          currentQ={currentQ}
        />
      )}

      {chartType === "line" && (
        <LinesTrendChart
          parsedOptions={parsedOptions}
          liveResults={liveResults}
          showCorrectAnswers={showCorrectAnswers}
          currentQ={currentQ}
        />
      )}

      {chartType === "donut" && (
        <DonutVotesChart
          parsedOptions={parsedOptions}
          liveResults={liveResults}
          totalAnswers={totalAnswers}
          showCorrectAnswers={showCorrectAnswers}
          currentQ={currentQ}
        />
      )}

      {chartType === "bar" && (
        <BarVotesChart
          parsedOptions={parsedOptions}
          liveResults={liveResults}
          showCorrectAnswers={showCorrectAnswers}
          currentQ={currentQ}
        />
      )}
    </div>
  );
}
