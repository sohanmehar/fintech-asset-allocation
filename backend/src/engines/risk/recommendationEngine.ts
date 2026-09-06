import { PolicyBreachItem } from './types';

export function generateRecommendations(breaches: PolicyBreachItem[]): string[] {
  if (!breaches || breaches.length === 0) {
    return ['Portfolio operates within all configured risk policy parameters. Maintain current target allocation.'];
  }

  const recommendations: string[] = [];

  breaches.forEach((breach) => {
    switch (breach.type) {
      case 'EQUITY_EXPOSURE':
        recommendations.push(
          `Reduce equity exposure by ${(breach.excess * 100).toFixed(1)} percentage points and reallocate to government bonds, corporate credit, or liquid cash reserves.`
        );
        break;

      case 'INDIVIDUAL_ASSET_WEIGHT':
        if (breach.assetSymbol) {
          recommendations.push(
            `Trim position size in '${breach.assetSymbol}' from ${(breach.currentValue * 100).toFixed(1)}% to below maximum allowed limit of ${(breach.limit * 100).toFixed(1)}%.`
          );
        } else {
          recommendations.push(
            `Reduce individual position concentration to conform with maximum asset weight limits of ${(breach.limit * 100).toFixed(1)}%.`
          );
        }
        break;

      case 'MIN_CASH':
        recommendations.push(
          `Increase cash or liquid reserve allocation by ${(breach.excess * 100).toFixed(1)} percentage points to meet the minimum required liquidity buffer of ${(breach.limit * 100).toFixed(1)}%.`
        );
        break;

      case 'MIN_LIQUIDITY':
        recommendations.push(
          `Rebalance towards higher-liquidity instruments to improve portfolio composite liquidity score from ${breach.currentValue.toFixed(1)} to above ${breach.limit}.`
        );
        break;

      case 'MAX_VOLATILITY':
        recommendations.push(
          `Reduce allocation to high-beta equities and increase fixed-income weighting to lower annualized portfolio volatility below ${(breach.limit * 100).toFixed(1)}%.`
        );
        break;

      case 'MAX_DRAWDOWN':
        recommendations.push(
          `Shift asset allocation towards defensive capital preservation assets (G-Secs, Gold, Cash) to mitigate downside drawdown risk.`
        );
        break;

      case 'ALLOCATION_INCONSISTENCY':
        recommendations.push(
          `Re-align portfolio holding quantities so that total allocation weights sum to exactly 100.0%.`
        );
        break;
    }
  });

  return recommendations;
}
