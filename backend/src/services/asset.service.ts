import { Asset, IAsset } from '../models/Asset';
import { getMarketDataProvider } from '../providers/marketData';

export class AssetService {
  async getAllAssets(): Promise<IAsset[]> {
    return Asset.find({}, { historicalPrices: { $slice: -5 } }).sort({ symbol: 1 });
  }

  async getAssetByIdOrSymbol(identifier: string): Promise<IAsset | null> {
    // Check if identifier is ObjectId or Symbol
    let asset: IAsset | null = null;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      asset = await Asset.findById(identifier);
    }
    if (!asset) {
      asset = await Asset.findOne({ symbol: identifier.toUpperCase() });
    }
    return asset;
  }

  async getAssetMarketPrice(symbol: string) {
    const provider = getMarketDataProvider();
    return provider.getAssetPrice(symbol);
  }

  async getAssetHistory(symbol: string, startDate?: Date, endDate?: Date) {
    const provider = getMarketDataProvider();
    return provider.getHistoricalPrices(symbol, startDate, endDate);
  }
}

export const assetService = new AssetService();
