import { useState } from "react";
import {
  Upload,
  Download,
  AlertCircle,
  Plus,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import Modal from "../../../components/Modal";
import type { ParsedExcelQuestion } from "../types";
import { parseExcelFile } from "../utils/editorExcelHelper";

interface EditorExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onImportSuccess: (
    parsedQuestions: ParsedExcelQuestion[],
    mode: "append" | "replace",
  ) => void;
  currentSlideCount: number;
}

export default function EditorExcelModal({
  isOpen,
  onClose,
  onDownloadTemplate,
  onImportSuccess,
  currentSlideCount,
}: EditorExcelModalProps) {
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [parsedExcelQuestions, setParsedExcelQuestions] = useState<
    ParsedExcelQuestion[]
  >([]);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [isDraggingExcel, setIsDraggingExcel] = useState(false);

  const handleResetAndClose = () => {
    setParsedExcelQuestions([]);
    setExcelFileName(null);
    setExcelError(null);
    setIsDraggingExcel(false);
    onClose();
  };

  const handleFile = async (file: File) => {
    setExcelError(null);
    setExcelFileName(file.name);
    try {
      const parsed = await parseExcelFile(file);
      setParsedExcelQuestions(parsed);
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

  const handleConfirm = () => {
    if (parsedExcelQuestions.length === 0) return;
    onImportSuccess(parsedExcelQuestions, importMode);
    handleResetAndClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleResetAndClose}
      title="Subir Preguntas Masivas desde Excel"
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Paso 1: Descargar Plantilla Modelo */}
        <div className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-black text-[#FFC72C] uppercase tracking-wider block">
              Paso 1: Plantilla Modelo Oficial
            </span>
            <p className="text-xs text-[var(--text-subtle)]">
              Descarga el formato Excel (.xlsx) con ejemplos y la hoja de guía
              de tipos de pregunta.
            </p>
          </div>
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="bg-[#48A9C5] hover:bg-[#3996B1] text-[#001E32] font-black text-xs py-2.5 px-4 rounded-xl transition shadow-sm flex items-center gap-2 shrink-0 active:scale-95 cursor-pointer"
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
              htmlFor="editor-excel-upload-input"
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
              id="editor-excel-upload-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleExcelFileUpload}
              className="hidden"
            />
          </div>

          {excelError && (
            <div className="p-3 bg-[#B7312C]/10 border border-[#B7312C]/30 rounded-xl flex items-center gap-2 text-xs text-[#B7312C]">
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
                className={`p-3.5 rounded-xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
                  importMode === "append"
                    ? "bg-[var(--surface-subtle)] border-[#FFC72C] text-[var(--text-main)] shadow-sm"
                    : "bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
              >
                <Plus
                  className={`w-5 h-5 ${
                    importMode === "append"
                      ? "text-[#FFC72C]"
                      : "text-[var(--text-muted)]"
                  }`}
                />
                <div>
                  <span className="font-bold text-xs block text-[var(--text-main)]">
                    Añadir al final
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Conserva las {currentSlideCount} diapositivas actuales
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setImportMode("replace")}
                className={`p-3.5 rounded-xl border-2 text-left transition flex items-center gap-3 cursor-pointer ${
                  importMode === "replace"
                    ? "bg-[var(--surface-subtle)] border-[#B7312C] text-[var(--text-main)] shadow-sm"
                    : "bg-[var(--surface-subtle)] border-[var(--border-subtle)] text-[var(--text-muted)]"
                }`}
              >
                <RotateCcw
                  className={`w-5 h-5 ${
                    importMode === "replace"
                      ? "text-[#B7312C]"
                      : "text-[var(--text-muted)]"
                  }`}
                />
                <div>
                  <span className="font-bold text-xs block text-[var(--text-main)]">
                    Reemplazar existentes
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
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
                {parsedExcelQuestions.length} Preguntas Detectadas Listas para
                Importar
              </span>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 border border-[var(--border-subtle)] rounded-xl p-3 bg-[var(--surface-subtle)]">
              {parsedExcelQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[var(--surface-card)] rounded-lg border border-[var(--border-subtle)] text-xs space-y-1.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#FFC72C]">
                      #{idx + 1} {q.questionText}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-subtle)]">
                      {q.questionType} &bull; {q.timeLimit}s &bull;{" "}
                      {q.pointsBase} pts
                    </span>
                  </div>
                  {q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 text-[11px] text-[var(--text-subtle)]">
                      {q.options.map((opt, oIdx) => (
                        <span
                          key={oIdx}
                          className={`px-2 py-0.5 rounded ${
                            opt.is_correct
                              ? "bg-[#4C8C2B]/15 text-[#4C8C2B] border border-[#4C8C2B]/30 font-bold"
                              : "bg-[var(--surface-subtle)] text-[var(--text-muted)]"
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
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={parsedExcelQuestions.length === 0}
            onClick={handleConfirm}
            className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-6 rounded-xl transition shadow-sm disabled:opacity-40 flex items-center gap-2 active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>
              Importar {parsedExcelQuestions.length} Diapositiva(s) al Editor
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
