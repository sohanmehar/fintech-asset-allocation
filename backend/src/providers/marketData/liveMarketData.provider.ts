import { MarketDataProvider, AssetPriceQuote, HistoricalPriceObservation, MarketDataHealth } from './marketData.interface';
import { SeededMarketDataProvider } from './seededMarketData.provider';

export class LiveMarketDataProvider implements MarketDataProvider {
  private providerName = 'LiveMarketDataProvider';
  private fallbackProvider: SeededMarketDataProvider;
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.LIVE_MARKET_API_KEY;
    this.fallbackProvider = new SeededMarketDataProvider();
  }

  async getAssetPrice(symbol: string): Promise<AssetPriceQuote> {
    if (!this.apiKey) {
      console.warn(`[LiveMarketDataProvider] No live API key found. Falling back to Seeded provider for ${symbol}.`);
      return this.fallbackProvider.getAssetPrice(symbol);
    }
    // Placeholder for real live market data API integration (Phase 2+)
    return this.fallbackProvider.getAssetPrice(symbol);
  }

  async getHistoricalPrices(
    symbol: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HistoricalPriceObservation[]> {
    if (!this.apiKey) {
      console.warn(`[LiveMarketDataProvider] No live API key found. Falling back to Seeded provider for ${symbol}.`);
      return this.fallbackProvider.getHistoricalPrices(symbol, startDate, endDate);
    }
    return this.fallbackProvider.getHistoricalPrices(symbol, startDate, endDate);
  }

  async getMultipleAssets(symbols: string[]): Promise<AssetPriceQuote[]> {
    if (!this.apiKey) {
      return this.fallbackProvider.getMultipleAssets(symbols);
    }
    return this.fallbackProvider.getMultipleAssets(symbols);
  }

  async healthCheck(): Promise<MarketDataHealth> {
    return {
      status: 'ok',
      providerName: this.providerName,
      details: {
        hasApiKey: !!this.apiKey,
        mode: this.apiKey ? 'live' : 'fallback-seeded',
        message: 'Live provider initialized (Phase 1 placeholder active).',
      },
    };
  }
}
