import { AlertSeverityLevel, AlertType } from './types';

/**
 * Deterministic alert severity evaluator.
 * Evaluates metric values, limits, excesses, and warning thresholds to return appropriate severity.
 */
export function determineAlertSeverity(
  type: AlertType,
  currentValue: number,
  limitValue: number,
  excessValue: number,
  warningThresholdRatio: number = 0.85
): AlertSeverityLevel {
  // 1. Risk Score Special Logic
  if (type === 'RISK_SCORE') {
    if (currentValue >= 80) return 'CRITICAL';
    if (currentValue >= 60) return 'HIGH';
    if (currentValue >= 40) return 'WARNING';
    return 'INFO';
  }

  // 2. Explicit Breach Scenarios (excess > 0)
  if (excessValue > 0) {
    // Severe excess thresholds
    if (type === 'EQUITY_EXPOSURE' && excessValue >= 0.05) return 'CRITICAL';
    if (type === 'INDIVIDUAL_ASSET_CONCENTRATION' && excessValue >= 0.05) return 'CRITICAL';
    if (type === 'PORTFOLIO_VOLATILITY' && excessValue >= 0.03) return 'CRITICAL';
    if (type === 'MAX_DRAWDOWN' && excessValue >= 0.05) return 'CRITICAL';
    if (type === 'MIN_CASH' && excessValue >= 0.03) return 'CRITICAL';
    if (type === 'LIQUIDITY' && excessValue >= 15) return 'CRITICAL';

    return 'HIGH';
  }

  // 3. Approaching Warning Threshold
  if (limitValue > 0) {
    // For metrics where higher is worse (equity, concentration, volatility, drawdown)
    if (
      type === 'EQUITY_EXPOSURE' ||
      type === 'INDIVIDUAL_ASSET_CONCENTRATION' ||
      type === 'PORTFOLIO_VOLATILITY' ||
      type === 'MAX_DRAWDOWN'
    ) {
      if (currentValue >= limitValue * warningThresholdRatio) {
        return 'WARNING';
      }
    }

    // For metrics where lower is worse (cash, liquidity)
    if (type === 'MIN_CASH' || type === 'LIQUIDITY') {
      if (currentValue <= limitValue * (1 + (1 - warningThresholdRatio))) {
        return 'WARNING';
      }
    }
  }

  return 'INFO';
}
