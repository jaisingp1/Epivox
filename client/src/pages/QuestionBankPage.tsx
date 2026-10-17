import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Folder,
  FolderPlus,
  Plus,
  FileSpreadsheet,
  Download,
  Upload,
  Search,
  Layers,
  Clock,
  Award,
  Edit3,
  Trash2,
  CheckCircle2,
  Star,
  Sparkles,
  Sliders,
  HelpCircle,
  BarChart3,
  AlertCircle,
  ChevronRight,
  Home,
  Check,
  X,
  User,
} from "lucide-react";
import * as XLSX from "xlsx";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";

export interface QuestionFolder {
  id: number;
  name: string;
  parent_id: number | null;
  created_by_user_id: number;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  questions_count?: number;
  subfolders_count?: number;
  creator_name?: string;
}

export interface BankQuestion {
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
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  folder_name?: string;
}

const EPIROC_COLORS = [
  { label: "Amarillo Epiroc", value: "#FFC72C" },
  { label: "Azul Oscuro", value: "#001E32" },
  { label: "Azul Claro", value: "#48A9C5" },
  { label: "Verde Eléctrico", value: "#86C8BC" },
  { label: "Verde Seguridad", value: "#4C8C2B" },
  { label: "Gris Minero", value: "#425563" },
  { label: "Rojo Alerta", value: "#B7312C" },
];

