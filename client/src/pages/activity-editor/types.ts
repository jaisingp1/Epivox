import type { LucideIcon } from "lucide-react";
import {
  Layers,
  CheckCircle2,
  Star,
  Sparkles,
  Sliders,
  HelpCircle,
  BarChart3,
} from "lucide-react";

export interface OptionItem {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuestionItem {
  id: number;
  activity_id: number;
  sort_order: number;
  question_text: string;
  question_type: string;
  time_limit: number;
  points_base: number;
  media_type: string;
  media_url: string | null;
  reveal_step_count: number;
  chart_type: string;
  options_json: string;
  correct_answer_value: string | null;
  explanation_text: string | null;
}

export interface ActivityData {
  id: number;
  title: string;
  description: string | null;
  category: string;
  activity_type: string;
  theme_id: number | null;
  default_time_limit: number;
  default_points: number;
  speed_bonus_enabled: boolean;
  negative_points_enabled: boolean;
  questions?: QuestionItem[];
}

export interface QuestionTypeDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const QUESTION_TYPES: QuestionTypeDefinition[] = [
  { id: "multiple_choice", label: "Opción Múltiple (Quiz)", icon: Layers },
  { id: "true_false", label: "Verdadero o Falso", icon: CheckCircle2 },
  { id: "rating", label: "Calificación con Estrellas (1-5 ⭐)", icon: Star },
  { id: "word_cloud", label: "Nube de Palabras", icon: Sparkles },
  { id: "likert_scale", label: "Escala Likert (1-5)", icon: Sliders },
  { id: "open_text", label: "Pregunta Abierta", icon: HelpCircle },
  { id: "ranking", label: "Ordenamiento / Ranking", icon: BarChart3 },
];

export interface ParsedExcelQuestion {
  questionText: string;
  questionType: string;
  options: Array<{ id: string; text: string; is_correct: boolean }>;
  timeLimit: number;
  pointsBase: number;
  explanation: string;
}
