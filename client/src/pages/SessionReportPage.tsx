import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Trophy,
  Users,
  Target,
  Clock,
  Flame,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import PageHeader from "../components/PageHeader";

interface QuestionReport {
  question_id: number;
  question_text: string;
  question_type: string;
  sort_order: number;
  total_answers: number;
  correct_answers: number;
  accuracy_pct: number;
  avg_time_ms: number;
  distribution: Record<string, number>;
}

interface ParticipantItem {
  id: number;
  nickname: string;
  avatar_seed: string;
  department: string | null;
  score: number;
  correct_count: number;
  best_streak: number;
}

interface SessionData {
  id: number;
  pin: string;
  activity_id: number;
  activity_title?: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

interface ReportData {
  session: SessionData;
  total_participants: number;
  total_answers: number;
  overall_accuracy_pct: number;
  avg_response_time_ms: number;
  questions: QuestionReport[];
  participants: ParticipantItem[];
}

export default function SessionReportPage() {
  const { id } = useParams<{ id: string }>();

  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        setIsLoading(true);
        // id puede ser el ID de sesión numérico o 1 por defecto
        const res = await fetch(`/api/epivox/sessions/${id || 1}/report`);
        if (res.ok) {
          const data = await res.json();
          setReport(data);
        }
      } catch (err) {
        console.error("Error al cargar reporte de sesión:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [id]);

  const handleExportCSV = () => {
    if (!report) return;

    // Generar archivo CSV compatible con Excel
    const headers = [
      "Ranking",
      "Participante",
      "Departamento",
      "Puntaje",
      "Aciertos",
      "Mejor Racha",
    ];
    const rows = report.participants.map((p, idx) => [
      idx + 1,
      `"${p.nickname}"`,
      `"${p.department || "General"}"`,
      p.score,
      p.correct_count,
      p.best_streak,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Epivox_Reporte_Sesion_${report.session.pin}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading || !report) {
    return (
      <div className="min-h-screen bg-[#001E32] text-white flex items-center justify-center p-6">
        <div className="flex items-center space-x-3 text-[#FFC72C]">
          <div className="w-8 h-8 border-3 border-[#FFC72C] border-t-transparent rounded-full animate-spin" />
          <span className="font-bold">
            Generando analíticas y métricas de sesión...
          </span>
        </div>
      </div>
    );
  }

  // Identificar pregunta más desafiante (con menor accuracy)
  const hardestQuestion = [...report.questions].sort(
    (a, b) => a.accuracy_pct - b.accuracy_pct,
  )[0];

  return (
    <div className="min-h-screen bg-[#001E32] text-white flex flex-col selection:bg-[#FFC72C] selection:text-[#001E32]">
      {/* Top Page Header */}
      <div className="bg-[#193750] border-b border-[#425563] px-6 py-6">
        <PageHeader
          title={`Reporte de Sesión: ${report.session.activity_title || "Evaluación Epiroc"}`}
          description={`Sesión PIN #${report.session.pin} • Finalizada el ${new Date(report.session.created_at).toLocaleDateString()}`}
          breadcrumbs={[
            { label: "Epivox Hub", href: "/" },
            { label: "Reportes y Analíticas" },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-[#4C8C2B] hover:bg-[#3D7122] text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition active:scale-95 text-xs"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Exportar a Excel / CSV</span>
              </button>
            </div>
          }
        />
      </div>

      <div className="max-w-7xl w-full mx-auto p-6 md:p-8 space-y-8 flex-1">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase text-[#ECEBE4]/60 tracking-wider">
              <span>Participantes</span>
              <Users className="w-5 h-5 text-[#48A9C5]" />
            </div>
            <div className="text-4xl font-black text-white">
              {report.total_participants}
            </div>
            <div className="text-[11px] text-[#ECEBE4]/70">
              Colaboradores conectados
            </div>
          </div>

          <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase text-[#ECEBE4]/60 tracking-wider">
              <span>Respuestas Emitidas</span>
              <Target className="w-5 h-5 text-[#FFC72C]" />
            </div>
            <div className="text-4xl font-black text-[#FFC72C]">
              {report.total_answers}
            </div>
            <div className="text-[11px] text-[#ECEBE4]/70">
              Votos totales registrados
            </div>
          </div>

          <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase text-[#ECEBE4]/60 tracking-wider">
              <span>Tasa de Acierto Global</span>
              <CheckCircle2 className="w-5 h-5 text-[#4C8C2B]" />
            </div>
            <div className="text-4xl font-black text-[#4C8C2B]">
              {report.overall_accuracy_pct}%
            </div>
            <div className="text-[11px] text-[#ECEBE4]/70">
              Efectividad del aprendizaje
            </div>
          </div>

          <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 shadow-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black uppercase text-[#ECEBE4]/60 tracking-wider">
              <span>Tiempo Promedio</span>
              <Clock className="w-5 h-5 text-[#FFC72C]" />
            </div>
            <div className="text-4xl font-black text-white font-mono">
              {(report.avg_response_time_ms / 1000).toFixed(1)}s
            </div>
            <div className="text-[11px] text-[#ECEBE4]/70">
              Velocidad de respuesta
            </div>
          </div>
        </div>

        {/* Insight: Hardest Question Alert */}
        {hardestQuestion && (
          <div className="bg-[#193750] border-2 border-[#B7312C]/60 rounded-3xl p-6 shadow-xl flex items-start gap-4">
            <div className="p-3 bg-[#B7312C]/20 text-[#B7312C] rounded-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-[#B7312C]">
                Área de Refuerzo / Pregunta más Desafiante
              </span>
              <h3 className="text-base font-bold text-white">
                "{hardestQuestion.question_text}"
              </h3>
              <p className="text-xs text-[#ECEBE4]/70">
                Solo el <strong>{hardestQuestion.accuracy_pct}%</strong> de los
                colaboradores respondió correctamente. Se recomienda reforzar
                este contenido en la siguiente sesión técnica.
              </p>
            </div>
          </div>
        )}

        {/* 2-Column Section: Question Breakdown & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Column 1: Questions Breakdown */}
          <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#425563]/60 pb-3">
              <h3 className="text-base font-black text-white">
                Desglose por Pregunta
              </h3>
              <span className="text-xs font-bold text-[#ECEBE4]/60">
                {report.questions.length} Preguntas
              </span>
            </div>

            <div className="space-y-3">
              {report.questions.map((q, idx) => (
                <div
                  key={q.question_id || idx}
                  className="bg-[#001E32]/80 border border-[#425563] rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-black text-[#FFC72C]">
                      #{q.sort_order}
                    </span>
                    <h4 className="text-xs font-bold text-white flex-1">
                      {q.question_text}
                    </h4>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                        q.accuracy_pct >= 70
                          ? "bg-[#4C8C2B]/20 text-[#4C8C2B]"
                          : q.accuracy_pct >= 50
                            ? "bg-[#FFC72C]/20 text-[#FFC72C]"
                            : "bg-[#B7312C]/20 text-[#B7312C]"
                      }`}
                    >
                      {q.accuracy_pct}% Acierto
                    </span>
                  </div>

                  <div className="w-full bg-[#193750] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        q.accuracy_pct >= 70
                          ? "bg-[#4C8C2B]"
                          : q.accuracy_pct >= 50
                            ? "bg-[#FFC72C]"
                            : "bg-[#B7312C]"
                      }`}
                      style={{ width: `${q.accuracy_pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#ECEBE4]/60">
                    <span>
                      {q.correct_answers} de {q.total_answers} respuestas
                      correctas
                    </span>
                    <span>{(q.avg_time_ms / 1000).toFixed(1)}s prom.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Full Leaderboard & Engagement */}
          <div className="bg-[#193750] border-2 border-[#425563] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#425563]/60 pb-3">
              <h3 className="text-base font-black text-white">
                Ranking de Participantes
              </h3>
              <span className="text-xs font-bold text-[#FFC72C] flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                Podio & Puntajes
              </span>
            </div>

            {report.participants.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#ECEBE4]/50">
                No hubo participantes registrados en esta sesión.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#425563]/50 text-[#ECEBE4]/60">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Colaborador</th>
                      <th className="py-2 px-3 text-center">Aciertos</th>
                      <th className="py-2 px-3 text-center">Racha</th>
                      <th className="py-2 px-3 text-right">Puntaje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#425563]/30">
                    {report.participants.map((p, idx) => {
                      const medalColor =
                        idx === 0
                          ? "text-[#FFC72C] font-black"
                          : idx === 1
                            ? "text-[#ECEBE4] font-black"
                            : idx === 2
                              ? "text-[#D86018] font-black"
                              : "text-[#ECEBE4]/70";

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-[#001E32]/40 transition"
                        >
                          <td className={`py-3 px-3 font-mono ${medalColor}`}>
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{p.nickname}</span>
                              {idx === 0 && (
                                <Trophy className="w-3.5 h-3.5 text-[#FFC72C]" />
                              )}
                            </div>
                            <span className="text-[10px] text-[#ECEBE4]/50">
                              {p.department || "Operaciones"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-[#4C8C2B]">
                            {p.correct_count}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-[#FFC72C]">
                              <Flame className="w-3 h-3 text-[#D86018]" />
                              {p.best_streak}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-[#FFC72C] font-mono">
                            {p.score.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="p-6 text-center text-xs text-[#ECEBE4]/50 border-t border-[#425563]/30">
        Ecosistema Logistech &bull; Epivox Analytics Engine &bull; Epiroc Chile
      </footer>
    </div>
  );
}
