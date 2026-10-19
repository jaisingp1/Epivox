import {
  Clock,
  Award,
  BarChart3,
  PieChart,
  TrendingUp,
  LayoutGrid,
  Cloud,
  Zap,
} from "lucide-react";
import type { ActivityData, QuestionItem } from "../types";
import { QUESTION_TYPES } from "../types";

interface QuestionConfigSidebarProps {
  currentQuestion: QuestionItem | undefined;
  activity: ActivityData;
  onUpdateCurrentQuestion: (fields: Partial<QuestionItem>) => void;
  onUpdateActivity: (fields: Partial<ActivityData>) => void;
}

export default function QuestionConfigSidebar({
  currentQuestion,
  activity,
  onUpdateCurrentQuestion,
  onUpdateActivity,
}: QuestionConfigSidebarProps) {
  return (
    <aside className="w-80 bg-[var(--surface-card)] border-l border-[var(--border-subtle)] p-5 overflow-y-auto space-y-6 shrink-0">
      <div>
        <h3 className="text-xs font-black uppercase tracking-wider text-[#FFC72C] mb-4">
          Configuración de la Diapositiva
        </h3>

        {/* Question Type Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--text-subtle)]">
            Tipo de Pregunta
          </label>
          <select
            value={currentQuestion?.question_type || "multiple_choice"}
            onChange={(e) =>
              onUpdateCurrentQuestion({ question_type: e.target.value })
            }
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] text-[var(--text-main)] text-xs font-semibold rounded-xl p-3 focus:outline-none focus:border-[#FFC72C] cursor-pointer"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Time Limit */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--text-subtle)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#FFC72C]" />
            Límite de Tiempo
          </span>
          <span className="text-[#FFC72C] font-mono font-bold">
            {currentQuestion?.time_limit || 30}s
          </span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[10, 20, 30, 60].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => onUpdateCurrentQuestion({ time_limit: sec })}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentQuestion?.time_limit === sec
                  ? "bg-[#FFC72C] text-[#001E32] font-black shadow-sm"
                  : "bg-[var(--surface-subtle)] text-[var(--text-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]"
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Points Base */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--text-subtle)] flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-[#48A9C5]" />
            Puntuación Base
          </span>
          <span className="text-[#48A9C5] font-mono font-bold">
            {currentQuestion?.points_base || 1000} pts
          </span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[500, 1000, 2000].map((pts) => (
            <button
              key={pts}
              type="button"
              onClick={() => onUpdateCurrentQuestion({ points_base: pts })}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentQuestion?.points_base === pts
                  ? "bg-[#48A9C5] text-[#001E32] font-black shadow-sm"
                  : "bg-[var(--surface-subtle)] text-[var(--text-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]"
              }`}
            >
              {pts}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Display Style */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-[var(--text-subtle)] flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-[#4C8C2B]" />
          Tipo de Gráfico Predeterminado
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { type: "bar", label: "Barras", icon: BarChart3 },
            { type: "donut", label: "Dona", icon: PieChart },
            { type: "line", label: "Líneas", icon: TrendingUp },
            { type: "cards", label: "Muro", icon: LayoutGrid },
            { type: "word_cloud", label: "Nube", icon: Cloud },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected =
              (currentQuestion?.chart_type ||
                (currentQuestion?.question_type === "word_cloud"
                  ? "word_cloud"
                  : "bar")) === item.type;
            return (
              <button
                key={item.type}
                type="button"
                onClick={() =>
                  onUpdateCurrentQuestion({ chart_type: item.type })
                }
                className={`flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? "bg-[#4C8C2B] text-white shadow-sm font-black scale-102"
                    : "bg-[var(--surface-subtle)] text-[var(--text-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Activity Global Settings */}
      <div className="pt-4 border-t border-[var(--border-subtle)] space-y-3">
        <h4 className="text-xs font-black uppercase text-[var(--text-muted)] tracking-wider">
          Reglas Globales
        </h4>

        <label className="flex items-center justify-between text-xs font-semibold cursor-pointer">
          <span className="flex items-center gap-1.5 text-[var(--text-main)]">
            <Zap className="w-4 h-4 text-[#FFC72C]" />
            Bonus por Velocidad
          </span>
          <input
            type="checkbox"
            checked={activity.speed_bonus_enabled}
            onChange={(e) =>
              onUpdateActivity({ speed_bonus_enabled: e.target.checked })
            }
            className="w-4 h-4 accent-[#FFC72C]"
          />
        </label>
      </div>
    </aside>
  );
}
