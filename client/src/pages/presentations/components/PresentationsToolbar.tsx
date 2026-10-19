import {
  Gamepad2,
  Presentation,
  Search,
  X,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";

interface PresentationsToolbarProps {
  modeFilter: "all" | "quiz" | "presentation";
  onModeFilterChange: (mode: "all" | "quiz" | "presentation") => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  viewMode: "grid" | "table";
  onViewModeChange: (view: "grid" | "table") => void;
  counts: { total: number; triviaCount: number; presentationCount: number };
}

export default function PresentationsToolbar({
  modeFilter,
  onModeFilterChange,
  searchQuery,
  onSearchQueryChange,
  viewMode,
  onViewModeChange,
  counts,
}: PresentationsToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
      {/* Pestañas de Modo (Trivia vs Presentación) */}
      <div className="flex items-center gap-1.5 bg-[var(--surface-subtle)] p-1.5 rounded-2xl border border-[var(--border-subtle)] shrink-0 flex-wrap">
        <button
          type="button"
          onClick={() => onModeFilterChange("all")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            modeFilter === "all"
              ? "bg-[#FFC72C] text-[#001E32] shadow font-black"
              : "text-[var(--text-subtle)] hover:text-[var(--text-main)]"
          }`}
        >
          <span>Todos</span>
          <span className="text-[10px] bg-[var(--surface-card)] text-[var(--text-subtle)] border border-[var(--border-subtle)] px-1.5 py-0.2 rounded-full font-bold">
            {counts.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onModeFilterChange("quiz")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            modeFilter === "quiz"
              ? "bg-[#FFC72C] text-[#001E32] shadow font-black"
              : "text-[var(--text-subtle)] hover:text-[var(--text-main)]"
          }`}
        >
          <Gamepad2 className="w-3.5 h-3.5" />
          <span>Modo Trivia (Gamificación)</span>
          <span className="text-[10px] bg-[var(--surface-card)] text-[var(--text-subtle)] border border-[var(--border-subtle)] px-1.5 py-0.2 rounded-full font-bold">
            {counts.triviaCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onModeFilterChange("presentation")}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            modeFilter === "presentation"
              ? "bg-[#48A9C5] text-[#001E32] shadow font-black"
              : "text-[var(--text-subtle)] hover:text-[var(--text-main)]"
          }`}
        >
          <Presentation className="w-3.5 h-3.5" />
          <span>Modo Presentación</span>
          <span className="text-[10px] bg-[var(--surface-card)] text-[var(--text-subtle)] border border-[var(--border-subtle)] px-1.5 py-0.2 rounded-full font-bold">
            {counts.presentationCount}
          </span>
        </button>
      </div>

      {/* Búsqueda en Vivo y Selector de Vista */}
      <div className="flex items-center gap-3">
        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar por título o categoría..."
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)] focus:border-[#FFC72C] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Botones de Vista: Cuadrícula / Tabla */}
        <div className="flex items-center bg-[var(--surface-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            title="Vista en Cuadrícula"
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === "grid"
                ? "bg-[#FFC72C] text-[#001E32] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            title="Vista en Tabla"
            className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === "table"
                ? "bg-[#FFC72C] text-[#001E32] shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
            }`}
          >
            <TableIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
