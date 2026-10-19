import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileSpreadsheet, HelpCircle, Tv } from "lucide-react";
import QRCode from "qrcode";
import PageHeader from "../../components/PageHeader";
import CollaboratorsModal from "../../components/CollaboratorsModal";
import QuestionBankPickerModal from "../../components/QuestionBankPickerModal";
import { getSocket } from "../../services/socket";

import type { PresentationItem } from "./types";
import { downloadExcelTemplate } from "./utils/excelHelper";
import PresentationsToolbar from "./components/PresentationsToolbar";
import PresentationsGrid from "./components/PresentationsGrid";
import PresentationsTable from "./components/PresentationsTable";
import ActiveSessionMonitor from "./components/ActiveSessionMonitor";
import CreatePresentationModal from "./modals/CreatePresentationModal";
import DeletePresentationModal from "./modals/DeletePresentationModal";
import QrSessionModal from "./modals/QrSessionModal";
import ExcelImportModal from "./modals/ExcelImportModal";

import { usePresenterSessionSocket } from "./hooks/usePresenterSessionSocket";

export default function PresentationsPage() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de búsqueda, modo y vista
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "quiz" | "presentation">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Sesión activa y WebSockets gestionados mediante hook
  const {
    activeSession,
    setActiveSession,
    activeParticipants,
    totalAnswers,
    liveResults,
    remainingTime,
    currentQuestions,
    clearActiveSession,
  } = usePresenterSessionSocket();

  // Estados de interfaz y modales
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [collabTarget, setCollabTarget] = useState<{
    id: number;
    title: string;
    isOwnerOrAdmin: boolean;
  } | null>(null);
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  const fetchPresentations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/epivox/activities");
      const data = await res.json();
      if (Array.isArray(data)) setPresentations(data);
    } catch (err) {
      console.error("Error al cargar presentaciones:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  // Filtrado de presentaciones
  const filteredPresentations = useMemo(() => {
    return presentations.filter((act) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        act.title.toLowerCase().includes(q) ||
        act.category.toLowerCase().includes(q) ||
        (act.description && act.description.toLowerCase().includes(q));

      let matchMode = true;
      if (modeFilter === "quiz") {
        matchMode = act.activity_type === "quiz";
      } else if (modeFilter === "presentation") {
        matchMode =
          act.activity_type === "interactive_presentation" ||
          act.activity_type === "open_poll";
      }

      return matchSearch && matchMode;
    });
  }, [presentations, searchQuery, modeFilter]);

  // Conteos para tabs de filtro
  const counts = useMemo(() => {
    const total = presentations.length;
    const triviaCount = presentations.filter(
      (p) => p.activity_type === "quiz",
    ).length;
    const presentationCount = presentations.filter(
      (p) =>
        p.activity_type === "interactive_presentation" ||
        p.activity_type === "open_poll",
    ).length;
    return { total, triviaCount, presentationCount };
  }, [presentations]);

  // Iniciar sesión en vivo
  const handleLaunchSession = async (activityId: number) => {
    try {
      const res = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, mode: "live" }),
      });
      const data = await res.json();
      if (data && data.pin) {
        setActiveSession({
          id: data.id,
          pin: data.pin,
          status: data.status,
          current_question_index: data.current_question_index || 0,
          current_step: data.current_step || "lobby",
          activity_id: data.activity_id,
        });

        const socket = getSocket();
        socket.emit("presenter:join", { pin: data.pin });
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
    }
  };

  // Controles de presentador
  const handlePresenterAction = (
    action: string,
    targetQuestionIndex?: number,
  ) => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action,
      questionIndex:
        targetQuestionIndex !== undefined
          ? targetQuestionIndex
          : activeSession.current_question_index,
    });
  };

  // Cancelar la sesión activa de presentación para todos los participantes
  const handleCancelActiveSession = async () => {
    if (!activeSession) return;
    const pin = activeSession.pin;
    try {
      const socket = getSocket();
      socket.emit("presenter:action", { pin, action: "cancel_session" });
      await fetch(`/api/epivox/sessions/${pin}/cancel`, { method: "POST" });
    } catch (err) {
      console.error("Error al cancelar sesión:", err);
    } finally {
      clearActiveSession();
    }
  };

  const handleCopyLink = (pin: string) => {
    const link = `${window.location.origin}/join?pin=${pin}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenQR = async (pin: string) => {
    const link = `${window.location.origin}/join?pin=${pin}`;
    try {
      const qr = await QRCode.toDataURL(link, {
        width: 300,
        margin: 1,
        color: { dark: "#001E32", light: "#FFC72C" },
      });
      setQrModalUrl(qr);
    } catch (err) {
      console.error(err);
    }
  };

  // Crear presentación manual
  const handleCreatePresentation = async (
    title: string,
    category: string,
    type: string,
  ) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/epivox/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          activity_type: type,
          default_time_limit: 30,
          default_points: type === "quiz" ? 1000 : 0,
        }),
      });
      if (res.ok) {
        setIsCreatingModal(false);
        await fetchPresentations();
      }
    } catch (err) {
      console.error("Error creando actividad:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clonar presentación
  const handleClone = async (id: number) => {
    try {
      await fetch(`/api/epivox/activities/${id}/clone`, { method: "POST" });
      await fetchPresentations();
    } catch (err) {
      console.error("Error al clonar:", err);
    }
  };

  // Confirmar y eliminar presentación
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      const res = await fetch(`/api/epivox/activities/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error(
          "Error al eliminar presentación:",
          data.error || res.statusText,
        );
      }
      setDeleteTargetId(null);
      await fetchPresentations();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Presentaciones"
        description="Gestor central de presentaciones interactivas y trivias gamificadas. Lanza sesiones en vivo, monitorea respuestas y realiza cargas masivas vía Excel."
        breadcrumbs={[
          { label: "Epivox", href: "/" },
          { label: "Presentaciones" },
        ]}
        badge={
          <span className="px-3 py-1 bg-[#FFC72C]/15 border border-[#FFC72C]/40 text-[#FFC72C] text-xs font-bold rounded-full">
            {presentations.length} Disponibles
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsBankPickerOpen(true)}
              className="bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#FFC72C]" />
              <span>Desde Banco de Preguntas</span>
            </button>

            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-4 rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#48A9C5]" />
              <span>Importar Excel</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreatingModal(true)}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow-sm flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Presentación</span>
            </button>
          </div>
        }
      />

      {/* CASO 1: SESIÓN EN VIVO ACTIVA (MONITOR) */}
      {activeSession ? (
        <ActiveSessionMonitor
          activeSession={activeSession}
          activeParticipants={activeParticipants}
          totalAnswers={totalAnswers}
          liveResults={liveResults}
          remainingTime={remainingTime}
          currentQuestions={currentQuestions}
          copiedLink={copiedLink}
          onCopyLink={handleCopyLink}
          onOpenQR={handleOpenQR}
          onCancelActiveSession={handleCancelActiveSession}
          onHideMonitor={clearActiveSession}
          onPresenterAction={handlePresenterAction}
        />
      ) : (
        /* CASO 2: CATÁLOGO DE PRESENTACIONES */
        <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
          <PresentationsToolbar
            modeFilter={modeFilter}
            onModeFilterChange={setModeFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            counts={counts}
          />

          {isLoading ? (
            <div className="py-12 text-center text-[var(--text-muted)]">
              Cargando catálogo de presentaciones...
            </div>
          ) : filteredPresentations.length === 0 ? (
            <div className="py-12 text-center text-[var(--text-muted)] space-y-3">
              <Tv className="w-12 h-12 mx-auto text-[#FFC72C] opacity-50" />
              <p>
                No se encontraron presentaciones para los filtros aplicados.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setModeFilter("all");
                }}
                className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] hover:border-[#FFC72C] text-[#FFC72C] font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <PresentationsGrid
              presentations={filteredPresentations}
              onLaunch={handleLaunchSession}
              onClone={handleClone}
              onDeleteClick={(id) => setDeleteTargetId(id)}
              onCollabClick={(target) => setCollabTarget(target)}
            />
          ) : (
            <PresentationsTable
              presentations={filteredPresentations}
              onLaunch={handleLaunchSession}
              onClone={handleClone}
              onDeleteClick={(id) => setDeleteTargetId(id)}
              onCollabClick={(target) => setCollabTarget(target)}
            />
          )}
        </div>
      )}

      {/* MODALES */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onDownloadTemplate={downloadExcelTemplate}
        onImportSuccess={fetchPresentations}
      />

      <CreatePresentationModal
        isOpen={isCreatingModal}
        onClose={() => setIsCreatingModal(false)}
        onSubmit={handleCreatePresentation}
        isSubmitting={isSubmitting}
      />

      <DeletePresentationModal
        deleteTargetId={deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
      />

      <QrSessionModal
        qrModalUrl={qrModalUrl}
        onClose={() => setQrModalUrl(null)}
      />

      <CollaboratorsModal
        isOpen={collabTarget !== null}
        onClose={() => setCollabTarget(null)}
        activityId={collabTarget?.id || null}
        activityTitle={collabTarget?.title || ""}
        isOwnerOrAdmin={Boolean(collabTarget?.isOwnerOrAdmin)}
      />

      <QuestionBankPickerModal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        existingActivities={presentations.map((p) => ({
          id: p.id,
          title: p.title,
        }))}
        onImportSuccess={async (actId) => {
          await fetchPresentations();
          navigate(`/editor/${actId}`);
        }}
      />
    </div>
  );
}
