import {
  CheckCircle2,
  HelpCircle,
  Star,
  Sparkles,
  Sliders,
} from "lucide-react";
import EpirocOptionIcon from "../../../components/EpirocOptionIcon";
import type { OptionItem, QuestionItem } from "../types";

interface QuestionCanvasProps {
  currentQuestion: QuestionItem | undefined;
  selectedQuestionIndex: number;
  currentOptions: OptionItem[];
  onUpdateCurrentQuestion: (fields: Partial<QuestionItem>) => void;
  onOptionChange: (idx: number, newText: string) => void;
  onSetCorrectOption: (optionId: string) => void;
}

export default function QuestionCanvas({
  currentQuestion,
  selectedQuestionIndex,
  currentOptions,
  onUpdateCurrentQuestion,
  onOptionChange,
  onSetCorrectOption,
}: QuestionCanvasProps) {
  if (!currentQuestion) {
    return (
      <main className="flex-1 bg-[var(--surface-subtle)] p-8 overflow-y-auto flex flex-col items-center justify-center">
        <div className="text-center text-[var(--text-muted)]">
          Selecciona o crea una diapositiva para comenzar a editar
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[var(--surface-subtle)] p-8 overflow-y-auto flex flex-col items-center">
      <div className="max-w-3xl w-full space-y-6">
        {/* Question Text Prompt */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-sm space-y-3">
          <label className="text-xs font-black uppercase text-[#FFC72C] tracking-wider block">
            Enunciado de la Pregunta #{selectedQuestionIndex + 1}
          </label>
          <input
            type="text"
            value={currentQuestion.question_text}
            onChange={(e) =>
              onUpdateCurrentQuestion({
                question_text: e.target.value,
              })
            }
            placeholder="Escribe tu pregunta aquí..."
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-2xl px-5 py-4 text-xl font-bold text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#FFC72C] transition"
          />
        </div>

        {/* Type-Specific Options Canvas */}
        {currentQuestion.question_type === "multiple_choice" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[var(--text-subtle)]">
              <span>
                Opciones de Respuesta (Marca el check verde en la correcta)
              </span>
              <span>4 Opciones Estándar</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {currentOptions.map((opt, idx) => {
                const isCorrect =
                  currentQuestion.correct_answer_value === opt.id ||
                  opt.isCorrect;
                return (
                  <div
                    key={opt.id || idx}
                    className={`relative flex items-center bg-[var(--surface-card)] border-2 rounded-2xl p-3 transition shadow-sm ${
                      isCorrect
                        ? "border-[#4C8C2B] ring-2 ring-[#4C8C2B]/30"
                        : "border-[var(--border-subtle)]"
                    }`}
                  >
                    <div className="mr-3 shrink-0">
                      <EpirocOptionIcon index={idx} size="md" />
                    </div>

                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => onOptionChange(idx, e.target.value)}
                      placeholder={`Opción ${opt.id}`}
                      className="flex-1 bg-transparent text-sm font-semibold text-[var(--text-main)] focus:outline-none placeholder-[var(--text-muted)]"
                    />

                    <button
                      type="button"
                      onClick={() => onSetCorrectOption(opt.id)}
                      title="Marcar como respuesta correcta"
                      className={`p-2 rounded-xl transition cursor-pointer ${
                        isCorrect
                          ? "text-[#4C8C2B] bg-[#4C8C2B]/15 font-bold"
                          : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentQuestion.question_type === "true_false" && (
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() =>
                onUpdateCurrentQuestion({
                  correct_answer_value: "true",
                  options_json: JSON.stringify([
                    { id: "true", text: "Verdadero", isCorrect: true },
                    { id: "false", text: "Falso", isCorrect: false },
                  ]),
                })
              }
              className={`p-6 rounded-2xl border-2 font-black text-lg transition flex items-center justify-center space-x-3 cursor-pointer ${
                currentQuestion.correct_answer_value === "true"
                  ? "bg-[#4C8C2B] text-white border-[#4C8C2B] shadow-md"
                  : "bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--text-main)] hover:border-[#4C8C2B]"
              }`}
            >
              <CheckCircle2 className="w-6 h-6" />
              <span>Verdadero</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onUpdateCurrentQuestion({
                  correct_answer_value: "false",
                  options_json: JSON.stringify([
                    { id: "true", text: "Verdadero", isCorrect: false },
                    { id: "false", text: "Falso", isCorrect: true },
                  ]),
                })
              }
              className={`p-6 rounded-2xl border-2 font-black text-lg transition flex items-center justify-center space-x-3 cursor-pointer ${
                currentQuestion.correct_answer_value === "false"
                  ? "bg-[#B7312C] text-white border-[#B7312C] shadow-md"
                  : "bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--text-main)] hover:border-[#B7312C]"
              }`}
            >
              <span>Falso</span>
            </button>
          </div>
        )}

        {currentQuestion.question_type === "rating" && (
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <div className="flex justify-center items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-10 h-10 text-[#FFC72C] fill-[#FFC72C] transition-transform hover:scale-125"
                />
              ))}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-[var(--text-main)]">
                Calificación con Estrellas (Escala 1 a 5 ⭐)
              </h3>
              <p className="text-xs text-[var(--text-subtle)] max-w-md mx-auto leading-relaxed">
                Los asistentes evaluarán la pregunta asignando de 1 a 5
                estrellas desde sus teléfonos móviles. En la pantalla grande se
                calculará automáticamente el promedio en vivo y el desglose de
                votos.
              </p>
            </div>
          </div>
        )}

        {currentQuestion.question_type === "word_cloud" && (
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 text-center space-y-2 shadow-sm">
            <Sparkles className="w-8 h-8 text-[#FFC72C] mx-auto animate-pulse-subtle" />
            <h3 className="text-base font-bold text-[var(--text-main)]">
              Nube de Palabras en Tiempo Real
            </h3>
            <p className="text-xs text-[var(--text-subtle)] max-w-md mx-auto">
              Los participantes enviarán palabras cortas o conceptos desde sus
              teléfonos móviles. Las frecuencias se ponderarán y animarán
              automáticamente en el proyector.
            </p>
          </div>
        )}

        {currentQuestion.question_type === "likert_scale" && (
          <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 text-center space-y-4 shadow-sm">
            <Sliders className="w-8 h-8 text-[#48A9C5] mx-auto" />
            <h3 className="text-base font-bold text-[var(--text-main)]">
              Escala Likert de Valoración (1 a 5)
            </h3>
            <div className="flex justify-between max-w-sm mx-auto text-xs font-bold text-[var(--text-muted)] pt-2">
              <span>1: Muy en Desacuerdo</span>
              <span>5: Totalmente de Acuerdo</span>
            </div>
          </div>
        )}

        {/* Explanation Field */}
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-2 shadow-sm">
          <label className="text-xs font-bold text-[var(--text-subtle)] flex items-center space-x-1.5">
            <HelpCircle className="w-4 h-4 text-[#FFC72C]" />
            <span>
              Explicación Didáctica (Mostrada tras revelar los resultados)
            </span>
          </label>
          <textarea
            rows={2}
            value={currentQuestion.explanation_text || ""}
            onChange={(e) =>
              onUpdateCurrentQuestion({
                explanation_text: e.target.value,
              })
            }
            placeholder="Explica a la audiencia por qué esta respuesta es la correcta..."
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl p-3 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#FFC72C]"
          />
        </div>
      </div>
    </main>
  );
}
