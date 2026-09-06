import { CandidateAllocation } from './types';
import { normalizeAllocationWeights } from './allocationValidator';

export interface CandidateGenInput {
  currentWeights: number[];
  assets: Array<{
    symbol: string;
    assetClass: string;
    minWeight: number;
    maxWeight: number;
  }>;
  maxEquityExposure: number;
  minCashAllocation: number;
  maxIndividualAssetWeight: number;
}

export function generateCandidateAllocations(input: CandidateGenInput): CandidateAllocation[] {
  const {
    currentWeights,
    assets,
    maxEquityExposure,
    minCashAllocation,
    maxIndividualAssetWeight,
  } = input;

  const candidates: CandidateAllocation[] = [];
  const numAssets = assets.length;

  const addCandidate = (name: string, rawW: number[]) => {
    const normW = normalizeAllocationWeights(rawW);
    const holdings = assets.map((a, i) => ({
      assetId: (a as any).assetId || '',
      symbol: a.symbol,
      weight: normW[i],
    }));
    candidates.push({ name, weights: normW, holdings });
  };

  // Strategy A: Current Allocation
  addCandidate('Current Allocation', currentWeights);

  // Strategy B: Minimum-Risk Allocation (heavy weight on CASH, GSEC10Y, CORPBOND, GOLDBEES)
  const minRiskW: number[] = new Array(numAssets).fill(0);
  assets.forEach((a, i) => {
    if (a.assetClass === 'CASH') minRiskW[i] = 0.35;
    else if (a.assetClass === 'GOVERNMENT_BOND') minRiskW[i] = 0.30;
    else if (a.assetClass === 'CORPORATE_BOND') minRiskW[i] = 0.20;
    else if (a.assetClass === 'GOLD') minRiskW[i] = 0.10;
    else if (a.assetClass === 'EQUITY') minRiskW[i] = 0.01; // minimal equity
  });
  addCandidate('Minimum Risk Allocation', minRiskW);

  // Strategy C: Feasible Defensive Shift (Reduce equity from current 68% down to target 60%)
  const defensiveW = [...currentWeights];
  let equitySum = 0;
  const equityIndices: number[] = [];
  const nonEquityIndices: number[] = [];

  assets.forEach((a, i) => {
    if (a.assetClass === 'EQUITY') {
      equitySum += defensiveW[i];
      equityIndices.push(i);
    } else {
      nonEquityIndices.push(i);
    }
  });

  if (equitySum > maxEquityExposure && equityIndices.length > 0) {
    const excess = equitySum - maxEquityExposure;
    // Scale down equity positions proportionally to sum to maxEquityExposure
    const scaleFactor = maxEquityExposure / equitySum;
    equityIndices.forEach((i) => {
      defensiveW[i] = Math.round(defensiveW[i] * scaleFactor * 10000) / 10000;
    });

    // Distribute excess 8% to non-equity assets (Bonds, Cash, Gold)
    const addPerNonEquity = excess / nonEquityIndices.length;
    nonEquityIndices.forEach((i) => {
      defensiveW[i] = Math.round((defensiveW[i] + addPerNonEquity) * 10000) / 10000;
    });
  }
  addCandidate('Feasible Defensive Shift (Max Equity 60%)', defensiveW);

  // Strategy D: Equal-Weight Balanced Allocation
  const equalW = assets.map((a) => {
    const maxAllowed = Math.min(a.maxWeight || 1.0, maxIndividualAssetWeight);
    if (a.assetClass === 'EQUITY') {
      return Math.min(maxAllowed, maxEquityExposure / Math.max(1, equityIndices.length));
    }
    return Math.min(maxAllowed, 0.15);
  });
  addCandidate('Equal-Weight Balanced', equalW);

  // Strategy E: Strategic Yield & Credit Allocation (Higher Bond & Gold weight)
  const yieldW: number[] = new Array(numAssets).fill(0);
  assets.forEach((a, i) => {
    if (a.assetClass === 'GOVERNMENT_BOND') yieldW[i] = 0.25;
    else if (a.assetClass === 'CORPORATE_BOND') yieldW[i] = 0.25;
    else if (a.assetClass === 'GOLD') yieldW[i] = 0.15;
    else if (a.assetClass === 'CASH') yieldW[i] = 0.10;
    else if (a.assetClass === 'EQUITY') yieldW[i] = 0.05;
  });
  addCandidate('Strategic Yield & Credit Focus', yieldW);

  // Strategy F: Maximum Equity Feasible Allocation (Exactly 60% Equity, balanced top equities)
  const maxEqW = [...currentWeights];
  if (equityIndices.length > 0) {
    const topEquityIndices = [...equityIndices].sort((a, b) => maxEqW[b] - maxEqW[a]);
    const maxPerAsset = Math.min(0.20, maxIndividualAssetWeight);
    let remEquity = maxEquityExposure;

    topEquityIndices.forEach((i) => {
      const w = Math.min(remEquity, maxPerAsset);
      maxEqW[i] = w;
      remEquity -= w;
    });

    // Fill non-equities
    const remNonEquity = 1.0 - maxEquityExposure;
    const nonEqShare = remNonEquity / Math.max(1, nonEquityIndices.length);
    nonEquityIndices.forEach((i) => {
      maxEqW[i] = nonEqShare;
    });
  }
  addCandidate('Maximum Allowed Equity Allocation (60% Cap)', maxEqW);

  // Strategy G: Local Deterministic Coordinate Perturbations around Defensive Allocation
  // Shift 1-2% from equity to bonds/cash deterministically
  const seedBase = [...defensiveW];
  for (let eIdx of equityIndices) {
    for (let neIdx of nonEquityIndices) {
      if (seedBase[eIdx] >= 0.02) {
        const perturbed = [...seedBase];
        perturbed[eIdx] -= 0.02; // -2% equity
        perturbed[neIdx] += 0.02; // +2% non-equity
        addCandidate(`Local Shift ${assets[eIdx].symbol}->${assets[neIdx].symbol}`, perturbed);
      }
    }
  }

  return candidates;
}
