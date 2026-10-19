import React from "react";
import { CheckCircle2, XCircle, Flame, Lightbulb, Clock } from "lucide-react";
import { ConnectionBanner } from "./ConnectionBanner";
import {
  QuestionData,
  ParticipantData,
  LastFeedbackData,
  getCorrectAnswerDisplay,
  getSelectedAnswerDisplay,
} from "../types";

interface ResultsFeedbackViewProps {
  currentQuestion: QuestionData | null;
  participant: ParticipantData | null;
  selectedAnswer: string | null;
  lastFeedback: LastFeedbackData | null;
  isConnected: boolean;
}

export const ResultsFeedbackView: React.FC<ResultsFeedbackViewProps> = ({
  currentQuestion,
  participant,
  selectedAnswer,
  lastFeedback,
  isConnected,
}) => {
  const correctAnswerText = currentQuestion
    ? getCorrectAnswerDisplay(currentQuestion)
    : null;
  const userAnswerText =
    selectedAnswer && currentQuestion
      ? getSelectedAnswerDisplay(selectedAnswer, currentQuestion)
      : selectedAnswer;
  const explanation =
    lastFeedback?.explanationText || currentQuestion?.explanation_text;

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col justify-between p-6 text-center">
      <header className="flex justify-between items-center py-2 border-b border-[#425563]">
        <span className="text-sm text-[#ECEBE4]">
          Puntaje: {participant?.score || 0}
        </span>
        <span className="text-xs bg-[#193750] px-3 py-1 rounded-full text-[#FFC72C] font-bold">
          Tiempo Cerrado
        </span>
      </header>

      <ConnectionBanner isConnected={isConnected} />

      <main className="my-auto space-y-4 max-w-md mx-auto w-full">
        {currentQuestion?.question_text && (
          <div className="bg-[#193750] border border-[#425563] p-3.5 rounded-2xl text-center shadow-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FFC72C] block mb-1">
              Pregunta
            </span>
            <p className="text-sm font-bold text-white leading-snug">
              {currentQuestion.question_text}
            </p>
          </div>
        )}

        {lastFeedback ? (
          (() => {
            const isPollOrOpen =
              lastFeedback.isPoll ||
              currentQuestion?.question_type === "word_cloud" ||
              currentQuestion?.question_type === "open_ended" ||
              currentQuestion?.question_type === "rating" ||
              currentQuestion?.question_type === "ranking" ||
              currentQuestion?.question_type === "likert" ||
              currentQuestion?.question_type === "likert_scale";

            if (isPollOrOpen) {
              return (
                <div className="space-y-3">
                  <div className="bg-[#48A9C5]/20 border-2 border-[#48A9C5] p-5 rounded-3xl space-y-2 text-center shadow-lg">
                    <CheckCircle2 className="w-14 h-14 text-[#48A9C5] mx-auto" />
                    <h2 className="text-2xl font-black text-white">
                      ¡Respuesta Recibida!
                    </h2>
                    <p className="text-sm text-[#ECEBE4]">
                      Tu opinión ya se visualiza en la pantalla principal.
                    </p>
                  </div>

                  {userAnswerText && (
                    <div className="bg-[#193750] border border-[#425563] p-3 rounded-2xl text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#48A9C5] block mb-0.5">
                        Tu Aporte Registrado
                      </span>
                      <p className="text-sm font-black text-white">
                        {userAnswerText}
                      </p>
                    </div>
                  )}

                  {explanation && (
                    <div className="bg-[#193750] border border-[#FFC72C]/40 p-4 rounded-2xl text-left space-y-1.5 shadow-md">
                      <div className="flex items-center gap-2 text-[#FFC72C]">
                        <Lightbulb className="w-4 h-4 fill-[#FFC72C]/20" />
                        <span className="text-xs font-black uppercase tracking-wider">
                          Retroalimentación
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#ECEBE4] leading-relaxed">
                        {explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            if (lastFeedback.isCorrect) {
              return (
                <div className="space-y-3">
                  <div className="bg-[#4C8C2B]/20 border-2 border-[#4C8C2B] p-5 rounded-3xl space-y-2 text-center shadow-lg">
                    <CheckCircle2 className="w-14 h-14 text-[#4C8C2B] mx-auto" />
                    <h2 className="text-2xl font-black text-white">
                      ¡Correcto!
                    </h2>
                    <p className="text-2xl font-extrabold text-[#FFC72C]">
                      +{lastFeedback.pointsAwarded} pts
                    </p>
                    {lastFeedback.newStreak > 1 && (
                      <p className="text-sm font-bold text-[#FFC72C] flex items-center justify-center space-x-1">
                        <Flame className="w-5 h-5 text-orange-500 fill-orange-500 inline" />
                        <span>
                          ¡Racha de {lastFeedback.newStreak} aciertos!
                        </span>
                      </p>
                    )}
                  </div>

                  {correctAnswerText && (
                    <div className="bg-[#001E32]/90 border border-[#4C8C2B] p-3.5 rounded-2xl text-left flex items-start gap-3 shadow-md">
                      <div className="p-1.5 bg-[#4C8C2B]/20 rounded-lg text-[#4C8C2B] mt-0.5 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black uppercase text-[#86C8BC] tracking-wider block">
                          Respuesta Correcta
                        </span>
                        <p className="text-sm font-bold text-white break-words">
                          {correctAnswerText}
                        </p>
                      </div>
                    </div>
                  )}

                  {explanation && (
                    <div className="bg-[#193750] border border-[#FFC72C]/40 p-4 rounded-2xl text-left space-y-1.5 shadow-md">
                      <div className="flex items-center gap-2 text-[#FFC72C]">
                        <Lightbulb className="w-4 h-4 fill-[#FFC72C]/20" />
                        <span className="text-xs font-black uppercase tracking-wider">
                          Retroalimentación / Explicación
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#ECEBE4] leading-relaxed">
                        {explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            // Falló la respuesta
            return (
              <div className="space-y-3">
                <div className="bg-[#B7312C]/20 border-2 border-[#B7312C] p-5 rounded-3xl space-y-2 text-center shadow-lg">
                  <XCircle className="w-14 h-14 text-[#B7312C] mx-auto" />
                  <h2 className="text-2xl font-black text-white">
                    ¡Ups, no era esa!
                  </h2>
                  <p className="text-xs text-[#ECEBE4]">
                    ¡Ánimo! Revisa la retroalimentación a continuación:
                  </p>
                </div>

                {userAnswerText && (
                  <div className="bg-[#001E32]/90 border border-[#B7312C]/60 p-3.5 rounded-2xl text-left flex items-start gap-3 shadow-md">
                    <div className="p-1.5 bg-[#B7312C]/20 rounded-lg text-[#B7312C] mt-0.5 shrink-0">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase text-[#FFA6A3] tracking-wider block">
                        Tu Respuesta
                      </span>
                      <p className="text-sm font-bold text-white line-through opacity-80 break-words">
                        {userAnswerText}
                      </p>
                    </div>
                  </div>
                )}

                {correctAnswerText && (
                  <div className="bg-[#001E32]/90 border border-[#4C8C2B] p-3.5 rounded-2xl text-left flex items-start gap-3 shadow-md">
                    <div className="p-1.5 bg-[#4C8C2B]/20 rounded-lg text-[#4C8C2B] mt-0.5 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-black uppercase text-[#86C8BC] tracking-wider block">
                        Respuesta Correcta
                      </span>
                      <p className="text-sm font-black text-white break-words">
                        {correctAnswerText}
                      </p>
                    </div>
                  </div>
                )}

                {explanation && (
                  <div className="bg-[#193750] border-2 border-[#FFC72C]/50 p-4 rounded-2xl text-left space-y-1.5 shadow-md">
                    <div className="flex items-center gap-2 text-[#FFC72C]">
                      <Lightbulb className="w-5 h-5 fill-[#FFC72C]/20" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        Retroalimentación / Explicación
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#ECEBE4] leading-relaxed font-medium">
                      {explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          /* Tiempo agotado sin respuesta */
          <div className="space-y-3">
            <div className="bg-[#193750] border border-[#425563] p-5 rounded-3xl space-y-2 text-center shadow-lg">
              <Clock className="w-12 h-12 text-[#FFC72C] mx-auto" />
              <h2 className="text-2xl font-bold text-white">Tiempo Agotado</h2>
              <p className="text-xs text-[#ECEBE4]">
                No alcanzaste a enviar tu respuesta a tiempo.
              </p>
            </div>

            {correctAnswerText && (
              <div className="bg-[#001E32]/90 border border-[#4C8C2B] p-3.5 rounded-2xl text-left flex items-start gap-3 shadow-md">
                <div className="p-1.5 bg-[#4C8C2B]/20 rounded-lg text-[#4C8C2B] mt-0.5 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-[#86C8BC] tracking-wider block">
                    Respuesta Correcta
                  </span>
                  <p className="text-sm font-black text-white break-words">
                    {correctAnswerText}
                  </p>
                </div>
              </div>
            )}

            {explanation && (
              <div className="bg-[#193750] border-2 border-[#FFC72C]/50 p-4 rounded-2xl text-left space-y-1.5 shadow-md">
                <div className="flex items-center gap-2 text-[#FFC72C]">
                  <Lightbulb className="w-5 h-5 fill-[#FFC72C]/20" />
                  <span className="text-xs font-black uppercase tracking-wider">
                    Retroalimentación / Explicación
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#ECEBE4] leading-relaxed font-medium">
                  {explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="text-center text-xs text-[#ECEBE4] opacity-60">
        Esperando que el presentador continúe...
      </footer>
    </div>
  );
};
