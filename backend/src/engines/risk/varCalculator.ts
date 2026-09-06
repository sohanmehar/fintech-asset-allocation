import { VaRResult, VAR_Z_95, TRADING_DAYS_PER_YEAR } from './types';

/**
 * Calculates Parametric 1-Day 95% Value at Risk (VaR).
 * 
 * Formula:
 * VaR = Z_95 * portfolioDailyVolatility * totalCapital
 * where Z_95 = 1.645 for 95% confidence level.
 */
export function calculateParametricVaR(
  annualPortfolioVolatility: number,
  totalCapital: number
): VaRResult {
  const dailyVolatility = annualPortfolioVolatility / Math.sqrt(TRADING_DAYS_PER_YEAR);
  const varPercentage = VAR_Z_95 * dailyVolatility;
  const varAmount = Math.abs(varPercentage * totalCapital);

  return {
    confidenceLevel: 0.95,
    horizonDays: 1,
    amount: Math.round(varAmount * 100) / 100,
    percentage: Math.round(varPercentage * 100000) / 100000,
    label: 'Parametric 1-day 95% VaR',
  };
}
