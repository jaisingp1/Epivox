import React, { useRef } from "react";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Modal from "../../../components/Modal";
import { QuestionFolder, ParsedBankExcelQuestion } from "../types";

interface BankExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  folders: QuestionFolder[];
  excelTargetFolderId: number | null;
  setExcelTargetFolderId: (id: number | null) => void;
  excelFileName: string | null;
  parsedQuestions: ParsedBankExcelQuestion[];
  excelError: string | null;
  isImporting: boolean;
  importSuccessMsg: string | null;
  onFileSelect: (file: File) => void;
  onConfirmImport: () => Promise<void>;
  onDownloadTemplate: () => void;
}

export const BankExcelImportModal: React.FC<BankExcelImportModalProps> = ({
  isOpen,
  onClose,
  folders,
  excelTargetFolderId,
  setExcelTargetFolderId,
  excelFileName,
  parsedQuestions,
  excelError,
  isImporting,
  importSuccessMsg,
  onFileSelect,
  onConfirmImport,
  onDownloadTemplate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Importación Masiva de Preguntas (.xlsx)"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Selector de Carpeta de Destino */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-main)] mb-1">
            Carpeta de Destino en el Banco
          </label>
          <select
            value={excelTargetFolderId || ""}
            onChange={(e) =>
              setExcelTargetFolderId(
                e.target.value ? Number(e.target.value) : null,
              )
            }
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-[#FFC72C] cursor-pointer"
          >
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                📁 {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Zona de Arrastrar o Seleccionar Archivo */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[var(--border-subtle)] hover:border-[#FFC72C] bg-[var(--surface-subtle)] rounded-2xl p-6 text-center cursor-pointer transition space-y-2"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileSelect(e.target.files[0]);
              }
            }}
          />
          <Upload className="w-8 h-8 text-[#FFC72C] mx-auto" />
          <p className="text-xs font-bold text-[var(--text-main)]">
            {excelFileName ? (
              <span className="text-[#FFC72C]">{excelFileName}</span>
            ) : (
              "Arrastra tu archivo Excel aquí o haz clic para seleccionarlo"
            )}
          </p>
          <p className="text-[11px] text-[var(--text-muted)]">
            Acepta formato estándar de Epivox (.xlsx). ¿No tienes la plantilla?{" "}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDownloadTemplate();
              }}
              className="text-[#FFC72C] hover:underline font-bold"
            >
              Descárgala aquí
            </button>
          </p>
        </div>

        {excelError && (
          <div className="flex items-center gap-2 p-3 bg-[#B7312C]/10 border border-[#B7312C]/30 rounded-xl text-xs text-[#B7312C]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{excelError}</span>
          </div>
        )}

        {importSuccessMsg && (
          <div className="flex items-center gap-2 p-3 bg-[#4C8C2B]/10 border border-[#4C8C2B]/30 rounded-xl text-xs text-[#4C8C2B]">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {/* Vista previa de preguntas cargadas */}
        {parsedQuestions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span className="font-bold uppercase tracking-wider text-[var(--text-main)]">
                Vista Previa ({parsedQuestions.length} preguntas detectadas)
              </span>
              <span className="text-[#4C8C2B] font-bold">
                Listas para importar
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[var(--surface-subtle)] p-2 rounded-xl border border-[var(--border-subtle)]">
              {parsedQuestions.map((pq, idx) => (
                <div
                  key={idx}
                  className="bg-[var(--surface-card)] p-2.5 rounded-lg border border-[var(--border-subtle)] text-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileSpreadsheet className="w-4 h-4 text-[#48A9C5] shrink-0" />
                    <span className="font-bold text-[var(--text-main)] truncate">
                      #{idx + 1} {pq.questionText}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-[var(--surface-subtle)] text-[var(--text-muted)] shrink-0">
                    {pq.questionType}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[var(--text-subtle)] hover:bg-[var(--surface-hover)] transition cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            disabled={parsedQuestions.length === 0 || isImporting}
            onClick={onConfirmImport}
            className="bg-[#FFC72C] hover:bg-[#E6B327] disabled:opacity-50 text-[#001E32] font-black text-xs py-2 px-5 rounded-xl transition shadow flex items-center gap-1.5 cursor-pointer"
          >
            <span>
              {isImporting
                ? "Importando..."
                : `Importar ${parsedQuestions.length} Pregunta(s)`}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
