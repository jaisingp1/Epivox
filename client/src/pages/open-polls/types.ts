import {
  Cloud,
  BarChart3,
  TrendingUp,
  LayoutGrid,
  PieChart,
  LucideIcon,
} from "lucide-react";

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

export interface ChartTypeOption {
  id: string;
  name: string;
  desc: string;
  icon: LucideIcon;
}

export const CHART_TYPES: ChartTypeOption[] = [
  {
    id: "word_cloud",
    name: "Nube de Palabras",
    desc: "Palabras con tamaño según frecuencia",
    icon: Cloud,
  },
  {
    id: "bar",
    name: "Barras",
    desc: "Histograma de conteo por respuesta",
    icon: BarChart3,
  },
  {
    id: "line",
    name: "Líneas",
    desc: "Distribución continua o tendencia",
    icon: TrendingUp,
  },
  {
    id: "cards",
    name: "Muro de Ideas",
    desc: "Tarjetas en vivo tipo brainstorming",
    icon: LayoutGrid,
  },
  {
    id: "donut",
    name: "Dona Circular",
    desc: "Proporciones porcentuales",
    icon: PieChart,
  },
];

export interface RawAnswerItem {
  id: number;
  nickname: string;
  answer_payload: string;
  department: string | null;
}

export interface DraftQuestion {
  id: string;
  questionText: string;
  chartType: string;
}

export interface SessionQuestion {
  id: number;
  question_text: string;
  question_type: string;
  chart_type?: string;
  time_limit: number;
}
