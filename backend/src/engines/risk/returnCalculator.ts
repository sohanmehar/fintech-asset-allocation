import { TRADING_DAYS_PER_YEAR } from './types';

export interface AlignedPriceData {
  dates: string[]; // YYYY-MM-DD strings
  symbols: string[];
  priceMatrix: number[][]; // [dateIndex][assetIndex]
}

export interface AlignedReturnData {
  dates: string[]; // YYYY-MM-DD strings for return dates (dates.length - 1)
  symbols: string[];
  returnsMatrix: number[][]; // [returnIndex][assetIndex]
}

/**
 * Aligns asset historical price series chronologically by date.
 * Uses exact overlapping dates across all assets.
 */
export function alignPriceSeries(
  assetHistories: Array<{ symbol: string; prices: Array<{ date: Date | string; close: number }> }>
): AlignedPriceData {
  if (!assetHistories || assetHistories.length === 0) {
    throw new Error('Insufficient data: No asset price histories provided for alignment.');
  }

  const symbols = assetHistories.map((a) => a.symbol);

  // Map each asset's prices by date string YYYY-MM-DD
  const dateMapPerAsset: Map<string, Map<string, number>> = new Map();

  assetHistories.forEach((asset) => {
    if (!asset.prices || asset.prices.length < 30) {
      throw new Error(
        `Insufficient data: Asset '${asset.symbol}' has only ${asset.prices?.length || 0} observations (minimum 30 required).`
      );
    }

    const priceMap = new Map<string, number>();
    asset.prices.forEach((p) => {
      const dateStr = new Date(p.date).toISOString().split('T')[0];
      priceMap.set(dateStr, p.close);
    });
    dateMapPerAsset.set(asset.symbol, priceMap);
  });

  // Find common overlapping dates across all assets
  const firstAssetDates = Array.from(dateMapPerAsset.get(symbols[0])!.keys());
  const commonDates = firstAssetDates
    .filter((dateStr) => symbols.every((sym) => dateMapPerAsset.get(sym)!.has(dateStr)))
    .sort(); // Sort chronologically (oldest to newest)

  if (commonDates.length < 30) {
    throw new Error(
      `Insufficient overlapping data: Found only ${commonDates.length} common trading dates across all assets (minimum 30 required).`
    );
  }

  // Construct priceMatrix [dateIndex][assetIndex]
  const priceMatrix: number[][] = commonDates.map((dateStr) => {
    return symbols.map((sym) => dateMapPerAsset.get(sym)!.get(dateStr)!);
  });

  return {
    dates: commonDates,
    symbols,
    priceMatrix,
  };
}

/**
 * Calculates daily percentage returns: r_t = Price[t] / Price[t-1] - 1
 */
export function calculateDailyReturns(alignedPrices: AlignedPriceData): AlignedReturnData {
  const { dates, symbols, priceMatrix } = alignedPrices;
  const returnDates: string[] = [];
  const returnsMatrix: number[][] = [];

  for (let t = 1; t < dates.length; t++) {
    returnDates.push(dates[t]);
    const rowReturns: number[] = [];

    for (let a = 0; a < symbols.length; a++) {
      const prevPrice = priceMatrix[t - 1][a];
      const currPrice = priceMatrix[t][a];

      if (prevPrice <= 0) {
        throw new Error(`Invalid price observation: Asset '${symbols[a]}' had non-positive price ${prevPrice} on date ${dates[t - 1]}.`);
      }

      const dailyRet = currPrice / prevPrice - 1;
      rowReturns.push(dailyRet);
    }
    returnsMatrix.push(rowReturns);
  }

  return {
    dates: returnDates,
    symbols,
    returnsMatrix,
  };
}

/**
 * Calculates expected annualized return for a single asset series of daily returns.
 * Expected Annual Return = mean(dailyReturns) * 252 (Trading Days)
 * 
 * Note: Uses arithmetic mean annualized over 252 trading days as specified.
 */
export function calculateExpectedAnnualReturn(dailyReturns: number[]): number {
  if (!dailyReturns || dailyReturns.length === 0) return 0;
  const sum = dailyReturns.reduce((acc, val) => acc + val, 0);
  const meanDaily = sum / dailyReturns.length;
  return meanDaily * TRADING_DAYS_PER_YEAR;
}

/**
 * Calculates portfolio expected return: Sum( weight_i * expectedReturn_i )
 */
export function calculatePortfolioExpectedReturn(
  weights: number[],
  expectedReturns: number[]
): number {
  if (weights.length !== expectedReturns.length) {
    throw new Error('Mismatch between weights length and expected returns length.');
  }
  return weights.reduce((sum, w, i) => sum + w * expectedReturns[i], 0);
}
