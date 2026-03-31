const SPEND_POINTS: Record<string, number> = {
  '0-999': 0,
  '1000-9999': 2,
  '10000-49999': 4,
  '50000-99999': 6,
  '100000-499999': 8,
  '500000-999999': 10,
  '1000000+': 12,
};

const IMPRESSIONS_POINTS: Record<string, number> = {
  '0-9999': 0,
  '10000-99999': 2,
  '100000-499999': 4,
  '500000-999999': 6,
  '1000000-4999999': 8,
  '5000000-9999999': 10,
  '10000000+': 12,
};

export function calculateScore(
  spendRange: string,
  impressionsRange: string,
  daysActive: number,
  trend: 'growing' | 'stable' | 'declining' = 'stable'
): { total: number; isScaled: boolean } {
  const spendPoints = SPEND_POINTS[spendRange] || 0;
  const impressionsPoints = IMPRESSIONS_POINTS[impressionsRange] || 0;
  const durationPoints =
    daysActive <= 7 ? 1 : daysActive <= 30 ? 3 : daysActive <= 90 ? 5 : 7;
  const trendPoints = trend === 'growing' ? 3 : trend === 'stable' ? 1 : 0;
  const total = spendPoints + impressionsPoints + durationPoints + trendPoints;
  return { total, isScaled: total >= 18 };
}

export function getSpendRangeLabel(range: string): string {
  const labels: Record<string, string> = {
    '0-999': 'Menos de R$1.000',
    '1000-9999': 'R$1.000 - R$9.999',
    '10000-49999': 'R$10.000 - R$49.999',
    '50000-99999': 'R$50.000 - R$99.999',
    '100000-499999': 'R$100.000 - R$499.999',
    '500000-999999': 'R$500.000 - R$999.999',
    '1000000+': 'Mais de R$1.000.000',
  };
  return labels[range] || range;
}
