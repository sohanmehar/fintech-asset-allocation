/**
 * Calculates weighted average portfolio liquidity score on a 0-100 scale.
 */
export function calculatePortfolioLiquidityScore(
  holdings: Array<{ weight: number; liquidityScore: number }>
): number {
  if (!holdings || holdings.length === 0) return 0;
  const weightedLiquidity = holdings.reduce(
    (sum, h) => sum + h.weight * (h.liquidityScore || 0),
    0
  );
  return Math.round(weightedLiquidity * 100) / 100;
}
