import React, { useState, useEffect, useMemo } from "react";
import {
  CheckSquare,
  Square,
  Shuffle,
  Plus,
  Tv,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  Search,
  Check,
  AlertCircle,
  Star,
  CheckCircle2,
  Sliders,
  BarChart3,
} from "lucide-react";

import Modal from "./Modal";

export interface QuestionBankFolder {
  id: number;
  name: string;
  parent_id: number | null;
  description: string | null;
  color: string;
  questions_count?: number;
  subfolders_count?: number;
}

export interface QuestionBankItem {
  id: number;
  folder_id: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  points_base: number;
  chart_type: string;
  options_json: string;
  correct_answer_value: string | null;
  explanation_text: string | null;
  folder_name?: string;
}

interface QuestionBankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (targetActivityId: number, questionsCount: number) => void;
  targetActivityId?: number; // Si se abre desde el editor de una presentación ya existente
  targetActivityTitle?: string;
  existingActivities?: Array<{ id: number; title: string }>;
}

export const QuestionBankPickerModal: React.FC<QuestionBankPickerModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  targetActivityId,
  targetActivityTitle,
  existingActivities = [],
}) => {
  // Estado de carpetas y preguntas
  const [folders, setFolders] = useState<QuestionBankFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [selectedSubfolderId, setSelectedSubfolderId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  // Selección de preguntas
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [randomCount, setRandomCount] = useState<number>(3);
  const [searchFilter, setSearchFilter] = useState("");

  // Destino (si no hay targetActivityId)
  const [destinationMode, setDestinationMode] = useState<"new" | "existing">(
    targetActivityId ? "existing" : "new",
  );
  const [chosenActivityId, setChosenActivityId] = useState<number>(
    targetActivityId || (existingActivities[0]?.id ?? 0),
  );
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityCategory, setNewActivityCategory] = useState("Capacitación");
  const [newActivityType, setNewActivityType] = useState<"quiz" | "interactive_presentation">("quiz");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar carpetas al abrir modal
  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg(null);
    setSelectedQuestionIds([]);
    setSearchFilter("");
    if (targetActivityId) {
      setChosenActivityId(targetActivityId);
      setDestinationMode("existing");
    }

    const fetchFolders = async () => {
      try {
        const res = await fetch("/api/epivox/bank/folders");
        if (res.ok) {
          const data = await res.json();
          setFolders(data);
          // Si hay carpetas raíz, seleccionar la primera
          const rootFolders = data.filter((f: QuestionBankFolder) => f.parent_id === null);
          if (rootFolders.length > 0) {
            setSelectedFolderId(rootFolders[0].id);
          }
        }
      } catch (err) {
        console.error("Error al cargar carpetas del banco:", err);
      }
    };

    fetchFolders();
  }, [isOpen, targetActivityId]);

  // Subcarpetas de la carpeta seleccionada
  const subfolders = useMemo(() => {
    if (!selectedFolderId) return [];
    return folders.filter((f) => f.parent_id === selectedFolderId);
  }, [folders, selectedFolderId]);

  // Cargar preguntas cuando cambia la carpeta o subcarpeta seleccionada
  useEffect(() => {
    if (!selectedFolderId) {
      setQuestions([]);
      return;
    }

    const targetFolder = selectedSubfolderId || selectedFolderId;
    const fetchQuestions = async () => {
      setIsLoadingQuestions(true);
      try {
        // Si no seleccionó subcarpeta pero hay subcarpetas, pedir con recursive=true
        const isParentWithSubfolders = !selectedSubfolderId && subfolders.length > 0;
        const url = `/api/epivox/bank/questions?folder_id=${targetFolder}${isParentWithSubfolders ? "&recursive=true" : ""}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data);
          setSelectedQuestionIds([]);
        }
      } catch (err) {
        console.error("Error al cargar preguntas:", err);
      } finally {
        setIsLoadingQuestions(false);
      }
    };

    fetchQuestions();
  }, [selectedFolderId, selectedSubfolderId, subfolders.length]);

  // Preguntas filtradas por búsqueda
  const filteredQuestions = useMemo(() => {
    if (!searchFilter.trim()) return questions;
    const q = searchFilter.toLowerCase();
    return questions.filter(
      (item) =>
        item.question_text.toLowerCase().includes(q) ||
        item.question_type.toLowerCase().includes(q) ||
        (item.explanation_text && item.explanation_text.toLowerCase().includes(q)),
    );
  }, [questions, searchFilter]);

  // ---------------------------------------------------------------------------
  // OPCIÓN 1: SELECCIONAR TODAS LAS PREGUNTAS
  // ---------------------------------------------------------------------------
  const handleSelectAll = () => {
    if (selectedQuestionIds.length === filteredQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(filteredQuestions.map((q) => q.id));
    }
  };

  // ---------------------------------------------------------------------------
  // OPCIÓN 2: SELECCIONAR ALGUNAS (TOGGLE INDIVIDUAL)
  // ---------------------------------------------------------------------------
  const handleToggleQuestion = (id: number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  // ---------------------------------------------------------------------------
  // OPCIÓN 3: ESCOGER X AL AZAR
  // ---------------------------------------------------------------------------
  const handlePickRandom = () => {
    if (filteredQuestions.length === 0) return;
    const count = Math.min(Math.max(1, randomCount), filteredQuestions.length);
    const shuffled = [...filteredQuestions].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, count).map((q) => q.id);
    setSelectedQuestionIds(picked);
  };

  // ---------------------------------------------------------------------------
  // GUARDAR / TRANSFERIR PREGUNTAS A LA PRESENTACIÓN
  // ---------------------------------------------------------------------------
  const handleConfirmTransfer = async () => {
    if (selectedQuestionIds.length === 0) {
      setErrorMsg("Debes seleccionar al menos una pregunta para transferir.");
      return;
    }

    if (destinationMode === "new" && !newActivityTitle.trim()) {
      setErrorMsg("Ingresa un título para la nueva presentación.");
      return;
    }

    if (destinationMode === "existing" && !chosenActivityId) {
      setErrorMsg("Selecciona una presentación de destino existente.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload: {
        activity_id?: number;
        new_activity?: { title: string; category: string; activity_type: string };
        question_ids: number[];
      } = {
        question_ids: selectedQuestionIds,
      };

      if (destinationMode === "existing") {
        payload.activity_id = chosenActivityId;
      } else {
        payload.new_activity = {
          title: newActivityTitle.trim(),
          category: newActivityCategory,
          activity_type: newActivityType,
        };
      }

      const res = await fetch("/api/epivox/bank/copy-to-presentation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Error al copiar preguntas.");
        return;
      }

      onImportSuccess(data.activity.id, selectedQuestionIds.length);
      onClose();
    } catch {
      setErrorMsg("Error de red al transferir las preguntas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return { label: "Opción Múltiple", icon: Layers, color: "text-[#48A9C5] bg-[#48A9C5]/10 border-[#48A9C5]/30" };
      case "true_false":
        return { label: "Verdadero o Falso", icon: CheckCircle2, color: "text-[#FFC72C] bg-[#FFC72C]/10 border-[#FFC72C]/30" };
      case "rating":
        return { label: "Calificación ⭐", icon: Star, color: "text-[#FFC72C] bg-[#FFC72C]/10 border-[#FFC72C]/30" };
      case "word_cloud":
        return { label: "Nube de Palabras", icon: Sparkles, color: "text-[#86C8BC] bg-[#86C8BC]/10 border-[#86C8BC]/30" };
      case "likert":
        return { label: "Escala Likert", icon: Sliders, color: "text-[#4C8C2B] bg-[#4C8C2B]/10 border-[#4C8C2B]/30" };
      case "open_ended":
        return { label: "Pregunta Abierta", icon: HelpCircle, color: "text-[#86C8BC] bg-[#86C8BC]/10 border-[#86C8BC]/30" };
      case "ranking":
        return { label: "Ranking / Orden", icon: BarChart3, color: "text-[#B7312C] bg-[#B7312C]/10 border-[#B7312C]/30" };
      default:
        return { label: type, icon: Layers, color: "text-[#ECEBE4] bg-[#425563]/20 border-[#425563]" };
    }
  };

  const rootFolders = folders.filter((f) => f.parent_id === null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escoger desde Banco de Preguntas"
      description="Navega por las carpetas corporativas y selecciona las preguntas que desees incorporar a tu presentación."
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-[#ECEBE4]/70">
            {selectedQuestionIds.length > 0 ? (
              <span className="font-bold text-[#FFC72C]">
                {selectedQuestionIds.length} {selectedQuestionIds.length === 1 ? "pregunta seleccionada" : "preguntas seleccionadas"}
              </span>
            ) : (
              <span>Ninguna pregunta seleccionada</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-subtle)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2 px-4 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmTransfer}
              disabled={isSubmitting || selectedQuestionIds.length === 0}
              className="bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] font-black text-xs py-2 px-5 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? "Importando..."
                  : targetActivityId
                    ? `Añadir ${selectedQuestionIds.length} al Editor`
                    : `Importar ${selectedQuestionIds.length} Preguntas`}
              </span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-[#B7312C]/10 border border-[#B7312C]/30 rounded-xl text-xs text-[#B7312C]">
            <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* PASO 1: SELECCIONAR CARPETA Y SUBCARPETAS                           */}
        {/* ------------------------------------------------------------------- */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3">
          <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
            1. Selecciona Carpeta del Banco
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Selector de Carpeta Raíz */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">
                Carpeta Principal
              </label>
              <select
                value={selectedFolderId || ""}
                onChange={(e) => {
                  setSelectedFolderId(Number(e.target.value) || null);
                  setSelectedSubfolderId(null);
                }}
                className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] focus:border-[#FFC72C] text-xs text-[var(--text-main)] rounded-xl px-3 py-2.5 outline-none cursor-pointer"
              >
                {rootFolders.map((rf) => (
                  <option key={rf.id} value={rf.id}>
                    📁 {rf.name} ({rf.questions_count || 0} preguntas)
                  </option>
                ))}
              </select>
            </div>

            {/* Selector de Subcarpeta (si existen) */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">
                Subcarpeta (Opcional)
              </label>
              <select
                value={selectedSubfolderId || ""}
                disabled={subfolders.length === 0}
                onChange={(e) => setSelectedSubfolderId(Number(e.target.value) || null)}
                className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] focus:border-[#FFC72C] text-xs text-[var(--text-main)] rounded-xl px-3 py-2.5 outline-none disabled:opacity-50 cursor-pointer"
              >
                <option value="">
                  {subfolders.length > 0 ? "📂 Todas las subcarpetas del tema" : "Sin subcarpetas"}
                </option>
                {subfolders.map((sf) => (
                  <option key={sf.id} value={sf.id}>
                    ↳ {sf.name} ({sf.questions_count || 0} preguntas)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* PASO 2: HERRAMIENTAS DE SELECCIÓN (TODAS / ALGUNAS / X AL AZAR)    */}
        {/* ------------------------------------------------------------------- */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider">
              2. Opciones de Selección ({filteredQuestions.length} disponibles)
            </span>

            {/* Buscador de preguntas */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Filtrar por texto..."
                className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none focus:border-[#FFC72C]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {/* Botón 1: Seleccionar Todas las Preguntas */}
            <button
              type="button"
              onClick={handleSelectAll}
              disabled={filteredQuestions.length === 0}
              className="flex items-center justify-center gap-2 bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-subtle)] hover:text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2 px-3 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {selectedQuestionIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-[#FFC72C]" />
                  <span>Deseleccionar Todas</span>
                </>
              ) : (
                <>
                  <CheckSquare className="w-4 h-4 text-[#48A9C5]" />
                  <span>Seleccionar Todas ({filteredQuestions.length})</span>
                </>
              )}
            </button>

            {/* Botón 2: Seleccionar Algunas (Recordatorio / Checkboxes) */}
            <div className="flex items-center justify-center gap-1.5 bg-[var(--surface-card)]/50 border border-[var(--border-subtle)] text-[var(--text-muted)] text-[11px] font-semibold py-2 px-3 rounded-xl text-center">
              <span>O marca casillas abajo para elegir algunas</span>
            </div>

            {/* Botón 3: Escoger X al Azar */}
            <div className="flex items-center gap-1.5 bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl p-1">
              <input
                type="number"
                min={1}
                max={filteredQuestions.length || 10}
                value={randomCount}
                onChange={(e) => setRandomCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-12 text-center bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-lg py-1 text-xs text-[var(--text-main)] font-bold outline-none"
                title="Cantidad al azar"
              />
              <button
                type="button"
                onClick={handlePickRandom}
                disabled={filteredQuestions.length === 0}
                className="flex-1 flex items-center justify-center gap-1 bg-[#48A9C5] hover:bg-[#3996B1] text-[#001E32] font-black text-xs py-1.5 px-2 rounded-lg transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Elegir {randomCount} al Azar</span>
              </button>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* LISTADO DE PREGUNTAS CON CHECKBOXES                                 */}
        {/* ------------------------------------------------------------------- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--text-subtle)] px-1">
            <span>Listado de Preguntas:</span>
            <span className="font-bold text-[#FFC72C]">
              {selectedQuestionIds.length} seleccionadas de {filteredQuestions.length}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-[var(--border-subtle)] border border-[var(--border-subtle)] rounded-2xl p-2 bg-[var(--surface-subtle)]">
            {isLoadingQuestions ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Cargando preguntas de la carpeta...
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)] space-y-1">
                <p>No se encontraron preguntas en esta carpeta o criterio de búsqueda.</p>
                <span className="text-[11px] text-[#48A9C5]">
                  Puedes subir preguntas a esta carpeta con Excel en el Banco de Preguntas.
                </span>
              </div>
            ) : (
              filteredQuestions.map((q) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                const badge = getQuestionTypeLabel(q.question_type);
                const BadgeIcon = badge.icon;

                let optionsCount = 0;
                try {
                  const opts = JSON.parse(q.options_json || "[]");
                  optionsCount = Array.isArray(opts) ? opts.length : 0;
                } catch {
                  optionsCount = 0;
                }

                return (
                  <div
                    key={q.id}
                    onClick={() => handleToggleQuestion(q.id)}
                    className={`p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-[var(--surface-card)] border-[#FFC72C] ring-1 ring-[#FFC72C] shadow-sm"
                        : "bg-[var(--surface-card)] border-[var(--border-subtle)] hover:border-[#48A9C5] text-[var(--text-subtle)]"
                    }`}
                  >
                    <div className="pt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#FFC72C]" />
                      ) : (
                        <Square className="w-4 h-4 text-[var(--text-muted)]" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${badge.color}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>

                        <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {q.time_limit}s
                        </span>

                        {optionsCount > 0 && (
                          <span className="text-[10px] text-[var(--text-muted)]">
                            • {optionsCount} opciones
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-[var(--text-main)] leading-relaxed">
                        {q.question_text}
                      </p>

                      {q.explanation_text && (
                        <p className="text-[11px] text-[var(--text-muted)] italic line-clamp-1">
                          {q.explanation_text}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* PASO 3: DESTINO DE LA IMPORTACIÓN                                   */}
        {/* ------------------------------------------------------------------- */}
        {!targetActivityId && (
          <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-2xl p-4 space-y-3">
            <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
              3. Destino de las Preguntas
            </span>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDestinationMode("new")}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  destinationMode === "new"
                    ? "bg-[var(--surface-card)] border-[#FFC72C] ring-1 ring-[#FFC72C] shadow-sm"
                    : "bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
              >
                <Plus className="w-4 h-4 text-[#FFC72C]" />
                <div>
                  <span className="text-xs font-bold text-[var(--text-main)] block">
                    Crear Nueva Presentación
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Con las preguntas seleccionadas
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setDestinationMode("existing")}
                disabled={existingActivities.length === 0}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                  destinationMode === "existing"
                    ? "bg-[var(--surface-card)] border-[#48A9C5] ring-1 ring-[#48A9C5] shadow-sm"
                    : "bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--text-muted)] disabled:opacity-40"
                }`}
              >
                <Tv className="w-4 h-4 text-[#48A9C5]" />
                <div>
                  <span className="text-xs font-bold text-[var(--text-main)] block">
                    Añadir a Existente
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Insertar al final de la diapositiva
                  </span>
                </div>
              </button>
            </div>

            {destinationMode === "new" ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">
                    Título de la Presentación
                  </label>
                  <input
                    type="text"
                    value={newActivityTitle}
                    onChange={(e) => setNewActivityTitle(e.target.value)}
                    placeholder="Ej. Cuestionario LOTO y Seguridad Faena"
                    className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[#FFC72C]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">
                    Categoría
                  </label>
                  <select
                    value={newActivityCategory}
                    onChange={(e) => setNewActivityCategory(e.target.value)}
                    className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[#FFC72C] cursor-pointer"
                  >
                    <option value="Capacitación">Capacitación</option>
                    <option value="Seguridad">Seguridad</option>
                    <option value="Operaciones">Operaciones</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Ventas">Ventas</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">
                    Dinámica
                  </label>
                  <select
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value as "quiz" | "interactive_presentation")}
                    className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[#FFC72C] cursor-pointer"
                  >
                    <option value="quiz">🎮 Modo Trivia (Gamificación)</option>
                    <option value="interactive_presentation">📊 Presentación Interactiva</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-[var(--text-subtle)] mb-1">
                  Selecciona la Presentación de Destino
                </label>
                <select
                  value={chosenActivityId}
                  onChange={(e) => setChosenActivityId(Number(e.target.value))}
                  className="w-full bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] outline-none focus:border-[#FFC72C] cursor-pointer"
                >
                  {existingActivities.map((act) => (
                    <option key={act.id} value={act.id}>
                      {act.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {targetActivityId && (
          <div className="p-3 bg-[#48A9C5]/10 border border-[#48A9C5]/30 rounded-xl text-xs text-[var(--text-subtle)] flex items-center gap-2">
            <Tv className="w-4 h-4 text-[#48A9C5] shrink-0" />
            <span>
              Las preguntas seleccionadas se añadirán al final de la presentación:{" "}
              <strong className="text-[var(--text-main)] font-bold">"{targetActivityTitle || "Presentación actual"}"</strong>.
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QuestionBankPickerModal;
