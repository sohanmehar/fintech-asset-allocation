import { MarketDataProvider, AssetPriceQuote, HistoricalPriceObservation, MarketDataHealth } from './marketData.interface';
import { Asset } from '../../models/Asset';

export class SeededMarketDataProvider implements MarketDataProvider {
  private providerName = 'SeededMarketDataProvider';

  async getAssetPrice(symbol: string): Promise<AssetPriceQuote> {
    const asset = await Asset.findOne({ symbol: symbol.toUpperCase() });
    if (!asset) {
      throw new Error(`Asset with symbol '${symbol}' not found in seeded database.`);
    }
    return {
      symbol: asset.symbol,
      price: asset.currentPrice,
      currency: asset.currency || 'INR',
      timestamp: new Date(),
    };
  }

  async getHistoricalPrices(
    symbol: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<HistoricalPriceObservation[]> {
    const asset = await Asset.findOne({ symbol: symbol.toUpperCase() });
    if (!asset) {
      throw new Error(`Asset with symbol '${symbol}' not found in seeded database.`);
    }

    let prices = asset.historicalPrices || [];

    if (startDate) {
      prices = prices.filter((p) => new Date(p.date) >= new Date(startDate));
    }
    if (endDate) {
      prices = prices.filter((p) => new Date(p.date) <= new Date(endDate));
    }

    return prices.map((p) => ({
      date: new Date(p.date),
      close: p.close,
    }));
  }

  async getMultipleAssets(symbols: string[]): Promise<AssetPriceQuote[]> {
    const upperSymbols = symbols.map((s) => s.toUpperCase());
    const assets = await Asset.find({ symbol: { $in: upperSymbols } });

    return assets.map((asset) => ({
      symbol: asset.symbol,
      price: asset.currentPrice,
      currency: asset.currency || 'INR',
      timestamp: new Date(),
    }));
  }

  async healthCheck(): Promise<MarketDataHealth> {
    try {
      const count = await Asset.countDocuments();
      return {
        status: 'ok',
        providerName: this.providerName,
        details: {
          seededAssetCount: count,
          source: 'MongoDB Local/Atlas Seeded Collection',
        },
      };
    } catch (error: any) {
      return {
        status: 'error',
        providerName: this.providerName,
        details: { message: error.message },
      };
    }
  }
}
