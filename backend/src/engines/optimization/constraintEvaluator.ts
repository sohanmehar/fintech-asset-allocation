import { ConstraintEvaluationResult, ConstraintValidationItem } from './types';
import { calculatePortfolioVolatility } from '../risk/volatilityCalculator';
import { calculatePortfolioLiquidityScore } from '../risk/liquidityCalculator';
import { calculateHistoricalMaxDrawdown } from '../risk/drawdownCalculator';
import { AlignedPriceData } from '../risk/returnCalculator';

export interface ConstraintInput {
  weights: number[];
  assets: Array<{
    symbol: string;
    assetClass: string;
    minWeight: number;
    maxWeight: number;
    liquidityScore: number;
  }>;
  alignedPrices: AlignedPriceData;
  annualCovarianceMatrix: number[][];
  maxEquityExposure: number;
  minCashAllocation: number;
  maxPortfolioVolatility: number;
  minLiquidityScore: number;
  maxIndividualAssetWeight: number;
  maxDrawdown: number;
}

export function evaluateConstraints(input: ConstraintInput): ConstraintEvaluationResult {
  const {
    weights,
    assets,
    alignedPrices,
    annualCovarianceMatrix,
    maxEquityExposure,
    minCashAllocation,
    maxPortfolioVolatility,
    minLiquidityScore,
    maxIndividualAssetWeight,
    maxDrawdown,
  } = input;

  const violations: string[] = [];
  const constraintItems: ConstraintValidationItem[] = [];

  // 1. Sum of weights = 1.0 (numerical tolerance 1e-5)
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const totalWeightDiff = Math.abs(totalWeight - 1.0);
  const totalWeightPassed = totalWeightDiff <= 1e-4;

  constraintItems.push({
    name: 'Total Allocation Weight',
    current: Math.round(totalWeight * 10000) / 10000,
    limit: 1.0,
    status: totalWeightPassed ? 'PASS' : 'FAIL',
    message: totalWeightPassed
      ? 'Total allocation equals 100%.'
      : `Sum of weights (${(totalWeight * 100).toFixed(2)}%) must equal 100%.`,
  });
  if (!totalWeightPassed) {
    violations.push(`Total allocation sum (${(totalWeight * 100).toFixed(2)}%) does not equal 100%.`);
  }

  // 2. Non-negative weights
  let negativeWeightFound = false;
  weights.forEach((w, idx) => {
    if (w < -1e-6) {
      negativeWeightFound = true;
      violations.push(`Asset '${assets[idx].symbol}' weight cannot be negative (${(w * 100).toFixed(2)}%).`);
    }
  });
  constraintItems.push({
    name: 'No Short Selling (Non-Negative Weights)',
    current: negativeWeightFound ? -1 : 0,
    limit: 0,
    status: !negativeWeightFound ? 'PASS' : 'FAIL',
    message: !negativeWeightFound ? 'No negative weights present.' : 'Negative asset weights detected.',
  });

  // 3 & 4. Individual Asset Min & Max Weights
  let individualLimitPassed = true;
  assets.forEach((asset, idx) => {
    const w = weights[idx];
    const effectiveMin = asset.minWeight || 0;
    const effectiveMax = Math.min(asset.maxWeight || 1.0, maxIndividualAssetWeight);

    if (w < effectiveMin - 1e-5) {
      individualLimitPassed = false;
      violations.push(`Asset '${asset.symbol}' weight (${(w * 100).toFixed(1)}%) is below minimum limit (${(effectiveMin * 100).toFixed(1)}%).`);
    }
    if (w > effectiveMax + 1e-5) {
      individualLimitPassed = false;
      violations.push(`Asset '${asset.symbol}' weight (${(w * 100).toFixed(1)}%) exceeds maximum limit (${(effectiveMax * 100).toFixed(1)}%).`);
    }
  });
  constraintItems.push({
    name: 'Individual Asset Weight Limits',
    current: individualLimitPassed ? 0 : 1,
    limit: 0,
    status: individualLimitPassed ? 'PASS' : 'FAIL',
    message: individualLimitPassed ? 'All asset weights conform to individual limits.' : 'Individual asset weight limits breached.',
  });

  // 5. Equity Exposure
  let equityExposure = 0;
  assets.forEach((a, idx) => {
    if (a.assetClass === 'EQUITY') equityExposure += weights[idx];
  });
  const equityPassed = equityExposure <= maxEquityExposure + 1e-5;
  constraintItems.push({
    name: 'Maximum Equity Exposure',
    current: Math.round(equityExposure * 10000) / 10000,
    limit: maxEquityExposure,
    status: equityPassed ? 'PASS' : 'FAIL',
    message: equityPassed
      ? `Equity exposure (${(equityExposure * 100).toFixed(1)}%) complies with limit (${(maxEquityExposure * 100).toFixed(1)}%).`
      : `Equity exposure (${(equityExposure * 100).toFixed(1)}%) exceeds limit (${(maxEquityExposure * 100).toFixed(1)}%).`,
  });
  if (!equityPassed) {
    violations.push(`Equity exposure (${(equityExposure * 100).toFixed(1)}%) exceeds limit (${(maxEquityExposure * 100).toFixed(1)}%).`);
  }

  // 6. Minimum Cash Allocation
  let cashAllocation = 0;
  assets.forEach((a, idx) => {
    if (a.assetClass === 'CASH') cashAllocation += weights[idx];
  });
  const cashPassed = cashAllocation >= minCashAllocation - 1e-5;
  constraintItems.push({
    name: 'Minimum Cash Allocation',
    current: Math.round(cashAllocation * 10000) / 10000,
    limit: minCashAllocation,
    status: cashPassed ? 'PASS' : 'FAIL',
    message: cashPassed
      ? `Cash allocation (${(cashAllocation * 100).toFixed(1)}%) meets buffer requirement (${(minCashAllocation * 100).toFixed(1)}%).`
      : `Cash allocation (${(cashAllocation * 100).toFixed(1)}%) is below buffer requirement (${(minCashAllocation * 100).toFixed(1)}%).`,
  });
  if (!cashPassed) {
    violations.push(`Cash allocation (${(cashAllocation * 100).toFixed(1)}%) is below minimum requirement (${(minCashAllocation * 100).toFixed(1)}%).`);
  }

  // 7. Maximum Portfolio Volatility
  const portfolioVolatility = calculatePortfolioVolatility(weights, annualCovarianceMatrix);
  const volPassed = portfolioVolatility <= maxPortfolioVolatility + 1e-5;
  constraintItems.push({
    name: 'Maximum Portfolio Volatility',
    current: Math.round(portfolioVolatility * 10000) / 10000,
    limit: maxPortfolioVolatility,
    status: volPassed ? 'PASS' : 'FAIL',
    message: volPassed
      ? `Portfolio volatility (${(portfolioVolatility * 100).toFixed(2)}%) is within limit (${(maxPortfolioVolatility * 100).toFixed(2)}%).`
      : `Portfolio volatility (${(portfolioVolatility * 100).toFixed(2)}%) exceeds limit (${(maxPortfolioVolatility * 100).toFixed(2)}%).`,
  });
  if (!volPassed) {
    violations.push(`Portfolio volatility (${(portfolioVolatility * 100).toFixed(2)}%) exceeds limit (${(maxPortfolioVolatility * 100).toFixed(2)}%).`);
  }

  // 8. Minimum Portfolio Liquidity Score
  const portfolioLiquidity = calculatePortfolioLiquidityScore(
    assets.map((a, idx) => ({ weight: weights[idx], liquidityScore: a.liquidityScore || 80 }))
  );
  const liqPassed = portfolioLiquidity >= minLiquidityScore - 1e-5;
  constraintItems.push({
    name: 'Minimum Portfolio Liquidity',
    current: Math.round(portfolioLiquidity * 10) / 10,
    limit: minLiquidityScore,
    status: liqPassed ? 'PASS' : 'FAIL',
    message: liqPassed
      ? `Portfolio liquidity (${portfolioLiquidity.toFixed(1)}) meets requirement (${minLiquidityScore}).`
      : `Portfolio liquidity (${portfolioLiquidity.toFixed(1)}) is below requirement (${minLiquidityScore}).`,
  });
  if (!liqPassed) {
    violations.push(`Portfolio liquidity (${portfolioLiquidity.toFixed(1)}) is below threshold (${minLiquidityScore}).`);
  }

  // 9. Maximum Historical Drawdown
  const maximumDrawdown = calculateHistoricalMaxDrawdown(alignedPrices, weights);
  const ddPassed = maximumDrawdown <= maxDrawdown + 1e-5;
  constraintItems.push({
    name: 'Maximum Portfolio Drawdown',
    current: Math.round(maximumDrawdown * 10000) / 10000,
    limit: maxDrawdown,
    status: ddPassed ? 'PASS' : 'FAIL',
    message: ddPassed
      ? `Max drawdown (${(maximumDrawdown * 100).toFixed(2)}%) is within limit (${(maxDrawdown * 100).toFixed(2)}%).`
      : `Max drawdown (${(maximumDrawdown * 100).toFixed(2)}%) exceeds limit (${(maxDrawdown * 100).toFixed(2)}%).`,
  });
  if (!ddPassed) {
    violations.push(`Max drawdown (${(maximumDrawdown * 100).toFixed(2)}%) exceeds limit (${(maxDrawdown * 100).toFixed(2)}%).`);
  }

  return {
    feasible: violations.length === 0,
    totalViolations: violations.length,
    violations,
    constraintItems,
  };
}
