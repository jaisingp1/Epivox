import React from "react";
import {
  Home,
  ChevronRight,
  Folder,
  FolderPlus,
  Edit3,
  Trash2,
} from "lucide-react";
import { QuestionFolder } from "../types";

interface FolderNavigationProps {
  currentFolder: QuestionFolder | null;
  folderTrail: QuestionFolder[];
  displayedSubfolders: QuestionFolder[];
  onSelectFolder: (folderId: number | null) => void;
  onOpenFolderModal: (
    folder?: QuestionFolder,
    defaultParentId?: number | null,
  ) => void;
  onDeleteFolderConfirm: (folder: QuestionFolder) => void;
}

export const FolderNavigation: React.FC<FolderNavigationProps> = ({
  currentFolder,
  folderTrail,
  displayedSubfolders,
  onSelectFolder,
  onOpenFolderModal,
  onDeleteFolderConfirm,
}) => {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--border-subtle)] rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
      {/* Barra de Migas de Pan (Breadcrumbs) de Carpetas */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <button
          type="button"
          onClick={() => onSelectFolder(null)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
            currentFolder === null
              ? "bg-[#FFC72C] text-[#001E32] font-black"
              : "text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--surface-subtle)]"
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Banco Raíz</span>
        </button>

        {folderTrail.map((f, idx) => {
          const isLast = idx === folderTrail.length - 1;
          return (
            <React.Fragment key={f.id}>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <button
                type="button"
                onClick={() => onSelectFolder(f.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition truncate max-w-[180px] cursor-pointer ${
                  isLast
                    ? "bg-[#FFC72C] text-[#001E32] font-black shadow-sm"
                    : "text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--surface-subtle)]"
                }`}
              >
                <Folder
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: f.color || "#FFC72C" }}
                />
                <span className="truncate">{f.name}</span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Cabecera de la Carpeta Activa con Acciones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
            style={{ backgroundColor: currentFolder?.color || "#FFC72C" }}
          >
            <Folder className="w-5 h-5 text-[#001E32]" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--text-main)]">
              {currentFolder
                ? currentFolder.name
                : "Todas las Preguntas (Raíz)"}
            </h2>
            <p className="text-xs text-[var(--text-subtle)]">
              {currentFolder?.description ||
                "Explora las carpetas temáticas o gestiona preguntas globales."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentFolder && (
            <>
              <button
                type="button"
                onClick={() => onOpenFolderModal(currentFolder)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--surface-subtle)] rounded-xl transition cursor-pointer"
                title="Editar carpeta"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteFolderConfirm(currentFolder)}
                className="p-2 text-[var(--text-muted)] hover:text-[#B7312C] hover:bg-[#B7312C]/10 rounded-xl transition cursor-pointer"
                title="Eliminar carpeta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() =>
              onOpenFolderModal(undefined, currentFolder?.id || null)
            }
            className="bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] text-[#001E32] dark:text-[#FFC72C] border border-[var(--border-subtle)] font-bold text-xs py-2 px-3 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-[#FFC72C]" />
            <span>{currentFolder ? "Nueva Subcarpeta" : "Nueva Carpeta"}</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula de Subcarpetas */}
      {displayedSubfolders.length > 0 && (
        <div className="pt-2">
          <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-wider block mb-2">
            Subcarpetas ({displayedSubfolders.length}):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {displayedSubfolders.map((sf) => (
              <button
                key={sf.id}
                type="button"
                onClick={() => onSelectFolder(sf.id)}
                className="p-3 bg-[var(--surface-subtle)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] hover:border-[#FFC72C] rounded-xl text-left transition flex flex-col justify-between space-y-2 group cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: sf.color || "#FFC72C" }}
                  >
                    <Folder className="w-4 h-4 text-[#001E32]" />
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[var(--surface-card)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    {sf.questions_count ?? 0}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-black text-[var(--text-main)] group-hover:text-[#FFC72C] transition truncate">
                    {sf.name}
                  </h4>
                  <p className="text-[10px] text-[var(--text-muted)] truncate">
                    {sf.description || "Sin descripción"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
