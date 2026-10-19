import { Link } from "react-router-dom";
import {
  Gamepad2,
  Presentation,
  Calendar,
  Play,
  Edit3,
  Share2,
  CopyPlus,
  Trash2,
} from "lucide-react";
import type { PresentationItem } from "../types";

interface PresentationsTableProps {
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

export default function PresentationsTable({
  presentations,
  onLaunch,
  onClone,
  onDeleteClick,
  onCollabClick,
}: PresentationsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-card)]">
      <table className="w-full text-left text-xs">
        <thead className="bg-[var(--surface-subtle)] text-[var(--text-muted)] uppercase tracking-wider font-extrabold border-b border-[var(--border-subtle)]">
          <tr>
            <th className="py-3.5 px-4">Título y Descripción</th>
            <th className="py-3.5 px-4">Modo</th>
            <th className="py-3.5 px-4">Categoría</th>
            <th className="py-3.5 px-4">Creador y Fecha</th>
            <th className="py-3.5 px-4 text-center">Diapositivas</th>
            <th className="py-3.5 px-4 text-center">Tiempo</th>
            <th className="py-3.5 px-4 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)]">
          {presentations.map((act) => {
            const isTrivia = act.activity_type === "quiz";
            return (
              <tr
                key={act.id}
                className="hover:bg-[var(--surface-subtle)] transition-colors"
              >
                <td className="py-3.5 px-4">
                  <div className="space-y-0.5">
                    <span className="font-bold text-sm text-[var(--text-main)] block">
                      {act.title}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                      {act.description || "Sin descripción adicional"}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${
                      isTrivia
                        ? "bg-[#FFC72C]/10 text-[#FFC72C] border-[#FFC72C]/30"
                        : "bg-[#48A9C5]/10 text-[#48A9C5] border-[#48A9C5]/30"
                    }`}
                  >
                    {isTrivia ? (
                      <Gamepad2 className="w-3 h-3" />
                    ) : (
                      <Presentation className="w-3 h-3" />
                    )}
                    {isTrivia ? "Trivia" : "Presentación"}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="text-[var(--text-main)] font-medium">
                    {act.category}
                  </span>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[#FFC72C]/10 border border-[#FFC72C]/30 text-[#FFC72C] font-black text-[10px] flex items-center justify-center shrink-0">
                      {(act.owner_name ||
                        act.owner_username ||
                        "C")[0].toUpperCase()}
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-[var(--text-main)] block">
                        {act.owner_name || act.owner_username || "Creador"}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5 text-[#48A9C5]" />
                        <span>
                          {act.created_at
                            ? new Date(act.created_at).toLocaleDateString(
                                "es-CL",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </span>
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-[var(--text-main)] whitespace-nowrap">
                  {act.questions_count || 0}
                </td>
                <td className="py-3.5 px-4 text-center text-[var(--text-muted)] whitespace-nowrap">
                  {act.default_time_limit}s
                </td>

                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onLaunch(act.id)}
                      className="bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-1.5 px-3 rounded-lg transition shadow flex items-center gap-1 active:scale-95 cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-[#001E32]" />
                      <span>Lanzar</span>
                    </button>

                    <Link
                      to={`/editor/${act.id}`}
                      className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#48A9C5] border border-[#48A9C5]/40 py-1.5 px-2.5 rounded-lg transition"
                      title="Editar preguntas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Link>

                    <button
                      type="button"
                      onClick={() =>
                        onCollabClick({
                          id: act.id,
                          title: act.title,
                          isOwnerOrAdmin:
                            act.my_access === "owner" ||
                            act.my_access === "admin",
                        })
                      }
                      className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#48A9C5] border border-[#48A9C5]/40 py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                      title="Colaboradores"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onClone(act.id)}
                      className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[var(--text-main)] border border-[var(--border-subtle)] py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                      title="Duplicar"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </button>

                    {(act.my_access === "owner" ||
                      act.my_access === "admin" ||
                      !act.my_access) && (
                      <button
                        type="button"
                        onClick={() => onDeleteClick(act.id)}
                        className="bg-[var(--surface-subtle)] hover:bg-[#B7312C]/20 text-[#B7312C] border border-[#B7312C]/40 py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
