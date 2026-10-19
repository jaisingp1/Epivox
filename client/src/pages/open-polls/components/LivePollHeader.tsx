import React from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Copy,
  QrCode,
  Tv,
  ExternalLink,
  RefreshCw,
  RotateCcw,
  Users,
  MessageSquare,
} from "lucide-react";
import { SessionQuestion } from "../types";

interface LivePollHeaderProps {
  pin: string;
  copiedLink: boolean;
  activeParticipantsCount: number;
  totalAnswers: number;
  sessionQuestions: SessionQuestion[];
  currentQIndex: number;
  handleCopyLink: () => void;
  handleOpenQR: () => void;
  handlePushCurrentQuestion: () => void;
  handleJumpToQuestion: (idx: number) => void;
  handleResetSession: () => void;
}

export const LivePollHeader: React.FC<LivePollHeaderProps> = ({
  pin,
  copiedLink,
  activeParticipantsCount,
  totalAnswers,
  sessionQuestions,
  currentQIndex,
  handleCopyLink,
  handleOpenQR,
  handlePushCurrentQuestion,
  handleJumpToQuestion,
  handleResetSession,
}) => {
  return (
    <div className="space-y-4">
      {/* Barra Superior con Enlace para Enviar y PIN */}
      <div className="bg-[var(--surface-card)] border-2 border-[#FFC72C] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4C8C2B] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4C8C2B]" />
            </span>
            <span className="text-xs uppercase font-black text-[#4C8C2B] tracking-widest">
              Sondeo Abierto en Vivo
            </span>
          </div>
          <h2 className="text-2xl font-black text-[var(--text-main)]">
            PIN:{" "}
            <span className="text-[#FFC72C] font-mono tracking-widest">
              {pin}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Botón Copiar Link */}
          <button
            type="button"
            onClick={handleCopyLink}
            className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#001E32] dark:text-[#FFC72C] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-[#4C8C2B]" />
                <span className="text-[#4C8C2B]">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Link para Enviar</span>
              </>
            )}
          </button>

          {/* Botón QR */}
          <button
            type="button"
            onClick={handleOpenQR}
            className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#FFC72C]" />
            <span>QR</span>
          </button>

          {/* Botón Abrir Pantalla Proyector 16:9 */}
          <Link
            to={`/present/${pin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Tv className="w-4 h-4 fill-[#001E32]" />
            <span>Abrir Proyector (16:9)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Botón Forzar Reenvío a Móviles */}
          <button
            type="button"
            onClick={handlePushCurrentQuestion}
            title="Sincronizar y forzar la apertura de la pregunta actual en todos los teléfonos"
            className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#48A9C5] border border-[#48A9C5]/40 font-bold text-xs py-2.5 px-3.5 rounded-xl transition shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#48A9C5]" />
            <span>Reenviar a Móviles</span>
          </button>

          {/* Nuevo Sondeo / Reiniciar */}
          <button
            type="button"
            onClick={handleResetSession}
            className="bg-[#B7312C]/10 hover:bg-[#B7312C]/20 text-[#B7312C] border border-[#B7312C]/30 font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nuevo Sondeo</span>
          </button>
        </div>
      </div>

      {/* Enlace y Metadatos de Conexión */}
      <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 truncate">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFC72C] shrink-0">
            Link de Participación:
          </span>
          <span className="font-mono text-[var(--text-main)] truncate font-semibold">
            {window.location.origin}/join?pin={pin}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] shrink-0">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-[#48A9C5]" />
            <span className="font-bold text-[var(--text-main)]">
              {activeParticipantsCount}
            </span>{" "}
            conectados
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-[#FFC72C]" />
            <span className="font-bold text-[var(--text-main)]">
              {totalAnswers}
            </span>{" "}
            respuestas
          </span>
        </div>
      </div>

      {/* Carrusel de Pestañas de Preguntas para el Presentador */}
      {sessionQuestions.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {sessionQuestions.map((sq, idx) => {
            const isCur = idx === currentQIndex;
            return (
              <button
                key={sq.id}
                type="button"
                onClick={() => handleJumpToQuestion(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 border cursor-pointer ${
                  isCur
                    ? "bg-[#FFC72C] text-[#001E32] border-[#FFC72C] shadow-sm font-black"
                    : "bg-[var(--surface-card)] text-[var(--text-subtle)] border-[var(--border-subtle)] hover:border-[#48A9C5]"
                }`}
              >
                <span>Pregunta {idx + 1}</span>
                <span className="max-w-[140px] truncate text-[11px] opacity-75">
                  {sq.question_text}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
