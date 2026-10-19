import {
  Clock,
  BarChart3,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import EpirocOptionIcon from "../../../components/EpirocOptionIcon";
import type {
  ParticipantData,
  QuestionData,
  QuestionOption,
  RawAnswerItem,
} from "../types";
import RatingVisualizer from "./RatingVisualizer";
import LiveChartsVisualizer from "./LiveChartsVisualizer";

interface QuestionStepViewProps {
  currentQ: QuestionData;
  currentQIndex: number;
  totalQuestions: number;
  remainingTime: number;
  totalAnswers: number;
  participants: ParticipantData[];
  parsedOptions: QuestionOption[];
  liveResults: Record<string, number>;
  rawAnswers: RawAnswerItem[];
  overrideChartType: string | null;
  onChartTypeChange: (type: string) => void;
  isOpenQuestion: boolean;
  onPresenterAction: (action: string) => void;
}

export default function QuestionStepView({
  currentQ,
  currentQIndex,
  totalQuestions,
  remainingTime,
  totalAnswers,
  participants,
  parsedOptions,
  liveResults,
  rawAnswers,
  overrideChartType,
  onChartTypeChange,
  isOpenQuestion,
  onPresenterAction,
}: QuestionStepViewProps) {
  const effectiveChartType =
    overrideChartType ||
    currentQ.chart_type ||
    (currentQ.question_type === "word_cloud" ? "word_cloud" : "bar");

  return (
    <main className="my-auto max-w-5xl w-full mx-auto space-y-8 py-4">
      <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl text-center shadow-2xl relative space-y-4">
        <span className="inline-block text-xs uppercase tracking-widest bg-[#FFC72C] text-[#001E32] font-black px-4 py-1 rounded-full">
          Pregunta {currentQIndex + 1} de {totalQuestions}
        </span>
        <h2 className="text-4xl font-extrabold text-white leading-tight">
          {currentQ.question_text}
        </h2>

        <div className="flex items-center justify-center space-x-8 pt-2">
          <div className="flex items-center space-x-2 bg-[#001E32] border border-[#425563] px-4 py-2 rounded-xl">
            <Clock className="w-6 h-6 text-[#FFC72C]" />
            <span className="font-mono text-2xl font-black text-[#FFC72C]">
              {remainingTime}s
            </span>
          </div>
          <div className="flex items-center space-x-2 bg-[#001E32] border border-[#425563] px-4 py-2 rounded-xl">
            <BarChart3 className="w-6 h-6 text-[#48A9C5]" />
            <span className="text-xl font-bold">
              {totalAnswers} / {participants.length} respuestas
            </span>
          </div>
        </div>

        {/* Aviso cuando todos han respondido */}
        {participants.length > 0 && totalAnswers >= participants.length && (
          <div className="inline-flex items-center gap-2.5 bg-[#4C8C2B]/20 border-2 border-[#4C8C2B] text-white px-5 py-2.5 rounded-2xl shadow-xl animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-[#86C8BC]" />
            <span className="text-base font-extrabold text-[#86C8BC]">
              ¡Todos los participantes han respondido! ({totalAnswers}/
              {participants.length})
            </span>
            <span className="text-xs text-[#ECEBE4]/80 hidden sm:inline">
              &bull; Puedes continuar con el tiempo o cerrar la pregunta ahora.
            </span>
          </div>
        )}
      </div>

      {/* Opciones en la pantalla grande - Soporte dinámico para 2 a 6 opciones o Rating */}
      {currentQ.question_type === "rating" ? (
        <RatingVisualizer liveResults={liveResults} />
      ) : parsedOptions.length > 0 ? (
        <div
          className={`grid gap-3 w-full ${
            parsedOptions.length >= 5
              ? "grid-cols-2 lg:grid-cols-3"
              : "grid-cols-2"
          } max-h-[52vh] overflow-y-auto pr-2`}
        >
          {parsedOptions.map((opt, idx) => (
            <div
              key={opt.id}
              className="bg-[#193750] border-2 border-[#425563] p-4 lg:p-5 rounded-2xl flex items-center space-x-3.5 shadow-xl transition"
            >
              <div className="shrink-0">
                <EpirocOptionIcon index={idx} size="lg" />
              </div>
              <span className="text-lg lg:text-xl font-bold text-white flex-1 leading-snug">
                {opt.text}
              </span>
            </div>
          ))}
        </div>
      ) : (
        /* PREGUNTA ABIERTA EN VIVO: GRÁFICO EN TIEMPO REAL DIRECTO EN PANTALLA */
        <LiveChartsVisualizer
          chartType={effectiveChartType}
          onChartTypeChange={onChartTypeChange}
          liveResults={liveResults}
          rawAnswers={rawAnswers}
          parsedOptions={parsedOptions}
          totalAnswers={totalAnswers}
          showCorrectAnswers={false}
          currentQ={currentQ}
        />
      )}

      {/* Controles de avance para el presentador */}
      <div className="flex items-center justify-between pt-4">
        {currentQIndex > 0 ? (
          <button
            type="button"
            onClick={() => onPresenterAction("prev_question")}
            className="bg-[#193750] hover:bg-[#254F72] text-white border border-[#425563] font-bold text-base py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Pregunta Anterior</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {isOpenQuestion ? (
            currentQIndex + 1 < totalQuestions ? (
              <button
                type="button"
                onClick={() => onPresenterAction("next_question")}
                className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95 cursor-pointer"
              >
                <span>
                  Siguiente Pregunta ({currentQIndex + 2}/{totalQuestions})
                </span>
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
              onClick={() => onPresenterAction("show_results")}
              className={`bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-lg py-3 px-6 rounded-xl shadow-xl flex items-center space-x-2 transition active:scale-95 cursor-pointer ${
                participants.length > 0 && totalAnswers >= participants.length
                  ? "ring-4 ring-[#86C8BC] ring-offset-2 ring-offset-[#001E32] animate-pulse"
                  : ""
              }`}
            >
              <span>Cerrar Votación y Ver Resultados</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
