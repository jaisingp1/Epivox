import { Star } from "lucide-react";

interface RatingVisualizerProps {
  liveResults: Record<string, number>;
}

export default function RatingVisualizer({
  liveResults,
}: RatingVisualizerProps) {
  // Calcular conteos por estrella: 1 a 5
  const starCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let totalVotes = 0;
  let weightedSum = 0;

  Object.entries(liveResults).forEach(([key, count]) => {
    const num = parseInt(key, 10);
    if (num >= 1 && num <= 5) {
      starCounts[num] = (starCounts[num] || 0) + count;
      totalVotes += count;
      weightedSum += num * count;
    }
  });

  const averageRating = totalVotes > 0 ? weightedSum / totalVotes : 0;

  return (
    <div className="bg-[#193750] border-2 border-[#425563] p-8 rounded-3xl shadow-2xl space-y-6 w-full max-w-4xl mx-auto animate-in fade-in">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-[#425563]/60 pb-6">
        <div className="text-center md:text-left space-y-1">
          <span className="text-xs font-black uppercase tracking-wider text-[#FFC72C]">
            Calificación Promedio del Público
          </span>
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <span className="text-5xl font-black text-white font-mono">
              {averageRating > 0 ? averageRating.toFixed(1) : "0.0"}
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(averageRating) && averageRating > 0
                        ? "text-[#FFC72C] fill-[#FFC72C] drop-shadow-[0_0_8px_rgba(255,199,44,0.6)]"
                        : "text-[#425563]"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-[#ECEBE4]/70 font-semibold block">
                de 5.0 estrellas posibles
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#001E32] border border-[#425563] px-6 py-3 rounded-2xl text-center">
          <span className="text-2xl font-black text-[#48A9C5] block font-mono">
            {totalVotes}
          </span>
          <span className="text-[11px] text-[#ECEBE4]/70 uppercase font-bold tracking-wider">
            {totalVotes === 1 ? "Calificación" : "Calificaciones"}
          </span>
        </div>
      </div>

      {/* Barras de distribución por estrellas (5 a 1) */}
      <div className="space-y-3">
        {[5, 4, 3, 2, 1].map((starVal) => {
          const count = starCounts[starVal] || 0;
          const pct =
            totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
          return (
            <div
              key={starVal}
              className="flex items-center gap-4 text-xs font-bold"
            >
              <div className="w-24 flex items-center justify-end gap-1.5 shrink-0 text-[#ECEBE4]">
                <span>{starVal}</span>
                <Star className="w-4 h-4 text-[#FFC72C] fill-[#FFC72C]" />
              </div>

              <div className="flex-1 bg-[#001E32] h-7 rounded-xl overflow-hidden border border-[#425563]/60 relative">
                <div
                  className="h-full bg-gradient-to-r from-[#FFC72C] to-[#E6B327] rounded-xl transition-all duration-700 shadow"
                  style={{ width: `${Math.max(pct, count > 0 ? 6 : 0)}%` }}
                />
                {count > 0 && (
                  <span className="absolute inset-y-0 left-3 flex items-center text-xs font-extrabold text-[#001E32]">
                    {count} {count === 1 ? "voto" : "votos"}
                  </span>
                )}
              </div>

              <div className="w-16 text-right font-mono font-extrabold text-[#ECEBE4]/80 shrink-0">
                {pct}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
