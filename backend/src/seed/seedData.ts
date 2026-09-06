import { AssetSeedConfig } from './historicalDataGenerator';

export const rawAssetConfigs: AssetSeedConfig[] = [
  // EQUITIES
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd.',
    assetClass: 'EQUITY',
    sector: 'Energy & Conglomerate',
    currentPrice: 2950.0,
    currency: 'INR',
    liquidityScore: 95,
    minWeight: 0.0,
    maxWeight: 0.3,
    annualDrift: 0.14,
    annualVolatility: 0.22,
    scenarioShock: { marketCrash: -0.28, interestRateRise: -0.08 },
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd.',
    assetClass: 'EQUITY',
    sector: 'Information Technology',
    currentPrice: 4120.0,
    currency: 'INR',
    liquidityScore: 92,
    minWeight: 0.0,
    maxWeight: 0.3,
    annualDrift: 0.13,
    annualVolatility: 0.19,
    scenarioShock: { marketCrash: -0.22, interestRateRise: -0.05 },
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd.',
    assetClass: 'EQUITY',
    sector: 'Banking & Financial Services',
    currentPrice: 1650.0,
    currency: 'INR',
    liquidityScore: 94,
    minWeight: 0.0,
    maxWeight: 0.3,
    annualDrift: 0.12,
    annualVolatility: 0.20,
    scenarioShock: { marketCrash: -0.25, interestRateRise: -0.12 },
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd.',
    assetClass: 'EQUITY',
    sector: 'Information Technology',
    currentPrice: 1820.0,
    currency: 'INR',
    liquidityScore: 90,
    minWeight: 0.0,
    maxWeight: 0.25,
    annualDrift: 0.12,
    annualVolatility: 0.21,
    scenarioShock: { marketCrash: -0.24, interestRateRise: -0.06 },
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd.',
    assetClass: 'EQUITY',
    sector: 'Banking & Financial Services',
    currentPrice: 1210.0,
    currency: 'INR',
    liquidityScore: 91,
    minWeight: 0.0,
    maxWeight: 0.25,
    annualDrift: 0.15,
    annualVolatility: 0.23,
    scenarioShock: { marketCrash: -0.26, interestRateRise: -0.10 },
  },
  {
    symbol: 'TATAMOTORS',
    name: 'Tata Motors Ltd.',
    assetClass: 'EQUITY',
    sector: 'Automotive',
    currentPrice: 980.0,
    currency: 'INR',
    liquidityScore: 85,
    minWeight: 0.0,
    maxWeight: 0.2,
    annualDrift: 0.16,
    annualVolatility: 0.28,
    scenarioShock: { marketCrash: -0.32, interestRateRise: -0.14 },
  },
  // GOVERNMENT BONDS
  {
    symbol: 'GSEC10Y',
    name: 'Government of India 10-Year G-Sec',
    assetClass: 'GOVERNMENT_BOND',
    sector: 'Sovereign Debt',
    currentPrice: 1050.0,
    currency: 'INR',
    liquidityScore: 98,
    minWeight: 0.05,
    maxWeight: 0.5,
    annualDrift: 0.068,
    annualVolatility: 0.04,
    scenarioShock: { marketCrash: 0.05, interestRateRise: -0.07 },
  },
  // CORPORATE BONDS
  {
    symbol: 'CORPBOND',
    name: 'Nippon India Corporate Bond Fund',
    assetClass: 'CORPORATE_BOND',
    sector: 'Corporate Credit',
    currentPrice: 1120.0,
    currency: 'INR',
    liquidityScore: 88,
    minWeight: 0.0,
    maxWeight: 0.4,
    annualDrift: 0.078,
    annualVolatility: 0.065,
    scenarioShock: { marketCrash: -0.04, interestRateRise: -0.09 },
  },
  // GOLD
  {
    symbol: 'GOLDBEES',
    name: 'Nippon India ETF Gold BeES',
    assetClass: 'GOLD',
    sector: 'Commodities',
    currentPrice: 64.5,
    currency: 'INR',
    liquidityScore: 89,
    minWeight: 0.0,
    maxWeight: 0.3,
    annualDrift: 0.09,
    annualVolatility: 0.13,
    scenarioShock: { marketCrash: 0.12, interestRateRise: -0.03 },
  },
  // CASH
  {
    symbol: 'CASH',
    name: 'Liquid Cash & Reserve Fund',
    assetClass: 'CASH',
    sector: 'Liquid Reserve',
    currentPrice: 1.0,
    currency: 'INR',
    liquidityScore: 100,
    minWeight: 0.05,
    maxWeight: 1.0,
    annualDrift: 0.055,
    annualVolatility: 0.001,
    scenarioShock: { marketCrash: 0.0, interestRateRise: 0.005 },
  },
];

export const riskPoliciesSeedData = [
  {
    name: 'CONSERVATIVE',
    maxIndividualAssetWeight: 0.30,
    maxEquityExposure: 0.40,
    minCashAllocation: 0.10,
    minLiquidityScore: 70,
    maxPortfolioVolatility: 0.10,
    maxDrawdown: 0.20,
    warningThreshold: 0.85,
    enabled: true,
  },
  {
    name: 'BALANCED',
    maxIndividualAssetWeight: 0.30,
    maxEquityExposure: 0.60,
    minCashAllocation: 0.05,
    minLiquidityScore: 70,
    maxPortfolioVolatility: 0.15,
    maxDrawdown: 0.20,
    warningThreshold: 0.85,
    enabled: true,
  },
  {
    name: 'AGGRESSIVE',
    maxIndividualAssetWeight: 0.30,
    maxEquityExposure: 0.75,
    minCashAllocation: 0.05,
    minLiquidityScore: 70,
    maxPortfolioVolatility: 0.20,
    maxDrawdown: 0.20,
    warningThreshold: 0.85,
    enabled: true,
  },
];

export const demoUserSeed = {
  name: 'Chief Risk Officer',
  email: 'risk.officer@capitalguard.internal',
  passwordHash: '$2b$10$HackathonDemoHashedPasswordPlaceholder2026',
  role: 'RISK_OFFICER' as const,
};

export const demoPortfolioTargetWeights = [
  { symbol: 'RELIANCE', weight: 0.20 },  // 20%
  { symbol: 'TCS', weight: 0.15 },       // 15%
  { symbol: 'HDFCBANK', weight: 0.15 },  // 15%
  { symbol: 'INFY', weight: 0.10 },      // 10%
  { symbol: 'ICICIBANK', weight: 0.08 }, // 8%
  // Total Equity = 68% (Breaches BALANCED limit of 60%)
  { symbol: 'GSEC10Y', weight: 0.10 },   // 10%
  { symbol: 'CORPBOND', weight: 0.07 },  // 7%
  { symbol: 'GOLDBEES', weight: 0.10 },  // 10%
  { symbol: 'CASH', weight: 0.05 },      // 5%
  // Total = 100% exactly
];
