import type { Player } from '@/lib/types';

const PROGRESSION_PERFORMANCE_THRESHOLD = 1;

export function applyPlayerMatchDevelopment(
  player: Player,
  scoreFor: number,
  scoreAgainst: number,
): Player {
  const scoreDifference = scoreFor - scoreAgainst;
  const resultMomentum = scoreDifference > 0 ? 0.32 : scoreDifference < 0 ? -0.24 : 0;
  const performanceMomentum = Math.max(-0.12, Math.min(0.12, scoreDifference * 0.025));
  const ratingCeilingFactor = Math.max(0.2, 1 - (player.monetaryValue - 1) / 125);
  const progress = (player.developmentProgress || 0) +
    (resultMomentum + performanceMomentum) * ratingCeilingFactor;

  if (progress >= PROGRESSION_PERFORMANCE_THRESHOLD) {
    return {
      ...player,
      monetaryValue: Math.min(100, player.monetaryValue + 1),
      developmentProgress: progress - PROGRESSION_PERFORMANCE_THRESHOLD,
    };
  }

  if (progress <= -PROGRESSION_PERFORMANCE_THRESHOLD) {
    return {
      ...player,
      monetaryValue: Math.max(1, player.monetaryValue - 1),
      developmentProgress: progress + PROGRESSION_PERFORMANCE_THRESHOLD,
    };
  }

  return { ...player, developmentProgress: progress };
}
