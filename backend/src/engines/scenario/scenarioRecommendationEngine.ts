import {
  AssetShockDetail,
  ScenarioDefinition,
  StressedMetricSnapshot,
  StressedPolicyEvaluation,
} from './types';

export function generateScenarioRecommendations(
  scenarioDef: ScenarioDefinition,
  currentSnapshot: StressedMetricSnapshot,
  stressedSnapshot: StressedMetricSnapshot,
  policyEvaluation: StressedPolicyEvaluation,
  assetImpacts: AssetShockDetail[]
): string[] {
  const recommendations: string[] = [];

  const capitalLoss = currentSnapshot.totalCapital - stressedSnapshot.totalCapital;
  const lossPercent = (capitalLoss / currentSnapshot.totalCapital) * 100;

  // 1. Capital Loss Alert
  if (capitalLoss > 0 && lossPercent >= 5.0) {
    recommendations.push(
      `Scenario impact results in an estimated capital drawdown of ₹${capitalLoss.toLocaleString('en-IN')} (-${lossPercent.toFixed(1)}%). Consider rebalancing into capital preservation assets.`
    );
  }

  // 2. Equity Loss Primary Driver
  const largestLossAsset = assetImpacts[0];
  if (largestLossAsset && largestLossAsset.impactAmount < 0 && largestLossAsset.assetClass === 'EQUITY') {
    recommendations.push(
      `Equity position in ${largestLossAsset.symbol} (${largestLossAsset.name}) is the primary driver of scenario losses (Impact: ₹${Math.abs(largestLossAsset.impactAmount).toLocaleString('en-IN')}). Trim equity weight.`
    );
  }

  // 3. Equity Exposure Breach / Threshold
  if (stressedSnapshot.equityExposure > 0.60) {
    recommendations.push(
      `Stressed equity exposure (${(stressedSnapshot.equityExposure * 100).toFixed(1)}%) remains above the 60.0% policy ceiling. Reduce equity allocation to restore governance compliance.`
    );
  }

  // 4. Volatility Breach
  if (stressedSnapshot.portfolioVolatility > 0.15) {
    recommendations.push(
      `Stressed portfolio volatility (${(stressedSnapshot.portfolioVolatility * 100).toFixed(2)}%) exceeds the 15.0% policy threshold. Rebalance toward low-beta defensive sovereign bonds.`
    );
  }

  // 5. Liquidity Deterioration
  if (stressedSnapshot.liquidityScore < 70) {
    recommendations.push(
      `Stressed portfolio liquidity score (${stressedSnapshot.liquidityScore.toFixed(1)}) falls below the min 70.0 threshold. Increase cash and liquid reserves to bolster liquidity buffer.`
    );
  }

  // 6. Actionable Directive
  recommendations.push(
    `Run portfolio optimization for this scenario to generate a mathematically optimal target rebalance.`
  );

  return recommendations;
}
