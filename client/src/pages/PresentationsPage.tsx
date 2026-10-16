import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Tv,
  Plus,
  Play,
  Copy,
  Check,
  QrCode,
  Clock,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Edit3,
  CopyPlus,
  Trash2,
  BarChart3,
  Search,
  LayoutGrid,
  Table as TableIcon,
  FileSpreadsheet,
  Download,
  Upload,
  Gamepad2,
  Presentation,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import QRCode from "qrcode";
import * as XLSX from "xlsx";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";
import { getSocket } from "../services/socket";

interface PresentationItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  activity_type: string;
  questions_count?: number;
  default_time_limit: number;
  updated_at: string;
}

interface ActiveSessionData {
  id: number;
  pin: string;
  status: string;
  current_question_index: number;
  current_step: string;
  activity_title?: string;
  activity_id: number;
}

interface ParticipantInfo {
  id: number;
  nickname: string;
  department: string | null;
  score: number;
}

interface ParsedExcelQuestion {
  questionText: string;
  questionType: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
  correctOptionIndex: number;
  timeLimit: number;
  pointsBase: number;
  explanation: string;
}

export default function PresentationsPage() {
  const [presentations, setPresentations] = useState<PresentationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de búsqueda, modo y vista
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "quiz" | "presentation">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");

  // Sesión activa seleccionada para monitoreo
  const [activeSession, setActiveSession] = useState<ActiveSessionData | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<ParticipantInfo[]>([]);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [liveResults, setLiveResults] = useState<Record<string, number>>({});
  const [remainingTime, setRemainingTime] = useState(30);
  const [currentQuestions, setCurrentQuestions] = useState<
    Array<{
      id: number;
      question_text: string;
      question_type: string;
      options_json: string;
      time_limit: number;
    }>
  >([]);

  // Estados de interfaz y modales
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrModalUrl, setQrModalUrl] = useState<string | null>(null);
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Presentaciones");
  const [newType, setNewType] = useState("quiz");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal de confirmación de eliminación (sin alert nativo)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Modal de Importación Masiva desde Excel
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelTitle, setExcelTitle] = useState("");
  const [excelCategory, setExcelCategory] = useState("Presentaciones");
  const [excelType, setExcelType] = useState<"quiz" | "interactive_presentation">("quiz");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedExcelQuestion[]>([]);
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Detectar y montar automáticamente sesión activa si viene por query param ?sessionPin=XXXX
  useEffect(() => {
    const sessionPin = searchParams.get("sessionPin");
    if (sessionPin && (!activeSession || activeSession.pin !== sessionPin)) {
      fetch(`/api/epivox/sessions/${sessionPin}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.session) {
            setActiveSession({
              id: data.session.id,
              pin: data.session.pin,
              status: data.session.status,
              current_question_index: data.session.current_question_index || 0,
              current_step: data.session.current_step || "lobby",
              activity_id: data.session.activity_id,
            });
            const socket = getSocket();
            socket.emit("presenter:join", { pin: data.session.pin });
          }
        })
        .catch((err) => console.error("Error al restaurar sesión activa por PIN:", err));
    }
  }, [searchParams]);

  // WebSockets para monitoreo en vivo de la sesión seleccionada
  useEffect(() => {
    if (!activeSession) return;
    const socket = getSocket();
    const pin = activeSession.pin;

    socket.emit("presenter:join", { pin });

    socket.on(
      "presenter:sync",
      (data: {
        session: ActiveSessionData;
        participants: ParticipantInfo[];
        questions: Array<{
          id: number;
          question_text: string;
          question_type: string;
          options_json: string;
          time_limit: number;
        }>;
        totalAnswers?: number;
        liveResults?: Record<string, number>;
      }) => {
        setActiveSession(data.session);
        setActiveParticipants(data.participants || []);
        setCurrentQuestions(data.questions || []);
        if (data.totalAnswers !== undefined) setTotalAnswers(data.totalAnswers);
        if (data.liveResults) setLiveResults(data.liveResults);
      },
    );

    socket.on(
      "lobby:participants_update",
      (data: { participants: ParticipantInfo[] }) => {
        setActiveParticipants(data.participants || []);
      },
    );

    socket.on(
      "results:live_update",
      (data: { totalAnswers: number; results: Record<string, number> }) => {
        setTotalAnswers(data.totalAnswers);
        setLiveResults(data.results);
      },
    );

    socket.on(
      "session:state_changed",
      (data: {
        status: string;
        currentStep: string;
        currentQuestionIndex?: number;
        results?: Record<string, number>;
        totalAnswers?: number;
      }) => {
        setActiveSession((prev) =>
          prev
            ? {
                ...prev,
                status: data.status,
                current_step: data.currentStep,
                current_question_index:
                  data.currentQuestionIndex !== undefined
                    ? data.currentQuestionIndex
                    : prev.current_question_index,
              }
            : null,
        );
        if (data.results) setLiveResults(data.results);
        if (data.totalAnswers !== undefined) setTotalAnswers(data.totalAnswers);
      },
    );

    socket.on("timer:tick", (data: { remaining: number }) => {
      setRemainingTime(data.remaining);
    });

    return () => {
      socket.off("presenter:sync");
      socket.off("lobby:participants_update");
      socket.off("results:live_update");
      socket.off("session:state_changed");
      socket.off("timer:tick");
    };
  }, [activeSession?.pin]);

  // Filtrado de presentaciones
  const filteredPresentations = useMemo(() => {
    return presentations.filter((act) => {
      // Filtro de búsqueda de texto
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        act.title.toLowerCase().includes(q) ||
        act.category.toLowerCase().includes(q) ||
        (act.description && act.description.toLowerCase().includes(q));

      // Filtro por modo (trivia vs presentación)
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
    const triviaCount = presentations.filter((p) => p.activity_type === "quiz").length;
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
  const handlePresenterAction = (action: string) => {
    if (!activeSession) return;
    const socket = getSocket();
    socket.emit("presenter:action", {
      pin: activeSession.pin,
      action,
      questionIndex: activeSession.current_question_index,
    });
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
  const handleCreatePresentation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/epivox/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          activity_type: newType,
          default_time_limit: 30,
          default_points: newType === "quiz" ? 1000 : 0,
        }),
      });
      if (res.ok) {
        setIsCreatingModal(false);
        setNewTitle("");
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
        console.error("Error al eliminar presentación:", data.error || res.statusText);
      }
      setDeleteTargetId(null);
      await fetchPresentations();
    } catch (err) {
      console.error("Error al eliminar:", err);
      setDeleteTargetId(null);
    }
  };

  // ---------------------------------------------------------------------------
  // GENERADOR Y DESCARGA DE EXCEL MODELO (.xlsx) CON GUÍA COMPLETA DE 7 TIPOS
  // ---------------------------------------------------------------------------
  const handleDownloadExcelTemplate = () => {
    // Hoja 1: Plantilla de Preguntas
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

    // Hoja 2: Guía de los 7 Tipos de Pregunta y Cómo Usarlas
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
    if (!excelTitle) {
      setExcelTitle(file.name.replace(/\.[^/.]+$/, ""));
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: "binary" });
        // Buscar la hoja "Plantilla_Preguntas" o la primera hoja
        const targetSheetName =
          wb.SheetNames.find((s) => s.toLowerCase().includes("plantilla")) ||
          wb.SheetNames[0];
        const ws = wb.Sheets[targetSheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          setExcelError("El archivo Excel no contiene filas de datos para importar.");
          return;
        }

        const parsed: ParsedExcelQuestion[] = [];
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
                : excelType === "quiz"
                  ? 1000
                  : 0;
          const explanation = row[9] ? String(row[9]).trim() : "";

          const optionsList: Array<{
            id: string;
            text: string;
            is_correct: boolean;
          }> = [];
          if (questionType === "true_false") {
            optionsList.push({
              id: "opt-1",
              text: "Verdadero",
              is_correct: correctIdx === 0,
            });
            optionsList.push({
              id: "opt-2",
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
            correctOptionIndex: correctIdx,
            timeLimit,
            pointsBase,
            explanation,
          });
        }

        setParsedQuestions(parsed);
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

  // Guardar la actividad y las preguntas parseadas desde Excel
  const handleSaveImportedExcel = async () => {
    if (parsedQuestions.length === 0) return;
    setIsImporting(true);
    try {
      // 1. Crear actividad
      const actRes = await fetch("/api/epivox/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: excelTitle.trim() || "Cuestionario Importado Excel",
          category: excelCategory,
          activity_type: excelType,
          default_time_limit: 30,
          default_points: excelType === "quiz" ? 1000 : 0,
        }),
      });
      const act = await actRes.json();

      // 2. Insertar cada una de las preguntas
      for (let i = 0; i < parsedQuestions.length; i++) {
        const q = parsedQuestions[i];
        await fetch(`/api/epivox/activities/${act.id}/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sort_order: i + 1,
            question_text: q.questionText,
            question_type: q.questionType,
            chart_type: q.questionType === "word_cloud" ? "word_cloud" : "bar",
            time_limit: q.timeLimit,
            points_base: q.pointsBase,
            options_json: JSON.stringify(q.options),
            explanation_text: q.explanation,
          }),
        });
      }

      setImportSuccessMsg(
        `¡Se importaron con éxito ${parsedQuestions.length} preguntas en "${act.title}"!`,
      );
      setTimeout(() => {
        setImportSuccessMsg(null);
        setIsExcelModalOpen(false);
        setParsedQuestions([]);
        setExcelFileName(null);
        setExcelTitle("");
      }, 2000);

      await fetchPresentations();
    } catch (err) {
      console.error("Error al importar preguntas:", err);
    } finally {
      setIsImporting(false);
    }
  };

  const currentQ = currentQuestions[activeSession?.current_question_index || 0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Presentaciones"
        description="Gestor central de presentaciones interactivas y trivias gamificadas. Lanza sesiones en vivo, monitorea respuestas y realiza cargas masivas vía Excel."
        breadcrumbs={[{ label: "Epivox", href: "/" }, { label: "Presentaciones" }]}
        badge={
          <span className="px-3 py-1 bg-[#FFC72C]/15 border border-[#FFC72C]/40 text-[#FFC72C] text-xs font-bold rounded-full">
            {presentations.length} Disponibles
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Botón Subir Excel Masivo */}
            <button
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="bg-[#001E32] hover:bg-[#254F72] text-[#48A9C5] border border-[#48A9C5]/40 font-bold text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-2 active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#48A9C5]" />
              <span>Importar Excel</span>
            </button>

            {/* Botón Crear Manual */}
            <button
              type="button"
              onClick={() => setIsCreatingModal(true)}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Presentación</span>
            </button>
          </div>
        }
      />

      {/* ===================================================================== */}
      {/* CASO 1: SESIÓN EN VIVO ACTIVA (SE MUESTRA ÚNICA Y EXCLUSIVAMENTE ESTO) */}
      {/* ===================================================================== */}
      {activeSession ? (
        <section className="bg-gradient-to-r from-[#193750] via-[#102B41] to-[#001E32] border-2 border-[#FFC72C] rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#425563]/60">
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
              <h2 className="text-2xl font-black text-white">
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
                onClick={() => handleCopyLink(activeSession.pin)}
                className="bg-[#001E32] hover:bg-[#254F72] text-[#FFC72C] border border-[#FFC72C]/40 font-bold text-xs py-2.5 px-4 rounded-xl transition flex items-center gap-2 shadow"
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
                onClick={() => handleOpenQR(activeSession.pin)}
                className="bg-[#001E32] hover:bg-[#254F72] text-white border border-[#425563] font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow"
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

              {/* Cerrar Monitor y Volver al Catálogo */}
              <button
                type="button"
                onClick={() => {
                  setActiveSession(null);
                  setSearchParams({});
                }}
                className="bg-[#B7312C]/20 hover:bg-[#B7312C]/40 text-[#B7312C] border border-[#B7312C]/40 font-bold text-xs py-2.5 px-3.5 rounded-xl transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Catálogo</span>
              </button>
            </div>
          </div>

          {/* Enlace destacado para enviar */}
          <div className="bg-[#001E32]/70 border border-[#425563] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-3 truncate">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FFC72C] shrink-0">
                Link de Participación:
              </span>
              <span className="font-mono text-white/90 truncate">
                {window.location.origin}/join?pin={activeSession.pin}
              </span>
            </div>
            <span className="text-xs text-[#ECEBE4]/60 shrink-0">
              Envía este link por Teams, correo o chat a tu audiencia
            </span>
          </div>

          {/* Estadísticas en Vivo: Usuarios y Respuestas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Usuarios Conectados */}
            <div className="bg-[#001E32] border border-[#425563] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ECEBE4]/70">
                  Participantes en Sala
                </span>
                <span className="text-xs bg-[#4C8C2B] text-white font-extrabold px-2.5 py-0.5 rounded-full">
                  {activeParticipants.length} conectados
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {activeParticipants.length === 0 ? (
                  <p className="text-xs text-[#ECEBE4]/50 italic py-2">
                    Esperando que los participantes ingresen...
                  </p>
                ) : (
                  activeParticipants.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs py-1 px-2.5 bg-[#193750] rounded-lg"
                    >
                      <span className="font-bold text-white truncate">
                        {p.nickname}
                      </span>
                      {p.department && (
                        <span className="text-[10px] text-[#ECEBE4]/60 truncate">
                          {p.department}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 2. Cantidad de Respuestas Recibidas */}
            <div className="bg-[#001E32] border border-[#425563] p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ECEBE4]/70">
                  Progreso de Respuestas
                </span>
                <span className="text-xs bg-[#48A9C5] text-white font-extrabold px-2.5 py-0.5 rounded-full">
                  {totalAnswers} / {activeParticipants.length} votos
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">
                  {totalAnswers}
                </span>
                <span className="text-xs text-[#ECEBE4]/60">
                  respuestas registradas
                </span>
              </div>
              <div className="w-full bg-[#193750] h-3 rounded-full overflow-hidden">
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
            <div className="bg-[#001E32] border border-[#425563] p-5 rounded-2xl space-y-3 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#ECEBE4]/70">
                  Acción de la Diapositiva
                </span>
                <span className="text-xs bg-[#FFC72C] text-[#001E32] font-black px-2 py-0.5 rounded">
                  Fase: {activeSession.current_step}
                </span>
              </div>

              {activeSession.current_step === "lobby" ? (
                <button
                  type="button"
                  onClick={() => handlePresenterAction("start_game")}
                  className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-95"
                >
                  <Play className="w-4 h-4 fill-[#001E32]" />
                  <span>Iniciar Primera Pregunta</span>
                </button>
              ) : activeSession.current_step === "question" ? (
                <button
                  type="button"
                  onClick={() => handlePresenterAction("show_results")}
                  className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-95"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Cerrar Votación y Ver Resultados</span>
                </button>
              ) : activeSession.current_step === "results" ? (
                <button
                  type="button"
                  onClick={() => handlePresenterAction("show_leaderboard")}
                  className="w-full bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-sm py-3 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Ver Tabla de Posiciones</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePresenterAction("next_question")}
                  className="w-full bg-[#4C8C2B] hover:bg-[#3E7323] text-white font-black text-sm py-3 rounded-xl transition shadow flex items-center justify-center gap-2 active:scale-95"
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

            {/* Fila de Resumen de la Pregunta Activa en el Monitor */}
            {currentQ && (
              <div className="md:col-span-3 bg-[#001E32] border border-[#425563] p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-extrabold uppercase tracking-wider text-[#FFC72C] bg-[#FFC72C]/10 px-2.5 py-1 rounded-lg border border-[#FFC72C]/30 shrink-0">
                    Pregunta Activa #{activeSession.current_question_index + 1}
                  </span>
                  <span className="font-bold text-white truncate text-sm">
                    {currentQ.question_text}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[#ECEBE4]/70">
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
          </div>
        </section>
      ) : (
        /* ===================================================================== */
        /* CASO 2: CATÁLOGO DE PRESENTACIONES (FILTROS, BÚSQUEDA Y VISTA TABLA)  */
        /* ===================================================================== */
        <div className="bg-[#193750] border border-[#425563]/60 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
          {/* Barra de Filtros por Modo, Búsqueda y Switch de Vista */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#425563]/40">
            {/* Pestañas de Modo (Trivia vs Presentación) */}
            <div className="flex items-center gap-1.5 bg-[#001E32] p-1.5 rounded-2xl border border-[#425563] shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setModeFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  modeFilter === "all"
                    ? "bg-[#FFC72C] text-[#001E32] shadow font-black"
                    : "text-[#ECEBE4]/70 hover:text-white"
                }`}
              >
                <span>Todos</span>
                <span className="text-[10px] bg-[#193750] text-white px-1.5 py-0.2 rounded-full">
                  {counts.total}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModeFilter("quiz")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  modeFilter === "quiz"
                    ? "bg-[#FFC72C] text-[#001E32] shadow font-black"
                    : "text-[#ECEBE4]/70 hover:text-white"
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Modo Trivia (Gamificación)</span>
                <span className="text-[10px] bg-[#193750] text-white px-1.5 py-0.2 rounded-full">
                  {counts.triviaCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModeFilter("presentation")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  modeFilter === "presentation"
                    ? "bg-[#48A9C5] text-[#001E32] shadow font-black"
                    : "text-[#ECEBE4]/70 hover:text-white"
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Modo Presentación</span>
                <span className="text-[10px] bg-[#193750] text-white px-1.5 py-0.2 rounded-full">
                  {counts.presentationCount}
                </span>
              </button>
            </div>

            {/* Búsqueda en Vivo y Selector de Vista */}
            <div className="flex items-center gap-3">
              {/* Buscador */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-[#ECEBE4]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por título o categoría..."
                  className="w-full bg-[#001E32] border border-[#425563] focus:border-[#FFC72C] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-[#ECEBE4]/40 focus:outline-none transition"
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

              {/* Botones de Vista: Cuadrícula / Tabla */}
              <div className="flex items-center bg-[#001E32] p-1 rounded-xl border border-[#425563] shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  title="Vista en Cuadrícula"
                  className={`p-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === "grid"
                      ? "bg-[#FFC72C] text-[#001E32]"
                      : "text-[#ECEBE4]/60 hover:text-white"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  title="Vista en Tabla"
                  className={`p-1.5 rounded-lg text-xs font-bold transition ${
                    viewMode === "table"
                      ? "bg-[#FFC72C] text-[#001E32]"
                      : "text-[#ECEBE4]/60 hover:text-white"
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-[#ECEBE4]/60">
              Cargando catálogo de presentaciones...
            </div>
          ) : filteredPresentations.length === 0 ? (
            <div className="py-12 text-center text-[#ECEBE4]/60 space-y-3">
              <Tv className="w-12 h-12 mx-auto text-[#FFC72C] opacity-50" />
              <p>No se encontraron presentaciones para los filtros aplicados.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setModeFilter("all");
                }}
                className="bg-[#001E32] border border-[#425563] hover:border-[#FFC72C] text-[#FFC72C] font-bold text-xs py-2 px-4 rounded-xl transition"
              >
                Limpiar Filtros
              </button>
            </div>
          ) : viewMode === "grid" ? (
            /* --------------------------------------------------------------- */
            /* VISTA EN CUADRÍCULA (CARDS)                                     */
            /* --------------------------------------------------------------- */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPresentations.map((act) => {
                const isTrivia = act.activity_type === "quiz";
                return (
                  <div
                    key={act.id}
                    className="bg-[#001E32] border border-[#425563] hover:border-[#FFC72C] p-6 rounded-2xl transition shadow-lg flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                            isTrivia
                              ? "bg-[#FFC72C]/10 text-[#FFC72C] border-[#FFC72C]/30"
                              : "bg-[#48A9C5]/10 text-[#48A9C5] border-[#48A9C5]/30"
                          }`}
                        >
                          {isTrivia ? "🎮 Trivia Gamificada" : "📊 Presentación"}
                        </span>
                        <span className="text-xs text-[#ECEBE4]/60 font-semibold">
                          {act.questions_count || 0} diapositivas
                        </span>
                      </div>

                      <h3 className="text-lg font-black text-white group-hover:text-[#FFC72C] transition-colors line-clamp-2">
                        {act.title}
                      </h3>

                      <p className="text-xs text-[#ECEBE4]/70 line-clamp-2">
                        {act.description ||
                          (isTrivia
                            ? "Cuestionario interactivo con concurso de puntos y podio."
                            : "Presentación interactiva para recopilación de ideas en vivo.")}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#425563]/40">
                      <div className="flex items-center justify-between text-xs text-[#ECEBE4]/60">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {act.default_time_limit}s por pregunta
                        </span>
                        <span className="text-[11px] font-semibold text-[#ECEBE4]/80">
                          {act.category}
                        </span>
                      </div>

                      {/* Acciones principales */}
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleLaunchSession(act.id)}
                          className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow active:scale-95"
                        >
                          <Play className="w-3.5 h-3.5 fill-[#001E32]" />
                          <span>Lanzar en Vivo</span>
                        </button>

                        <Link
                          to={`/editor/${act.id}`}
                          className="bg-[#193750] hover:bg-[#254F72] text-[#ECEBE4] hover:text-white border border-[#425563] font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-[#48A9C5]" />
                          <span>Editar</span>
                        </Link>
                      </div>

                      {/* Acciones secundarias (Clonar / Eliminar) */}
                      <div className="flex items-center justify-end gap-3 text-xs pt-1">
                        <button
                          type="button"
                          onClick={() => handleClone(act.id)}
                          className="text-[#ECEBE4]/60 hover:text-white flex items-center gap-1 transition"
                          title="Duplicar presentación"
                        >
                          <CopyPlus className="w-3.5 h-3.5" />
                          <span>Duplicar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(act.id)}
                          className="text-[#B7312C]/80 hover:text-[#B7312C] flex items-center gap-1 transition"
                          title="Eliminar presentación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* --------------------------------------------------------------- */
            /* VISTA EN TABLA                                                  */
            /* --------------------------------------------------------------- */
            <div className="overflow-x-auto rounded-2xl border border-[#425563]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#001E32] text-[#ECEBE4]/80 uppercase tracking-wider font-extrabold border-b border-[#425563]">
                  <tr>
                    <th className="py-3.5 px-4">Título y Descripción</th>
                    <th className="py-3.5 px-4">Modo</th>
                    <th className="py-3.5 px-4">Categoría</th>
                    <th className="py-3.5 px-4 text-center">Diapositivas</th>
                    <th className="py-3.5 px-4 text-center">Tiempo</th>
                    <th className="py-3.5 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#425563]/40">
                  {filteredPresentations.map((act) => {
                    const isTrivia = act.activity_type === "quiz";
                    return (
                      <tr
                        key={act.id}
                        className="hover:bg-[#001E32]/60 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-sm text-white block">
                              {act.title}
                            </span>
                            <span className="text-[11px] text-[#ECEBE4]/60 line-clamp-1">
                              {act.description || "Sin descripción adicional"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                              isTrivia
                                ? "bg-[#FFC72C]/10 text-[#FFC72C] border-[#FFC72C]/30"
                                : "bg-[#48A9C5]/10 text-[#48A9C5] border-[#48A9C5]/30"
                            }`}
                          >
                            {isTrivia ? (
                              <Gamepad2 className="w-3 h-3" />
                            ) : (
                              <Presentation className="w-3 h-3" />
                            )}
                            {isTrivia ? "Trivia" : "Presentación"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-white font-medium">
                            {act.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-white whitespace-nowrap">
                          {act.questions_count || 0}
                        </td>
                        <td className="py-3.5 px-4 text-center text-[#ECEBE4]/80 whitespace-nowrap">
                          {act.default_time_limit}s
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleLaunchSession(act.id)}
                              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-1.5 px-3 rounded-lg transition shadow flex items-center gap-1 active:scale-95"
                            >
                              <Play className="w-3 h-3 fill-[#001E32]" />
                              <span>Lanzar</span>
                            </button>

                            <Link
                              to={`/editor/${act.id}`}
                              className="bg-[#001E32] hover:bg-[#254F72] text-[#48A9C5] border border-[#48A9C5]/40 py-1.5 px-2.5 rounded-lg transition"
                              title="Editar preguntas"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleClone(act.id)}
                              className="bg-[#001E32] hover:bg-[#254F72] text-[#ECEBE4] border border-[#425563] py-1.5 px-2.5 rounded-lg transition"
                              title="Duplicar"
                            >
                              <CopyPlus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(act.id)}
                              className="bg-[#001E32] hover:bg-[#B7312C]/20 text-[#B7312C] border border-[#B7312C]/40 py-1.5 px-2.5 rounded-lg transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: IMPORTACIÓN MASIVA DESDE EXCEL (.XLSX)                       */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isExcelModalOpen}
        onClose={() => {
          setIsExcelModalOpen(false);
          setParsedQuestions([]);
          setExcelFileName(null);
        }}
        title="Importación Masiva de Preguntas desde Excel"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Paso 1: Descargar Excel Modelo */}
          <div className="bg-[#001E32] border border-[#425563] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
                Paso 1: Descargar Plantilla Modelo
              </span>
              <p className="text-xs text-[#ECEBE4]/70">
                Descarga nuestro formato oficial con ejemplos de trivia y preguntas abiertas listos para rellenar.
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

          {/* Paso 2: Configuración de la Actividad y Carga de Archivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#ECEBE4] mb-1">
                Título de la Presentación
              </label>
              <input
                type="text"
                value={excelTitle}
                onChange={(e) => setExcelTitle(e.target.value)}
                placeholder="Ej. Cuestionario de Seguridad Faena"
                className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFC72C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#ECEBE4] mb-1">
                Categoría
              </label>
              <select
                value={excelCategory}
                onChange={(e) => setExcelCategory(e.target.value)}
                className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#FFC72C]"
              >
                <option value="Presentaciones">Presentaciones</option>
                <option value="Seguridad">Seguridad / LOTO</option>
                <option value="Capacitación">Capacitación Técnica</option>
                <option value="Operaciones">Operaciones Faena</option>
                <option value="Cultura">Cultura y Clima</option>
                <option value="Inducción">Inducción</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#ECEBE4] mb-1">
                Modo de la Dinámica
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExcelType("quiz")}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                    excelType === "quiz"
                      ? "bg-[#001E32] border-[#FFC72C] ring-1 ring-[#FFC72C]"
                      : "bg-[#001E32]/50 border-[#425563] text-[#ECEBE4]/60"
                  }`}
                >
                  <Gamepad2
                    className={`w-5 h-5 ${
                      excelType === "quiz" ? "text-[#FFC72C]" : "text-[#ECEBE4]/50"
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Modo Trivia (Gamificación)
                    </span>
                    <span className="text-[10px] text-[#ECEBE4]/60">
                      Puntajes por velocidad, rachas y podio final
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setExcelType("interactive_presentation")}
                  className={`p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                    excelType === "interactive_presentation"
                      ? "bg-[#001E32] border-[#48A9C5] ring-1 ring-[#48A9C5]"
                      : "bg-[#001E32]/50 border-[#425563] text-[#ECEBE4]/60"
                  }`}
                >
                  <Presentation
                    className={`w-5 h-5 ${
                      excelType === "interactive_presentation"
                        ? "text-[#48A9C5]"
                        : "text-[#ECEBE4]/50"
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Modo Presentación
                    </span>
                    <span className="text-[10px] text-[#ECEBE4]/60">
                      Sondeos de opinión, gráficos en vivo sin podio
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Paso 3: Selector de Archivo Excel */}
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
                htmlFor="presentations-excel-file-input"
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
                id="presentations-excel-file-input"
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

          {/* Previsualización de Preguntas Detectadas */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4C8C2B] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#4C8C2B]" />
                  {parsedQuestions.length} Preguntas Detectadas Listas para Importar
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-[#425563] rounded-xl p-3 bg-[#001E32]">
                {parsedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#193750] rounded-lg border border-[#425563] text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-[#FFC72C]">
                        #{idx + 1} {q.questionText}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#001E32] text-[#ECEBE4]/80">
                        {q.questionType} &bull; {q.timeLimit}s
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

          {importSuccessMsg && (
            <div className="p-3 bg-[#4C8C2B]/20 border border-[#4C8C2B] text-[#4C8C2B] rounded-xl text-xs font-bold text-center">
              {importSuccessMsg}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-[#425563]/60">
            <button
              type="button"
              onClick={() => {
                setIsExcelModalOpen(false);
                setParsedQuestions([]);
                setExcelFileName(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#ECEBE4]/70 hover:bg-[#425563]/30 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={
                isImporting ||
                parsedQuestions.length === 0 ||
                !excelTitle.trim()
              }
              onClick={handleSaveImportedExcel}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-6 rounded-xl transition shadow disabled:opacity-50 flex items-center gap-2"
            >
              {isImporting ? (
                <span>Guardando Preguntas...</span>
              ) : (
                <span>
                  Crear Presentación con {parsedQuestions.length} Pregunta(s)
                </span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 2: CREAR PRESENTACIÓN MANUAL                                    */}
      {/* ===================================================================== */}
      <Modal
        isOpen={isCreatingModal}
        onClose={() => setIsCreatingModal(false)}
        title="Crear Nueva Presentación"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePresentation} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#ECEBE4] mb-1">
              Título de la Presentación
            </label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ej. Procedimientos de Seguridad en Faena"
              className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFC72C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#ECEBE4] mb-1">
              Categoría
            </label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFC72C]"
            >
              <option value="Presentaciones">Presentaciones</option>
              <option value="Capacitación">Capacitación</option>
              <option value="Seguridad">Seguridad / LOTO</option>
              <option value="Operaciones">Operaciones Faena</option>
              <option value="Cultura">Cultura y Clima</option>
              <option value="Inducción">Inducción</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#ECEBE4] mb-1">
              Tipo de Dinámica
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full bg-[#001E32] border border-[#425563] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#FFC72C]"
            >
              <option value="quiz">
                🎮 Quiz Gamificado (Puntos, tiempo y podio)
              </option>
              <option value="interactive_presentation">
                📊 Presentación Interactiva (Sondeos y feedback sin podio)
              </option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsCreatingModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#ECEBE4]/70 hover:bg-[#425563]/30 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newTitle.trim()}
              className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-5 rounded-xl transition shadow disabled:opacity-50"
            >
              {isSubmitting ? "Creando..." : "Crear Presentación"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 3: CONFIRMACIÓN DE ELIMINACIÓN (SIN ALERT/CONFIRM NATIVO)        */}
      {/* ===================================================================== */}
      <Modal
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        title="Confirmar Eliminación"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center p-2">
          <div className="w-12 h-12 rounded-full bg-[#B7312C]/20 border border-[#B7312C] text-[#B7312C] mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              ¿Eliminar esta presentación?
            </h4>
            <p className="text-xs text-[#ECEBE4]/70 mt-1">
              Esta acción no se puede deshacer. Se eliminarán todas las preguntas y estadísticas asociadas.
            </p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeleteTargetId(null)}
              className="px-4 py-2 bg-[#001E32] border border-[#425563] text-[#ECEBE4] font-bold text-xs rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-[#B7312C] hover:bg-[#962622] text-white font-bold text-xs rounded-xl shadow"
            >
              Sí, Eliminar
            </button>
          </div>
        </div>
      </Modal>

      {/* ===================================================================== */}
      {/* MODAL 4: VISUALIZAR CÓDIGO QR PARA UNIRSE DIRECTO                     */}
      {/* ===================================================================== */}
      <Modal
        isOpen={Boolean(qrModalUrl)}
        onClose={() => setQrModalUrl(null)}
        title="Escanear Código QR para Unirse"
        maxWidth="sm"
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4 text-center">
          {qrModalUrl && (
            <img
              src={qrModalUrl}
              alt="Código QR de la Sesión"
              className="w-64 h-64 rounded-2xl border-4 border-[#FFC72C] shadow-2xl"
            />
          )}
          <p className="text-xs text-[#ECEBE4]">
            Pide a los asistentes apuntar la cámara de su teléfono para unirse directamente sin escribir el PIN.
          </p>
          <button
            type="button"
            onClick={() => setQrModalUrl(null)}
            className="w-full bg-[#FFC72C] text-[#001E32] font-black py-2 rounded-xl text-xs"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}
