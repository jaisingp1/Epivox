import * as XLSX from "xlsx";
import type { ParsedExcelQuestion } from "../types";

export function getQuestionTypeBadge(type: string): {
  label: string;
  color: string;
} {
  switch (type) {
    case "multiple_choice":
      return {
        label: "Opción Múltiple",
        color: "bg-[#48A9C5]/20 text-[#48A9C5] border-[#48A9C5]/40",
      };
    case "true_false":
      return {
        label: "Verdadero o Falso",
        color: "bg-[#FFC72C]/20 text-[#FFC72C] border-[#FFC72C]/40",
      };
    case "word_cloud":
      return {
        label: "Nube de Palabras",
        color: "bg-[#86C8BC]/20 text-[#86C8BC] border-[#86C8BC]/40",
      };
    case "open_ended":
      return {
        label: "Pregunta Abierta",
        color: "bg-[#86C8BC]/20 text-[#86C8BC] border-[#86C8BC]/40",
      };
    case "rating":
      return {
        label: "Calificación (Estrellas)",
        color: "bg-[#FFC72C]/20 text-[#FFC72C] border-[#FFC72C]/40",
      };
    case "ranking":
      return {
        label: "Ranking / Ordenar",
        color: "bg-[#B7312C]/20 text-[#B7312C] border-[#B7312C]/40",
      };
    case "likert":
      return {
        label: "Escala de Valoración",
        color: "bg-[#4C8C2B]/20 text-[#4C8C2B] border-[#4C8C2B]/40",
      };
    default:
      return {
        label: type || "Pregunta",
        color: "bg-[#425563]/30 text-[#ECEBE4] border-[#425563]",
      };
  }
}

export function downloadExcelTemplate(): void {
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
}

export function parseExcelFile(
  file: File,
  excelType: "quiz" | "interactive_presentation",
): Promise<ParsedExcelQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const buffer = evt.target?.result;
        const wb = XLSX.read(buffer, { type: "binary" });
        const targetSheetName =
          wb.SheetNames.find((s) => s.toLowerCase().includes("plantilla")) ||
          wb.SheetNames[0];
        const ws = wb.Sheets[targetSheetName];
        const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          throw new Error(
            "El archivo Excel no contiene filas de datos para importar.",
          );
        }

        const parsed: ParsedExcelQuestion[] = [];
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
          } else if (
            rawType.includes("true") ||
            rawType.includes("verdadero")
          ) {
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

        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}
