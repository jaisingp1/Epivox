import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Copy,
  Play,
  Eye,
  Layers,
  Clock,
  Award,
  Tag,
  Search,
  BookOpen,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import Modal from "../components/Modal";

interface TemplateItem {
  id: number;
  title: string;
  description: string | null;
  category: string;
  activity_type: string;
  questions_count?: number;
  default_time_limit: number;
  default_points: number;
}

const CATEGORIES = [
  "Todos",
  "Seguridad y Salud",
  "Operaciones y Mina",
  "Inducción Corporativa",
  "Cultura y Valores",
];

export default function TemplatesPage() {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [cloningId, setCloningId] = useState<number | null>(null);

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(
    null,
  );

  useEffect(() => {
    async function loadTemplates() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/epivox/templates");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (err) {
        console.error("Error al cargar plantillas:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const filteredTemplates = templates.filter((t) => {
    const matchesCategory =
      selectedCategory === "Todos" ||
      t.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description &&
        t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleClone = async (templateId: number) => {
    setCloningId(templateId);
    try {
      const res = await fetch(`/api/epivox/activities/${templateId}/clone`, {
        method: "POST",
      });
      if (res.ok) {
        const cloned = await res.json();
        navigate(`/editor/${cloned.id}`);
      }
    } catch (err) {
      console.error("Error al clonar plantilla:", err);
    } finally {
      setCloningId(null);
    }
  };

  const handleLaunch = async (activityId: number) => {
    try {
      const res = await fetch("/api/epivox/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, mode: "live" }),
      });
      const data = await res.json();
      if (data.pin) {
        navigate(`/present/${data.pin}`);
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Banco de Plantillas Epivox"
        description="Catálogo corporativo de cuestionarios, dinámicas y evaluaciones listas para clonar o presentar en vivo."
        breadcrumbs={[
          { label: "Epivox", href: "/" },
          { label: "Banco de Plantillas" },
        ]}
        badge={
          <span className="bg-[#FFC72C]/20 border border-[#FFC72C] text-[#FFC72C] text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            {templates.length} Plantillas Disponibles
          </span>
        }
      />

      <div className="space-y-6">
        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#193750] border border-[#425563] p-4 rounded-2xl">
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#ECEBE4]/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título o palabra clave..."
              className="w-full bg-[#001E32] border border-[#425563] text-sm text-white pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFC72C] placeholder-[#ECEBE4]/40 transition"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition shrink-0 ${
                  selectedCategory === cat
                    ? "bg-[#FFC72C] text-[#001E32] shadow-md"
                    : "bg-[#001E32] text-[#ECEBE4]/80 hover:bg-[#425563]/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center p-16 text-[#FFC72C]">
            <div className="w-8 h-8 border-3 border-[#FFC72C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="bg-[#193750] border border-[#425563] rounded-3xl p-12 text-center space-y-3">
            <BookOpen className="w-12 h-12 text-[#ECEBE4]/40 mx-auto" />
            <h3 className="text-lg font-bold text-white">
              No se encontraron plantillas
            </h3>
            <p className="text-xs text-[#ECEBE4]/70 max-w-sm mx-auto">
              Intenta cambiar los términos de búsqueda o selecciona otra
              categoría temática.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((t) => (
              <div
                key={t.id}
                className="bg-[#193750] border-2 border-[#425563] hover:border-[#FFC72C] rounded-3xl p-6 shadow-xl transition-all duration-200 flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  {/* Category & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#48A9C5] bg-[#48A9C5]/10 px-2.5 py-1 rounded-lg">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{t.category}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewTemplate(t)}
                      title="Vista previa rápida"
                      className="text-[#ECEBE4]/60 hover:text-[#FFC72C] p-1 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-[#FFC72C] transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-xs text-[#ECEBE4]/80 mt-2 line-clamp-3 leading-relaxed">
                      {t.description ||
                        "Plantilla interactiva prediseñada con las mejores prácticas corporativas de Epiroc."}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-3 pt-2 text-[11px] text-[#ECEBE4]/60 font-semibold border-t border-[#425563]/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#FFC72C]" />
                      {t.default_time_limit}s por pregunta
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[#48A9C5]" />
                      {t.default_points} pts base
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-[#4C8C2B]" />
                      {t.questions_count || 4} diapositivas
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-6 mt-4 border-t border-[#425563]/60">
                  <button
                    type="button"
                    onClick={() => handleClone(t.id)}
                    disabled={cloningId === t.id}
                    className="flex items-center justify-center gap-2 bg-[#48A9C5] hover:bg-[#3B8FA8] text-white font-bold py-2.5 px-3 rounded-xl transition text-xs shadow disabled:opacity-50"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>
                      {cloningId === t.id ? "Clonando..." : "Clonar y Editar"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLaunch(t.id)}
                    className="flex items-center justify-center gap-2 bg-[#FFC72C] hover:bg-[#E6B327] text-[#001E32] font-black py-2.5 px-3 rounded-xl transition text-xs shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-[#001E32]" />
                    <span>Lanzar en Vivo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewTemplate(null)}
          title={previewTemplate.title}
          description={`Categoría: ${previewTemplate.category} • ${previewTemplate.default_time_limit}s por pregunta`}
          footer={
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-[#425563] text-white rounded-xl text-xs font-bold hover:bg-[#425563]/80"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = previewTemplate.id;
                  setPreviewTemplate(null);
                  handleClone(id);
                }}
                className="px-4 py-2 bg-[#FFC72C] text-[#001E32] rounded-xl text-xs font-black hover:bg-[#E6B327]"
              >
                Clonar y Personalizar
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-[#ECEBE4]/90 leading-relaxed">
              {previewTemplate.description ||
                "Esta plantilla está optimizada para capacitaciones operacionales y dinámicas de equipo en Epiroc."}
            </p>
            <div className="bg-[#001E32] border border-[#425563] rounded-2xl p-4 text-xs space-y-2">
              <div className="font-bold text-[#FFC72C]">
                Estructura de la Actividad:
              </div>
              <ul className="list-disc pl-5 space-y-1 text-[#ECEBE4]/80">
                <li>Preguntas interactivas con gamificación y racha.</li>
                <li>Podio animado 3D y lluvia de confetti institucional.</li>
                <li>
                  Control remoto desde smartphone disponible para el moderador.
                </li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
