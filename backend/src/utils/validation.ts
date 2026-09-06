export interface AllocationValidationResult {
  valid: boolean;
  totalWeight: number; // as percentage e.g. 100% or 108%
  difference: number;
  message: string;
}

/**
 * Validates portfolio allocation weights.
 * Weights can be represented as decimals (e.g. 0.65) or percentages (e.g. 65).
 * The sum must equal 100% (or 1.0 in decimal).
 * 
 * IMPORTANT: Does NOT silently normalize or fix invalid allocations.
 */
export const validatePortfolioAllocation = (
  holdings: Array<{ weight: number; symbol?: string }>
): AllocationValidationResult => {
  if (!holdings || holdings.length === 0) {
    return {
      valid: false,
      totalWeight: 0,
      difference: 100,
      message: 'Portfolio must contain at least one holding.',
    };
  }

  const rawSum = holdings.reduce((acc, h) => acc + (h.weight || 0), 0);

  // Determine if weights are decimal (sum ~ 1.0) or percentage (sum ~ 100)
  const isDecimal = rawSum <= 2.0;

  const totalPercentage = isDecimal ? rawSum * 100 : rawSum;
  const roundedTotal = Math.round(totalPercentage * 1000) / 1000;
  const difference = Math.round(Math.abs(100 - roundedTotal) * 1000) / 1000;

  // Allow a tiny floating point tolerance (0.01%)
  const valid = difference <= 0.01;

  return {
    valid,
    totalWeight: roundedTotal / 100, // Normalized to decimal 1.0 scale or 100% representation
    difference: isDecimal ? difference / 100 : difference,
    message: valid
      ? 'Portfolio allocation is valid (equals 100%).'
      : `Portfolio allocation must equal 100%. Current allocation total: ${roundedTotal}% (Difference: ${difference}%).`,
  };
};

export const validatePositiveCapital = (capital: number): { valid: boolean; message?: string } => {
  if (typeof capital !== 'number' || isNaN(capital) || capital <= 0) {
    return { valid: false, message: 'Total capital must be a positive number greater than 0.' };
  }
  return { valid: true };
};

export const validateAssetClass = (assetClass: string): boolean => {
  const validClasses = ['EQUITY', 'GOVERNMENT_BOND', 'CORPORATE_BOND', 'GOLD', 'CASH'];
  return validClasses.includes(assetClass);
};

export const validateRiskProfile = (profile: string): boolean => {
  const validProfiles = ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'];
  return validProfiles.includes(profile);
};

export const validateLiquidityScore = (score: number): boolean => {
  return typeof score === 'number' && score >= 0 && score <= 100;
};

export const validatePolicyThresholds = (policy: any): { valid: boolean; message?: string } => {
  if (policy.maxIndividualAssetWeight !== undefined && (policy.maxIndividualAssetWeight < 0 || policy.maxIndividualAssetWeight > 1)) {
    return { valid: false, message: 'maxIndividualAssetWeight must be between 0 and 1.' };
  }
  if (policy.maxEquityExposure !== undefined && (policy.maxEquityExposure < 0 || policy.maxEquityExposure > 1)) {
    return { valid: false, message: 'maxEquityExposure must be between 0 and 1.' };
  }
  if (policy.minCashAllocation !== undefined && (policy.minCashAllocation < 0 || policy.minCashAllocation > 1)) {
    return { valid: false, message: 'minCashAllocation must be between 0 and 1.' };
  }
  if (policy.minLiquidityScore !== undefined && (policy.minLiquidityScore < 0 || policy.minLiquidityScore > 100)) {
    return { valid: false, message: 'minLiquidityScore must be between 0 and 100.' };
  }
  return { valid: true };
};
