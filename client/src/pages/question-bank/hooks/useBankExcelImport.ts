import { useState } from "react";
import { QuestionFolder, ParsedBankExcelQuestion } from "../types";
import { parseBankExcel } from "../utils/bankExcelHelper";

interface UseBankExcelImportProps {
  folders: QuestionFolder[];
  currentFolderId: number | null;
  onRefresh: () => Promise<void>;
}

export function useBankExcelImport({
  folders,
  currentFolderId,
  onRefresh,
}: UseBankExcelImportProps) {
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelTargetFolderId, setExcelTargetFolderId] = useState<number | null>(
    null,
  );
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [parsedExcelQuestions, setParsedExcelQuestions] = useState<
    ParsedBankExcelQuestion[]
  >([]);
  const [excelError, setExcelError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const openExcelModal = () => {
    setExcelTargetFolderId(currentFolderId || folders[0]?.id || null);
    setParsedExcelQuestions([]);
    setExcelFileName(null);
    setExcelError(null);
    setIsExcelModalOpen(true);
  };

  const handleExcelFileSelect = (file: File) => {
    setExcelError(null);
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const buffer = evt.target?.result;
      if (buffer) {
        const result = parseBankExcel(buffer as ArrayBuffer);
        if (result.error) {
          setExcelError(result.error);
        } else {
          setParsedExcelQuestions(result.questions);
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmExcelImport = async () => {
    const targetFolder =
      excelTargetFolderId || currentFolderId || folders[0]?.id;
    if (!targetFolder || parsedExcelQuestions.length === 0) return;

    setIsImporting(true);
    setExcelError(null);
    try {
      const res = await fetch("/api/epivox/bank/questions/import-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder_id: targetFolder,
          questions: parsedExcelQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setExcelError(data.error || "Error al importar preguntas");
        return;
      }

      setImportSuccessMsg(
        `¡${data.count || parsedExcelQuestions.length} preguntas importadas exitosamente!`,
      );
      await onRefresh();

      setTimeout(() => {
        setIsExcelModalOpen(false);
        setParsedExcelQuestions([]);
        setExcelFileName(null);
        setImportSuccessMsg(null);
      }, 1500);
    } catch (err) {
      setExcelError("Error de conexión al importar preguntas");
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isExcelModalOpen,
    setIsExcelModalOpen,
    excelTargetFolderId,
    setExcelTargetFolderId,
    excelFileName,
    parsedExcelQuestions,
    excelError,
    isImporting,
    importSuccessMsg,
    openExcelModal,
    handleExcelFileSelect,
    handleConfirmExcelImport,
  };
}
