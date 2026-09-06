/**
 * Validates and normalizes candidate weights so that:
 * 1. All weights are non-negative (>= 0).
 * 2. Sum of weights equals exactly 1.0000 (100.00%).
 * 3. Decimal precision is rounded cleanly to 4 decimal places (0.0001 = 0.01%).
 */
export function normalizeAllocationWeights(rawWeights: number[]): number[] {
  if (!rawWeights || rawWeights.length === 0) return [];

  // Clamp negative weights to 0
  let nonNegative = rawWeights.map((w) => Math.max(0, w));
  let sum = nonNegative.reduce((acc, w) => acc + w, 0);

  if (sum === 0) {
    // Equal distribution if all zeros
    const equalW = 1.0 / rawWeights.length;
    nonNegative = rawWeights.map(() => equalW);
    sum = 1.0;
  }

  // Normalize to sum to 1.0
  const normalized = nonNegative.map((w) => Math.round((w / sum) * 10000) / 10000);
  const roundedSum = normalized.reduce((acc, w) => acc + w, 0);
  const diff = Math.round((1.0 - roundedSum) * 10000) / 10000;

  if (Math.abs(diff) > 0) {
    // Add residual tiny rounding difference to the largest holding weight to ensure sum === 1.0000
    let maxIdx = 0;
    for (let i = 1; i < normalized.length; i++) {
      if (normalized[i] > normalized[maxIdx]) {
        maxIdx = i;
      }
    }
    normalized[maxIdx] = Math.round((normalized[maxIdx] + diff) * 10000) / 10000;
  }

  return normalized;
}
