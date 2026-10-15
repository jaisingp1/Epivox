export interface ScoreCalculationParams {
  isCorrect: boolean;
  pointsBase: number;
  timeTakenMs: number;
  timeLimitSec: number;
  currentStreak: number;
  speedBonusEnabled?: boolean;
  negativePointsEnabled?: boolean;
}

export interface ScoreCalculationResult {
  pointsAwarded: number;
  newStreak: number;
  multiplier: number;
}

export function calculateScore(
  params: ScoreCalculationParams,
): ScoreCalculationResult {
  const {
    isCorrect,
    pointsBase,
    timeTakenMs,
    timeLimitSec,
    currentStreak,
    speedBonusEnabled = true,
    negativePointsEnabled = false,
  } = params;

  if (!isCorrect) {
    const penalty = negativePointsEnabled ? -Math.round(pointsBase * 0.25) : 0;
    return {
      pointsAwarded: penalty,
      newStreak: 0,
      multiplier: 1.0,
    };
  }

  const newStreak = currentStreak + 1;
  let multiplier = 1.0;
  if (newStreak === 2) multiplier = 1.1;
  else if (newStreak === 3) multiplier = 1.2;
  else if (newStreak === 4) multiplier = 1.3;
  else if (newStreak >= 5) multiplier = 1.5;

  let points = pointsBase;

  if (speedBonusEnabled && timeLimitSec > 0) {
    const timeLimitMs = timeLimitSec * 1000;
    // Ratio decrece desde 1.0 (inmediato) hasta 0.5 (en el último segundo del tiempo límite)
    const timeRatio = Math.max(0, 1 - timeTakenMs / (2 * timeLimitMs));
    points = Math.round(pointsBase * timeRatio);
  }

  const pointsAwarded = Math.round(points * multiplier);

  return {
    pointsAwarded,
    newStreak,
    multiplier,
  };
}
