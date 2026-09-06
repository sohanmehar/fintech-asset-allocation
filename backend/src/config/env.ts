import dotenv from 'dotenv';
import path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const ATLAS_DEFAULT_URI =
  'mongodb://pict_db_user:pict2026@ac-epkojil-shard-00-00.jthperc.mongodb.net:27017,ac-epkojil-shard-00-01.jthperc.mongodb.net:27017,ac-epkojil-shard-00-02.jthperc.mongodb.net:27017/capitalguard?ssl=true&replicaSet=atlas-j0h7uj-shard-0&authSource=admin&appName=PICT-Canteen';

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
  mongoUri: process.env.MONGODB_URI || ATLAS_DEFAULT_URI,
  marketDataProvider: process.env.MARKET_DATA_PROVIDER || 'seeded',
  jwtSecret: process.env.JWT_SECRET || 'capitalguard_default_secret_2026',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  allowMemoryDbFallback: process.env.ALLOW_MEMORY_DB_FALLBACK === 'true',
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
