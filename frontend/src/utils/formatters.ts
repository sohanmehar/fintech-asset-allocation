/**
 * Formats numbers into Indian Currency format (INR ₹).
 * Handles compact Representation (Cr / L) for large capital sums when requested.
 */
export function formatCurrency(amount: number, compact: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '₹0';

  if (compact && Math.abs(amount) >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr.toFixed(2)} Cr`;
  }
  if (compact && Math.abs(amount) >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh.toFixed(2)} L`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Formats a decimal fraction (0.68) or percentage into formatted string (e.g. 68.0%).
 */
export function formatPercentage(val: number, isDecimal: boolean = true, decimals: number = 2): string {
  if (isNaN(val) || val === null || val === undefined) return '0%';
  const percentage = isDecimal ? val * 100 : val;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Formats numbers cleanly with specified decimal precision.
 */
export function formatNumber(val: number, decimals: number = 2): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format risk score and returns color classes
 */
export function getRiskLevelColor(levelOrScore: string | number): { bg: string; text: string; border: string } {
  let level = 'MODERATE';
  if (typeof levelOrScore === 'number') {
    if (levelOrScore <= 30) level = 'LOW';
    else if (levelOrScore <= 60) level = 'MODERATE';
    else if (levelOrScore <= 80) level = 'HIGH';
    else level = 'CRITICAL';
  } else {
    level = levelOrScore || 'MODERATE';
  }

  switch (level.toUpperCase()) {
    case 'LOW':
      return { bg: 'bg-[#E3EBE4]', text: 'text-[#1D5B4B]', border: 'border-[#C5D7C8]' };
    case 'MODERATE':
      return { bg: 'bg-[#FBF2E3]', text: 'text-[#925F18]', border: 'border-[#F2DEB8]' };
    case 'HIGH':
      return { bg: 'bg-[#FCEFE6]', text: 'text-[#C05621]', border: 'border-[#FCD5C1]' };
    case 'CRITICAL':
      return { bg: 'bg-[#FDF0ED]', text: 'text-[#A63A2B]', border: 'border-[#F6D0C9]' };
    default:
      return { bg: 'bg-[#EAE8E1]', text: 'text-stone-700', border: 'border-[#D8D5C8]' };
  }
}

/**
 * Formats ISO date string into readable date & time.
 */
export function formatDate(dateString?: string | Date): string {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
