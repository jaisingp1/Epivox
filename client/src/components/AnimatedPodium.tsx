import React from "react";
import { Trophy, Medal, Award, Flame, User as UserIcon } from "lucide-react";

export interface PodiumUser {
  id?: string | number;
  name: string;
  score: number;
  avatar?: string;
  avatar_seed?: string;
  streak?: number;
}

export interface PodiumPositionItem {
  user: PodiumUser;
  position: 1 | 2 | 3;
}

/**
 * Ordena y prepara la estructura visual clásica del podio:
 * 2º lugar a la izquierda, 1º al centro, 3º a la derecha.
 */
export function getPodiumOrder(users: PodiumUser[]): PodiumPositionItem[] {
  if (!users || users.length === 0) return [];

  // Ordenar de mayor a menor puntaje
  const sorted = [...users].sort((a, b) => b.score - a.score);

  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  if (sorted.length === 1) {
    return [{ user: first, position: 1 }];
  }

  if (sorted.length === 2) {
    return [
      { user: second, position: 2 },
      { user: first, position: 1 },
    ];
  }

  // Orden visual clásico de podio: 2º, 1º, 3º
  return [
    { user: second, position: 2 },
    { user: first, position: 1 },
    { user: third, position: 3 },
  ];
}

export interface AnimatedPodiumProps {
  users: PodiumUser[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
  showRunnersUp?: boolean;
  className?: string;
}

export const AnimatedPodium: React.FC<AnimatedPodiumProps> = ({
  users,
  title = "🏆 Podio de Ganadores",
  subtitle = "¡Felicitaciones a los mejores puntajes de Epiroc!",
  emptyMessage = "No se registraron participantes para el podio.",
  showRunnersUp = true,
  className = "",
}) => {
  if (!users || users.length === 0) {
    return (
      <div className={`text-center py-12 space-y-3 ${className}`}>
        <div className="w-16 h-16 mx-auto rounded-full bg-[var(--color-epiroc-grey)]/30 flex items-center justify-center text-[var(--color-epiroc-medium-grey)]">
          <Trophy className="w-8 h-8 opacity-40" />
        </div>
        <p className="text-[var(--color-epiroc-light-grey)] text-base font-semibold">
          {emptyMessage}
        </p>
      </div>
    );
  }

  const orderedPodium = getPodiumOrder(users);
  const sortedAll = [...users].sort((a, b) => b.score - a.score);
  const runnersUp = sortedAll.slice(3, 5);

  return (
    <section
      aria-label="Podio de ganadores"
      className={`flex flex-col items-center justify-center w-full max-w-4xl mx-auto space-y-6 ${className}`}
    >
      {/* Encabezado */}
      {(title || subtitle) && (
        <div className="text-center space-y-2">
          {title && (
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-base sm:text-lg text-[var(--color-epiroc-yellow)] font-bold">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Contenedor del Podio Animado */}
      <div className="flex items-end justify-center gap-3 sm:gap-6 w-full max-w-3xl pt-10 pb-2 min-h-[380px]">
        {orderedPodium.map(({ user, position }) => {
          const colClass =
            position === 1
              ? "podium-col-pos-1 w-40 sm:w-56"
              : position === 2
                ? "podium-col-pos-2 w-36 sm:w-48"
                : "podium-col-pos-3 w-36 sm:w-48";

          const infoClass =
            position === 1
              ? "podium-info-pos-1"
              : position === 2
                ? "podium-info-pos-2"
                : "podium-info-pos-3";

          const barClass =
            position === 1
              ? "podium-bar-pos-1 border-4 border-white/90 text-[var(--color-epiroc-dark-blue)]"
              : position === 2
                ? "podium-bar-pos-2 border-2 border-white/70 text-[var(--color-epiroc-dark-blue)]"
                : "podium-bar-pos-3 border-2 border-[var(--color-epiroc-orange)] text-[var(--color-epiroc-light-grey)]";

          return (
            <div
              key={`${user.name}-${position}`}
              className={`flex flex-col items-center ${colClass}`}
            >
              {/* Información del Usuario (Medalla, Avatar, Nombre, Puntaje) */}
              <div
                className={`flex flex-col items-center text-center mb-3 w-full space-y-1.5 ${infoClass}`}
              >
                {/* Ícono de Condecoración Institucional */}
                <div className="relative">
                  {position === 1 && (
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--color-epiroc-yellow)] text-[var(--color-epiroc-dark-blue)] flex items-center justify-center shadow-lg shadow-[#FFC72C]/40 border-2 border-white ring-4 ring-[#FFC72C]/30">
                      <Trophy className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                  )}
                  {position === 2 && (
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[var(--color-epiroc-light-grey)] text-[var(--color-epiroc-dark-blue)] flex items-center justify-center shadow-md border-2 border-white">
                      <Medal className="w-6 h-6 sm:w-7 sm:h-7" />
                    </div>
                  )}
                  {position === 3 && (
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[var(--color-epiroc-orange)] text-white flex items-center justify-center shadow-md border-2 border-[var(--color-epiroc-dark-red)]">
                      <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  )}

                  {/* Racha de aciertos si existe */}
                  {user.streak && user.streak > 1 && (
                    <div
                      title={`Racha de ${user.streak} aciertos consecutivos`}
                      className="absolute -bottom-1 -right-1 bg-[var(--color-epiroc-dark-blue)] border border-[var(--color-epiroc-yellow)] text-[var(--color-epiroc-yellow)] text-[10px] font-black rounded-full px-1.5 py-0.5 flex items-center gap-0.5 shadow-sm"
                    >
                      <Flame className="w-2.5 h-2.5 text-[var(--color-epiroc-orange)] fill-[var(--color-epiroc-orange)]" />
                      <span>{user.streak}</span>
                    </div>
                  )}
                </div>

                {/* Nombre del Usuario */}
                <div
                  className="font-black text-white text-sm sm:text-base tracking-wide truncate max-w-full px-2"
                  title={user.name}
                >
                  {user.name}
                </div>

                {/* Puntaje */}
                <div className="font-mono text-xs sm:text-sm font-bold text-[var(--color-epiroc-yellow)] bg-[var(--color-epiroc-dark-blue)]/80 px-3 py-0.5 rounded-full border border-[var(--color-epiroc-grey)]/60 shadow-inner">
                  {user.score.toLocaleString()} pts
                </div>
              </div>

              {/* Barra del Podio */}
              <div
                className={`w-full rounded-t-2xl sm:rounded-t-3xl flex flex-col items-center justify-start pt-3 sm:pt-4 shadow-2xl ${barClass}`}
              >
                <span className="font-black text-4xl sm:text-5xl leading-none">
                  {position}
                </span>
                <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase mt-1 opacity-80">
                  {position === 1
                    ? "1° Lugar"
                    : position === 2
                      ? "2° Lugar"
                      : "3° Lugar"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lista de Finalistas Secundarios (4° y 5° lugar si existen) */}
      {showRunnersUp && runnersUp.length > 0 && (
        <div className="w-full max-w-md pt-4 space-y-2 border-t border-[var(--color-epiroc-grey)]/40">
          <p className="text-xs uppercase tracking-widest font-bold text-[var(--color-epiroc-medium-grey)] text-center">
            Menciones Destacadas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {runnersUp.map((runner, idx) => (
              <div
                key={runner.name}
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-[var(--color-epiroc-grey)]/20 border border-[var(--color-epiroc-grey)]/40 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono font-bold text-[var(--color-epiroc-medium-grey)]">
                    #{idx + 4}
                  </span>
                  <UserIcon className="w-3.5 h-3.5 text-[var(--color-epiroc-medium-grey)] flex-shrink-0" />
                  <span className="font-medium text-white truncate">
                    {runner.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-[var(--color-epiroc-yellow)] flex-shrink-0 ml-2">
                  {runner.score.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default AnimatedPodium;
