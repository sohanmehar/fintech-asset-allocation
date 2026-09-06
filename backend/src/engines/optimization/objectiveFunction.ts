import { ObjectiveBreakdown } from './types';
import { calculatePortfolioVolatility } from '../risk/volatilityCalculator';
import { calculatePortfolioExpectedReturn } from '../risk/returnCalculator';

export interface ObjectiveInput {
  weights: number[];
  currentWeights: number[];
  expectedReturns: number[];
  annualCovarianceMatrix: number[][];
  riskAversion: number;
  transactionCostRate: number;
}

/**
 * Calculates the mean-variance objective value for a candidate allocation:
 * 
 * Objective(w) = ExpectedReturn(w) - riskAversion * PortfolioVariance(w) - TransactionCostPenalty(w)
 * 
 * where:
 * - ExpectedReturn(w) = Sum( w_i * expectedReturn_i )
 * - PortfolioVariance(w) = w^T * Sigma_annual * w
 * - TransactionCostPenalty(w) = turnover * transactionCostRate
 *   (turnover = Sum( |w_i - currentWeight_i| ))
 */
export function evaluateObjectiveFunction(input: ObjectiveInput): ObjectiveBreakdown {
  const {
    weights,
    currentWeights,
    expectedReturns,
    annualCovarianceMatrix,
    riskAversion,
    transactionCostRate,
  } = input;

  // 1. Expected Portfolio Return
  const expectedReturnComponent = calculatePortfolioExpectedReturn(weights, expectedReturns);

  // 2. Portfolio Variance Risk Penalty
  const portfolioVolatility = calculatePortfolioVolatility(weights, annualCovarianceMatrix);
  const portfolioVariance = Math.pow(portfolioVolatility, 2);
  const riskPenalty = riskAversion * portfolioVariance;

  // 3. Transaction Cost Penalty
  let turnover = 0;
  for (let i = 0; i < weights.length; i++) {
    turnover += Math.abs(weights[i] - currentWeights[i]);
  }
  const transactionCostPenalty = turnover * transactionCostRate;

  // Total Objective Value
  const totalObjective = expectedReturnComponent - riskPenalty - transactionCostPenalty;

  return {
    expectedReturnComponent: Math.round(expectedReturnComponent * 100000) / 100000,
    riskPenalty: Math.round(riskPenalty * 100000) / 100000,
    transactionCostPenalty: Math.round(transactionCostPenalty * 100000) / 100000,
    totalObjective: Math.round(totalObjective * 100000) / 100000,
  };
}
