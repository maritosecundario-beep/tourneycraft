import type { ScoringRuleType, Tournament } from '@/lib/types';

export function getScoreRuleError(
  type: ScoringRuleType,
  value: number,
  rangeMin: number,
  rangeMax: number,
  homeScore: number,
  awayScore: number,
): string | null {
  if (![homeScore, awayScore].every(score => Number.isInteger(score) && score >= 0)) {
    return 'Los resultados deben ser números enteros no negativos.';
  }

  if (type === 'nToNRange') {
    if (rangeMin > rangeMax) return 'El mínimo del rango no puede superar el máximo.';
    const total = homeScore + awayScore;
    return total < rangeMin || total > rangeMax
      ? `La suma de los resultados debe estar entre ${rangeMin} y ${rangeMax}.`
      : null;
  }

  if (type === 'bestOfN') {
    return homeScore + awayScore !== value
      ? `Los dos resultados deben sumar exactamente ${value}.`
      : null;
  }

  if (Math.max(homeScore, awayScore) !== value || homeScore === awayScore) {
    return `El ganador debe alcanzar exactamente ${value} puntos y no puede haber empate.`;
  }
  return null;
}

export function generateScore(tournament: Tournament, homeWinProbability: number) {
  const probability = Math.max(0.05, Math.min(0.95, homeWinProbability));
  const value = Math.max(1, Math.floor(tournament.scoringValue || 9));
  let total: number;

  if (tournament.scoringRuleType === 'nToNRange') {
    const min = Math.max(0, Math.floor(tournament.nToNRangeMin ?? 0));
    const max = Math.max(min, Math.floor(tournament.nToNRangeMax ?? 10));
    total = min + Math.floor(Math.random() * (max - min + 1));
  } else if (tournament.scoringRuleType === 'bestOfN') {
    total = value;
  } else {
    const homeWins = Math.random() < probability;
    const loserScore = Math.floor(Math.random() * value);
    return homeWins ? { homeScore: value, awayScore: loserScore } : { homeScore: loserScore, awayScore: value };
  }

  let homeScore = 0;
  for (let point = 0; point < total; point++) {
    if (Math.random() < probability) homeScore++;
  }
  return { homeScore, awayScore: total - homeScore };
}
