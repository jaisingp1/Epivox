import React, { useState } from "react";
import {
  Clock,
  ArrowRightCircle,
  Play,
  CheckSquare,
  Trophy,
  SkipForward,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { QuestionData } from "../types";

interface RemoteControlCardProps {
  currentStep: string;
  remainingTime: number;
  totalAnswers: number;
  currentQIndex: number;
  questions: QuestionData[];
  onAction: (action: string, targetQuestionIndex?: number) => void;
}

export const RemoteControlCard: React.FC<RemoteControlCardProps> = ({
  currentStep,
  remainingTime,
  totalAnswers,
  currentQIndex,
  questions,
  onAction,
}) => {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isLobby = currentStep === "lobby";
  const currentQ = questions[currentQIndex];
  const nextQ = isLobby ? questions[0] : questions[currentQIndex + 1];

  return (
    <div className="space-y-4">
      {/* Estado actual / Cronómetro */}
      <div className="bg-[#193750] border border-[#425563] p-4 rounded-2xl flex items-center justify-between shadow-xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#FFC72C] tracking-wider block">
            Fase Actual
          </span>
          <span className="text-xl font-black capitalize text-white">
            {currentStep}
          </span>
        </div>

        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-[#ECEBE4] tracking-wider block">
            Tiempo / Respuestas
          </span>
          <div className="flex items-center space-x-2 justify-end">
            <Clock className="w-4 h-4 text-[#FFC72C]" />
            <span className="font-mono text-xl font-bold text-[#FFC72C]">
              {remainingTime}s
            </span>
            <span className="text-xs text-[#ECEBE4]">
              ({totalAnswers} votos)
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta de Diapositiva Actual */}
      <div className="bg-[#193750] border-2 border-[#425563] p-5 rounded-2xl space-y-2 shadow-xl">
        <span className="text-xs font-bold text-[#FFC72C] uppercase tracking-wider">
          Pregunta {currentQIndex + 1} de {questions.length}
        </span>
        <h2 className="text-lg font-extrabold text-white leading-snug">
          {currentQ?.question_text || "Esperando inicio..."}
        </h2>

        {currentQ?.explanation_text && (
          <div className="text-xs bg-[#001E32] border border-[#425563] p-2.5 rounded-xl text-[#ECEBE4] mt-2">
            <strong className="text-[#48A9C5]">Nota Privada del Orador:</strong>{" "}
            {currentQ.explanation_text}
          </div>
        )}
      </div>

      {/* Vista previa siguiente diapositiva */}
      <div className="bg-[#193750] border-2 border-[#48A9C5]/60 p-3.5 rounded-2xl text-xs space-y-1.5 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 font-extrabold uppercase tracking-wider text-[#48A9C5]">
            <ArrowRightCircle className="w-3.5 h-3.5" />
            {isLobby
              ? "Próxima a Lanzar: Pregunta #1"
              : nextQ
                ? `Siguiente Pregunta (#${currentQIndex + 2} de ${questions.length})`
                : "Fin del Cuestionario"}
          </span>
          {nextQ && (
            <span className="text-[10px] bg-[#48A9C5]/15 text-[#48A9C5] px-2 py-0.5 rounded-full font-bold">
              ⏱ {nextQ.time_limit}s
            </span>
          )}
        </div>
        <p className="font-bold text-white text-sm truncate">
          {nextQ
            ? nextQ.question_text
            : "No hay más preguntas pendientes. Al avanzar se mostrará el Podio."}
        </p>
      </div>

      {/* Botonera de Acciones Maestras */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {currentStep === "lobby" && (
          <button
            type="button"
            onClick={() => onAction("start_game")}
            className="col-span-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-4 rounded-xl shadow-xl text-lg flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer"
          >
            <Play className="w-6 h-6 fill-[#001E32]" />
            <span>Lanzar Primera Pregunta</span>
          </button>
        )}

        {currentStep === "question" && (
          <button
            type="button"
            onClick={() => onAction("show_results")}
            className="col-span-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-extrabold py-4 rounded-xl shadow-xl text-lg flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer"
          >
            <CheckSquare className="w-6 h-6" />
            <span>Cerrar Votación y Mostrar Resultados</span>
          </button>
        )}

        {currentStep === "results" && (
          <button
            type="button"
            onClick={() => onAction("show_leaderboard")}
            className="col-span-2 bg-[#48A9C5] hover:bg-[#3B8FA8] text-white font-extrabold py-4 rounded-xl shadow-xl text-lg flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer"
          >
            <Trophy className="w-6 h-6" />
            <span>Mostrar Tabla de Posiciones</span>
          </button>
        )}

        {currentStep === "leaderboard" && (
          <button
            type="button"
            onClick={() => onAction("next_question")}
            className="col-span-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-4 rounded-xl shadow-xl text-lg flex items-center justify-center space-x-2 active:scale-95 transition cursor-pointer"
          >
            <SkipForward className="w-6 h-6" />
            <span>
              {currentQIndex + 1 < questions.length
                ? "Siguiente Pregunta"
                : "Finalizar y Podio"}
            </span>
          </button>
        )}
      </div>

      {/* Botón y Panel para Cancelar Sesión para Alumnos */}
      <div className="bg-[#001E32] border border-[#425563] p-3.5 rounded-2xl space-y-2">
        {!showCancelConfirm ? (
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            className="w-full py-2.5 px-4 bg-[#B7312C]/20 hover:bg-[#B7312C]/35 border border-[#B7312C]/50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow"
          >
            <XCircle className="w-4 h-4 text-[#B7312C]" />
            <span>Cancelar Presentación para Alumnos</span>
          </button>
        ) : (
          <div className="p-3 bg-[#B7312C]/15 border border-[#B7312C]/40 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0" />
              <span>¿Detener la sesión ahora?</span>
            </div>
            <p className="text-[11px] text-[#ECEBE4]/80">
              Las preguntas se cerrarán de inmediato para todos los alumnos en
              sus móviles.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-1.5 px-3 bg-[#193750] hover:bg-[#254F72] border border-[#425563] text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={() => {
                  onAction("cancel_session");
                  setShowCancelConfirm(false);
                }}
                className="flex-1 py-1.5 px-3 bg-[#B7312C] hover:bg-[#A32823] text-white rounded-lg text-xs font-black transition shadow cursor-pointer"
              >
                Sí, Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
