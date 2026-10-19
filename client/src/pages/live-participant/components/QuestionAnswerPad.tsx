import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Star,
  ChevronUp,
  ChevronDown,
  ListOrdered,
} from "lucide-react";
import EpirocOptionIcon, {
  EPIROC_OPTION_CONFIGS,
} from "../../../components/EpirocOptionIcon";
import { ConnectionBanner } from "./ConnectionBanner";
import {
  QuestionData,
  QuestionOption,
  ParticipantData,
  getSelectedAnswerDisplay,
} from "../types";

interface QuestionAnswerPadProps {
  currentQuestion: QuestionData | null;
  participant: ParticipantData | null;
  remainingTime: number;
  hasAnswered: boolean;
  hasSubmitted: boolean;
  selectedAnswer: string | null;
  selectedRating: number;
  setSelectedRating: (val: number) => void;
  textAnswer: string;
  setTextAnswer: (val: string) => void;
  isConnected: boolean;
  pin: string | undefined;
  handleAnswerSubmit: (payload: string) => void;
}

export const QuestionAnswerPad: React.FC<QuestionAnswerPadProps> = ({
  currentQuestion,
  participant,
  remainingTime,
  hasAnswered,
  hasSubmitted,
  selectedAnswer,
  selectedRating,
  setSelectedRating,
  textAnswer,
  setTextAnswer,
  isConnected,
  pin,
  handleAnswerSubmit,
}) => {
  let parsedOptions: QuestionOption[] = [];
  try {
    parsedOptions = currentQuestion
      ? JSON.parse(currentQuestion.options_json)
      : [];
  } catch {
    parsedOptions = [];
  }

  const [rankingItems, setRankingItems] = useState<QuestionOption[]>(() => {
    if (currentQuestion?.question_type === "ranking") {
      try {
        return currentQuestion.options_json
          ? JSON.parse(currentQuestion.options_json)
          : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    if (currentQuestion?.question_type === "ranking") {
      try {
        const opts = currentQuestion.options_json
          ? JSON.parse(currentQuestion.options_json)
          : [];
        setRankingItems(opts);
      } catch {
        setRankingItems([]);
      }
    }
  }, [
    currentQuestion?.id,
    currentQuestion?.options_json,
    currentQuestion?.question_type,
  ]);

  const handleMoveRankItem = (index: number, direction: "up" | "down") => {
    if (hasAnswered || hasSubmitted) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rankingItems.length) return;
    const updated = [...rankingItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setRankingItems(updated);
  };

  const handleRankingSubmit = () => {
    if (rankingItems.length === 0 || hasAnswered || hasSubmitted) return;
    const formattedRanking = rankingItems
      .map((opt, i) => `${i + 1}. ${opt.text || opt.id}`)
      .join(" • ");
    handleAnswerSubmit(formattedRanking);
  };

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-4">
      {/* Header con cronómetro */}
      <header className="flex items-center justify-between py-2 border-b border-[#425563]">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-[#FFC72C]" />
          <span className="font-mono text-xl font-black text-[#FFC72C]">
            {remainingTime}s
          </span>
        </div>
        <span className="text-sm font-bold text-white bg-[#193750] px-3 py-1 rounded-full border border-[#425563]">
          {participant?.nickname} ({participant?.score || 0} pts)
        </span>
      </header>

      <ConnectionBanner isConnected={isConnected} />

      {/* Cuerpo principal según si ya respondió o no */}
      <main className="my-auto max-w-md w-full mx-auto space-y-4">
        {hasAnswered ? (
          <div className="bg-[#193750] border-2 border-[#FFC72C] p-6 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-[#FFC72C]/20 text-[#FFC72C] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              ¡Respuesta Enviada!
            </h2>
            {currentQuestion?.question_text && (
              <div className="bg-[#001E32] border border-[#425563] p-3 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-[#FFC72C] tracking-wider block mb-0.5">
                  Pregunta respondida
                </span>
                <p className="text-xs text-white font-semibold">
                  {currentQuestion.question_text}
                </p>
              </div>
            )}
            {selectedAnswer && (
              <p className="text-xs uppercase tracking-wider text-[#FFC72C] font-bold">
                Opción registrada:{" "}
                {getSelectedAnswerDisplay(selectedAnswer, currentQuestion) ||
                  selectedAnswer}
              </p>
            )}
            <p className="text-sm text-[#ECEBE4] opacity-80">
              Esperando a que el resto de los participantes terminen de
              responder...
            </p>
          </div>
        ) : remainingTime <= 0 ? (
          <div className="bg-[#193750] border-2 border-[#FFC72C] p-6 rounded-3xl text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 bg-[#FFC72C]/20 text-[#FFC72C] rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white">¡Tiempo Agotado!</h2>
            {currentQuestion?.question_text && (
              <div className="bg-[#001E32] border border-[#425563] p-3 rounded-xl text-left">
                <span className="text-[10px] uppercase font-bold text-[#FFC72C] tracking-wider block mb-0.5">
                  Pregunta
                </span>
                <p className="text-xs text-white font-semibold">
                  {currentQuestion.question_text}
                </p>
              </div>
            )}
            <p className="text-sm text-[#ECEBE4]">
              El tiempo para enviar tu respuesta ha concluido.
            </p>
            <p className="text-xs text-[#ECEBE4]/70">
              Espera a que el presentador revele los resultados y la
              retroalimentación.
            </p>
          </div>
        ) : (
          <>
            {/* Tarjeta con el Enunciado de la Pregunta */}
            {currentQuestion?.question_text && (
              <div className="bg-[#193750] border-2 border-[#FFC72C]/70 p-4 rounded-2xl shadow-xl space-y-1 text-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FFC72C] block">
                  Pregunta
                </span>
                <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                  {currentQuestion.question_text}
                </h2>
              </div>
            )}

            {/* Pregunta tipo: Verdadero / Falso */}
            {currentQuestion?.question_type === "true_false" && (
              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  disabled={hasAnswered || hasSubmitted}
                  onClick={() => {
                    const optT = parsedOptions.find(
                      (o) =>
                        o.id === "true" ||
                        o.id === "A" ||
                        o.text?.toLowerCase().includes("verdadero"),
                    );
                    handleAnswerSubmit(optT ? optT.id : "true");
                  }}
                  className="bg-[#4C8C2B] hover:bg-[#3E7323] text-white font-black text-2xl py-8 rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center space-x-3 disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-8 h-8" />
                  <span>VERDADERO</span>
                </button>
                <button
                  type="button"
                  disabled={hasAnswered || hasSubmitted}
                  onClick={() => {
                    const optF = parsedOptions.find(
                      (o) =>
                        o.id === "false" ||
                        o.id === "B" ||
                        o.text?.toLowerCase().includes("falso"),
                    );
                    handleAnswerSubmit(optF ? optF.id : "false");
                  }}
                  className="bg-[#B7312C] hover:bg-[#962824] text-white font-black text-2xl py-8 rounded-2xl shadow-xl active:scale-95 transition flex items-center justify-center space-x-3 disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-8 h-8" />
                  <span>FALSO</span>
                </button>
              </div>
            )}

            {/* Pregunta tipo: Calificación con Estrellas (1-5 ⭐) */}
            {currentQuestion?.question_type === "rating" && (
              <div className="bg-[#193750] border-2 border-[#425563] p-6 rounded-3xl space-y-6 text-center shadow-2xl">
                <div className="space-y-1">
                  <span className="text-xs font-black uppercase tracking-wider text-[#FFC72C]">
                    Calificación de la Audiencia
                  </span>
                  <h3 className="text-base font-black text-white">
                    {currentQuestion.question_text}
                  </h3>
                </div>

                {/* 5 Estrellas Interactivas */}
                <div className="flex justify-center items-center gap-2 py-3">
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= (selectedRating || 0);
                    return (
                      <button
                        key={starVal}
                        type="button"
                        disabled={hasAnswered || hasSubmitted}
                        onClick={() => setSelectedRating(starVal)}
                        className="p-1 transition-transform active:scale-90 hover:scale-110 focus:outline-none disabled:opacity-40 cursor-pointer"
                        aria-label={`${starVal} estrellas`}
                      >
                        <Star
                          className={`w-12 h-12 transition-all ${
                            isFilled
                              ? "text-[#FFC72C] fill-[#FFC72C] drop-shadow-[0_0_10px_rgba(255,199,44,0.7)]"
                              : "text-[#425563] hover:text-[#FFC72C]/40"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="min-h-[24px] text-xs font-bold text-[#ECEBE4]/80">
                  {selectedRating > 0 ? (
                    <span className="text-[#FFC72C] font-black text-sm">
                      {selectedRating === 1 &&
                        "★ 1 Estrella (Muy insatisfecho)"}
                      {selectedRating === 2 && "★★ 2 Estrellas (Insatisfecho)"}
                      {selectedRating === 3 && "★★★ 3 Estrellas (Neutral)"}
                      {selectedRating === 4 && "★★★★ 4 Estrellas (Satisfecho)"}
                      {selectedRating === 5 && "★★★★★ 5 Estrellas (Excelente)"}
                    </span>
                  ) : (
                    "Toca las estrellas para calificar"
                  )}
                </div>

                <button
                  type="button"
                  disabled={selectedRating === 0 || hasAnswered || hasSubmitted}
                  onClick={() => handleAnswerSubmit(String(selectedRating))}
                  className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-base py-3.5 rounded-xl transition shadow-xl disabled:opacity-40 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Star className="w-5 h-5 fill-[#001E32]" />
                  <span>
                    Enviar Calificación{" "}
                    {selectedRating > 0 ? `(${selectedRating} ⭐)` : ""}
                  </span>
                </button>
              </div>
            )}

            {/* Pregunta tipo: Ranking / Ordenar */}
            {currentQuestion?.question_type === "ranking" && (
              <div className="bg-[#193750] border-2 border-[#425563] p-4 sm:p-5 rounded-3xl space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#425563]/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-5 h-5 text-[#FFC72C]" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#FFC72C]">
                      Orden de Prioridad
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#ECEBE4]/70">
                    Usa las flechas para ordenar
                  </span>
                </div>

                <p className="text-xs text-[#ECEBE4]/90 text-center font-medium">
                  Organiza las opciones de mayor importancia (#1 arriba) a menor
                  importancia.
                </p>

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {rankingItems.map((item, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === rankingItems.length - 1;
                    return (
                      <div
                        key={item.id || idx}
                        className="bg-[#001E32] border border-[#425563] rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 shadow-md transition"
                      >
                        {/* Indicador de posición #1, #2... */}
                        <div className="w-8 h-8 rounded-xl bg-[#FFC72C] text-[#001E32] font-black text-sm flex items-center justify-center shrink-0 shadow">
                          #{idx + 1}
                        </div>

                        {/* Texto del ítem */}
                        <div className="flex-1 min-w-0">
                          <span className="text-xs sm:text-sm font-bold text-white block line-clamp-2 leading-snug">
                            {item.text || item.id}
                          </span>
                        </div>

                        {/* Botones de subir / bajar */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={isFirst || hasAnswered || hasSubmitted}
                            onClick={() => handleMoveRankItem(idx, "up")}
                            title="Mover arriba"
                            className="p-2 rounded-xl bg-[#193750] hover:bg-[#FFC72C] hover:text-[#001E32] text-white disabled:opacity-20 active:scale-90 transition cursor-pointer"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isLast || hasAnswered || hasSubmitted}
                            onClick={() => handleMoveRankItem(idx, "down")}
                            title="Mover abajo"
                            className="p-2 rounded-xl bg-[#193750] hover:bg-[#FFC72C] hover:text-[#001E32] text-white disabled:opacity-20 active:scale-90 transition cursor-pointer"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={
                    rankingItems.length === 0 || hasAnswered || hasSubmitted
                  }
                  onClick={handleRankingSubmit}
                  className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-base py-3.5 rounded-xl transition shadow-xl disabled:opacity-40 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5 fill-[#001E32] text-white" />
                  <span>Confirmar Orden de Prioridad</span>
                </button>
              </div>
            )}

            {/* Pregunta tipo: Selección Múltiple */}
            {(currentQuestion?.question_type === "multiple_choice" ||
              (!currentQuestion?.question_type &&
                currentQuestion?.question_type !== "rating" &&
                currentQuestion?.question_type !== "ranking")) && (
              <div className="grid grid-cols-2 gap-2.5 max-h-[56vh] overflow-y-auto p-1">
                {parsedOptions.map((opt, idx) => {
                  const cfg =
                    EPIROC_OPTION_CONFIGS[idx % EPIROC_OPTION_CONFIGS.length];
                  const is5thCentered = parsedOptions.length === 5 && idx === 4;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={hasAnswered || hasSubmitted}
                      onClick={() => handleAnswerSubmit(opt.id)}
                      className={`${cfg.bgColor} ${cfg.textColor} ${
                        is5thCentered ? "col-span-2" : ""
                      } font-extrabold p-3.5 rounded-2xl shadow-xl active:scale-95 transition flex flex-col items-center justify-center min-h-[95px] disabled:opacity-50 cursor-pointer`}
                    >
                      <div className="mb-1 flex items-center justify-center">
                        <EpirocOptionIcon index={idx} size="md" />
                      </div>
                      <span className="text-center text-sm line-clamp-3 leading-snug">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pregunta tipo: Nube de Palabras / Abierta */}
            {(currentQuestion?.question_type === "word_cloud" ||
              currentQuestion?.question_type === "open_ended") && (
              <div className="bg-[#193750] border border-[#425563] p-6 rounded-2xl space-y-4">
                <label
                  htmlFor="word-input"
                  className="block text-sm text-[#ECEBE4] font-bold text-center"
                >
                  Escribe tu respuesta:
                </label>
                <input
                  id="word-input"
                  type="text"
                  maxLength={30}
                  disabled={hasAnswered || hasSubmitted}
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  placeholder="Escribe aquí..."
                  className="w-full text-center text-xl font-bold py-3 px-4 rounded-xl bg-[#001E32] border-2 border-[#425563] focus:border-[#FFC72C] text-white focus:outline-none disabled:opacity-50"
                />
                <button
                  type="button"
                  disabled={!textAnswer.trim() || hasAnswered || hasSubmitted}
                  onClick={() => handleAnswerSubmit(textAnswer.trim())}
                  className="w-full bg-[#FFC72C] text-[#001E32] font-black text-lg py-4 rounded-xl hover:bg-[#E6B327] transition shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  Enviar Respuesta
                </button>
              </div>
            )}

            {/* Pregunta tipo: Likert / Escala */}
            {(currentQuestion?.question_type === "likert" ||
              currentQuestion?.question_type === "likert_scale") && (
              <div className="bg-[#193750] border border-[#425563] p-6 rounded-2xl space-y-4 text-center">
                <span className="block text-sm text-[#ECEBE4] font-bold">
                  Selecciona tu nivel de acuerdo (1 al 5):
                </span>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled={hasAnswered || hasSubmitted}
                      onClick={() => handleAnswerSubmit(num.toString())}
                      className="bg-[#001E32] hover:bg-[#FFC72C] hover:text-[#001E32] text-white border-2 border-[#425563] font-black text-2xl py-6 rounded-xl transition shadow active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="text-center text-xs text-[#ECEBE4] opacity-50 py-1">
        Epiroc Epivox &bull; PIN: {pin}
      </footer>
    </div>
  );
};
