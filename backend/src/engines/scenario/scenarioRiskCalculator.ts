import { RiskReport } from '../risk/types';
import { calculateCompositeRiskScore } from '../risk/riskScoreCalculator';
import { evaluateRiskPolicy } from '../risk/policyEvaluator';
import { IRiskPolicy } from '../../models/RiskPolicy';
import {
  AssetShockDetail,
  MetricDifference,
  ScenarioDefinition,
  StressedMetricSnapshot,
  StressedPolicyBreach,
  StressedPolicyEvaluation,
} from './types';

export function calculateScenarioRiskMetrics(
  baseRiskReport: RiskReport,
  assetImpacts: AssetShockDetail[],
  stressedTotalCapital: number,
  scenarioDef: ScenarioDefinition,
  riskPolicy: IRiskPolicy
): {
  currentSnapshot: StressedMetricSnapshot;
  stressedSnapshot: StressedMetricSnapshot;
  metricChanges: MetricDifference;
  policyEvaluation: StressedPolicyEvaluation;
} {
  // 1. Current Snapshot
  const currentSnapshot: StressedMetricSnapshot = {
    totalCapital: baseRiskReport.totalCapital,
    expectedReturn: baseRiskReport.metrics.expectedReturn,
    portfolioVolatility: baseRiskReport.metrics.portfolioVolatility,
    var95Amount: baseRiskReport.metrics.var95.amount,
    var95Percentage: baseRiskReport.metrics.var95.percentage,
    maximumDrawdown: baseRiskReport.metrics.maximumDrawdown,
    liquidityScore: baseRiskReport.metrics.liquidityScore,
    concentrationHHI: baseRiskReport.metrics.concentration.hhi,
    equityExposure: baseRiskReport.metrics.equityExposure,
    cashAllocation: baseRiskReport.metrics.cashAllocation,
    riskScore: baseRiskReport.riskScore.score,
    riskLevel: baseRiskReport.riskScore.level,
    policyPassed: baseRiskReport.policyEvaluation.passed,
  };

  // 2. Compute Stressed Weights and Capital Allocations
  let stressedEquityWeightSum = 0;
  let stressedCashWeightSum = 0;
  let hhiSum = 0;
  let weightedLiquiditySum = 0;

  const stressedHoldingsForPolicy = assetImpacts.map((a) => {
    const stressedWeight = stressedTotalCapital > 0 ? a.stressedValue / stressedTotalCapital : 0;
    
    // Accumulate Exposure
    if (a.assetClass === 'EQUITY') {
      stressedEquityWeightSum += stressedWeight;
    } else if (a.assetClass === 'CASH') {
      stressedCashWeightSum += stressedWeight;
    }

    // Concentration HHI
    hhiSum += Math.pow(stressedWeight, 2);

    // Liquidity Score with optional deterioration penalty
    let assetLiquidity = 90; // Default fallback
    const matchedAsset = baseRiskReport.assetMetrics.find((am) => am.symbol === a.symbol);
    if (matchedAsset && matchedAsset.liquidityScore !== undefined) {
      assetLiquidity = matchedAsset.liquidityScore;
    }

    if (scenarioDef.liquidityDeteriorationFactor && a.assetClass !== 'CASH') {
      assetLiquidity = Math.max(10, assetLiquidity * (1 - scenarioDef.liquidityDeteriorationFactor));
    }

    weightedLiquiditySum += stressedWeight * assetLiquidity;

    return {
      symbol: a.symbol,
      weight: stressedWeight,
      assetClass: a.assetClass,
    };
  });

  const stressedEquityExposure = Math.round(stressedEquityWeightSum * 10000) / 10000;
  const stressedCashAllocation = Math.round(stressedCashWeightSum * 10000) / 10000;
  const stressedHHI = Math.round(hhiSum * 10000) / 10000;
  const stressedLiquidityScore = Math.round(weightedLiquiditySum * 100) / 100;

  // Stressed Volatility & Return Estimation
  // Stressed volatility shifts proportional to average asset price shocks or stressed weight shifts
  const weightedShock = assetImpacts.reduce((sum, a) => {
    const origWeight = baseRiskReport.totalCapital > 0 ? a.currentValue / baseRiskReport.totalCapital : 0;
    return sum + origWeight * a.shock;
  }, 0);

  // Severe market crash / liquidity crisis elevates volatility factor
  let volMultiplier = 1.0;
  if (scenarioDef.type === 'MARKET_CRASH') volMultiplier = 1.45;
  else if (scenarioDef.type === 'LIQUIDITY_CRISIS') volMultiplier = 1.35;
  else if (scenarioDef.type === 'RATE_SHOCK') volMultiplier = 1.25;
  else if (scenarioDef.type === 'SECTOR_SHOCK') volMultiplier = 1.15;
  else if (weightedShock < -0.10) volMultiplier = 1.30;

  const stressedVolatility = Math.round(baseRiskReport.metrics.portfolioVolatility * volMultiplier * 10000) / 10000;
  
  // Stressed expected return shifts according to weighted shock
  const stressedExpectedReturn = Math.round((baseRiskReport.metrics.expectedReturn + weightedShock * 0.5) * 10000) / 10000;

  // Stressed VaR (Parametric 95% 1-day)
  const stressedVarPercentage = Math.round(((1.645 * stressedVolatility) / Math.sqrt(252)) * 100000) / 100000;
  const stressedVarAmount = Math.round(stressedVarPercentage * stressedTotalCapital);

  // Stressed Drawdown (increases proportionally with market losses)
  const lossPercent = Math.max(0, (baseRiskReport.totalCapital - stressedTotalCapital) / baseRiskReport.totalCapital);
  const stressedDrawdown = Math.round(Math.min(0.95, baseRiskReport.metrics.maximumDrawdown + lossPercent) * 10000) / 10000;

  // Stressed Composite Risk Score
  const compositeScoreResult = calculateCompositeRiskScore({
    portfolioVolatility: stressedVolatility,
    var95Percentage: stressedVarPercentage,
    hhi: stressedHHI,
    maximumDrawdown: stressedDrawdown,
    portfolioLiquidity: stressedLiquidityScore,
    policy: riskPolicy,
  });

  // Stressed Policy Evaluation
  const rawPolicyResult = evaluateRiskPolicy({
    portfolioHoldings: stressedHoldingsForPolicy,
    equityExposure: stressedEquityExposure,
    cashAllocation: stressedCashAllocation,
    portfolioLiquidity: stressedLiquidityScore,
    portfolioVolatility: stressedVolatility,
    maximumDrawdown: stressedDrawdown,
    allocationValid: true,
    allocationTotalWeight: 1.0,
    policy: riskPolicy,
  });

  const stressedPolicyBreaches: StressedPolicyBreach[] = rawPolicyResult.breaches.map((b) => ({
    type: b.type,
    severity: b.severity,
    currentValue: b.type === 'EQUITY_EXPOSURE' ? currentSnapshot.equityExposure : b.type === 'MIN_CASH' ? currentSnapshot.cashAllocation : b.currentValue,
    stressedValue: b.currentValue,
    limit: b.limit,
    excessPP: Math.round(b.excess * 100 * 10) / 10,
    message: b.message,
  }));

  const policyEvaluation: StressedPolicyEvaluation = {
    passed: rawPolicyResult.passed,
    totalBreaches: rawPolicyResult.totalBreaches,
    breaches: stressedPolicyBreaches,
  };

  // Stressed Snapshot
  const stressedSnapshot: StressedMetricSnapshot = {
    totalCapital: stressedTotalCapital,
    expectedReturn: stressedExpectedReturn,
    portfolioVolatility: stressedVolatility,
    var95Amount: stressedVarAmount,
    var95Percentage: stressedVarPercentage,
    maximumDrawdown: stressedDrawdown,
    liquidityScore: stressedLiquidityScore,
    concentrationHHI: stressedHHI,
    equityExposure: stressedEquityExposure,
    cashAllocation: stressedCashAllocation,
    riskScore: compositeScoreResult.score,
    riskLevel: compositeScoreResult.level,
    policyPassed: rawPolicyResult.passed,
  };

  // Metric Differences (Changes)
  const metricChanges: MetricDifference = {
    totalCapitalChange: stressedSnapshot.totalCapital - currentSnapshot.totalCapital,
    totalCapitalChangePercent: (stressedSnapshot.totalCapital - currentSnapshot.totalCapital) / currentSnapshot.totalCapital,
    expectedReturnDiffPP: (stressedSnapshot.expectedReturn - currentSnapshot.expectedReturn) * 100,
    volatilityDiffPP: (stressedSnapshot.portfolioVolatility - currentSnapshot.portfolioVolatility) * 100,
    var95AmountChange: stressedSnapshot.var95Amount - currentSnapshot.var95Amount,
    maximumDrawdownDiffPP: (stressedSnapshot.maximumDrawdown - currentSnapshot.maximumDrawdown) * 100,
    liquidityScoreDiffPts: stressedSnapshot.liquidityScore - currentSnapshot.liquidityScore,
    concentrationHHIDiff: stressedSnapshot.concentrationHHI - currentSnapshot.concentrationHHI,
    equityExposureDiffPP: (stressedSnapshot.equityExposure - currentSnapshot.equityExposure) * 100,
    cashAllocationDiffPP: (stressedSnapshot.cashAllocation - currentSnapshot.cashAllocation) * 100,
    riskScoreDiffPts: stressedSnapshot.riskScore - currentSnapshot.riskScore,
  };

  return {
    currentSnapshot,
    stressedSnapshot,
    metricChanges,
    policyEvaluation,
  };
}
