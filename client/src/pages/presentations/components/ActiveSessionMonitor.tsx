import { Link } from "react-router-dom";
import {
  Check,
  Copy,
  QrCode,
  Tv,
  ExternalLink,
  XCircle,
  ArrowLeft,
  Play,
  BarChart3,
  ArrowRight,
  Radio,
  ArrowRightCircle,
} from "lucide-react";
import type {
  ActiveSessionData,
  ParticipantInfo,
  SessionQuestionItem,
} from "../types";
import { getQuestionTypeBadge } from "../utils/excelHelper";
import SessionQuestionsList from "./SessionQuestionsList";

interface ActiveSessionMonitorProps {
  activeSession: ActiveSessionData;
  activeParticipants: ParticipantInfo[];
  totalAnswers: number;
  liveResults: Record<string, number>;
  remainingTime: number;
  currentQuestions: SessionQuestionItem[];
  copiedLink: boolean;
  onCopyLink: (pin: string) => void;
  onOpenQR: (pin: string) => void;
  onCancelActiveSession: () => void;
  onHideMonitor: () => void;
  onPresenterAction: (action: string, targetQuestionIndex?: number) => void;
}

export default function ActiveSessionMonitor({
  activeSession,
  activeParticipants,
  totalAnswers,
  liveResults,
  remainingTime,
  currentQuestions,
  copiedLink,
  onCopyLink,
  onOpenQR,
  onCancelActiveSession,
  onHideMonitor,
  onPresenterAction,
}: ActiveSessionMonitorProps) {
  const activeQIndex = activeSession.current_question_index ?? 0;
  const isLobby = activeSession.current_step === "lobby";
  const currentQ = currentQuestions[activeQIndex];
  const nextQ = isLobby
    ? currentQuestions[0]
    : currentQuestions[activeQIndex + 1];

  const pastQuestionsCount = isLobby ? 0 : activeQIndex;
  const pendingQuestionsCount = isLobby
    ? currentQuestions.length
    : Math.max(0, currentQuestions.length - (activeQIndex + 1));

  return (
    <section className="bg-[var(--surface-card)] border-2 border-[#FFC72C] rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 animate-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4C8C2B] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4C8C2B]" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#4C8C2B]">
              Sesión en Vivo Activa &bull; Estado: {activeSession.status}
            </span>
          </div>
          <h2 className="text-2xl font-black text-[var(--text-main)]">
            Monitor del Presentador &bull; PIN:{" "}
            <span className="text-[#FFC72C] font-mono tracking-widest">
              {activeSession.pin}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Botón Copiar Link */}
          <button
            type="button"
            onClick={() => onCopyLink(activeSession.pin)}
            className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#FFC72C] border border-[#FFC72C]/40 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4 text-[#4C8C2B]" />
                <span className="text-[#4C8C2B]">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Enlace para Enviar</span>
              </>
            )}
          </button>

          {/* Botón Ver QR */}
          <button
            type="button"
            onClick={() => onOpenQR(activeSession.pin)}
            className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#FFC72C]" />
            <span>QR</span>
          </button>

          {/* Botón Abrir Proyector 16:9 */}
          <Link
            to={`/present/${activeSession.pin}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95"
          >
            <Tv className="w-4 h-4 fill-[#001E32]" />
            <span>Abrir Proyector (16:9)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Botón Cancelar Presentación para Alumnos */}
          <button
            type="button"
            onClick={onCancelActiveSession}
            className="bg-[#B7312C] hover:bg-[#A32823] text-white font-black text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
            title="Detiene la sesión inmediatamente para todos los alumnos conectados"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancelar Presentación</span>
          </button>

          {/* Ocultar Monitor (manteniendo sesión activa en segundo plano) */}
          <button
            type="button"
            onClick={onHideMonitor}
            className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-subtle)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Minimiza este panel manteniendo la sesión activa"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ocultar Monitor</span>
          </button>
        </div>
      </div>

      {/* Enlace destacado para enviar */}
      <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-3 truncate">
          <span className="text-xs font-bold uppercase tracking-wider text-[#FFC72C] shrink-0">
            Link de Participación:
          </span>
          <span className="font-mono text-[var(--text-main)] truncate">
            {window.location.origin}/join?pin={activeSession.pin}
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)] shrink-0">
          Envía este link por Teams, correo o chat a tu audiencia
        </span>
      </div>

      {/* Estadísticas en Vivo: Usuarios y Respuestas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Usuarios Conectados */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Participantes en Sala
            </span>
            <span className="text-xs bg-[#4C8C2B] text-white font-extrabold px-2.5 py-0.5 rounded-full">
              {activeParticipants.length} conectados
            </span>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {activeParticipants.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic py-2">
                Esperando que los participantes ingresen...
              </p>
            ) : (
              activeParticipants.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between text-xs py-1 px-2.5 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg"
                >
                  <span className="font-bold text-[var(--text-main)] truncate">
                    {p.nickname}
                  </span>
                  {p.department && (
                    <span className="text-[10px] text-[var(--text-muted)] truncate">
                      {p.department}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Cantidad de Respuestas Recibidas */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Progreso de Respuestas
            </span>
            <span className="text-xs bg-[#48A9C5] text-white font-extrabold px-2.5 py-0.5 rounded-full">
              {totalAnswers} / {activeParticipants.length} votos
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-[var(--text-main)]">
              {totalAnswers}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              respuestas registradas
            </span>
          </div>
          <div className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] h-3 rounded-full overflow-hidden">
            <div
              className="bg-[#FFC72C] h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  activeParticipants.length > 0
                    ? (totalAnswers / activeParticipants.length) * 100
                    : 0,
                )}%`,
              }}
            />
          </div>
        </div>

        {/* 3. Control de Diapositivas / Pregunta */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Acción de la Diapositiva
            </span>
            <span className="text-xs bg-[#FFC72C] text-[#001E32] font-black px-2 py-0.5 rounded">
              Fase: {activeSession.current_step}
            </span>
          </div>

          {activeSession.current_step === "lobby" ? (
            <button
              type="button"
              onClick={() => onPresenterAction("start_game")}
              className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-[#001E32]" />
              <span>Iniciar Primera Pregunta</span>
            </button>
          ) : activeSession.current_step === "question" ? (
            <button
              type="button"
              onClick={() => onPresenterAction("show_results")}
              className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Cerrar Votación y Ver Resultados</span>
            </button>
          ) : activeSession.current_step === "results" ? (
            <button
              type="button"
              onClick={() => onPresenterAction("show_leaderboard")}
              className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Ver Tabla de Posiciones</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onPresenterAction("next_question")}
              className="w-full bg-[#4C8C2B] hover:bg-[#3E7323] text-white font-black text-sm py-3 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <span>Siguiente Pregunta</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex justify-between text-xs text-[#ECEBE4]/60">
            <span>Tiempo: {remainingTime}s</span>
            <span>
              Pregunta #{activeSession.current_question_index + 1} de{" "}
              {currentQuestions.length}
            </span>
          </div>
        </div>

        {/* 1. Fila de Diapositiva Activa / En Vivo */}
        {currentQ && (
          <div className="md:col-span-3 bg-[var(--surface-subtle)] border-2 border-[#FFC72C] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
              <span className="flex items-center gap-1 font-extrabold uppercase tracking-wider text-[#FFC72C] bg-[#FFC72C]/15 px-3 py-1.5 rounded-xl border border-[#FFC72C]/40 shrink-0">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                {isLobby
                  ? "En Sala de Espera (Lobby)"
                  : `Pregunta Activa #${activeQIndex + 1}`}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-[var(--text-main)] truncate text-sm">
                  {currentQ.question_text}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 text-[var(--text-subtle)] flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getQuestionTypeBadge(currentQ.question_type).color}`}
              >
                {getQuestionTypeBadge(currentQ.question_type).label}
              </span>
              <span>
                Votos:{" "}
                <strong className="text-[#FFC72C]">
                  {totalAnswers} / {activeParticipants.length}
                </strong>
              </span>
              <span>
                Opciones con votos:{" "}
                <strong className="text-[#FFC72C]">
                  {Object.keys(liveResults).length}
                </strong>
              </span>
              <span>
                Límite: <strong>{currentQ.time_limit}s</strong>
              </span>
            </div>
          </div>
        )}

        {/* 2. Tarjeta Destacada: Siguiente Pregunta que Viene */}
        <div className="md:col-span-3 bg-[var(--surface-subtle)] border-2 border-[#48A9C5]/50 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[#48A9C5] bg-[#48A9C5]/15 border border-[#48A9C5]/40 px-2.5 py-0.5 rounded-full">
                <ArrowRightCircle className="w-3.5 h-3.5" />
                {isLobby
                  ? "Próxima a Lanzar: Pregunta #1"
                  : nextQ
                    ? `Siguiente Pregunta (#${activeQIndex + 2} de ${currentQuestions.length})`
                    : "Fin de Diapositivas"}
              </span>
              {nextQ && (
                <>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getQuestionTypeBadge(nextQ.question_type).color}`}
                  >
                    {getQuestionTypeBadge(nextQ.question_type).label}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    ⏱ {nextQ.time_limit}s
                  </span>
                </>
              )}
            </div>
            <h4 className="text-sm md:text-base font-bold text-[var(--text-main)] truncate">
              {nextQ
                ? nextQ.question_text
                : "No hay más preguntas pendientes. Al avanzar se proyectará el Podio Final."}
            </h4>
          </div>

          {nextQ && (
            <button
              type="button"
              onClick={() =>
                onPresenterAction(
                  "jump_to_question",
                  isLobby ? 0 : activeQIndex + 1,
                )
              }
              className="bg-[#48A9C5] hover:bg-[#3FA1BD] text-[#001E32] font-black text-xs py-2 px-3.5 rounded-xl transition shadow flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-[#001E32]" />
              <span>
                {isLobby
                  ? "Lanzar Primera Pregunta"
                  : "Lanzar Siguiente Pregunta Ahora"}
              </span>
            </button>
          )}
        </div>

        {/* 3. Panel Completo: Listado y Secuencia de Diapositivas */}
        <SessionQuestionsList
          currentQuestions={currentQuestions}
          activeQIndex={activeQIndex}
          isLobby={isLobby}
          pastQuestionsCount={pastQuestionsCount}
          pendingQuestionsCount={pendingQuestionsCount}
          onPresenterAction={onPresenterAction}
        />
      </div>
    </section>
  );
}
