import { TRADING_DAYS_PER_YEAR } from './types';

/**
 * Calculates sample standard deviation of an array of numbers.
 */
export function calculateSampleStandardDeviation(values: number[]): number {
  const n = values.length;
  if (n <= 1) return 0;

  const mean = values.reduce((sum, v) => sum + v, 0) / n;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / (n - 1);
  return Math.sqrt(variance);
}

/**
 * Calculates annualized volatility for an asset return series.
 * Annualized Volatility = dailyStdDev * sqrt(252)
 */
export function calculateAnnualVolatility(dailyReturns: number[]): number {
  const dailyStd = calculateSampleStandardDeviation(dailyReturns);
  return dailyStd * Math.sqrt(TRADING_DAYS_PER_YEAR);
}

/**
 * Calculates portfolio annualized volatility using matrix quadratic formula:
 * Portfolio Variance = w^T * Sigma_annual * w
 * Portfolio Volatility = sqrt(Portfolio Variance)
 */
export function calculatePortfolioVolatility(
  weights: number[],
  annualCovarianceMatrix: number[][]
): number {
  const n = weights.length;
  if (n !== annualCovarianceMatrix.length) {
    throw new Error('Weights dimension does not match covariance matrix dimensions.');
  }

  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      variance += weights[i] * weights[j] * annualCovarianceMatrix[i][j];
    }
  }

  return Math.sqrt(Math.max(0, variance));
}
