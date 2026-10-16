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
  ArrowLeft,
  Star,
  Upload,
  Download,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import EpirocOptionIcon from "../components/EpirocOptionIcon";

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
  { id: "rating", label: "Calificación con Estrellas (1-5 ⭐)", icon: Star },
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

  // Modal de Importación Masiva desde Excel dentro del Editor
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [parsedExcelQuestions, setParsedExcelQuestions] = useState<
    Array<{
      questionText: string;
      questionType: string;
      options: Array<{ id: string; text: string; is_correct: boolean }>;
      timeLimit: number;
      pointsBase: number;
      explanation: string;
    }>
  >([]);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);

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
      // Guardar todos los cambios primero para que la sesión tenga las diapositivas actualizadas
      await handleSaveAll();
      const res = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId: activity.id, mode: "live" }),
      });
      const data = await res.json();
      if (data.pin) {
        // Redirige al centro de mando / monitor del presentador en PresentationsPage
        navigate(`/presentations?sessionPin=${data.pin}`);
      }
    } catch (err) {
      console.error("Error al lanzar sesión:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // GENERADOR Y DESCARGA DE EXCEL MODELO (.xlsx) CON GUÍA COMPLETA DE 7 TIPOS
  // ---------------------------------------------------------------------------
  const handleDownloadExcelTemplate = () => {
    const headers = [
      "Pregunta",
      "Tipo",
      "Opcion_1",
      "Opcion_2",
      "Opcion_3",
      "Opcion_4",
      "Respuesta_Correcta",
      "Tiempo_Segundos",
      "Puntos",
      "Explicacion",
    ];

    const sampleRows = [
      [
        "¿Cuál es el procedimiento obligatorio para el bloqueo de energía (LOTO)?",
        "multiple_choice",
        "Verificar ausencia de tensión y candado personal",
        "Avisar por radio a la cuadrilla",
        "Bajar el interruptor sin candado",
        "Esperar la entrega de turno",
        "1",
        30,
        1000,
        "La verificación de energía cero y colocación de candado personal es obligatoria.",
      ],
      [
        "¿El uso de respirador y gafas de seguridad es obligatorio en zona de trituración?",
        "true_false",
        "Verdadero",
        "Falso",
        "",
        "",
        "1",
        20,
        1000,
        "Todo personal que ingrese a zonas con emisión de polvo debe utilizar protección respiratoria.",
      ],
      [
        "¿Cómo calificarías la claridad y utilidad de la capacitación recibida hoy?",
        "rating",
        "",
        "",
        "",
        "",
        "",
        30,
        0,
        "Calificación de 1 a 5 estrellas del público. El proyector calcula automáticamente el promedio general y distribución.",
      ],
      [
        "¿Qué aspecto operativo consideras prioritario optimizar en el próximo turno?",
        "word_cloud",
        "",
        "",
        "",
        "",
        "",
        60,
        0,
        "Pregunta abierta para recopilar lluvia de ideas en nube de palabras sin puntaje.",
      ],
      [
        "¿Qué tan claras y seguras consideras las herramientas y protocolos de tu jornada diaria?",
        "likert",
        "",
        "",
        "",
        "",
        "",
        30,
        0,
        "Escala psicométrica de 1 a 5 (Totalmente en desacuerdo a Totalmente de acuerdo).",
      ],
      [
        "¿Qué sugerencia o mejora concreta propones para optimizar la seguridad en faena?",
        "open_ended",
        "",
        "",
        "",
        "",
        "",
        60,
        0,
        "Pregunta de respuesta abierta proyectada en muro de ideas dinámico sin podio.",
      ],
      [
        "Ordena las siguientes acciones de acuerdo a la jerarquía de control de riesgos:",
        "ranking",
        "Eliminación del peligro",
        "Sustitución técnica",
        "Controles de ingeniería",
        "Equipo de protección personal (EPP)",
        "",
        45,
        1000,
        "Los participantes ordenan las 4 opciones de mayor a menor jerarquía preventiva.",
      ],
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws["!cols"] = [
      { wch: 48 }, // Pregunta
      { wch: 20 }, // Tipo
      { wch: 32 }, // Opcion_1
      { wch: 25 }, // Opcion_2
      { wch: 25 }, // Opcion_3
      { wch: 25 }, // Opcion_4
      { wch: 20 }, // Respuesta_Correcta
      { wch: 18 }, // Tiempo_Segundos
      { wch: 12 }, // Puntos
      { wch: 45 }, // Explicacion
    ];

    // Hoja 2: Guía de los 7 Tipos de Pregunta
    const guideHeaders = [
      "Tipo de Pregunta",
      "Código para Columna 'Tipo'",
      "¿Requiere Opciones?",
      "Respuesta Correcta",
      "Puntos Sugeridos",
      "Cómo Usarla / Cuándo Utilizarla",
    ];

    const guideRows = [
      [
        "Opción Múltiple (Quiz)",
        "multiple_choice",
        "Sí (Llena de 2 a 4 opciones en Opcion_1 a Opcion_4)",
        "Escribe el número de la opción correcta (ej: 1, 2, 3 o 4)",
        1000,
        "Evaluación de conocimientos con alternativas y concurso de rapidez. Los participantes ven formas geométricas en su móvil y ganan puntos para el podio.",
      ],
      [
        "Verdadero o Falso",
        "true_false",
        "No obligatorio (Se asignan automáticamente Verdadero y Falso)",
        "1 para Verdadero, o 2 para Falso",
        1000,
        "Pregunta binaria rápida de confirmación. En el teléfono del usuario aparecen los botones VERDADERO (verde) y FALSO (rojo).",
      ],
      [
        "Calificación con Estrellas",
        "rating",
        "No (Deja las columnas de opciones vacías)",
        "Dejar vacío (no aplica respuesta correcta)",
        0,
        "Permite a los asistentes calificar de 1 a 5 estrellas con un solo toque en su pantalla. El proyector calcula el promedio en tiempo real (ej: 4.8 / 5.0) y muestra barras con la cantidad de votos por cada estrella.",
      ],
      [
        "Nube de Palabras",
        "word_cloud",
        "No (Deja las columnas de opciones vacías)",
        "Dejar vacío (no aplica respuesta correcta)",
        0,
        "Sondeo interactivo para lluvia de ideas. Los participantes escriben 1 a 3 palabras cortas desde su móvil y las respuestas más repetidas crecen dinámicamente en el proyector.",
      ],
      [
        "Escala Likert (1-5)",
        "likert",
        "No obligatorio (Genera automáticamente los 5 niveles estándar si se deja vacío)",
        "Dejar vacío (no aplica)",
        0,
        "Mide niveles de acuerdo/desacuerdo frente a una afirmación (1: Totalmente en desacuerdo a 5: Totalmente de acuerdo). Muestra gráfico de distribución de opiniones.",
      ],
      [
        "Pregunta Abierta / Muro de Ideas",
        "open_ended",
        "No (Deja las columnas de opciones vacías)",
        "Dejar vacío (no aplica)",
        0,
        "Recopilación de comentarios, ideas o sugerencias del público. Cada respuesta enviada se proyecta en una tarjeta estilo muro de ideas en vivo.",
      ],
      [
        "Ordenamiento / Ranking",
        "ranking",
        "Sí (Llena de 2 a 4 opciones para priorizar)",
        "Dejar vacío o indicar orden esperado",
        1000,
        "Los participantes ordenan o priorizan las opciones arrastrándolas o seleccionándolas en su dispositivo móvil. El proyector muestra la media ponderada del ranking global.",
      ],
    ];

    const wsGuideData = [guideHeaders, ...guideRows];
    const wsGuide = XLSX.utils.aoa_to_sheet(wsGuideData);

    wsGuide["!cols"] = [
      { wch: 30 }, // Tipo de Pregunta
      { wch: 22 }, // Código
      { wch: 34 }, // Requiere Opciones
      { wch: 30 }, // Respuesta Correcta
      { wch: 16 }, // Puntos
      { wch: 70 }, // Cómo Usarla
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Preguntas");
    XLSX.utils.book_append_sheet(wb, wsGuide, "Guia_Tipos_Pregunta");
    XLSX.writeFile(wb, "Plantilla_Preguntas_Epivox.xlsx");
  };

  // ---------------------------------------------------------------------------
  // LECTURA Y PARSEO DE ARCHIVO EXCEL (SOPORTA SELECCIÓN Y DRAG & DROP)
  // ---------------------------------------------------------------------------
  const processExcelFile = (file: File) => {
    setExcelError(null);
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: "binary" });
        const targetSheetName =
          wb.SheetNames.find((s) => s.toLowerCase().includes("plantilla")) ||
          wb.SheetNames[0];
        const ws = wb.Sheets[targetSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          setExcelError("El archivo Excel no contiene filas de preguntas para importar.");
          return;
        }

        const parsed: Array<{
          questionText: string;
          questionType: string;
          options: Array<{ id: string; text: string; is_correct: boolean }>;
          timeLimit: number;
          pointsBase: number;
          explanation: string;
        }> = [];

        // Fila 0 es el encabezado
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0] || String(row[0]).trim() === "") continue;

          const questionText = String(row[0]).trim();
          const rawType = String(row[1] || "multiple_choice")
            .trim()
            .toLowerCase();

          let questionType = "multiple_choice";
          if (rawType.includes("cloud") || rawType.includes("nube")) {
            questionType = "word_cloud";
          } else if (rawType.includes("open") || rawType.includes("abierta")) {
            questionType = "open_ended";
          } else if (rawType.includes("true") || rawType.includes("verdadero")) {
            questionType = "true_false";
          } else if (
            rawType.includes("rating") ||
            rawType.includes("estrella") ||
            rawType.includes("calificacion")
          ) {
            questionType = "rating";
          } else if (rawType.includes("likert") || rawType.includes("escala")) {
            questionType = "likert";
          } else if (rawType.includes("rank") || rawType.includes("orden")) {
            questionType = "ranking";
          }

          const op1 = row[2] ? String(row[2]).trim() : "";
          const op2 = row[3] ? String(row[3]).trim() : "";
          const op3 = row[4] ? String(row[4]).trim() : "";
          const op4 = row[5] ? String(row[5]).trim() : "";

          const correctRaw = String(row[6] || "1").trim();
          const correctIdx = Math.max(0, parseInt(correctRaw, 10) - 1 || 0);

          const timeLimit = parseInt(String(row[7]), 10) || 30;
          const pointsBase =
            parseInt(String(row[8]), 10) !== undefined &&
            !isNaN(parseInt(String(row[8]), 10))
              ? parseInt(String(row[8]), 10)
              : questionType === "rating" ||
                questionType === "word_cloud" ||
                questionType === "open_ended" ||
                questionType === "likert"
                ? 0
                : 1000;
          const explanation = row[9] ? String(row[9]).trim() : "";

          const optionsList: Array<{
            id: string;
            text: string;
            is_correct: boolean;
          }> = [];

          if (questionType === "true_false") {
            optionsList.push({
              id: "true",
              text: "Verdadero",
              is_correct: correctIdx === 0,
            });
            optionsList.push({
              id: "false",
              text: "Falso",
              is_correct: correctIdx === 1,
            });
          } else if (questionType === "rating") {
            for (let s = 1; s <= 5; s++) {
              optionsList.push({
                id: String(s),
                text: `${s} ${s === 1 ? "Estrella" : "Estrellas"}`,
                is_correct: false,
              });
            }
          } else if (questionType === "likert") {
            const likertLabels = [
              "Totalmente en desacuerdo",
              "En desacuerdo",
              "Neutral / Indiferente",
              "De acuerdo",
              "Totalmente de acuerdo",
            ];
            for (let l = 1; l <= 5; l++) {
              optionsList.push({
                id: String(l),
                text: likertLabels[l - 1],
                is_correct: false,
              });
            }
          } else if (questionType === "ranking") {
            const rawOptions = [op1, op2, op3, op4].filter((o) => o.length > 0);
            rawOptions.forEach((optText, oIdx) => {
              optionsList.push({
                id: String(oIdx + 1),
                text: optText,
                is_correct: false,
              });
            });
          } else if (questionType === "multiple_choice") {
            const rawOptions = [op1, op2, op3, op4].filter((o) => o.length > 0);
            const letterIds = ["A", "B", "C", "D"];
            rawOptions.forEach((optText, oIdx) => {
              optionsList.push({
                id: letterIds[oIdx] || `opt-${oIdx + 1}`,
                text: optText,
                is_correct: oIdx === correctIdx,
              });
            });
          }

          parsed.push({
            questionText,
            questionType,
            options: optionsList,
            timeLimit,
            pointsBase,
            explanation,
          });
        }

        setParsedExcelQuestions(parsed);
      } catch (err) {
        console.error("Error al procesar archivo Excel:", err);
        setExcelError("Error al procesar el archivo Excel. Asegúrate de usar un formato válido .xlsx o .csv.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processExcelFile(file);
    }
  };

  // ---------------------------------------------------------------------------
  // CONFIRMAR IMPORTACIÓN DE PREGUNTAS AL EDITOR
  // ---------------------------------------------------------------------------
  const handleConfirmImportExcel = () => {
    if (parsedExcelQuestions.length === 0) return;

    const baseSort = importMode === "replace" ? 0 : questions.length;
    const newItems: QuestionItem[] = parsedExcelQuestions.map((q, idx) => {
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
        correct_answer_value: correctOpt ? correctOpt.id : (q.options[0]?.id ?? null),
        explanation_text: q.explanation,
      };
    });

    const updatedQuestions =
      importMode === "replace" ? newItems : [...questions, ...newItems];

    setQuestions(updatedQuestions);

    const newSelectedIndex =
      importMode === "replace" ? 0 : questions.length;
    setSelectedQuestionIndex(newSelectedIndex);

    if (newItems.length > 0) {
      try {
        setCurrentOptions(JSON.parse(newItems[0].options_json || "[]"));
      } catch {
        setCurrentOptions([]);
      }
    }

    setIsExcelModalOpen(false);
    setParsedExcelQuestions([]);
    setExcelFileName(null);
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
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col selection:bg-[#FFC72C] selection:text-[#001E32]">
      {/* Top Header Bar */}
      <div className="bg-[#193750] border-b border-[#425563] px-6 py-4">
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
                className="flex items-center space-x-1.5 bg-[#001E32] hover:bg-[#254F72] text-[#ECEBE4] border border-[#425563] font-bold py-2.5 px-3.5 rounded-xl transition active:scale-95 text-sm shadow"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Presentaciones</span>
              </button>

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
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setExcelError(null);
                  setParsedExcelQuestions([]);
                  setExcelFileName(null);
                  setIsExcelModalOpen(true);
                }}
                className="flex items-center space-x-1 bg-[#193750] hover:bg-[#254F72] text-[#48A9C5] border border-[#48A9C5]/40 text-xs font-bold py-1.5 px-2.5 rounded-lg transition active:scale-95 shadow"
                title="Subir preguntas masivas desde Excel (.xlsx)"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir</span>
              </button>

              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center space-x-1 bg-[#425563] hover:bg-[#FFC72C] hover:text-[#001E32] text-white text-xs font-bold py-1.5 px-2.5 rounded-lg transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>
            </div>
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
                      return (
                        <div
                          key={opt.id || idx}
                          className={`relative flex items-center bg-[#193750] border-2 rounded-2xl p-3 transition shadow-md ${
                            isCorrect
                              ? "border-[#4C8C2B] ring-2 ring-[#4C8C2B]/50"
                              : "border-[#425563]"
                          }`}
                        >
                          <div className="mr-3 shrink-0">
                            <EpirocOptionIcon index={idx} size="md" />
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

              {currentQuestion.question_type === "rating" && (
                <div className="bg-[#193750] border border-[#425563] rounded-3xl p-8 text-center space-y-4 shadow-xl">
                  <div className="flex justify-center items-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="w-10 h-10 text-[#FFC72C] fill-[#FFC72C] transition-transform hover:scale-125"
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-white">
                      Calificación con Estrellas (Escala 1 a 5 ⭐)
                    </h3>
                    <p className="text-xs text-[#ECEBE4]/70 max-w-md mx-auto leading-relaxed">
                      Los asistentes evaluarán la pregunta asignando de 1 a 5 estrellas desde sus teléfonos móviles.
                      En la pantalla grande se calculará automáticamente el promedio en vivo y el desglose de votos.
                    </p>
                  </div>
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
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setSaveSuccessModal(false)}
              className="px-4 py-2.5 bg-[#001E32] text-[#ECEBE4] hover:text-white border border-[#425563] rounded-xl text-xs font-bold transition"
            >
              Seguir Editando
            </button>
            <button
              type="button"
              onClick={() => navigate("/presentations")}
              className="px-5 py-2.5 bg-[#FFC72C] text-[#001E32] rounded-xl text-xs font-black shadow hover:bg-[#E6B327] transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Presentaciones</span>
            </button>
          </div>
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
      {/* ===================================================================== */}
      {/* MODAL: SUBIR PREGUNTAS MASIVAS DESDE EXCEL AL EDITOR                   */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isExcelModalOpen}
        onClose={() => {
          setIsExcelModalOpen(false);
          setParsedExcelQuestions([]);
          setExcelFileName(null);
          setExcelError(null);
        }}
        title="Subir Preguntas Masivas desde Excel"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Paso 1: Descargar Plantilla Modelo */}
          <div className="bg-[#001E32] border border-[#425563] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
                Paso 1: Plantilla Modelo Oficial
              </span>
              <p className="text-xs text-[#ECEBE4]/70">
                Descarga el formato Excel (.xlsx) con ejemplos y la hoja de guía de tipos de pregunta.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="bg-[#48A9C5] hover:bg-[#3996B1] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-2 shrink-0 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Plantilla (.xlsx)</span>
            </button>
          </div>

          {/* Paso 2: Selector de Archivo Excel */}
          <div className="space-y-2">
            <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
              Paso 2: Subir Archivo Rellenado (.xlsx o .csv)
            </span>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingExcel(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingExcel(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingExcel(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingExcel(false);
                const file = e.dataTransfer.files?.[0];
                if (file) {
                  processExcelFile(file);
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition ${
                isDraggingExcel
                  ? "border-[#FFC72C] bg-[#FFC72C]/10 scale-[1.01]"
                  : "border-[#425563] hover:border-[#FFC72C] bg-[#001E32]/40"
              }`}
            >
              <label
                htmlFor="editor-excel-upload-input"
                className="cursor-pointer flex flex-col items-center w-full"
              >
                <Upload
                  className={`w-8 h-8 mb-2 transition ${
                    isDraggingExcel ? "text-[#FFC72C] animate-bounce" : "text-[#48A9C5]"
                  }`}
                />
                <span className="text-xs font-bold text-white text-center">
                  {excelFileName
                    ? excelFileName
                    : isDraggingExcel
                      ? "¡Suelta tu archivo Excel aquí!"
                      : "Haz clic o arrastra y suelta aquí tu archivo Excel"}
                </span>
                <span className="text-[10px] text-[#ECEBE4]/60 mt-1">
                  Soporta archivos .xlsx, .xls y .csv
                </span>
              </label>
              <input
                id="editor-excel-upload-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileUpload}
                className="hidden"
              />
            </div>

            {excelError && (
              <div className="p-3 bg-[#B7312C]/20 border border-[#B7312C] rounded-xl flex items-center gap-2 text-xs text-white">
                <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0" />
                <span>{excelError}</span>
              </div>
            )}
          </div>

          {/* Opciones de Inserción: Agregar o Reemplazar */}
          {parsedExcelQuestions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
                Paso 3: Modo de Inserción
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setImportMode("append")}
                  className={`p-3.5 rounded-xl border-2 text-left transition flex items-center gap-3 ${
                    importMode === "append"
                      ? "bg-[#193750] border-[#FFC72C] text-white"
                      : "bg-[#001E32] border-[#425563] text-[#ECEBE4]/70"
                  }`}
                >
                  <Plus
                    className={`w-5 h-5 ${
                      importMode === "append"
                        ? "text-[#FFC72C]"
                        : "text-[#ECEBE4]/40"
                    }`}
                  />
                  <div>
                    <span className="font-bold text-xs block">
                      Añadir al final
                    </span>
                    <span className="text-[11px] text-[#ECEBE4]/60">
                      Conserva las {questions.length} diapositivas actuales
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setImportMode("replace")}
                  className={`p-3.5 rounded-xl border-2 text-left transition flex items-center gap-3 ${
                    importMode === "replace"
                      ? "bg-[#193750] border-[#B7312C] text-white"
                      : "bg-[#001E32] border-[#425563] text-[#ECEBE4]/70"
                  }`}
                >
                  <RotateCcw
                    className={`w-5 h-5 ${
                      importMode === "replace"
                        ? "text-[#B7312C]"
                        : "text-[#ECEBE4]/40"
                    }`}
                  />
                  <div>
                    <span className="font-bold text-xs block">
                      Reemplazar existentes
                    </span>
                    <span className="text-[11px] text-[#ECEBE4]/60">
                      Sustituye todas las diapositivas actuales
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Previsualización de Preguntas Detectadas */}
          {parsedExcelQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4C8C2B] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4C8C2B]" />
                  {parsedExcelQuestions.length} Preguntas Detectadas Listas para Importar
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-[#425563] rounded-xl p-3 bg-[#001E32]">
                {parsedExcelQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#193750] rounded-lg border border-[#425563] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#FFC72C]">
                        #{idx + 1} {q.questionText}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#001E32] text-[#ECEBE4]/80">
                        {q.questionType} &bull; {q.timeLimit}s &bull; {q.pointsBase} pts
                      </span>
                    </div>
                    {q.options.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-[11px] text-[#ECEBE4]/80">
                        {q.options.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className={`px-2 py-0.5 rounded ${
                              opt.is_correct
                                ? "bg-[#4C8C2B]/30 text-[#4C8C2B] border border-[#4C8C2B]/50 font-bold"
                                : "bg-[#001E32]/60"
                            }`}
                          >
                            {opt.is_correct ? "✓ " : ""}
                            {opt.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones del Modal */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#425563]">
            <button
              type="button"
              onClick={() => {
                setIsExcelModalOpen(false);
                setParsedExcelQuestions([]);
                setExcelFileName(null);
                setExcelError(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#ECEBE4]/70 hover:bg-[#425563]/30 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={parsedExcelQuestions.length === 0}
              onClick={handleConfirmImportExcel}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-6 rounded-xl transition shadow disabled:opacity-40 flex items-center gap-2 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>
                Importar {parsedExcelQuestions.length} Diapositiva(s) al Editor
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
