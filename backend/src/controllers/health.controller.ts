import { Request, Response, NextFunction } from 'express';
import { getMarketDataProvider } from '../providers/marketData';

export const getHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const marketDataProvider = getMarketDataProvider();
    const providerHealth = await marketDataProvider.healthCheck();

    res.status(200).json({
      status: 'ok',
      service: 'capitalguard-api',
      timestamp: new Date().toISOString(),
      provider: providerHealth,
    });
  } catch (error) {
    next(error);
  }
};
