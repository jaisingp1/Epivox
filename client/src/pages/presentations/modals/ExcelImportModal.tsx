import { useState } from "react";
import {
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  Gamepad2,
  Presentation,
} from "lucide-react";
import Modal from "../../../components/Modal";
import type { ParsedExcelQuestion } from "../types";
import { parseExcelFile } from "../utils/excelHelper";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onImportSuccess: () => Promise<void>;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onDownloadTemplate,
  onImportSuccess,
}: ExcelImportModalProps) {
  const [excelTitle, setExcelTitle] = useState("");
  const [excelCategory, setExcelCategory] = useState("Presentaciones");
  const [excelType, setExcelType] = useState<
    "quiz" | "interactive_presentation"
  >("quiz");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedExcelQuestion[]>(
    [],
  );
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);

  const handleResetAndClose = () => {
    setParsedQuestions([]);
    setExcelFileName(null);
    setExcelTitle("");
    setExcelError(null);
    setImportSuccessMsg(null);
    setIsDraggingExcel(false);
    onClose();
  };

  const handleFile = async (file: File) => {
    setExcelError(null);
    setExcelFileName(file.name);
    if (!excelTitle) {
      setExcelTitle(file.name.replace(/\.[^/.]+$/, ""));
    }
    try {
      const parsed = await parseExcelFile(file, excelType);
      setParsedQuestions(parsed);
    } catch (err) {
      console.error("Error al procesar archivo Excel:", err);
      setExcelError(
        err instanceof Error
          ? err.message
          : "Error al procesar el archivo Excel. Asegúrate de usar un formato válido .xlsx o .csv.",
      );
    }
  };

  const handleExcelFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

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
      setTimeout(async () => {
        handleResetAndClose();
        await onImportSuccess();
      }, 1500);
    } catch (err) {
      console.error("Error al importar preguntas:", err);
      setExcelError("Error al guardar preguntas en el servidor.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Importación Masiva de Preguntas desde Excel"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Paso 1: Descargar Excel Modelo */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
              Paso 1: Descargar Plantilla Modelo
            </span>
            <p className="text-xs text-[var(--text-subtle)]">
              Descarga nuestro formato oficial con ejemplos de trivia y
              preguntas abiertas listos para rellenar.
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="bg-[#48A9C5] hover:bg-[#3996B1] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Plantilla (.xlsx)</span>
          </button>
        </div>

        {/* Paso 2: Configuración de la Actividad y Carga de Archivo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Título de la Presentación
            </label>
            <input
              type="text"
              value={excelTitle}
              onChange={(e) => setExcelTitle(e.target.value)}
              placeholder="Ej. Cuestionario de Seguridad Faena"
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Categoría
            </label>
            <select
              value={excelCategory}
              onChange={(e) => setExcelCategory(e.target.value)}
              className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C]"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
              Modo de la Dinámica
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExcelType("quiz")}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  excelType === "quiz"
                    ? "bg-[var(--surface-subtle)] border-[#FFC72C] ring-1 ring-[#FFC72C]"
                    : "bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--text-subtle)]"
                }`}
              >
                <Gamepad2
                  className={`w-5 h-5 ${
                    excelType === "quiz"
                      ? "text-[#FFC72C]"
                      : "text-[var(--text-muted)]"
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-[var(--text-main)] block">
                    Modo Trivia (Gamificación)
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    Puntajes por velocidad, rachas y podio final
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setExcelType("interactive_presentation")}
                className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  excelType === "interactive_presentation"
                    ? "bg-[var(--surface-subtle)] border-[#48A9C5] ring-1 ring-[#48A9C5]"
                    : "bg-[var(--surface-card)] border-[var(--border-subtle)] text-[var(--text-subtle)]"
                }`}
              >
                <Presentation
                  className={`w-5 h-5 ${
                    excelType === "interactive_presentation"
                      ? "text-[#48A9C5]"
                      : "text-[var(--text-muted)]"
                  }`}
                />
                <div>
                  <span className="text-xs font-bold text-[var(--text-main)] block">
                    Modo Presentación
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)]">
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
                handleFile(file);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center transition ${
              isDraggingExcel
                ? "border-[#FFC72C] bg-[#FFC72C]/10 scale-[1.01]"
                : "border-[var(--border-subtle)] hover:border-[#FFC72C] bg-[var(--surface-subtle)]"
            }`}
          >
            <label
              htmlFor="presentations-excel-file-input"
              className="cursor-pointer flex flex-col items-center w-full"
            >
              <Upload
                className={`w-8 h-8 mb-2 transition ${
                  isDraggingExcel
                    ? "text-[#FFC72C] animate-bounce"
                    : "text-[#48A9C5]"
                }`}
              />
              <span className="text-xs font-bold text-[var(--text-main)] text-center">
                {excelFileName
                  ? excelFileName
                  : isDraggingExcel
                    ? "¡Suelta tu archivo Excel aquí!"
                    : "Haz clic o arrastra y suelta aquí tu archivo Excel"}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] mt-1">
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
            <div className="p-3 bg-[#B7312C]/20 border border-[#B7312C] rounded-xl flex items-center gap-2 text-xs text-[var(--text-main)]">
              <AlertCircle className="w-4 h-4 text-[#B7312C] shrink-0" />
              <span>{excelError}</span>
            </div>
          )}
        </div>

        {parsedQuestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#4C8C2B] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#4C8C2B]" />
                {parsedQuestions.length} Preguntas Detectadas Listas para
                Importar
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-[var(--border-subtle)] rounded-xl p-3 bg-[var(--surface-subtle)]">
              {parsedQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[var(--surface-card)] rounded-lg border border-[var(--border-subtle)] text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#FFC72C]">
                      #{idx + 1} {q.questionText}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-subtle)]">
                      {q.questionType} &bull; {q.timeLimit}s
                    </span>
                  </div>
                  {q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-subtle)]">
                      {q.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className={`px-2 py-0.5 rounded ${
                            opt.is_correct
                              ? "bg-[#4C8C2B]/20 text-[#4C8C2B] border border-[#4C8C2B]/40 font-bold"
                              : "bg-[var(--surface-subtle)]"
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

        <div className="flex justify-end gap-3 pt-2 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={
              isImporting || parsedQuestions.length === 0 || !excelTitle.trim()
            }
            onClick={handleSaveImportedExcel}
            className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-6 rounded-xl transition shadow disabled:opacity-50 flex items-center gap-2 cursor-pointer"
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
  );
}
