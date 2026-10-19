import { Link } from "react-router-dom";
import {
  Clock,
  User,
  Calendar,
  Play,
  Edit3,
  Share2,
  CopyPlus,
  Trash2,
} from "lucide-react";
import type { PresentationItem } from "../types";

interface PresentationsGridProps {
  presentations: PresentationItem[];
  onLaunch: (id: number) => void;
  onClone: (id: number) => void;
  onDeleteClick: (id: number) => void;
  onCollabClick: (target: {
    id: number;
    title: string;
    isOwnerOrAdmin: boolean;
  }) => void;
}

export default function PresentationsGrid({
  presentations,
  onLaunch,
  onClone,
  onDeleteClick,
  onCollabClick,
}: PresentationsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {presentations.map((act) => {
        const isTrivia = act.activity_type === "quiz";
        return (
          <div
            key={act.id}
            className="bg-[var(--surface-subtle)] border border-[var(--border-subtle)] hover:border-[#FFC72C] p-6 rounded-2xl transition shadow-sm flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                    isTrivia
                      ? "bg-[#FFC72C]/10 text-[#FFC72C] border-[#FFC72C]/30"
                      : "bg-[#48A9C5]/10 text-[#48A9C5] border-[#48A9C5]/30"
                  }`}
                >
                  {isTrivia ? "🎮 Trivia Gamificada" : "📊 Presentación"}
                </span>
                <span className="text-xs text-[var(--text-muted)] font-semibold">
                  {act.questions_count || 0} diapositivas
                </span>
              </div>

              <h3 className="text-lg font-black text-[var(--text-main)] group-hover:text-[#FFC72C] transition-colors line-clamp-2">
                {act.title}
              </h3>

              <p className="text-xs text-[var(--text-subtle)] line-clamp-2">
                {act.description ||
                  (isTrivia
                    ? "Cuestionario interactivo con concurso de puntos y podio."
                    : "Presentación interactiva para recopilación de ideas en vivo.")}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#FFC72C]" />
                  {act.default_time_limit}s por pregunta
                </span>
                <span className="text-[11px] font-semibold text-[var(--text-subtle)]">
                  {act.category}
                </span>
              </div>

              {/* Creador y Fecha de Creación */}
              <div className="flex items-center justify-between text-[11px] text-[var(--text-subtle)] pt-1">
                <span className="flex items-center gap-1.5 font-medium truncate max-w-[150px]">
                  <User className="w-3.5 h-3.5 text-[#FFC72C] shrink-0" />
                  <span className="truncate">
                    {act.owner_name || act.owner_username || "Creador"}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0 text-[var(--text-muted)]">
                  <Calendar className="w-3.5 h-3.5 text-[#48A9C5] shrink-0" />
                  <span>
                    {act.created_at
                      ? new Date(act.created_at).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </span>
              </div>

              {/* Acciones principales */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onLaunch(act.id)}
                  className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-[#001E32]" />
                  <span>Lanzar en Vivo</span>
                </button>

                <Link
                  to={`/editor/${act.id}`}
                  className="bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#48A9C5]" />
                  <span>Editar</span>
                </Link>
              </div>

              {/* Acciones secundarias (Compartir / Clonar / Eliminar) */}
              <div className="flex items-center justify-end gap-3 text-xs pt-1">
                <button
                  type="button"
                  onClick={() =>
                    onCollabClick({
                      id: act.id,
                      title: act.title,
                      isOwnerOrAdmin:
                        act.my_access === "owner" || act.my_access === "admin",
                    })
                  }
                  className="text-[#48A9C5] hover:text-[var(--text-main)] flex items-center gap-1 transition cursor-pointer"
                  title="Gestionar colaboradores"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir</span>
                </button>
                <button
                  type="button"
                  onClick={() => onClone(act.id)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1 transition cursor-pointer"
                  title="Duplicar presentación"
                >
                  <CopyPlus className="w-3.5 h-3.5" />
                  <span>Duplicar</span>
                </button>
                {(act.my_access === "owner" ||
                  act.my_access === "admin" ||
                  !act.my_access) && (
                  <button
                    type="button"
                    onClick={() => onDeleteClick(act.id)}
                    className="text-[#B7312C]/80 hover:text-[#B7312C] flex items-center gap-1 transition cursor-pointer"
                    title="Eliminar presentación"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
