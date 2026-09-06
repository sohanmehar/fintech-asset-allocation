import { RiskReport } from '../risk/types';
import { IRiskPolicy } from '../../models/RiskPolicy';
import { AlertCandidate, AlertType } from './types';
import { determineAlertSeverity } from './alertSeverity';

/**
 * Generator constructing alert candidates by analyzing base Risk Engine outputs.
 * DO NOT recalculate financial formulas; consume Risk Engine outputs directly.
 */
export function generateAlertCandidates(
  portfolioId: string,
  riskReport: RiskReport,
  riskPolicy: IRiskPolicy
): AlertCandidate[] {
  const alerts: AlertCandidate[] = [];
  const warningRatio = riskPolicy.warningThreshold || 0.85;

  const m = riskReport.metrics;
  const policyName = riskPolicy.name || 'DEFAULT';

  // 1. Equity Exposure Alert
  if (m.equityExposure > riskPolicy.maxEquityExposure) {
    const excess = m.equityExposure - riskPolicy.maxEquityExposure;
    const severity = determineAlertSeverity('EQUITY_EXPOSURE', m.equityExposure, riskPolicy.maxEquityExposure, excess, warningRatio);
    const excessPP = (excess * 100).toFixed(1);
    alerts.push({
      portfolioId,
      type: 'EQUITY_EXPOSURE',
      severity,
      title: 'Equity Exposure Policy Breach',
      message: `Equity exposure is ${(m.equityExposure * 100).toFixed(1)}%, exceeding the ${policyName} policy ceiling of ${(riskPolicy.maxEquityExposure * 100).toFixed(1)}% by ${excessPP} percentage points.`,
      metric: 'equityExposure',
      currentValue: m.equityExposure,
      limitValue: riskPolicy.maxEquityExposure,
      excessValue: excess,
      recommendation: `Reduce equity exposure by approximately ${excessPP} percentage points toward defensive assets or cash.`,
      source: 'RISK_ENGINE',
    });
  } else if (m.equityExposure >= riskPolicy.maxEquityExposure * warningRatio) {
    alerts.push({
      portfolioId,
      type: 'EQUITY_EXPOSURE',
      severity: 'WARNING',
      title: 'Equity Exposure Warning Threshold',
      message: `Equity exposure is ${(m.equityExposure * 100).toFixed(1)}%, approaching the ${policyName} policy ceiling of ${(riskPolicy.maxEquityExposure * 100).toFixed(1)}%.`,
      metric: 'equityExposure',
      currentValue: m.equityExposure,
      limitValue: riskPolicy.maxEquityExposure,
      excessValue: 0,
      recommendation: 'Monitor equity markets closely and avoid increasing equity allocations.',
      source: 'RISK_ENGINE',
    });
  }

  // 2. Individual Asset Concentration Alert
  if (m.concentration && m.concentration.exceededMaxAssetWeight) {
    const maxWeight = m.concentration.largestHoldingWeight;
    const maxSymbol = m.concentration.largestHoldingSymbol;
    const excess = maxWeight - riskPolicy.maxIndividualAssetWeight;
    const severity = determineAlertSeverity('INDIVIDUAL_ASSET_CONCENTRATION', maxWeight, riskPolicy.maxIndividualAssetWeight, excess, warningRatio);
    const excessPP = (excess * 100).toFixed(1);
    alerts.push({
      portfolioId,
      type: 'INDIVIDUAL_ASSET_CONCENTRATION',
      severity,
      title: `Single Asset Concentration Limit Breach (${maxSymbol})`,
      message: `Holding ${maxSymbol} constitutes ${(maxWeight * 100).toFixed(1)}% of total portfolio capital, exceeding the single asset limit of ${(riskPolicy.maxIndividualAssetWeight * 100).toFixed(1)}%.`,
      metric: 'maxIndividualAssetWeight',
      currentValue: maxWeight,
      limitValue: riskPolicy.maxIndividualAssetWeight,
      excessValue: excess,
      recommendation: `Trim ${maxSymbol} weight by ${excessPP} percentage points to re-align with single-asset concentration guidelines.`,
      source: 'RISK_ENGINE',
    });
  }

  // 3. Minimum Cash Allocation Alert
  if (m.cashAllocation < riskPolicy.minCashAllocation) {
    const deficit = riskPolicy.minCashAllocation - m.cashAllocation;
    const severity = determineAlertSeverity('MIN_CASH', m.cashAllocation, riskPolicy.minCashAllocation, deficit, warningRatio);
    const deficitPP = (deficit * 100).toFixed(1);
    alerts.push({
      portfolioId,
      type: 'MIN_CASH',
      severity,
      title: 'Minimum Cash Allocation Deficit',
      message: `Liquid cash allocation is ${(m.cashAllocation * 100).toFixed(1)}%, below the required minimum cash reserve of ${(riskPolicy.minCashAllocation * 100).toFixed(1)}%.`,
      metric: 'cashAllocation',
      currentValue: m.cashAllocation,
      limitValue: riskPolicy.minCashAllocation,
      excessValue: deficit,
      recommendation: `Reallocate ${deficitPP} percentage points into liquid cash reserves or money market funds.`,
      source: 'RISK_ENGINE',
    });
  }

  // 4. Portfolio Volatility Alert
  if (m.portfolioVolatility > riskPolicy.maxPortfolioVolatility) {
    const excess = m.portfolioVolatility - riskPolicy.maxPortfolioVolatility;
    const severity = determineAlertSeverity('PORTFOLIO_VOLATILITY', m.portfolioVolatility, riskPolicy.maxPortfolioVolatility, excess, warningRatio);
    const excessPP = (excess * 100).toFixed(1);
    alerts.push({
      portfolioId,
      type: 'PORTFOLIO_VOLATILITY',
      severity,
      title: 'Portfolio Volatility Ceiling Breach',
      message: `Annualized portfolio volatility is ${(m.portfolioVolatility * 100).toFixed(2)}%, exceeding configured limit of ${(riskPolicy.maxPortfolioVolatility * 100).toFixed(2)}%.`,
      metric: 'portfolioVolatility',
      currentValue: m.portfolioVolatility,
      limitValue: riskPolicy.maxPortfolioVolatility,
      excessValue: excess,
      recommendation: `Execute optimization to lower portfolio volatility by ${excessPP} percentage points.`,
      source: 'RISK_ENGINE',
    });
  }

  // 5. Maximum Drawdown Alert
  if (m.maximumDrawdown > riskPolicy.maxDrawdown) {
    const excess = m.maximumDrawdown - riskPolicy.maxDrawdown;
    const severity = determineAlertSeverity('MAX_DRAWDOWN', m.maximumDrawdown, riskPolicy.maxDrawdown, excess, warningRatio);
    alerts.push({
      portfolioId,
      type: 'MAX_DRAWDOWN',
      severity,
      title: 'Historical Maximum Drawdown Breach',
      message: `Historical peak-to-trough drawdown is ${(m.maximumDrawdown * 100).toFixed(1)}%, exceeding limit of ${(riskPolicy.maxDrawdown * 100).toFixed(1)}%.`,
      metric: 'maximumDrawdown',
      currentValue: m.maximumDrawdown,
      limitValue: riskPolicy.maxDrawdown,
      excessValue: excess,
      recommendation: 'Rebalance toward low-beta fixed income assets to dampen drawdown severity.',
      source: 'RISK_ENGINE',
    });
  }

  // 6. Liquidity Score Alert
  if (m.liquidityScore < riskPolicy.minLiquidityScore) {
    const deficit = riskPolicy.minLiquidityScore - m.liquidityScore;
    const severity = determineAlertSeverity('LIQUIDITY', m.liquidityScore, riskPolicy.minLiquidityScore, deficit, warningRatio);
    alerts.push({
      portfolioId,
      type: 'LIQUIDITY',
      severity,
      title: 'Portfolio Liquidity Score Deficit',
      message: `Portfolio liquidity score is ${m.liquidityScore.toFixed(1)}, below the required minimum of ${riskPolicy.minLiquidityScore}.`,
      metric: 'liquidityScore',
      currentValue: m.liquidityScore,
      limitValue: riskPolicy.minLiquidityScore,
      excessValue: deficit,
      recommendation: 'Increase allocation to highly liquid large-cap securities or sovereign bonds.',
      source: 'RISK_ENGINE',
    });
  }

  // 7. Composite Risk Score Alert
  const score = riskReport.riskScore?.score || 0;
  if (score >= 60) {
    const severity = determineAlertSeverity('RISK_SCORE', score, 60, score - 60, warningRatio);
    alerts.push({
      portfolioId,
      type: 'RISK_SCORE',
      severity,
      title: `Elevated Composite Risk Score (${score}/100)`,
      message: `Portfolio composite risk score is ${score} (${riskReport.riskScore?.level || 'HIGH'}), indicating multi-factor risk exposure.`,
      metric: 'compositeRiskScore',
      currentValue: score,
      limitValue: 60,
      excessValue: score - 60,
      recommendation: 'Perform risk-mitigating optimization run to reduce multi-factor risk concentration.',
      source: 'RISK_ENGINE',
    });
  }

  return alerts;
}
