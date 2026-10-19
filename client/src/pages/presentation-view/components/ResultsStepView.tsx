import { ArrowRight, CheckCircle2, Trophy } from "lucide-react";
import type { QuestionData, QuestionOption, RawAnswerItem } from "../types";
import RatingVisualizer from "./RatingVisualizer";
import LiveChartsVisualizer from "./LiveChartsVisualizer";

interface ResultsStepViewProps {
  currentQ: QuestionData;
  currentQIndex: number;
  totalQuestions: number;
  totalAnswers: number;
  parsedOptions: QuestionOption[];
  liveResults: Record<string, number>;
  rawAnswers: RawAnswerItem[];
  overrideChartType: string | null;
  onChartTypeChange: (type: string) => void;
  isOpenQuestion: boolean;
  onPresenterAction: (action: string) => void;
}

export default function ResultsStepView({
  currentQ,
  currentQIndex,
  totalQuestions,
  totalAnswers,
  parsedOptions,
  liveResults,
  rawAnswers,
  overrideChartType,
  onChartTypeChange,
  isOpenQuestion,
  onPresenterAction,
}: ResultsStepViewProps) {
  const effectiveChartType =
    overrideChartType ||
    currentQ.chart_type ||
    (currentQ.question_type === "word_cloud" ? "word_cloud" : "bar");

  return (
    <main className="my-auto max-w-5xl w-full mx-auto space-y-6 py-4">
      <div className="bg-[#193750] border-2 border-[#425563] p-6 rounded-3xl text-center space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#FFC72C] font-bold">
          {currentQ.question_type === "rating"
            ? "Calificación de la Audiencia • Resumen Final"
            : "Distribución de Respuestas • Modo Audiencia"}
        </span>
        <h2 className="text-3xl font-extrabold text-white">
          {currentQ.question_text}
        </h2>
      </div>

      {/* Gráfico Especial: Calificación con Estrellas */}
      {currentQ.question_type === "rating" ? (
        <RatingVisualizer liveResults={liveResults} />
      ) : (
        <LiveChartsVisualizer
          chartType={effectiveChartType}
          onChartTypeChange={onChartTypeChange}
          liveResults={liveResults}
          rawAnswers={rawAnswers}
          parsedOptions={parsedOptions}
          totalAnswers={totalAnswers}
          showCorrectAnswers={true}
          currentQ={currentQ}
        />
      )}

      {/* Explicación si aplica */}
      {currentQ.explanation_text && (
        <div className="bg-[#48A9C5]/10 border border-[#48A9C5] p-4 rounded-2xl text-sm text-[#ECEBE4]">
          <strong className="text-[#48A9C5]">Explicación:</strong>{" "}
          {currentQ.explanation_text}
        </div>
      )}

      <div className="flex justify-end pt-2">
        {isOpenQuestion ? (
          currentQIndex + 1 < totalQuestions ? (
            <button
              type="button"
              onClick={() => onPresenterAction("next_question")}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <span>Siguiente Pregunta</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onPresenterAction("finish_session")}
              className="bg-[#4C8C2B] hover:bg-[#3D7022] text-white font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <span>Finalizar Sondeo</span>
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={() => onPresenterAction("show_leaderboard")}
            className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition cursor-pointer"
          >
            <span>Ver Tabla de Posiciones</span>
            <Trophy className="w-5 h-5" />
          </button>
        )}
      </div>
    </main>
  );
}
