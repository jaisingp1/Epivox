export interface PresentationItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  activity_type: string;
  questions_count?: number;
  default_time_limit: number;
  created_at?: string;
  updated_at: string;
  owner_username?: string;
  owner_name?: string | null;
  my_access?: "owner" | "admin" | "editor" | "template";
}

export interface ActiveSessionData {
  id: number;
  pin: string;
  status: string;
  current_question_index: number;
  current_step: string;
  activity_title?: string;
  activity_id: number;
}

export interface ParticipantInfo {
  id: number;
  nickname: string;
  department: string | null;
  score: number;
}

export interface ParsedExcelQuestion {
  questionText: string;
  questionType: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
  correctOptionIndex: number;
  timeLimit: number;
  pointsBase: number;
  explanation: string;
}

export interface SessionQuestionItem {
  id: number;
  question_text: string;
  question_type: string;
  options_json: string;
  time_limit: number;
}
