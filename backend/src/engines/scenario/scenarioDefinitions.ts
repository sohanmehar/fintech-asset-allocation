import { ScenarioDefinition, ScenarioType } from './types';

export const PREDEFINED_SCENARIOS: Record<Exclude<ScenarioType, 'CUSTOM'>, ScenarioDefinition> = {
  MARKET_CRASH: {
    type: 'MARKET_CRASH',
    name: 'Market Crash (-20% Equity)',
    description: 'Severe global equity market correction (-20%) with flight to safety in sovereign bonds (+3%) and gold (+5%).',
    severity: 'CRITICAL',
    defaultAssetClassShocks: {
      EQUITY: -0.20,
      GOLD: 0.05,
      COMMODITY: 0.05,
      GOVERNMENT_BOND: 0.03,
      FIXED_INCOME: 0.03,
      CORPORATE_BOND: -0.05,
      CASH: 0.00,
    },
  },
  RATE_SHOCK: {
    type: 'RATE_SHOCK',
    name: 'Interest Rate Spike (+200 bps)',
    description: 'Aggressive central bank rate hikes driving bond price declines (-8%) and equity valuation compression (-5%).',
    severity: 'HIGH',
    defaultAssetClassShocks: {
      GOVERNMENT_BOND: -0.08,
      FIXED_INCOME: -0.08,
      CORPORATE_BOND: -0.06,
      EQUITY: -0.05,
      GOLD: 0.02,
      COMMODITY: 0.02,
      CASH: 0.00,
    },
  },
  LIQUIDITY_CRISIS: {
    type: 'LIQUIDITY_CRISIS',
    name: 'Liquidity & Credit Crunch',
    description: 'Sudden credit freeze causing corporate bond markdowns (-10%), equity selloffs (-12%), and a 20% drop in market liquidity.',
    severity: 'CRITICAL',
    defaultAssetClassShocks: {
      EQUITY: -0.12,
      CORPORATE_BOND: -0.10,
      GOVERNMENT_BOND: -0.03,
      FIXED_INCOME: -0.03,
      GOLD: -0.02,
      COMMODITY: -0.02,
      CASH: 0.00,
    },
    liquidityDeteriorationFactor: 0.20, // 20% penalty on non-cash asset liquidity
  },
  SECTOR_SHOCK: {
    type: 'SECTOR_SHOCK',
    name: 'Tech & Banking Downturn',
    description: 'Targeted selloff in Technology (-15%) and Banking (-12%) sectors with modest flight to safety in sovereign debt and gold.',
    severity: 'HIGH',
    defaultAssetClassShocks: {
      GOVERNMENT_BOND: 0.02,
      FIXED_INCOME: 0.02,
      CORPORATE_BOND: 0.01,
      GOLD: 0.03,
      COMMODITY: 0.03,
      CASH: 0.00,
    },
    defaultSymbolShocks: {
      TCS: -0.15,
      INFY: -0.15,
      HDFCBANK: -0.12,
      ICICIBANK: -0.12,
      RELIANCE: -0.08,
    },
  },
};

export function getScenarioDefinition(
  type: ScenarioType,
  customShocks?: Record<string, number>
): ScenarioDefinition {
  if (type === 'CUSTOM') {
    return {
      type: 'CUSTOM',
      name: 'Custom Market Scenario',
      description: 'User-defined asset and sector shock parameters.',
      severity: 'MODERATE',
      defaultAssetClassShocks: customShocks || {},
      defaultSymbolShocks: customShocks || {},
    };
  }

  const def = PREDEFINED_SCENARIOS[type];
  if (!def) {
    throw new Error(`Invalid scenario type '${type}'. Available types: MARKET_CRASH, RATE_SHOCK, LIQUIDITY_CRISIS, SECTOR_SHOCK, CUSTOM.`);
  }
  return def;
}
