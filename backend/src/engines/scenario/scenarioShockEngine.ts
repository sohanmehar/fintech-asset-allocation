import { AssetShockDetail, ScenarioDefinition } from './types';

export interface RawHoldingInput {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  currentValue: number;
  weight: number;
}

export function computeAssetShocks(
  holdings: RawHoldingInput[],
  scenarioDef: ScenarioDefinition,
  customShocks?: Record<string, number>
): {
  assetImpacts: AssetShockDetail[];
  shocksAppliedMap: Record<string, number>;
  stressedTotalCapital: number;
} {
  const assetImpacts: AssetShockDetail[] = [];
  const shocksAppliedMap: Record<string, number> = {};
  let stressedTotalCapital = 0;

  for (const h of holdings) {
    let shock = 0;

    // 1. Check customShocks first if provided
    if (customShocks && (customShocks[h.symbol] !== undefined || customShocks[h.assetClass] !== undefined)) {
      shock = customShocks[h.symbol] !== undefined ? customShocks[h.symbol] : customShocks[h.assetClass];
    } else {
      // 2. Check scenario defaultSymbolShocks
      if (scenarioDef.defaultSymbolShocks && scenarioDef.defaultSymbolShocks[h.symbol] !== undefined) {
        shock = scenarioDef.defaultSymbolShocks[h.symbol];
      }
      // 3. Fallback to defaultAssetClassShocks
      else if (scenarioDef.defaultAssetClassShocks && scenarioDef.defaultAssetClassShocks[h.assetClass] !== undefined) {
        shock = scenarioDef.defaultAssetClassShocks[h.assetClass];
      }
    }

    // Validate shock bounds [-1.0, +1.0]
    shock = Math.max(-1.0, Math.min(1.0, shock));

    const stressedValue = Math.max(0, h.currentValue * (1 + shock));
    const impactAmount = stressedValue - h.currentValue;

    shocksAppliedMap[h.symbol] = shock;
    stressedTotalCapital += stressedValue;

    assetImpacts.push({
      assetId: h.assetId,
      symbol: h.symbol,
      name: h.name,
      assetClass: h.assetClass,
      currentValue: h.currentValue,
      shock,
      stressedValue,
      impactAmount,
      impactPercentage: shock,
    });
  }

  // Sort by absolute monetary impact descending (largest loss/gain first)
  assetImpacts.sort((a, b) => Math.abs(b.impactAmount) - Math.abs(a.impactAmount));

  return {
    assetImpacts,
    shocksAppliedMap,
    stressedTotalCapital,
  };
}
