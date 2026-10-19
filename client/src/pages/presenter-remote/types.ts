export interface QuestionData {
  id: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  explanation_text?: string;
}

export type RemoteQuestionStatus = "completed" | "current" | "next" | "pending";
