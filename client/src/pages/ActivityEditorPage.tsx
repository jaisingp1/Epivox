import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Save,
  Play,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  PieChart,
  Clock,
  Award,
  Zap,
  Layers,
  Sliders,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";

interface OptionItem {
  id: string;
  text: string;
  isCorrect?: boolean;
}

interface QuestionItem {
  id: number;
  activity_id: number;
  sort_order: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  points_base: number;
  media_type: string;
  media_url: string | null;
  reveal_step_count: number;
  chart_type: string;
  options_json: string;
  correct_answer_value: string | null;
  explanation_text: string | null;
}

interface ActivityData {
  id: number;
  title: string;
  description: string | null;
  category: string;
  activity_type: string;
  theme_id: number | null;
  default_time_limit: number;
  default_points: number;
  speed_bonus_enabled: boolean;
  negative_points_enabled: boolean;
  questions?: QuestionItem[];
}

const QUESTION_TYPES = [
  { id: "multiple_choice", label: "Opción Múltiple (Quiz)", icon: Layers },
  { id: "true_false", label: "Verdadero o Falso", icon: CheckCircle2 },
  { id: "word_cloud", label: "Nube de Palabras", icon: Sparkles },
  { id: "likert_scale", label: "Escala Likert (1-5)", icon: Sliders },
  { id: "open_text", label: "Pregunta Abierta", icon: HelpCircle },
  { id: "ranking", label: "Ordenamiento / Ranking", icon: BarChart3 },
];

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
      const res = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: activity.id, mode: "live" }),
      });
      const data = await res.json();
      if (data.pin) {
        navigate(`/present/${data.pin}`);
      }
    } catch (err) {
      console.error("Error al lanzar sesión:", err);
    }
  };

  if (isLoading || !activity) {
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
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col selection:bg-[#FFC72C] selection:text-[#001E32]">
      {/* Top Header Bar */}
      <div className="bg-[#193750] border-b border-[#425563] px-6 py-4">
        <PageHeader
          title={activity.title}
          description="Editor y creador de diapositivas interactivas y cuestionarios gamificados"
          breadcrumbs={[
            { label: "Epivox Hub", href: "/" },
            { label: "Editor de Actividades" },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="flex items-center space-x-2 bg-[#48A9C5] hover:bg-[#3B8FA8] text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition active:scale-95 disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchSession}
                className="flex items-center space-x-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-2.5 px-4 rounded-xl shadow-lg transition active:scale-95 text-sm"
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
        {/* Column 1: Left Slides List */}
        <aside className="w-72 bg-[#001E32] border-r border-[#425563] flex flex-col shrink-0">
          <div className="p-4 border-b border-[#425563]/60 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[#ECEBE4]/70">
              Diapositivas ({questions.length})
            </span>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex items-center space-x-1 bg-[#425563] hover:bg-[#FFC72C] hover:text-[#001E32] text-white text-xs font-bold py-1.5 px-3 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {questions.map((q, idx) => {
              const isSelected = idx === selectedQuestionIndex;
              return (
                <div
                  key={q.id || idx}
                  onClick={() => handleSelectQuestion(idx)}
                  className={`group relative p-3 rounded-xl border-2 transition cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? "bg-[#193750] border-[#FFC72C] shadow-lg"
                      : "bg-[#001E32]/70 border-[#425563]/50 hover:border-[#425563]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-[#FFC72C]">
                      #{idx + 1}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-[#ECEBE4]/60 bg-[#425563]/40 px-1.5 py-0.5 rounded">
                      {q.question_type.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white line-clamp-2">
                    {q.question_text || "¿Sin pregunta redactada?"}
                  </p>

                  {/* Reorder & delete mini buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#425563]/40 text-[#ECEBE4]/60">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, "up");
                        }}
                        disabled={idx === 0}
                        aria-label="Subir diapositiva"
                        className="hover:text-[#FFC72C] disabled:opacity-20 p-1"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveQuestion(idx, "down");
                        }}
                        disabled={idx === questions.length - 1}
                        aria-label="Bajar diapositiva"
                        className="hover:text-[#FFC72C] disabled:opacity-20 p-1"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteModal(idx);
                      }}
                      aria-label="Eliminar diapositiva"
                      className="hover:text-[#B7312C] p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Column 2: Center Question Canvas */}
        <main className="flex-1 bg-[#0F2D44] p-8 overflow-y-auto flex flex-col items-center">
          {currentQuestion ? (
            <div className="max-w-3xl w-full space-y-6">
              {/* Question Text Prompt */}
              <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 shadow-xl space-y-3">
                <label className="text-xs font-black uppercase text-[#FFC72C] tracking-wider block">
                  Enunciado de la Pregunta #{selectedQuestionIndex + 1}
                </label>
                <input
                  type="text"
                  value={currentQuestion.question_text}
                  onChange={(e) =>
                    handleUpdateCurrentQuestion({
                      question_text: e.target.value,
                    })
                  }
                  placeholder="Escribe tu pregunta aquí..."
                  className="w-full bg-[#001E32] border border-[#425563] rounded-2xl px-5 py-4 text-xl font-bold text-white placeholder-[#ECEBE4]/40 focus:outline-none focus:border-[#FFC72C] transition"
                />
              </div>

              {/* Type-Specific Options Canvas */}
              {currentQuestion.question_type === "multiple_choice" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#ECEBE4]/80">
                    <span>
                      Opciones de Respuesta (Marca el check verde en la
                      correcta)
                    </span>
                    <span>4 Opciones Estándar</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {currentOptions.map((opt, idx) => {
                      const isCorrect =
                        currentQuestion.correct_answer_value === opt.id ||
                        opt.isCorrect;
                      const badgeColors = [
                        "bg-[#B7312C]",
                        "bg-[#48A9C5]",
                        "bg-[#FFC72C]",
                        "bg-[#4C8C2B]",
                      ];
                      const shapeIcons = ["▲", "◆", "●", "■"];

                      return (
                        <div
                          key={opt.id || idx}
                          className={`relative flex items-center bg-[#193750] border-2 rounded-2xl p-3 transition shadow-md ${
                            isCorrect
                              ? "border-[#4C8C2B] ring-2 ring-[#4C8C2B]/50"
                              : "border-[#425563]"
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0 mr-3 shadow ${
                              badgeColors[idx % 4]
                            }`}
                          >
                            {shapeIcons[idx % 4]}
                          </div>

                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              handleOptionChange(idx, e.target.value)
                            }
                            placeholder={`Opción ${opt.id}`}
                            className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none placeholder-[#ECEBE4]/30"
                          />

                          <button
                            type="button"
                            onClick={() => handleSetCorrectOption(opt.id)}
                            title="Marcar como respuesta correcta"
                            className={`p-2 rounded-xl transition ${
                              isCorrect
                                ? "text-[#4C8C2B] bg-[#4C8C2B]/20 font-bold"
                                : "text-[#ECEBE4]/40 hover:text-white"
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
                      handleUpdateCurrentQuestion({
                        correct_answer_value: "true",
                        options_json: JSON.stringify([
                          { id: "true", text: "Verdadero", isCorrect: true },
                          { id: "false", text: "Falso", isCorrect: false },
                        ]),
                      })
                    }
                    className={`p-6 rounded-2xl border-2 font-black text-lg transition flex items-center justify-center space-x-3 ${
                      currentQuestion.correct_answer_value === "true"
                        ? "bg-[#4C8C2B] text-white border-white shadow-xl"
                        : "bg-[#193750] border-[#425563] text-[#ECEBE4] hover:border-[#4C8C2B]"
                    }`}
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    <span>Verdadero</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateCurrentQuestion({
                        correct_answer_value: "false",
                        options_json: JSON.stringify([
                          { id: "true", text: "Verdadero", isCorrect: false },
                          { id: "false", text: "Falso", isCorrect: true },
                        ]),
                      })
                    }
                    className={`p-6 rounded-2xl border-2 font-black text-lg transition flex items-center justify-center space-x-3 ${
                      currentQuestion.correct_answer_value === "false"
                        ? "bg-[#B7312C] text-white border-white shadow-xl"
                        : "bg-[#193750] border-[#425563] text-[#ECEBE4] hover:border-[#B7312C]"
                    }`}
                  >
                    <span>Falso</span>
                  </button>
                </div>
              )}

              {currentQuestion.question_type === "word_cloud" && (
                <div className="bg-[#193750] border border-[#425563] rounded-3xl p-6 text-center space-y-2">
                  <Sparkles className="w-8 h-8 text-[#FFC72C] mx-auto animate-pulse-subtle" />
                  <h3 className="text-base font-bold text-white">
                    Nube de Palabras en Tiempo Real
                  </h3>
                  <p className="text-xs text-[#ECEBE4]/70 max-w-md mx-auto">
                    Los participantes enviarán palabras cortas o conceptos desde
                    sus teléfonos móviles. Las frecuencias se ponderarán y
                    animarán automáticamente en el proyector.
                  </p>
                </div>
              )}

              {currentQuestion.question_type === "likert_scale" && (
                <div className="bg-[#193750] border border-[#425563] rounded-3xl p-6 text-center space-y-4">
                  <Sliders className="w-8 h-8 text-[#48A9C5] mx-auto" />
                  <h3 className="text-base font-bold text-white">
                    Escala Likert de Valoración (1 a 5)
                  </h3>
                  <div className="flex justify-between max-w-sm mx-auto text-xs font-bold text-[#ECEBE4]/70 pt-2">
                    <span>1: Muy en Desacuerdo</span>
                    <span>5: Totalmente de Acuerdo</span>
                  </div>
                </div>
              )}

              {/* Explanation Field */}
              <div className="bg-[#193750] border border-[#425563] rounded-2xl p-4 space-y-2">
                <label className="text-xs font-bold text-[#ECEBE4]/80 flex items-center space-x-1.5">
                  <HelpCircle className="w-4 h-4 text-[#FFC72C]" />
                  <span>
                    Explicación Didáctica (Mostrada tras revelar los resultados)
                  </span>
                </label>
                <textarea
                  rows={2}
                  value={currentQuestion.explanation_text || ""}
                  onChange={(e) =>
                    handleUpdateCurrentQuestion({
                      explanation_text: e.target.value,
                    })
                  }
                  placeholder="Explica a la audiencia por qué esta respuesta es la correcta..."
                  className="w-full bg-[#001E32] border border-[#425563] rounded-xl p-3 text-xs text-white placeholder-[#ECEBE4]/30 focus:outline-none focus:border-[#FFC72C]"
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-[#ECEBE4]/50 my-auto">
              Selecciona o crea una diapositiva para comenzar a editar
            </div>
          )}
        </main>

        {/* Column 3: Right Properties Panel */}
        <aside className="w-80 bg-[#001E32] border-l border-[#425563] p-5 overflow-y-auto space-y-6 shrink-0">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#FFC72C] mb-4">
              Configuración de la Diapositiva
            </h3>

            {/* Question Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#ECEBE4]/80">
                Tipo de Pregunta
              </label>
              <select
                value={currentQuestion?.question_type || "multiple_choice"}
                onChange={(e) =>
                  handleUpdateCurrentQuestion({ question_type: e.target.value })
                }
                className="w-full bg-[#193750] border border-[#425563] text-white text-xs font-semibold rounded-xl p-3 focus:outline-none focus:border-[#FFC72C]"
              >
                {QUESTION_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time Limit */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#ECEBE4]/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#FFC72C]" />
                Límite de Tiempo
              </span>
              <span className="text-[#FFC72C] font-mono font-bold">
                {currentQuestion?.time_limit || 30}s
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() =>
                    handleUpdateCurrentQuestion({ time_limit: sec })
                  }
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    currentQuestion?.time_limit === sec
                      ? "bg-[#FFC72C] text-[#001E32]"
                      : "bg-[#193750] text-[#ECEBE4] hover:bg-[#425563]"
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Points Base */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#ECEBE4]/80 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#48A9C5]" />
                Puntuación Base
              </span>
              <span className="text-[#48A9C5] font-mono font-bold">
                {currentQuestion?.points_base || 1000} pts
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[500, 1000, 2000].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  onClick={() =>
                    handleUpdateCurrentQuestion({ points_base: pts })
                  }
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    currentQuestion?.points_base === pts
                      ? "bg-[#48A9C5] text-white"
                      : "bg-[#193750] text-[#ECEBE4] hover:bg-[#425563]"
                  }`}
                >
                  {pts}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Display Style */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#ECEBE4]/80 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#4C8C2B]" />
              Tipo de Gráfico
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleUpdateCurrentQuestion({ chart_type: "bar" })
                }
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                  currentQuestion?.chart_type === "bar"
                    ? "bg-[#4C8C2B] text-white"
                    : "bg-[#193750] text-[#ECEBE4] hover:bg-[#425563]"
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Barras</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleUpdateCurrentQuestion({ chart_type: "donut" })
                }
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition ${
                  currentQuestion?.chart_type === "donut"
                    ? "bg-[#4C8C2B] text-white"
                    : "bg-[#193750] text-[#ECEBE4] hover:bg-[#425563]"
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Donut</span>
              </button>
            </div>
          </div>

          {/* Activity Global Settings */}
          <div className="pt-4 border-t border-[#425563]/60 space-y-3">
            <h4 className="text-xs font-black uppercase text-[#ECEBE4]/60 tracking-wider">
              Reglas Globales
            </h4>

            <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#FFC72C]" />
                Bonus por Velocidad
              </span>
              <input
                type="checkbox"
                checked={activity.speed_bonus_enabled}
                onChange={(e) =>
                  setActivity((prev) =>
                    prev
                      ? { ...prev, speed_bonus_enabled: e.target.checked }
                      : null,
                  )
                }
                className="w-4 h-4 accent-[#FFC72C]"
              />
            </label>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal - Delete Question */}
      <Modal
        isOpen={confirmDeleteModal !== null}
        onClose={() => setConfirmDeleteModal(null)}
        title="Eliminar Diapositiva"
        description="¿Estás seguro de que deseas eliminar esta diapositiva? Esta acción no se puede deshacer."
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setConfirmDeleteModal(null)}
              className="px-4 py-2 bg-[#425563] text-white rounded-xl text-xs font-bold hover:bg-[#425563]/80"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() =>
                confirmDeleteModal !== null &&
                handleDeleteQuestion(confirmDeleteModal)
              }
              className="px-4 py-2 bg-[#B7312C] text-white rounded-xl text-xs font-bold hover:bg-[#A32823]"
            >
              Confirmar Eliminación
            </button>
          </div>
        }
      >
        <p className="text-xs text-[#ECEBE4]">
          La diapositiva #
          {confirmDeleteModal !== null ? confirmDeleteModal + 1 : ""} será
          removida del cuestionario.
        </p>
      </Modal>

      {/* Success Modal - Save */}
      <Modal
        isOpen={saveSuccessModal}
        onClose={() => setSaveSuccessModal(false)}
        title="¡Actividad Guardada con Éxito!"
        description="Todos los cambios y diapositivas han sido sincronizados correctamente en la base de datos."
        footer={
          <button
            type="button"
            onClick={() => setSaveSuccessModal(false)}
            className="px-5 py-2.5 bg-[#FFC72C] text-[#001E32] rounded-xl text-xs font-black shadow hover:bg-[#E6B327]"
          >
            Aceptar
          </button>
        }
      >
        <div className="flex items-center space-x-3 text-[#4C8C2B]">
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <span className="text-sm font-semibold text-white">
            Tu actividad "{activity.title}" está lista para ser presentada en
            vivo o editada en cualquier momento.
          </span>
        </div>
      </Modal>
    </div>
  );
}
