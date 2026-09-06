import { PolicyEvaluationResult, PolicyBreachItem, SeverityLevel } from './types';
import { IRiskPolicy } from '../../models/RiskPolicy';

export interface EvaluationInput {
  portfolioHoldings: Array<{ symbol: string; weight: number; assetClass: string }>;
  equityExposure: number;
  cashAllocation: number;
  portfolioLiquidity: number;
  portfolioVolatility: number;
  maximumDrawdown: number;
  allocationValid: boolean;
  allocationTotalWeight: number;
  policy: IRiskPolicy;
}

export function evaluateRiskPolicy(input: EvaluationInput): PolicyEvaluationResult {
  const {
    portfolioHoldings,
    equityExposure,
    cashAllocation,
    portfolioLiquidity,
    portfolioVolatility,
    maximumDrawdown,
    allocationValid,
    allocationTotalWeight,
    policy,
  } = input;

  const breaches: PolicyBreachItem[] = [];

  // Helper for severity assignment
  const determineSeverity = (ratio: number, isLowerBetter: boolean = true): SeverityLevel => {
    if (isLowerBetter) {
      if (ratio > 1.10) return 'CRITICAL';
      if (ratio > 1.00) return 'WARNING';
      return 'INFO';
    } else {
      if (ratio < 0.85) return 'CRITICAL';
      if (ratio < 1.00) return 'WARNING';
      return 'INFO';
    }
  };

  // 1. Allocation Inconsistency Check
  if (!allocationValid) {
    breaches.push({
      type: 'ALLOCATION_INCONSISTENCY',
      severity: 'CRITICAL',
      currentValue: allocationTotalWeight,
      limit: 1.0,
      excess: Math.round(Math.abs(allocationTotalWeight - 1.0) * 1000) / 1000,
      message: `Portfolio allocation sum (${(allocationTotalWeight * 100).toFixed(1)}%) does not equal 100%.`,
    });
  }

  // 2. Equity Exposure Check
  if (equityExposure > policy.maxEquityExposure) {
    const excess = Math.round((equityExposure - policy.maxEquityExposure) * 1000) / 1000;
    const ratio = equityExposure / policy.maxEquityExposure;
    const severity = determineSeverity(ratio, true);

    breaches.push({
      type: 'EQUITY_EXPOSURE',
      severity,
      currentValue: Math.round(equityExposure * 1000) / 1000,
      limit: policy.maxEquityExposure,
      excess,
      message: `Equity exposure (${(equityExposure * 100).toFixed(1)}%) exceeds the ${policy.name} policy limit of ${(policy.maxEquityExposure * 100).toFixed(1)}% by ${(excess * 100).toFixed(1)} percentage points.`,
    });
  }

  // 3. Individual Asset Weight Limit Check
  portfolioHoldings.forEach((h) => {
    if (h.weight > policy.maxIndividualAssetWeight) {
      const excess = Math.round((h.weight - policy.maxIndividualAssetWeight) * 1000) / 1000;
      const ratio = h.weight / policy.maxIndividualAssetWeight;
      const severity = determineSeverity(ratio, true);

      breaches.push({
        type: 'INDIVIDUAL_ASSET_WEIGHT',
        severity,
        currentValue: Math.round(h.weight * 1000) / 1000,
        limit: policy.maxIndividualAssetWeight,
        excess,
        assetSymbol: h.symbol,
        message: `Asset '${h.symbol}' weight (${(h.weight * 100).toFixed(1)}%) exceeds maximum individual asset weight limit of ${(policy.maxIndividualAssetWeight * 100).toFixed(1)}%.`,
      });
    }
  });

  // 4. Minimum Cash Allocation Check
  if (cashAllocation < policy.minCashAllocation) {
    const shortfall = Math.round((policy.minCashAllocation - cashAllocation) * 1000) / 1000;
    const ratio = cashAllocation / policy.minCashAllocation;
    const severity = determineSeverity(ratio, false);

    breaches.push({
      type: 'MIN_CASH',
      severity,
      currentValue: Math.round(cashAllocation * 1000) / 1000,
      limit: policy.minCashAllocation,
      excess: shortfall,
      message: `Cash allocation (${(cashAllocation * 100).toFixed(1)}%) is below the minimum required buffer of ${(policy.minCashAllocation * 100).toFixed(1)}%.`,
    });
  }

  // 5. Minimum Liquidity Score Check
  if (portfolioLiquidity < policy.minLiquidityScore) {
    const shortfall = Math.round((policy.minLiquidityScore - portfolioLiquidity) * 10) / 10;
    const ratio = portfolioLiquidity / policy.minLiquidityScore;
    const severity = determineSeverity(ratio, false);

    breaches.push({
      type: 'MIN_LIQUIDITY',
      severity,
      currentValue: Math.round(portfolioLiquidity * 10) / 10,
      limit: policy.minLiquidityScore,
      excess: shortfall,
      message: `Portfolio liquidity score (${portfolioLiquidity.toFixed(1)}) is below policy minimum threshold of ${policy.minLiquidityScore}.`,
    });
  }

  // 6. Maximum Portfolio Volatility Check
  if (portfolioVolatility > policy.maxPortfolioVolatility) {
    const excess = Math.round((portfolioVolatility - policy.maxPortfolioVolatility) * 1000) / 1000;
    const ratio = portfolioVolatility / policy.maxPortfolioVolatility;
    const severity = determineSeverity(ratio, true);

    breaches.push({
      type: 'MAX_VOLATILITY',
      severity,
      currentValue: Math.round(portfolioVolatility * 1000) / 1000,
      limit: policy.maxPortfolioVolatility,
      excess,
      message: `Annualized portfolio volatility (${(portfolioVolatility * 100).toFixed(1)}%) exceeds policy limit of ${(policy.maxPortfolioVolatility * 100).toFixed(1)}%.`,
    });
  }

  // 7. Maximum Drawdown Check
  if (maximumDrawdown > policy.maxDrawdown) {
    const excess = Math.round((maximumDrawdown - policy.maxDrawdown) * 1000) / 1000;
    const ratio = maximumDrawdown / policy.maxDrawdown;
    const severity = determineSeverity(ratio, true);

    breaches.push({
      type: 'MAX_DRAWDOWN',
      severity,
      currentValue: Math.round(maximumDrawdown * 1000) / 1000,
      limit: policy.maxDrawdown,
      excess,
      message: `Historical maximum drawdown (${(maximumDrawdown * 100).toFixed(1)}%) exceeds policy limit of ${(policy.maxDrawdown * 100).toFixed(1)}%.`,
    });
  }

  return {
    passed: breaches.length === 0,
    totalBreaches: breaches.length,
    breaches,
  };
}
