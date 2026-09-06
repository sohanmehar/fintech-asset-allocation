import { ConcentrationResult } from './types';

export function calculateConcentration(
  holdings: Array<{ symbol: string; weight: number }>,
  maxIndividualAssetWeightLimit: number = 0.30
): ConcentrationResult {
  if (!holdings || holdings.length === 0) {
    return {
      hhi: 0,
      concentrationLevel: 'LOW',
      largestHoldingSymbol: 'N/A',
      largestHoldingWeight: 0,
      holdingCount: 0,
      maxWeightAllowed: maxIndividualAssetWeightLimit,
      exceededMaxAssetWeight: false,
    };
  }

  let hhi = 0;
  let largestSymbol = holdings[0].symbol;
  let largestWeight = holdings[0].weight;

  holdings.forEach((h) => {
    hhi += Math.pow(h.weight, 2);
    if (h.weight > largestWeight) {
      largestWeight = h.weight;
      largestSymbol = h.symbol;
    }
  });

  hhi = Math.round(hhi * 10000) / 10000;

  let concentrationLevel: 'LOW' | 'MODERATE' | 'HIGH' = 'LOW';
  if (hhi >= 0.25) {
    concentrationLevel = 'HIGH';
  } else if (hhi >= 0.15) {
    concentrationLevel = 'MODERATE';
  }

  const exceededMaxAssetWeight = largestWeight > maxIndividualAssetWeightLimit;

  return {
    hhi,
    concentrationLevel,
    largestHoldingSymbol: largestSymbol,
    largestHoldingWeight: largestWeight,
    holdingCount: holdings.length,
    maxWeightAllowed: maxIndividualAssetWeightLimit,
    exceededMaxAssetWeight,
  };
}
