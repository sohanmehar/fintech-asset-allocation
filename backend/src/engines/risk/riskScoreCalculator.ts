import { CompositeRiskScoreResult, RiskLevel } from './types';
import { IRiskPolicy } from '../../models/RiskPolicy';

export interface ScoreCalculationInput {
  portfolioVolatility: number;
  var95Percentage: number;
  hhi: number;
  maximumDrawdown: number;
  portfolioLiquidity: number;
  policy: IRiskPolicy;
}

export function calculateCompositeRiskScore(input: ScoreCalculationInput): CompositeRiskScoreResult {
  const {
    portfolioVolatility,
    var95Percentage,
    hhi,
    maximumDrawdown,
    portfolioLiquidity,
    policy,
  } = input;

  // Thresholds derived from policy or application standards
  const volThreshold = policy.maxPortfolioVolatility || 0.15;
  // Approximate VaR threshold relative to volatility threshold (VaR_95 ~ 1.645 * vol / sqrt(252))
  const varThreshold = (1.645 * volThreshold) / Math.sqrt(252);
  const concThreshold = 0.25; // HHI High Concentration threshold
  const drawdownThreshold = policy.maxDrawdown || 0.20;
  const liquidityThreshold = policy.minLiquidityScore || 70;

  // 1. Volatility Score (30% weight) - Higher is worse
  const volScoreRaw = Math.min((portfolioVolatility / volThreshold) * 100, 100);
  const volScore = Math.max(0, Math.round(volScoreRaw * 10) / 10);
  const volContrib = Math.round(volScore * 0.30 * 100) / 100;

  // 2. VaR Score (25% weight) - Higher is worse
  const varScoreRaw = Math.min((var95Percentage / varThreshold) * 100, 100);
  const varScore = Math.max(0, Math.round(varScoreRaw * 10) / 10);
  const varContrib = Math.round(varScore * 0.25 * 100) / 100;

  // 3. Concentration Score (15% weight) - Higher is worse
  const concScoreRaw = Math.min((hhi / concThreshold) * 100, 100);
  const concScore = Math.max(0, Math.round(concScoreRaw * 10) / 10);
  const concContrib = Math.round(concScore * 0.15 * 100) / 100;

  // 4. Drawdown Score (15% weight) - Higher is worse
  const ddScoreRaw = Math.min((maximumDrawdown / drawdownThreshold) * 100, 100);
  const ddScore = Math.max(0, Math.round(ddScoreRaw * 10) / 10);
  const ddContrib = Math.round(ddScore * 0.15 * 100) / 100;

  // 5. Liquidity Score (15% weight) - Lower is worse
  const liqScoreRaw = portfolioLiquidity <= 0
    ? 100
    : Math.max(0, Math.min((liquidityThreshold / portfolioLiquidity) * 100, 100));
  const liqScore = Math.round(liqScoreRaw * 10) / 10;
  const liqContrib = Math.round(liqScore * 0.15 * 100) / 100;

  // Composite Score Sum
  const totalScoreRaw = volContrib + varContrib + concContrib + ddContrib + liqContrib;
  const score = Math.min(100, Math.max(0, Math.round(totalScoreRaw)));

  // Risk Level Classification
  let level: RiskLevel = 'LOW';
  if (score >= 81) {
    level = 'CRITICAL';
  } else if (score >= 61) {
    level = 'HIGH';
  } else if (score >= 31) {
    level = 'MODERATE';
  }

  return {
    score,
    level,
    breakdown: {
      volatility: {
        score: volScore,
        weight: 0.30,
        contribution: volContrib,
        currentValue: portfolioVolatility,
        threshold: volThreshold,
      },
      var: {
        score: varScore,
        weight: 0.25,
        contribution: varContrib,
        currentValue: var95Percentage,
        threshold: varThreshold,
      },
      concentration: {
        score: concScore,
        weight: 0.15,
        contribution: concContrib,
        currentValue: hhi,
        threshold: concThreshold,
      },
      drawdown: {
        score: ddScore,
        weight: 0.15,
        contribution: ddContrib,
        currentValue: maximumDrawdown,
        threshold: drawdownThreshold,
      },
      liquidity: {
        score: liqScore,
        weight: 0.15,
        contribution: liqContrib,
        currentValue: portfolioLiquidity,
        threshold: liquidityThreshold,
      },
    },
  };
}