export default function QuestionBankPage() {
  // Datos principales
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modales
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<QuestionFolder | null>(null);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderColor, setFolderColor] = useState("#FFC72C");
  const [folderParentId, setFolderParentId] = useState<number | null>(null);

  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelTargetFolderId, setExcelTargetFolderId] = useState<number | null>(null);
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
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Modal para Crear/Editar Pregunta individual
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("multiple_choice");
  const [qTimeLimit, setQTimeLimit] = useState(30);
  const [qPoints, setQPoints] = useState(1000);
  const [qExplanation, setQExplanation] = useState("");
  const [qOptions, setQOptions] = useState<Array<{ id: string; text: string; is_correct: boolean }>>([
    { id: "opt-1", text: "", is_correct: true },
    { id: "opt-2", text: "", is_correct: false },
    { id: "opt-3", text: "", is_correct: false },
    { id: "opt-4", text: "", is_correct: false },
  ]);

  // Modal confirmación eliminar
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "folder" | "question";
    id: number;
    title: string;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // CARGA DE DATOS
  // ---------------------------------------------------------------------------
  const loadFolders = useCallback(async () => {
    try {
      const res = await fetch("/api/epivox/bank/folders");
      if (res.ok) {
        const data = await res.json();
        setFolders(data);
      }
    } catch (err) {
      console.error("Error al cargar carpetas:", err);
    }
  }, []);

  const loadQuestions = useCallback(async (folderId: number | null) => {
    try {
      setIsLoading(true);
      const url = folderId
        ? `/api/epivox/bank/questions?folder_id=${folderId}&recursive=true`
        : "/api/epivox/bank/questions";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error("Error al cargar preguntas:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([loadFolders(), loadQuestions(currentFolderId)]);
  }, [loadFolders, loadQuestions, currentFolderId]);

  // Carpeta activa actual
  const currentFolder = useMemo(() => {
    if (!currentFolderId) return null;
    return folders.find((f) => f.id === currentFolderId) || null;
  }, [folders, currentFolderId]);

  // Ruta de migas de pan (Breadcrumbs)
  const folderTrail = useMemo(() => {
    const trail: QuestionFolder[] = [];
    let curr = currentFolder;
    while (curr) {
      trail.unshift(curr);
      curr = curr.parent_id ? folders.find((f) => f.id === curr?.parent_id) || null : null;
    }
    return trail;
  }, [currentFolder, folders]);

  // Subcarpetas de la carpeta activa (o carpetas raíz si currentFolderId es null)
  const displayedSubfolders = useMemo(() => {
    return folders.filter((f) => f.parent_id === currentFolderId);
  }, [folders, currentFolderId]);

  // Preguntas filtradas por texto y tipo
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchType = typeFilter === "all" || q.question_type === typeFilter;
      const search = searchQuery.toLowerCase().trim();
      const matchSearch =
        !search ||
        q.question_text.toLowerCase().includes(search) ||
        (q.explanation_text && q.explanation_text.toLowerCase().includes(search)) ||
        (q.folder_name && q.folder_name.toLowerCase().includes(search));
      return matchType && matchSearch;
    });
  }, [questions, typeFilter, searchQuery]);

  // ---------------------------------------------------------------------------
  // GESTIÓN DE CARPETAS
  // ---------------------------------------------------------------------------
  const handleOpenFolderModal = (folder?: QuestionFolder, defaultParentId?: number | null) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderName(folder.name);
      setFolderDescription(folder.description || "");
      setFolderColor(folder.color || "#FFC72C");
      setFolderParentId(folder.parent_id);
    } else {
      setEditingFolder(null);
      setFolderName("");
      setFolderDescription("");
      setFolderColor("#FFC72C");
      setFolderParentId(defaultParentId !== undefined ? defaultParentId : currentFolderId);
    }
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      if (editingFolder) {
        await fetch(`/api/epivox/bank/folders/${editingFolder.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: folderName.trim(),
            description: folderDescription.trim() || null,
            color: folderColor,
            parent_id: folderParentId,
          }),
        });
      } else {
        await fetch("/api/epivox/bank/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: folderName.trim(),
            description: folderDescription.trim() || null,
            color: folderColor,
            parent_id: folderParentId,
          }),
        });
      }

      setIsFolderModalOpen(false);
      await loadFolders();
    } catch (err) {
      console.error("Error al guardar carpeta:", err);
    }
  };

  const handleDeleteFolder = async (id: number) => {
    try {
      await fetch(`/api/epivox/bank/folders/${id}`, { method: "DELETE" });
      if (currentFolderId === id) {
        setCurrentFolderId(null);
      }
      await loadFolders();
      await loadQuestions(currentFolderId === id ? null : currentFolderId);
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error al eliminar carpeta:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // GESTIÓN DE PREGUNTAS
  // ---------------------------------------------------------------------------
  const handleOpenQuestionModal = (question?: BankQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setQText(question.question_text);
      setQType(question.question_type);
      setQTimeLimit(question.time_limit);
      setQPoints(question.points_base);
      setQExplanation(question.explanation_text || "");
      try {
        const parsed = JSON.parse(question.options_json || "[]");
        setQOptions(Array.isArray(parsed) && parsed.length > 0 ? parsed : [
          { id: "opt-1", text: "", is_correct: true },
          { id: "opt-2", text: "", is_correct: false },
        ]);
      } catch {
        setQOptions([]);
      }
    } else {
      setEditingQuestion(null);
      setQText("");
      setQType("multiple_choice");
      setQTimeLimit(30);
      setQPoints(1000);
      setQExplanation("");
      setQOptions([
        { id: "opt-1", text: "", is_correct: true },
        { id: "opt-2", text: "", is_correct: false },
        { id: "opt-3", text: "", is_correct: false },
        { id: "opt-4", text: "", is_correct: false },
      ]);
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) return;

    const targetFolder = currentFolderId || folders[0]?.id;
    if (!targetFolder) {
      alert("Debes crear al menos una carpeta antes de añadir preguntas.");
      return;
    }

    try {
      const payload = {
        folder_id: targetFolder,
        question_text: qText.trim(),
        question_type: qType,
        time_limit: qTimeLimit,
        points_base: qPoints,
        chart_type: qType === "word_cloud" ? "word_cloud" : "bar",
        options_json: JSON.stringify(qOptions),
        correct_answer_value: qType === "multiple_choice" ? "1" : null,
        explanation_text: qExplanation.trim() || null,
      };

      if (editingQuestion) {
        await fetch(`/api/epivox/bank/questions/${editingQuestion.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/epivox/bank/questions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setIsQuestionModalOpen(false);
      await loadQuestions(currentFolderId);
      await loadFolders();
    } catch (err) {
      console.error("Error guardando pregunta:", err);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await fetch(`/api/epivox/bank/questions/${id}`, { method: "DELETE" });
      await loadQuestions(currentFolderId);
      await loadFolders();
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error al eliminar pregunta:", err);
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
        "Calificación de 1 a 5 estrellas del público con promedios en vivo.",
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
        "Pregunta de respuesta abierta proyectada en muro de ideas dinámico.",
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

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
    ws["!cols"] = [
      { wch: 48 },
      { wch: 20 },
      { wch: 32 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 18 },
      { wch: 12 },
      { wch: 45 },
    ];

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
        "Evaluación de conocimientos con alternativas y concurso de rapidez con podio.",
      ],
      [
        "Verdadero o Falso",
        "true_false",
        "No obligatorio (Se asignan automáticamente Verdadero y Falso)",
        "1 para Verdadero, o 2 para Falso",
        1000,
        "Pregunta binaria rápida de confirmación.",
      ],
      [
        "Calificación con Estrellas",
        "rating",
        "No (Deja las columnas de opciones vacías)",
        "Dejar vacío (no aplica)",
        0,
        "Permite a los asistentes calificar de 1 a 5 estrellas con un solo toque.",
      ],
      [
        "Nube de Palabras",
        "word_cloud",
        "No (Deja las columnas de opciones vacías)",
        "Dejar vacío (no aplica)",
        0,
        "Sondeo interactivo para lluvia de ideas en tiempo real.",
      ],
      [
        "Escala Likert (1-5)",
        "likert",
        "No obligatorio",
        "Dejar vacío (no aplica)",
        0,
        "Mide niveles de acuerdo/desacuerdo frente a una afirmación (1 a 5).",
      ],
      [
        "Pregunta Abierta / Muro de Ideas",
        "open_ended",
        "No (Deja las columnas de opciones vacías)",
        "Dejar vacío (no aplica)",
        0,
        "Recopilación de comentarios en muro dinámico.",
      ],
      [
        "Ordenamiento / Ranking",
        "ranking",
        "Sí (Llena de 2 a 4 opciones para priorizar)",
        "Dejar vacío",
        1000,
        "Los participantes priorizan opciones en su móvil.",
      ],
    ];

    const wsGuide = XLSX.utils.aoa_to_sheet([guideHeaders, ...guideRows]);
    wsGuide["!cols"] = [
      { wch: 30 },
      { wch: 22 },
      { wch: 34 },
      { wch: 30 },
      { wch: 16 },
      { wch: 70 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Preguntas");
    XLSX.utils.book_append_sheet(wb, wsGuide, "Guia_Tipos_Pregunta");
    XLSX.writeFile(wb, "Plantilla_Preguntas_Epivox.xlsx");
  };

  // ---------------------------------------------------------------------------
  // LECTURA Y PARSEO DE EXCEL
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
          setExcelError("El archivo Excel no contiene filas de datos para importar.");
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

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || !row[0] || String(row[0]).trim() === "") continue;

          const questionText = String(row[0]).trim();
          const rawType = String(row[1] || "multiple_choice").trim().toLowerCase();

          let questionType = "multiple_choice";
          if (rawType.includes("cloud") || rawType.includes("nube")) {
            questionType = "word_cloud";
          } else if (rawType.includes("open") || rawType.includes("abierta")) {
            questionType = "open_ended";
          } else if (rawType.includes("true") || rawType.includes("verdadero")) {
            questionType = "true_false";
          } else if (rawType.includes("rating") || rawType.includes("estrella")) {
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
            parseInt(String(row[8]), 10) !== undefined && !isNaN(parseInt(String(row[8]), 10))
              ? parseInt(String(row[8]), 10)
              : questionType === "multiple_choice" || questionType === "true_false" || questionType === "ranking"
                ? 1000
                : 0;
          const explanation = row[9] ? String(row[9]).trim() : "";

          const optionsList: Array<{ id: string; text: string; is_correct: boolean }> = [];
          if (questionType === "true_false") {
            optionsList.push({ id: "opt-1", text: "Verdadero", is_correct: correctIdx === 0 });
            optionsList.push({ id: "opt-2", text: "Falso", is_correct: correctIdx === 1 });
          } else if (questionType === "rating") {
            for (let s = 1; s <= 5; s++) {
              optionsList.push({ id: String(s), text: `${s} Estrellas`, is_correct: false });
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
              optionsList.push({ id: String(l), text: likertLabels[l - 1], is_correct: false });
            }
          } else if (questionType === "ranking" || questionType === "multiple_choice") {
            const rawOptions = [op1, op2, op3, op4].filter((o) => o.length > 0);
            rawOptions.forEach((optText, oIdx) => {
              optionsList.push({
                id: `opt-${oIdx + 1}`,
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
        console.error("Error al procesar Excel:", err);
        setExcelError("Error al procesar el archivo Excel. Asegúrate de usar un formato válido .xlsx o .csv.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSaveImportedExcel = async () => {
    if (parsedExcelQuestions.length === 0) return;
    const targetFolder = excelTargetFolderId || currentFolderId || folders[0]?.id;
    if (!targetFolder) {
      setExcelError("Debes seleccionar una carpeta de destino.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/epivox/bank/questions/import-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder_id: targetFolder,
          questions: parsedExcelQuestions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setExcelError(data.error || "Error al importar preguntas.");
        return;
      }

      setImportSuccessMsg(`¡Se importaron ${parsedExcelQuestions.length} preguntas correctamente a la carpeta!`);
      setTimeout(() => {
        setIsExcelModalOpen(false);
        setParsedExcelQuestions([]);
        setExcelFileName(null);
        setImportSuccessMsg(null);
        loadQuestions(currentFolderId);
        loadFolders();
      }, 1500);
    } catch {
      setExcelError("Error de red al importar preguntas.");
    } finally {
      setIsImporting(false);
    }
  };

  const getQuestionTypeBadge = (type: string) => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Banco de Preguntas Epivox"
        description="Biblioteca corporativa de preguntas organizadas en carpetas y subcarpetas para dinámicas y capacitaciones en faena."
        breadcrumbs={[
          { label: "Epivox", href: "/" },
          { label: "Banco de Preguntas", href: currentFolderId ? "#" : undefined },
          ...(currentFolder
            ? [{ label: currentFolder.name }]
            : []),
        ]}
        badge={
          <span className="bg-[#FFC72C]/20 border border-[#FFC72C] text-[#FFC72C] text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            {folders.length} Carpetas • {questions.length} Preguntas
          </span>
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Subir Preguntas con Excel */}
            <button
              type="button"
              onClick={() => {
                setExcelTargetFolderId(currentFolderId || (folders[0]?.id ?? null));
                setIsExcelModalOpen(true);
              }}
              className="bg-[#001E32] hover:bg-[#254F72] text-[#48A9C5] border border-[#48A9C5]/40 font-bold text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Subir Preguntas (Excel)</span>
            </button>

            {/* Nueva Carpeta o Subcarpeta */}
            <button
              type="button"
              onClick={() => handleOpenFolderModal(undefined, currentFolderId)}
              className="bg-[#193750] hover:bg-[#254F72] text-[#ECEBE4] hover:text-white border border-[#425563] font-bold text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-[#FFC72C]" />
              <span>{currentFolderId ? "Nueva Subcarpeta" : "Nueva Carpeta"}</span>
            </button>

            {/* Nueva Pregunta Manual */}
            <button
              type="button"
              onClick={() => handleOpenQuestionModal()}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Pregunta</span>
            </button>
          </div>
        }
      />

      {/* --------------------------------------------------------------------- */}
      {/* BARRA DE NAVEGACIÓN Y BREADCRUMBS DE CARPETAS                         */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-4 bg-[#193750] border border-[#425563] p-4 rounded-2xl flex-wrap">
        <div className="flex items-center gap-2 text-xs font-bold text-[#ECEBE4] overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setCurrentFolderId(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
              currentFolderId === null
                ? "bg-[#FFC72C] text-[#001E32] shadow font-black"
                : "bg-[#001E32] hover:bg-[#254F72] text-[#ECEBE4]"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Inicio (Todas las Carpetas)</span>
          </button>

          {folderTrail.map((folder, idx) => (
            <React.Fragment key={folder.id}>
              <ChevronRight className="w-3.5 h-3.5 text-[#ECEBE4]/40 shrink-0" />
              <button
                type="button"
                onClick={() => setCurrentFolderId(folder.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  idx === folderTrail.length - 1
                    ? "bg-[#FFC72C] text-[#001E32] shadow font-black"
                    : "bg-[#001E32] hover:bg-[#254F72] text-[#ECEBE4]"
                }`}
              >
                <Folder className="w-3.5 h-3.5" style={{ color: folder.color }} />
                <span>{folder.name}</span>
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Buscador de preguntas dentro del banco */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#ECEBE4]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por pregunta o tema..."
            className="w-full bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#ECEBE4]/40 outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#ECEBE4]/50 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* SECCIÓN 1: SUBCARPETAS DE LA CARPETA ACTUAL                           */}
      {/* --------------------------------------------------------------------- */}
      {displayedSubfolders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[#ECEBE4]/80">
            <span className="uppercase tracking-wider">
              {currentFolderId ? "Subcarpetas" : "Carpetas Principales"} ({displayedSubfolders.length})
            </span>
            <button
              type="button"
              onClick={() => handleOpenFolderModal(undefined, currentFolderId)}
              className="text-[#FFC72C] hover:underline flex items-center gap-1 text-[11px]"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir {currentFolderId ? "Subcarpeta" : "Carpeta"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {displayedSubfolders.map((folder) => (
              <div
                key={folder.id}
                className="bg-[#193750] border-2 border-[#425563] hover:border-[#FFC72C] p-4 rounded-2xl shadow transition group flex flex-col justify-between space-y-3 cursor-pointer"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow"
                      style={{ backgroundColor: `${folder.color}20`, border: `1px solid ${folder.color}` }}
                    >
                      <Folder className="w-5 h-5" style={{ color: folder.color }} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white group-hover:text-[#FFC72C] transition-colors line-clamp-1">
                        {folder.name}
                      </h4>
                      <span className="text-[10px] text-[#ECEBE4]/60">
                        {folder.questions_count || 0} preguntas • {folder.subfolders_count || 0} subcarpetas
                      </span>
                    </div>
                  </div>

                  {/* Acciones de Carpeta */}
                  <div
                    className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenFolderModal(folder)}
                      className="p-1 text-[#ECEBE4]/60 hover:text-white rounded"
                      title="Editar Carpeta"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDeleteConfirm({
                          type: "folder",
                          id: folder.id,
                          title: folder.name,
                        })
                      }
                      className="p-1 text-[#B7312C]/70 hover:text-[#B7312C] rounded"
                      title="Eliminar Carpeta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {folder.description && (
                  <p className="text-[11px] text-[#ECEBE4]/70 line-clamp-2">
                    {folder.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* SECCIÓN 2: PREGUNTAS ALMACENADAS                                      */}
      {/* --------------------------------------------------------------------- */}
      <div className="bg-[#193750] border border-[#425563]/60 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#425563]/40">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FFC72C]" />
              <span>
                {currentFolder ? `Preguntas en "${currentFolder.name}"` : "Todas las Preguntas"}
              </span>
            </h3>
            <p className="text-xs text-[#ECEBE4]/70">
              {filteredQuestions.length} {filteredQuestions.length === 1 ? "pregunta encontrada" : "preguntas encontradas"}
            </p>
          </div>

          {/* Filtros por tipo de pregunta */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: "all", label: "Todos los Tipos" },
              { id: "multiple_choice", label: "Trivia (Quiz)" },
              { id: "true_false", label: "V / F" },
              { id: "rating", label: "Estrellas" },
              { id: "word_cloud", label: "Nube Palabras" },
              { id: "likert", label: "Likert" },
              { id: "open_ended", label: "Abiertas" },
              { id: "ranking", label: "Ranking" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTypeFilter(tab.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition shrink-0 cursor-pointer ${
                  typeFilter === tab.id
                    ? "bg-[#FFC72C] text-[#001E32] shadow font-black"
                    : "bg-[#001E32] text-[#ECEBE4]/70 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Listado de preguntas */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-[#ECEBE4]/60">
            Cargando preguntas del banco...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#ECEBE4]/60 space-y-3">
            <HelpCircle className="w-12 h-12 mx-auto text-[#FFC72C] opacity-50" />
            <p className="font-bold text-white text-sm">
              No se encontraron preguntas en esta ubicación.
            </p>
            <p className="max-w-md mx-auto text-[#ECEBE4]/70">
              Puedes subir preguntas masivamente mediante un archivo Excel (.xlsx) o crear reactivos de forma manual.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setExcelTargetFolderId(currentFolderId || (folders[0]?.id ?? null));
                  setIsExcelModalOpen(true);
                }}
                className="bg-[#48A9C5] hover:bg-[#3996B1] text-[#001E32] font-black text-xs py-2 px-4 rounded-xl transition"
              >
                Subir con Excel
              </button>
              <button
                type="button"
                onClick={() => handleOpenQuestionModal()}
                className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-4 rounded-xl transition"
              >
                Crear Pregunta Manual
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => {
              const badge = getQuestionTypeBadge(q.question_type);
              const BadgeIcon = badge.icon;

              let optionsList: Array<{ id: string; text: string; is_correct?: boolean }> = [];
              try {
                optionsList = JSON.parse(q.options_json || "[]");
              } catch {
                optionsList = [];
              }

              return (
                <div
                  key={q.id}
                  className="bg-[#001E32] border border-[#425563] hover:border-[#FFC72C] p-5 rounded-2xl transition shadow-lg flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${badge.color}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>

                        {q.folder_name && (
                          <span className="text-[10px] text-[#ECEBE4]/60 flex items-center gap-1 bg-[#193750] px-2 py-0.5 rounded">
                            <Folder className="w-3 h-3 text-[#FFC72C]" />
                            <span>{q.folder_name}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenQuestionModal(q)}
                          className="p-1 text-[#ECEBE4]/60 hover:text-white rounded"
                          title="Editar Pregunta"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteConfirm({
                              type: "question",
                              id: q.id,
                              title: q.question_text,
                            })
                          }
                          className="p-1 text-[#B7312C]/70 hover:text-[#B7312C] rounded"
                          title="Eliminar Pregunta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-[#FFC72C] transition-colors leading-relaxed">
                      {q.question_text}
                    </h4>

                    {optionsList.length > 0 && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {optionsList.map((opt, oIdx) => (
                          <div
                            key={opt.id || oIdx}
                            className={`p-2 rounded-lg text-[11px] border flex items-center justify-between ${
                              opt.is_correct
                                ? "bg-[#4C8C2B]/15 border-[#4C8C2B]/40 text-[#4C8C2B] font-bold"
                                : "bg-[#193750]/60 border-[#425563]/40 text-[#ECEBE4]/70"
                            }`}
                          >
                            <span className="truncate">{opt.text}</span>
                            {opt.is_correct && <Check className="w-3 h-3 shrink-0" />}
                          </div>
                        ))}
                      </div>
                    )}

                    {q.explanation_text && (
                      <p className="text-[11px] text-[#ECEBE4]/60 italic line-clamp-2 pt-1 border-t border-[#425563]/30">
                        {q.explanation_text}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#ECEBE4]/50 pt-2 border-t border-[#425563]/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#FFC72C]" />
                      {q.time_limit}s
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#48A9C5]" />
                      {q.points_base} pts
                    </span>
                    {q.creator_name && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {q.creator_name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: SUBIDA MASIVA DE PREGUNTAS CON EXCEL                           */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isExcelModalOpen}
        onClose={() => {
          setIsExcelModalOpen(false);
          setParsedExcelQuestions([]);
          setExcelFileName(null);
        }}
        title="Subir Preguntas al Banco desde Excel (.xlsx)"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Paso 1: Descargar Plantilla */}
          <div className="bg-[#001E32] border border-[#425563] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
                Paso 1: Descargar Formato Oficial
              </span>
              <p className="text-xs text-[#ECEBE4]/70">
                Descarga el archivo Excel con las 10 columnas oficiales y la hoja de guía con los 7 tipos de preguntas.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadExcelTemplate}
              className="bg-[#48A9C5] hover:bg-[#3996B1] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Formato (.xlsx)</span>
            </button>
          </div>

          {/* Paso 2: Seleccionar Carpeta de Destino */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#ECEBE4]">
              Paso 2: Seleccionar Carpeta o Subcarpeta de Destino
            </label>
            <select
              value={excelTargetFolderId || ""}
              onChange={(e) => setExcelTargetFolderId(Number(e.target.value))}
              className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFC72C]"
            >
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.parent_id ? `↳ ${f.name}` : `📁 ${f.name}`}
                </option>
              ))}
            </select>
          </div>

          {/* Paso 3: Subir Archivo */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[#ECEBE4]">
              Paso 3: Cargar Archivo Excel Rellenado
            </label>
            <div className="border-2 border-dashed border-[#425563] hover:border-[#FFC72C] rounded-2xl p-6 text-center space-y-3 transition bg-[#001E32]/50">
              <Upload className="w-10 h-10 text-[#FFC72C] mx-auto opacity-70" />
              <div>
                <span className="text-xs font-bold text-white block">
                  {excelFileName ? excelFileName : "Arrastra tu archivo Excel aquí o haz clic para seleccionar"}
                </span>
                <span className="text-[10px] text-[#ECEBE4]/50">Formatos soportados: .xlsx, .xls</span>
              </div>
              <input
                type="file"
                accept=".xlsx, .xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) processExcelFile(file);
                }}
                className="hidden"
                id="excel-file-bank-upload"
              />
              <label
                htmlFor="excel-file-bank-upload"
                className="inline-block bg-[#193750] hover:bg-[#254F72] text-[#ECEBE4] hover:text-white border border-[#425563] font-bold text-xs py-2 px-4 rounded-xl cursor-pointer transition shadow"
              >
                Seleccionar Archivo
              </label>
            </div>
          </div>

          {excelError && (
            <div className="p-3 bg-[#B7312C]/20 border border-[#B7312C]/40 rounded-xl text-xs text-[#ECEBE4] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0" />
              <span>{excelError}</span>
            </div>
          )}

          {importSuccessMsg && (
            <div className="p-3 bg-[#4C8C2B]/20 border border-[#4C8C2B]/40 rounded-xl text-xs text-[#ECEBE4] flex items-center gap-2">
              <Check className="w-4 h-4 text-[#4C8C2B] shrink-0" />
              <span>{importSuccessMsg}</span>
            </div>
          )}

          {parsedExcelQuestions.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#FFC72C]">
                Vista Previa: {parsedExcelQuestions.length} preguntas detectadas en el archivo
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-[#001E32] rounded-xl border border-[#425563]/50 text-xs">
                {parsedExcelQuestions.slice(0, 10).map((pq, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-1.5 bg-[#193750]/50 rounded">
                    <span className="font-bold text-white truncate">{idx + 1}. {pq.questionText}</span>
                    <span className="text-[10px] text-[#48A9C5] shrink-0">{pq.questionType}</span>
                  </div>
                ))}
                {parsedExcelQuestions.length > 10 && (
                  <p className="text-center text-[10px] text-[#ECEBE4]/50 pt-1">
                    ... y {parsedExcelQuestions.length - 10} preguntas más.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-[#425563]/40">
            <button
              type="button"
              onClick={() => setIsExcelModalOpen(false)}
              className="bg-[#001E32] text-[#ECEBE4] border border-[#425563] text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveImportedExcel}
              disabled={isImporting || parsedExcelQuestions.length === 0}
              className="bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] font-black text-xs py-2 px-5 rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isImporting ? "Importando..." : `Guardar ${parsedExcelQuestions.length} Preguntas`}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: CREAR / EDITAR CARPETA                                         */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        title={editingFolder ? "Editar Carpeta" : folderParentId ? "Nueva Subcarpeta" : "Nueva Carpeta Principal"}
        maxWidth="md"
      >
        <form onSubmit={handleSaveFolder} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
              Nombre de la Carpeta *
            </label>
            <input
              type="text"
              required
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Ej. Seguridad Operacional y LOTO"
              className="w-full bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
              Carpeta Superior (Padre)
            </label>
            <select
              value={folderParentId || ""}
              onChange={(e) => setFolderParentId(Number(e.target.value) || null)}
              className="w-full bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl px-3 py-2 text-xs text-white outline-none"
            >
              <option value="">(Ninguna: Es carpeta principal)</option>
              {folders
                .filter((f) => !editingFolder || f.id !== editingFolder.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
              Descripción (Opcional)
            </label>
            <textarea
              rows={2}
              value={folderDescription}
              onChange={(e) => setFolderDescription(e.target.value)}
              placeholder="Descripción del contenido o área funcional..."
              className="w-full bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2">
              {EPIROC_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFolderColor(c.value)}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    folderColor === c.value ? "border-white scale-110 shadow" : "border-transparent opacity-70"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#425563]/40">
            <button
              type="button"
              onClick={() => setIsFolderModalOpen(false)}
              className="bg-[#001E32] text-[#ECEBE4] border border-[#425563] text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-5 rounded-xl shadow cursor-pointer"
            >
              Guardar Carpeta
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: CREAR / EDITAR PREGUNTA INDIVIDUAL                             */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        title={editingQuestion ? "Editar Pregunta" : "Nueva Pregunta en el Banco"}
        maxWidth="lg"
      >
        <form onSubmit={handleSaveQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
              Texto de la Pregunta *
            </label>
            <textarea
              rows={2}
              required
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Escribe el enunciado de la pregunta..."
              className="w-full bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
                Tipo de Dinámica
              </label>
              <select
                value={qType}
                onChange={(e) => setQType(e.target.value)}
                className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-3 py-2 text-xs text-white outline-none"
              >
                <option value="multiple_choice">Opción Múltiple (Quiz)</option>
                <option value="true_false">Verdadero o Falso</option>
                <option value="rating">Calificación (Estrellas)</option>
                <option value="word_cloud">Nube de Palabras</option>
                <option value="likert">Escala Likert</option>
                <option value="open_ended">Pregunta Abierta</option>
                <option value="ranking">Ranking / Ordenamiento</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
                Tiempo (Segundos)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={qTimeLimit}
                onChange={(e) => setQTimeLimit(parseInt(e.target.value) || 30)}
                className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
                Puntos Base
              </label>
              <input
                type="number"
                min={0}
                max={5000}
                value={qPoints}
                onChange={(e) => setQPoints(parseInt(e.target.value) || 0)}
                className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>
          </div>

          {/* Opciones si es multiple_choice */}
          {qType === "multiple_choice" && (
            <div className="space-y-2 pt-2 border-t border-[#425563]/40">
              <label className="block text-xs font-bold text-[#ECEBE4]">
                Alternativas de Respuesta (Marca la Correcta)
              </label>
              <div className="space-y-2">
                {qOptions.map((opt, oIdx) => (
                  <div key={opt.id || oIdx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setQOptions((prev) =>
                          prev.map((o, idx) => ({ ...o, is_correct: idx === oIdx })),
                        )
                      }
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer ${
                        opt.is_correct
                          ? "bg-[#4C8C2B] border-[#4C8C2B] text-white"
                          : "border-[#425563] text-transparent hover:border-[#4C8C2B]"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) =>
                        setQOptions((prev) =>
                          prev.map((o, idx) => (idx === oIdx ? { ...o, text: e.target.value } : o)),
                        )
                      }
                      placeholder={`Opción ${oIdx + 1}`}
                      className="flex-1 bg-[#001E32] border border-[#425563] rounded-xl px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#ECEBE4] mb-1">
              Explicación Preventiva / Retroalimentación (Opcional)
            </label>
            <input
              type="text"
              value={qExplanation}
              onChange={(e) => setQExplanation(e.target.value)}
              placeholder="Texto proyectado tras revelar la respuesta correcta..."
              className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-3 py-2 text-xs text-white outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#425563]/40">
            <button
              type="button"
              onClick={() => setIsQuestionModalOpen(false)}
              className="bg-[#001E32] text-[#ECEBE4] border border-[#425563] text-xs font-bold py-2 px-4 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-5 rounded-xl shadow cursor-pointer"
            >
              Guardar Pregunta
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN                                          */}
      {/* ===================================================================== */}
      {deleteConfirm && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          title={`Eliminar ${deleteConfirm.type === "folder" ? "Carpeta" : "Pregunta"}`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <p className="text-xs text-[#ECEBE4]/80 leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente{" "}
              <strong className="text-white">"{deleteConfirm.title}"</strong>?
              {deleteConfirm.type === "folder" && (
                <span className="block text-[#B7312C] font-semibold mt-1">
                  Se eliminarán también las subcarpetas y preguntas contenidas en ella.
                </span>
              )}
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#425563]/40">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="bg-[#001E32] text-[#ECEBE4] border border-[#425563] text-xs font-bold py-2 px-4 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirm.type === "folder") {
                    handleDeleteFolder(deleteConfirm.id);
                  } else {
                    handleDeleteQuestion(deleteConfirm.id);
                  }
                }}
                className="bg-[#B7312C] hover:bg-[#A32823] text-white font-black text-xs py-2 px-4 rounded-xl shadow cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
