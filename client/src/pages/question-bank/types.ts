export interface QuestionFolder {
  id: number;
  name: string;
  parent_id: number | null;
  created_by_user_id: number;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  questions_count?: number;
  subfolders_count?: number;
  creator_name?: string;
}

export interface BankQuestion {
  id: number;
  folder_id: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  points_base: number;
  chart_type: string;
  options_json: string;
  correct_answer_value: string | null;
  explanation_text: string | null;
  created_by_user_id: number;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  folder_name?: string;
}

export interface ParsedBankExcelQuestion {
  questionText: string;
  questionType: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
  timeLimit: number;
  pointsBase: number;
  explanation: string;
}

export const EPIROC_COLORS = [
  { label: "Amarillo Epiroc", value: "#FFC72C" },
  { label: "Azul Oscuro", value: "#001E32" },
  { label: "Azul Claro", value: "#48A9C5" },
  { label: "Verde Eléctrico", value: "#86C8BC" },
  { label: "Verde Seguridad", value: "#4C8C2B" },
  { label: "Gris Minero", value: "#425563" },
  { label: "Rojo Alerta", value: "#B7312C" },
];
