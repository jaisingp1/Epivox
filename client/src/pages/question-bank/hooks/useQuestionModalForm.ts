import React, { useState } from "react";
import { BankQuestion, QuestionFolder } from "../types";

interface UseQuestionModalFormProps {
  currentFolderId: number | null;
  folders: QuestionFolder[];
  onRefresh: () => Promise<void>;
  onClearDeleteConfirm: () => void;
}

export function useQuestionModalForm({
  currentFolderId,
  folders,
  onRefresh,
  onClearDeleteConfirm,
}: UseQuestionModalFormProps) {
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(
    null,
  );
  const [qText, setQText] = useState("");
  const [qType, setQType] = useState("multiple_choice");
  const [qTimeLimit, setQTimeLimit] = useState(30);
  const [qPoints, setQPoints] = useState(1000);
  const [qExplanation, setQExplanation] = useState("");
  const [qOptions, setQOptions] = useState<
    Array<{ id: string; text: string; is_correct: boolean }>
  >([
    { id: "opt-1", text: "", is_correct: true },
    { id: "opt-2", text: "", is_correct: false },
    { id: "opt-3", text: "", is_correct: false },
    { id: "opt-4", text: "", is_correct: false },
  ]);

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
        setQOptions(
          Array.isArray(parsed) && parsed.length > 0
            ? parsed
            : [
                { id: "opt-1", text: "", is_correct: true },
                { id: "opt-2", text: "", is_correct: false },
              ],
        );
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
    if (!targetFolder) return;

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
      await onRefresh();
    } catch (err) {
      console.error("Error guardando pregunta:", err);
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await fetch(`/api/epivox/bank/questions/${id}`, { method: "DELETE" });
      await onRefresh();
      onClearDeleteConfirm();
    } catch (err) {
      console.error("Error al eliminar pregunta:", err);
    }
  };

  return {
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
  };
}
