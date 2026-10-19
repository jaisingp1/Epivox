import React, { useState, useEffect, useMemo, useCallback } from "react";
import PageHeader from "../../components/PageHeader";
import { QuestionFolder, BankQuestion } from "./types";
import {
  downloadBankExcelTemplate,
  exportFolderToExcel,
} from "./utils/bankExcelHelper";
import { FolderNavigation } from "./components/FolderNavigation";
import { QuestionBankGrid } from "./components/QuestionBankGrid";
import { BankHeaderActions } from "./components/BankHeaderActions";
import { FolderModal } from "./modals/FolderModal";
import { BankQuestionModal } from "./modals/BankQuestionModal";
import { BankExcelImportModal } from "./modals/BankExcelImportModal";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";
import { useBankExcelImport } from "./hooks/useBankExcelImport";
import { useQuestionModalForm } from "./hooks/useQuestionModalForm";

export const QuestionBankPage: React.FC = () => {
  // Datos principales
  const [folders, setFolders] = useState<QuestionFolder[]>([]);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal para carpetas
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<QuestionFolder | null>(
    null,
  );
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderColor, setFolderColor] = useState("#FFC72C");
  const [folderParentId, setFolderParentId] = useState<number | null>(null);

  // Modal confirmación eliminar
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "folder" | "question";
    id: number;
    title: string;
  } | null>(null);

  // Carga de datos
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

  const refreshAll = useCallback(async () => {
    await Promise.all([loadFolders(), loadQuestions(currentFolderId)]);
  }, [loadFolders, loadQuestions, currentFolderId]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Hook para gestión de formularios de preguntas
  const {
    isQuestionModalOpen,
    setIsQuestionModalOpen,
    editingQuestion,
    qText,
    setQText,
    qType,
    setQType,
    qTimeLimit,
    setQTimeLimit,
    qPoints,
    setQPoints,
    qExplanation,
    setQExplanation,
    qOptions,
    setQOptions,
    handleOpenQuestionModal,
    handleSaveQuestion,
    handleDeleteQuestion,
  } = useQuestionModalForm({
    currentFolderId,
    folders,
    onRefresh: refreshAll,
    onClearDeleteConfirm: () => setDeleteConfirm(null),
  });

  // Hook para importación Excel
  const {
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
  } = useBankExcelImport({
    folders,
    currentFolderId,
    onRefresh: refreshAll,
  });

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
      curr = curr.parent_id
        ? folders.find((f) => f.id === curr?.parent_id) || null
        : null;
    }
    return trail;
  }, [currentFolder, folders]);

  // Subcarpetas de la carpeta activa
  const displayedSubfolders = useMemo(() => {
    return folders.filter((f) => f.parent_id === currentFolderId);
  }, [folders, currentFolderId]);

  // Preguntas filtradas
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchType = typeFilter === "all" || q.question_type === typeFilter;
      const search = searchQuery.toLowerCase().trim();
      const matchSearch =
        !search ||
        q.question_text.toLowerCase().includes(search) ||
        (q.explanation_text &&
          q.explanation_text.toLowerCase().includes(search)) ||
        (q.folder_name && q.folder_name.toLowerCase().includes(search));
      return matchType && matchSearch;
    });
  }, [questions, typeFilter, searchQuery]);

  // Gestión de carpetas
  const handleOpenFolderModal = (
    folder?: QuestionFolder,
    defaultParentId?: number | null,
  ) => {
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
      setFolderParentId(
        defaultParentId !== undefined ? defaultParentId : currentFolderId,
      );
    }
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      const payload = {
        name: folderName.trim(),
        description: folderDescription.trim() || null,
        color: folderColor,
        parent_id: folderParentId,
      };

      if (editingFolder) {
        await fetch(`/api/epivox/bank/folders/${editingFolder.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/epivox/bank/folders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
      await refreshAll();
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error al eliminar carpeta:", err);
    }
  };

  const handleExportCurrentFolder = () => {
    exportFolderToExcel(currentFolder ? currentFolder.name : "Raiz", questions);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banco de Preguntas"
        description="Biblioteca corporativa organizada por carpetas temáticas. Reutiliza e importa preguntas en cualquier presentación o quiz."
        breadcrumbs={[
          { label: "Epivox", href: "/" },
          { label: "Banco de Preguntas" },
        ]}
        actions={
          <BankHeaderActions
            onExportCurrentFolder={handleExportCurrentFolder}
            onDownloadTemplate={downloadBankExcelTemplate}
            onOpenExcelModal={openExcelModal}
            onOpenQuestionModal={() => handleOpenQuestionModal()}
          />
        }
      />

      <FolderNavigation
        currentFolder={currentFolder}
        folderTrail={folderTrail}
        displayedSubfolders={displayedSubfolders}
        onSelectFolder={setCurrentFolderId}
        onOpenFolderModal={handleOpenFolderModal}
        onDeleteFolderConfirm={(f) =>
          setDeleteConfirm({ type: "folder", id: f.id, title: f.name })
        }
      />

      <QuestionBankGrid
        questions={filteredQuestions}
        isLoading={isLoading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        onEditQuestion={handleOpenQuestionModal}
        onDeleteQuestionConfirm={(q) =>
          setDeleteConfirm({
            type: "question",
            id: q.id,
            title: q.question_text,
          })
        }
      />

      {/* Modales */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        editingFolder={editingFolder}
        folderName={folderName}
        setFolderName={setFolderName}
        folderDescription={folderDescription}
        setFolderDescription={setFolderDescription}
        folderColor={folderColor}
        setFolderColor={setFolderColor}
        handleSaveFolder={handleSaveFolder}
      />

      <BankQuestionModal
        isOpen={isQuestionModalOpen}
        onClose={() => setIsQuestionModalOpen(false)}
        editingQuestion={editingQuestion}
        qText={qText}
        setQText={setQText}
        qType={qType}
        setQType={setQType}
        qTimeLimit={qTimeLimit}
        setQTimeLimit={setQTimeLimit}
        qPoints={qPoints}
        setQPoints={setQPoints}
        qExplanation={qExplanation}
        setQExplanation={setQExplanation}
        qOptions={qOptions}
        setQOptions={setQOptions}
        hasFolders={folders.length > 0}
        onSave={handleSaveQuestion}
      />

      <BankExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        folders={folders}
        excelTargetFolderId={excelTargetFolderId}
        setExcelTargetFolderId={setExcelTargetFolderId}
        excelFileName={excelFileName}
        parsedQuestions={parsedExcelQuestions}
        excelError={excelError}
        isImporting={isImporting}
        importSuccessMsg={importSuccessMsg}
        onFileSelect={handleExcelFileSelect}
        onConfirmImport={handleConfirmExcelImport}
        onDownloadTemplate={downloadBankExcelTemplate}
      />

      <DeleteConfirmModal
        target={deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) {
            if (deleteConfirm.type === "folder") {
              handleDeleteFolder(deleteConfirm.id);
            } else {
              handleDeleteQuestion(deleteConfirm.id);
            }
          }
        }}
      />
    </div>
  );
};

export default QuestionBankPage;
