export interface AssetPriceQuote {
  symbol: string;
  price: number;
  currency: string;
  timestamp: Date;
}

export interface HistoricalPriceObservation {
  date: Date;
  close: number;
}

export interface MarketDataHealth {
  status: 'ok' | 'error';
  providerName: string;
  details?: Record<string, any>;
}

export interface MarketDataProvider {
  getAssetPrice(symbol: string): Promise<AssetPriceQuote>;
  getHistoricalPrices(
    symbol: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HistoricalPriceObservation[]>;
  getMultipleAssets(symbols: string[]): Promise<AssetPriceQuote[]>;
  healthCheck(): Promise<MarketDataHealth>;
}
