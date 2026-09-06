import { MarketDataProvider } from './marketData.interface';
import { SeededMarketDataProvider } from './seededMarketData.provider';
import { LiveMarketDataProvider } from './liveMarketData.provider';
import { config } from '../../config/env';

export * from './marketData.interface';
export * from './seededMarketData.provider';
export * from './liveMarketData.provider';

let instance: MarketDataProvider | null = null;

export const getMarketDataProvider = (): MarketDataProvider => {
  if (!instance) {
    const providerType = (config.marketDataProvider || 'seeded').toLowerCase();
    if (providerType === 'live') {
      console.log('[MarketDataProvider] Instantiating Live Market Data Provider (with seeded fallback).');
      instance = new LiveMarketDataProvider();
    } else {
      console.log('[MarketDataProvider] Instantiating Seeded Market Data Provider.');
      instance = new SeededMarketDataProvider();
    }
  }
  return instance;
};
