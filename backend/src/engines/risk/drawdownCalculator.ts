import { AlignedPriceData } from './returnCalculator';

/**
 * Calculates historical Maximum Drawdown for a portfolio.
 * 
 * 1. Normalizes each asset's price series to 1.0 on day 0: P_norm[t] = P[t] / P[0].
 * 2. Portfolio Index Value on day t: V[t] = Sum( weight_i * P_norm[i, t] ).
 * 3. Running peak M[t] = max_{0..t}(V[s]).
 * 4. Drawdown D[t] = (V[t] - M[t]) / M[t].
 * 5. Max Drawdown = abs(min(D[t])).
 */
export function calculateHistoricalMaxDrawdown(
  alignedPrices: AlignedPriceData,
  weights: number[]
): number {
  const { priceMatrix } = alignedPrices;
  const numDates = priceMatrix.length;
  const numAssets = weights.length;

  if (numDates === 0) return 0;

  const basePrices = priceMatrix[0];
  const portfolioValues: number[] = new Array(numDates);

  for (let t = 0; t < numDates; t++) {
    let portVal = 0;
    for (let a = 0; a < numAssets; a++) {
      const normalizedPrice = priceMatrix[t][a] / basePrices[a];
      portVal += weights[a] * normalizedPrice;
    }
    portfolioValues[t] = portVal;
  }

  let runningPeak = portfolioValues[0];
  let maxDrawdown = 0;

  for (let t = 0; t < numDates; t++) {
    if (portfolioValues[t] > runningPeak) {
      runningPeak = portfolioValues[t];
    }
    const currentDrawdown = (portfolioValues[t] - runningPeak) / runningPeak;
    if (currentDrawdown < maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }
  }

  return Math.abs(maxDrawdown);
}
