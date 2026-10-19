import React from "react";
import { Plus, FileSpreadsheet, Download, Upload } from "lucide-react";

interface BankHeaderActionsProps {
  onExportCurrentFolder: () => void;
  onDownloadTemplate: () => void;
  onOpenExcelModal: () => void;
  onOpenQuestionModal: () => void;
}

export const BankHeaderActions: React.FC<BankHeaderActionsProps> = ({
  onExportCurrentFolder,
  onDownloadTemplate,
  onOpenExcelModal,
  onOpenQuestionModal,
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={onExportCurrentFolder}
        className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
      >
        <FileSpreadsheet className="w-4 h-4 text-[#48A9C5]" />
        <span>Exportar Carpeta</span>
      </button>
      <button
        type="button"
        onClick={onDownloadTemplate}
        className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
      >
        <Download className="w-4 h-4 text-[#FFC72C]" />
        <span>Plantilla Excel</span>
      </button>
      <button
        type="button"
        onClick={onOpenExcelModal}
        className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2 px-3.5 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
      >
        <Upload className="w-4 h-4 text-[#48A9C5]" />
        <span>Importar Excel</span>
      </button>
      <button
        type="button"
        onClick={onOpenQuestionModal}
        className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2 px-4 rounded-xl transition shadow flex items-center gap-1.5 active:scale-95 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>Nueva Pregunta</span>
      </button>
    </div>
  );
};
