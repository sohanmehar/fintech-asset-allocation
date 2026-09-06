import { TransactionCostSummary } from './types';

/**
 * Calculates portfolio turnover and estimated transaction costs.
 * 
 * turnover = Sum( |targetWeight_i - currentWeight_i| )
 * estimatedCost = turnover * totalCapital * transactionCostRate
 */
export function calculateTransactionCost(
  currentWeights: number[],
  targetWeights: number[],
  totalCapital: number,
  transactionCostRate: number = 0.0025
): TransactionCostSummary {
  if (currentWeights.length !== targetWeights.length) {
    throw new Error('Current weights length does not match target weights length.');
  }

  let turnover = 0;
  for (let i = 0; i < currentWeights.length; i++) {
    turnover += Math.abs(targetWeights[i] - currentWeights[i]);
  }

  turnover = Math.round(turnover * 10000) / 10000;
  const estimatedCost = Math.round(turnover * totalCapital * transactionCostRate * 100) / 100;

  return {
    turnover,
    rate: transactionCostRate,
    estimatedCost,
  };
}
