export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
  isCorrect?: boolean;
}

export interface QuestionData {
  id: number;
  question_text: string;
  question_type: string;
  chart_type?: string;
  time_limit: number;
  options_json: string;
  explanation_text?: string;
  correct_answer_value?: string;
}

export interface ParticipantData {
  id: number;
  nickname: string;
  avatar_seed: string;
  score: number;
  current_streak: number;
}

export interface RawAnswerItem {
  id: number;
  nickname: string;
  answer_payload: string;
  department: string | null;
}

export interface SessionData {
  id: number;
  pin: string;
  status: string;
  current_question_index: number;
  session_mode?: string;
}

export interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
}

export const OPTION_COLORS = [
  "#FFC72C", // Epiroc Yellow
  "#48A9C5", // Epiroc Light Blue
  "#4C8C2B", // Epiroc Green
  "#B7312C", // Epiroc Red
  "#612C51", // Epiroc Violet
  "#D86018", // Epiroc Orange
  "#86C8BC", // Epiroc Electric Green
  "#77746E", // Epiroc Dark Grey
];
