import { RebalancingActionItem, RebalanceAction } from './types';

export function calculateRebalancingActions(
  assets: Array<{ assetId: string; symbol: string; assetClass: string }>,
  currentWeights: number[],
  targetWeights: number[],
  totalCapital: number,
  tolerance: number = 0.005 // 0.5% threshold for BUY/SELL actions
): RebalancingActionItem[] {
  return assets.map((asset, i) => {
    const currW = currentWeights[i];
    const targW = targetWeights[i];
    const weightChange = Math.round((targW - currW) * 10000) / 10000;

    const currentValue = Math.round(currW * totalCapital * 100) / 100;
    const targetValue = Math.round(targW * totalCapital * 100) / 100;
    const valueChange = Math.round((targetValue - currentValue) * 100) / 100;

    let action: RebalanceAction = 'HOLD';
    if (weightChange > tolerance) {
      action = 'BUY';
    } else if (weightChange < -tolerance) {
      action = 'SELL';
    }

    return {
      assetId: asset.assetId,
      symbol: asset.symbol,
      assetClass: asset.assetClass,
      currentWeight: Math.round(currW * 10000) / 10000,
      targetWeight: Math.round(targW * 10000) / 10000,
      weightChange,
      currentValue,
      targetValue,
      valueChange,
      action,
    };
  });
}
