export interface AssetSeedConfig {
  symbol: string;
  name: string;
  assetClass: 'EQUITY' | 'GOVERNMENT_BOND' | 'CORPORATE_BOND' | 'GOLD' | 'CASH';
  sector: string;
  currentPrice: number;
  currency: string;
  liquidityScore: number;
  minWeight: number;
  maxWeight: number;
  annualDrift: number; // expected return e.g. 0.12 (12%)
  annualVolatility: number; // expected volatility e.g. 0.20 (20%)
  scenarioShock?: Record<string, number>;
  metadata?: Record<string, any>;
}

export function generateHistoricalPrices(
  currentPrice: number,
  annualDrift: number,
  annualVolatility: number,
  days: number = 500,
  seedOffset: number = 1
): Array<{ date: Date; close: number }> {
  const result: Array<{ date: Date; close: number }> = [];
  const dt = 1 / 252; // 252 trading days per year
  const endDate = new Date();

  // For CASH or near-zero volatility reserve assets, generate smooth risk-free yield accumulation
  const isCashOrZeroVol = annualVolatility < 0.005;

  let seed = seedOffset * 123456789;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const normalRandom = () => {
    const u1 = pseudoRandom();
    const u2 = pseudoRandom();
    return Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2);
  };

  const prices: number[] = new Array(days);
  prices[days - 1] = currentPrice;

  for (let i = days - 2; i >= 0; i--) {
    if (isCashOrZeroVol) {
      // Deterministic risk-free daily compounding without noise
      const returnFactor = Math.exp(annualDrift * dt);
      prices[i] = prices[i + 1] / returnFactor;
    } else {
      const z = normalRandom();
      const driftTerm = (annualDrift - 0.5 * Math.pow(annualVolatility, 2)) * dt;
      const volTerm = annualVolatility * Math.sqrt(dt) * z;
      const returnFactor = Math.exp(driftTerm + volTerm);
      prices[i] = Math.max(0.01, prices[i + 1] / returnFactor);
    }
  }

  for (let i = 0; i < days; i++) {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - (days - 1 - i));

    // Preserve 4 decimal places for low unit-value instruments like CASH (1.0000)
    const decimals = currentPrice <= 10 || isCashOrZeroVol ? 10000 : 100;
    const close = Math.round(prices[i] * decimals) / decimals;

    result.push({ date, close });
  }

  return result;
}
