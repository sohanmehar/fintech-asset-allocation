import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface AppConfig {
  port: number;
  mongoUri: string;
  marketDataProvider: 'seeded' | 'live' | string;
  jwtSecret: string;
  clientUrl: string;
  nodeEnv: string;
  allowMemoryDbFallback: boolean;
}

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/capitalguard',
  marketDataProvider: process.env.MARKET_DATA_PROVIDER || 'seeded',
  jwtSecret: process.env.JWT_SECRET || 'capitalguard_jwt_secret_placeholder',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowMemoryDbFallback: process.env.ALLOW_MEMORY_DB_FALLBACK !== 'false',
};

export const validateEnv = (): void => {
  const missing: string[] = [];
  if (!config.mongoUri) missing.push('MONGODB_URI');

  if (missing.length > 0) {
    console.warn(`[Config Warning] Missing environment variables: ${missing.join(', ')}.`);
  }

  console.log(`[Config] Operating in mode: ${config.nodeEnv}`);
  console.log(`[Config] Market Data Provider set to: ${config.marketDataProvider}`);
  console.log(`[Config] In-Memory DB Fallback allowed: ${config.allowMemoryDbFallback}`);
};
