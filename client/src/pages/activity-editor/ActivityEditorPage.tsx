import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Save, Play, ArrowLeft } from "lucide-react";
import PageHeader from "../../components/PageHeader";
import QuestionBankPickerModal from "../../components/QuestionBankPickerModal";

import type {
  ActivityData,
  OptionItem,
  ParsedExcelQuestion,
  QuestionItem,
} from "./types";
import { downloadExcelTemplate } from "./utils/editorExcelHelper";
import SlideListSidebar from "./components/SlideListSidebar";
import QuestionCanvas from "./components/QuestionCanvas";
import QuestionConfigSidebar from "./components/QuestionConfigSidebar";
import DeleteConfirmModal from "./modals/DeleteConfirmModal";
import SaveSuccessModal from "./modals/SaveSuccessModal";
import EditorExcelModal from "./modals/EditorExcelModal";

export default function ActivityEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessModal, setSaveSuccessModal] = useState(false);
  const [confirmDeleteModal, setConfirmDeleteModal] = useState<number | null>(
    null,
  );

  // Modales
  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Active question editing state
  const currentQuestion = questions[selectedQuestionIndex];
  const [currentOptions, setCurrentOptions] = useState<OptionItem[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/epivox/activities/${id || 1}`);
        if (res.ok) {
          const data = await res.json();
          setActivity(data);
          const qList = data.questions || [];
          setQuestions(qList);
          if (qList.length > 0) {
            setSelectedQuestionIndex(0);
            try {
              setCurrentOptions(JSON.parse(qList[0].options_json || "[]"));
            } catch {
              setCurrentOptions([]);
            }
          }
        }
      } catch (err) {
        console.error("Error al cargar actividad:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  useEffect(() => {
    if (currentQuestion) {
      try {
        setCurrentOptions(JSON.parse(currentQuestion.options_json || "[]"));
      } catch {
        setCurrentOptions([]);
      }
    }
  }, [selectedQuestionIndex, currentQuestion]);

  const handleSelectQuestion = (index: number) => {
    setSelectedQuestionIndex(index);
  };

  const handleUpdateCurrentQuestion = (fields: Partial<QuestionItem>) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[selectedQuestionIndex] = {
        ...next[selectedQuestionIndex],
        ...fields,
      };
      return next;
    });
  };

  const handleUpdateActivity = (fields: Partial<ActivityData>) => {
    setActivity((prev) => (prev ? { ...prev, ...fields } : null));
  };

  const handleAddQuestion = () => {
    const newQ: QuestionItem = {
      id: Date.now(), // ID temporal
      activity_id: activity ? activity.id : 1,
      sort_order: questions.length + 1,
      question_text: "¿Nueva Pregunta?",
      question_type: "multiple_choice",
      time_limit: 30,
      points_base: 1000,
      media_type: "none",
      media_url: null,
      reveal_step_count: 1,
      chart_type: "bar",
      options_json: JSON.stringify([
        { id: "A", text: "Opción A", isCorrect: true },
        { id: "B", text: "Opción B", isCorrect: false },
        { id: "C", text: "Opción C", isCorrect: false },
        { id: "D", text: "Opción D", isCorrect: false },
      ]),
      correct_answer_value: "A",
      explanation_text: "",
    };
    setQuestions((prev) => [...prev, newQ]);
    setSelectedQuestionIndex(questions.length);
  };

  const handleDeleteQuestion = (indexToDelete: number) => {
    setQuestions((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToDelete);
      return filtered.map((q, idx) => ({ ...q, sort_order: idx + 1 }));
    });
    setSelectedQuestionIndex((prev) => (prev > 0 ? prev - 1 : 0));
    setConfirmDeleteModal(null);
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === questions.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const reordered = [...questions];
    const temp = reordered[index];
    reordered[index] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const updated = reordered.map((q, idx) => ({ ...q, sort_order: idx + 1 }));
    setQuestions(updated);
    setSelectedQuestionIndex(targetIndex);
  };

  const handleOptionChange = (idx: number, newText: string) => {
    const next = [...currentOptions];
    next[idx] = { ...next[idx], text: newText };
    setCurrentOptions(next);
    handleUpdateCurrentQuestion({ options_json: JSON.stringify(next) });
  };

  const handleSetCorrectOption = (optionId: string) => {
    const next = currentOptions.map((opt) => ({
      ...opt,
      isCorrect: opt.id === optionId,
    }));
    setCurrentOptions(next);
    handleUpdateCurrentQuestion({
      options_json: JSON.stringify(next),
      correct_answer_value: optionId,
    });
  };

  const handleSaveAll = async () => {
    if (!activity) return;
    setIsSaving(true);
    try {
      // 1. Guardar metadatos de actividad
      await fetch(`/api/epivox/activities/${activity.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activity.title,
          description: activity.description,
          category: activity.category,
          default_time_limit: activity.default_time_limit,
          default_points: activity.default_points,
          speed_bonus_enabled: activity.speed_bonus_enabled,
        }),
      });

      // 2. Guardar o actualizar preguntas
      for (const q of questions) {
        if (q.id > 10000000) {
          // Pregunta nueva
          await fetch(`/api/epivox/activities/${activity.id}/questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(q),
          });
        } else {
          // Pregunta existente
          await fetch(`/api/epivox/questions/${q.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(q),
          });
        }
      }

      setSaveSuccessModal(true);
    } catch (err) {
      console.error("Error guardando actividad:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLaunchSession = async () => {
    if (!activity) return;
    try {
      await handleSaveAll();
      const res = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: activity.id, mode: "live" }),
      });
      const data = await res.json();
      if (data.pin) {
        navigate(`/presentations?sessionPin=${data.pin}`);
      }
    } catch (err) {
      console.error("Error al lanzar sesión:", err);
    }
  };

  const handleImportExcelQuestions = (
    parsed: ParsedExcelQuestion[],
    mode: "append" | "replace",
  ) => {
    const baseSort = mode === "replace" ? 0 : questions.length;
    const newItems: QuestionItem[] = parsed.map((q, idx) => {
      const correctOpt = q.options.find((o) => o.is_correct);
      return {
        id: Date.now() + idx,
        activity_id: activity ? activity.id : 1,
        sort_order: baseSort + idx + 1,
        question_text: q.questionText,
        question_type: q.questionType,
        time_limit: q.timeLimit,
        points_base: q.pointsBase,
        media_type: "none",
        media_url: null,
        reveal_step_count: 1,
        chart_type: q.questionType === "word_cloud" ? "word_cloud" : "bar",
        options_json: JSON.stringify(q.options),
        correct_answer_value: correctOpt
          ? correctOpt.id
          : (q.options[0]?.id ?? null),
        explanation_text: q.explanation,
      };
    });

    const updatedQuestions =
      mode === "replace" ? newItems : [...questions, ...newItems];

    setQuestions(updatedQuestions);

    const newSelectedIndex = mode === "replace" ? 0 : questions.length;
    setSelectedQuestionIndex(newSelectedIndex);

    if (newItems.length > 0) {
      try {
        setCurrentOptions(JSON.parse(newItems[0].options_json || "[]"));
      } catch {
        setCurrentOptions([]);
      }
    }
  };

  if (!activity || isLoading) {
    return (
      <div className="min-h-screen bg-[#001E32] text-white flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-[#FFC72C]">
          <div className="w-6 h-6 border-2 border-[#FFC72C] border-t-transparent rounded-full animate-spin" />
          <span className="font-bold">Cargando Editor de Epivox...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-bg)] text-[var(--text-main)] flex flex-col selection:bg-[#FFC72C] selection:text-[#001E32]">
      {/* Top Header Bar */}
      <div className="bg-[var(--surface-card)] border-b border-[var(--border-subtle)] px-6 py-4 shadow-sm">
        <PageHeader
          title={activity.title}
          description="Editor y creador de diapositivas interactivas y cuestionarios gamificados"
          breadcrumbs={[
            { label: "Epivox Hub", href: "/" },
            { label: "Presentaciones", href: "/presentations" },
            { label: "Editor de Actividades" },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate("/presentations")}
                className="flex items-center space-x-1.5 bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold py-2.5 px-3.5 rounded-xl transition active:scale-95 text-sm shadow-sm cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Presentaciones</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-[#48A9C5] hover:bg-[#3B8FA8] text-[#001E32] font-black py-2.5 px-4 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50 text-sm cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchSession}
                className="flex items-center space-x-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-2.5 px-4 rounded-xl shadow-sm transition active:scale-95 text-sm cursor-pointer"
              >
                <Play className="w-4 h-4 fill-[#001E32]" />
                <span>Presentar en Vivo</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        <SlideListSidebar
          questions={questions}
          selectedQuestionIndex={selectedQuestionIndex}
          onSelectQuestion={handleSelectQuestion}
          onMoveQuestion={handleMoveQuestion}
          onDeleteQuestionClick={(idx) => setConfirmDeleteModal(idx)}
          onAddQuestion={handleAddQuestion}
          onOpenBankPicker={() => setIsBankPickerOpen(true)}
          onOpenExcelModal={() => setIsExcelModalOpen(true)}
        />

        <QuestionCanvas
          currentQuestion={currentQuestion}
          selectedQuestionIndex={selectedQuestionIndex}
          currentOptions={currentOptions}
          onUpdateCurrentQuestion={handleUpdateCurrentQuestion}
          onOptionChange={handleOptionChange}
          onSetCorrectOption={handleSetCorrectOption}
        />

        <QuestionConfigSidebar
          currentQuestion={currentQuestion}
          activity={activity}
          onUpdateCurrentQuestion={handleUpdateCurrentQuestion}
          onUpdateActivity={handleUpdateActivity}
        />
      </div>

      {/* Confirmation Modal - Delete Question */}
      <DeleteConfirmModal
        isOpen={confirmDeleteModal !== null}
        questionIndex={confirmDeleteModal}
        onClose={() => setConfirmDeleteModal(null)}
        onConfirm={handleDeleteQuestion}
      />

      {/* Success Modal - Save */}
      <SaveSuccessModal
        isOpen={saveSuccessModal}
        activityTitle={activity.title}
        onClose={() => setSaveSuccessModal(false)}
        onNavigateToPresentations={() => navigate("/presentations")}
      />

      {/* Modal: Subir Preguntas Masivas desde Excel al Editor */}
      <EditorExcelModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onDownloadTemplate={downloadExcelTemplate}
        onImportSuccess={handleImportExcelQuestions}
        currentSlideCount={questions.length}
      />

      {/* Modal para Escoger Preguntas desde el Banco */}
      <QuestionBankPickerModal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        targetActivityId={activity ? activity.id : undefined}
        targetActivityTitle={activity ? activity.title : undefined}
        onImportSuccess={async () => {
          if (!id) return;
          try {
            const res = await fetch(`/api/epivox/activities/${id}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.questions) {
                setQuestions(data.questions);
              }
            }
          } catch (err) {
            console.error(
              "Error recargando preguntas tras importar desde banco:",
              err,
            );
          }
        }}
      />
    </div>
  );
}
