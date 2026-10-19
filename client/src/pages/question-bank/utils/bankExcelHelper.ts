import * as XLSX from "xlsx";
import { BankQuestion, ParsedBankExcelQuestion } from "../types";

export function downloadBankExcelTemplate(): void {
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
}

export function parseBankExcel(buffer: ArrayBuffer | string): {
  questions: ParsedBankExcelQuestion[];
  error: string | null;
} {
  try {
    const wb = XLSX.read(buffer, { type: "binary" });
    const targetSheetName =
      wb.SheetNames.find((s) => s.toLowerCase().includes("plantilla")) ||
      wb.SheetNames[0];
    const ws = wb.Sheets[targetSheetName];
    const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (rows.length < 2) {
      return {
        questions: [],
        error: "El archivo Excel no contiene filas de datos para importar.",
      };
    }

    const parsed: ParsedBankExcelQuestion[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || !row[0]) continue;

      const questionText = String(row[0] || "").trim();
      if (!questionText) continue;

      let questionType = String(row[1] || "multiple_choice")
        .trim()
        .toLowerCase();
      if (
        ![
          "multiple_choice",
          "true_false",
          "rating",
          "word_cloud",
          "likert",
          "open_ended",
          "ranking",
        ].includes(questionType)
      ) {
        questionType = "multiple_choice";
      }

      const opt1 = String(row[2] || "").trim();
      const opt2 = String(row[3] || "").trim();
      const opt3 = String(row[4] || "").trim();
      const opt4 = String(row[5] || "").trim();
      const rawCorrect = String(row[6] || "1").trim();
      const timeLimit = parseInt(String(row[7] || "30"), 10) || 30;
      const pointsBase = parseInt(String(row[8] || "1000"), 10) || 0;
      const explanation = String(row[9] || "").trim();

      const options: Array<{ id: string; text: string; is_correct: boolean }> =
        [];

      if (questionType === "true_false") {
        const correctIndex = parseInt(rawCorrect, 10) || 1;
        options.push({
          id: "opt-1",
          text: "Verdadero",
          is_correct: correctIndex === 1,
        });
        options.push({
          id: "opt-2",
          text: "Falso",
          is_correct: correctIndex === 2,
        });
      } else if (
        questionType === "multiple_choice" ||
        questionType === "ranking"
      ) {
        const rawOptions = [opt1, opt2, opt3, opt4].filter(Boolean);
        const correctNum = parseInt(rawCorrect, 10) || 1;

        if (rawOptions.length < 2) {
          rawOptions.push("Alternativa A");
          rawOptions.push("Alternativa B");
        }

        rawOptions.forEach((optText, idx) => {
          options.push({
            id: `opt-${idx + 1}`,
            text: optText,
            is_correct:
              questionType === "multiple_choice"
                ? idx + 1 === correctNum
                : false,
          });
        });
      }

      parsed.push({
        questionText,
        questionType,
        options,
        timeLimit,
        pointsBase,
        explanation,
      });
    }

    if (parsed.length === 0) {
      return {
        questions: [],
        error: "No se pudieron extraer preguntas válidas del archivo.",
      };
    }

    return { questions: parsed, error: null };
  } catch (err) {
    return {
      questions: [],
      error: `Error procesando archivo Excel: ${String(err)}`,
    };
  }
}

export function exportFolderToExcel(
  folderName: string,
  questions: BankQuestion[],
): void {
  const headers = [
    "ID",
    "Pregunta",
    "Tipo",
    "Opciones",
    "Respuesta_Correcta",
    "Tiempo_Segundos",
    "Puntos",
    "Explicacion",
    "Carpeta",
  ];

  const rows = questions.map((q) => {
    let optionsText = "";
    try {
      const opts = JSON.parse(q.options_json || "[]");
      optionsText = opts.map((o: { text: string }) => o.text).join(" | ");
    } catch {
      optionsText = q.options_json;
    }

    return [
      q.id,
      q.question_text,
      q.question_type,
      optionsText,
      q.correct_answer_value || "",
      q.time_limit,
      q.points_base,
      q.explanation_text || "",
      q.folder_name || folderName,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Preguntas");
  XLSX.writeFile(wb, `Banco_Preguntas_${folderName.replace(/\s+/g, "_")}.xlsx`);
}
