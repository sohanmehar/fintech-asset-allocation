export type ScenarioType =
  | 'MARKET_CRASH'
  | 'RATE_SHOCK'
  | 'LIQUIDITY_CRISIS'
  | 'SECTOR_SHOCK'
  | 'CUSTOM';

export interface ScenarioDefinition {
  type: ScenarioType;
  name: string;
  description: string;
  severity: 'MODERATE' | 'HIGH' | 'CRITICAL';
  defaultAssetClassShocks: Record<string, number>;
  defaultSymbolShocks?: Record<string, number>;
  liquidityDeteriorationFactor?: number; // e.g. 0.20 for 20% penalty
}

export interface AssetShockDetail {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  currentValue: number;
  shock: number; // e.g. -0.20 for -20%
  stressedValue: number;
  impactAmount: number; // stressedValue - currentValue
  impactPercentage: number; // shock
}

export interface StressedMetricSnapshot {
  totalCapital: number;
  expectedReturn: number;
  portfolioVolatility: number;
  var95Amount: number;
  var95Percentage: number;
  maximumDrawdown: number;
  liquidityScore: number;
  concentrationHHI: number;
  equityExposure: number;
  cashAllocation: number;
  riskScore: number;
  riskLevel: string;
  policyPassed: boolean;
}

export interface MetricDifference {
  totalCapitalChange: number;
  totalCapitalChangePercent: number;
  expectedReturnDiffPP: number;
  volatilityDiffPP: number;
  var95AmountChange: number;
  maximumDrawdownDiffPP: number;
  liquidityScoreDiffPts: number;
  concentrationHHIDiff: number;
  equityExposureDiffPP: number;
  cashAllocationDiffPP: number;
  riskScoreDiffPts: number;
}

export interface StressedPolicyBreach {
  type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  currentValue: number;
  stressedValue: number;
  limit: number;
  excessPP: number;
  message: string;
}

export interface StressedPolicyEvaluation {
  passed: boolean;
  totalBreaches: number;
  breaches: StressedPolicyBreach[];
}

export interface ScenarioRunResult {
  scenarioRunId?: string;
  portfolioId: string;
  portfolioName: string;
  scenarioType: ScenarioType;
  scenarioName: string;
  scenarioDescription: string;
  shocksApplied: Record<string, number>;

  currentSnapshot: StressedMetricSnapshot;
  stressedSnapshot: StressedMetricSnapshot;
  metricChanges: MetricDifference;

  policyEvaluation: StressedPolicyEvaluation;
  assetImpacts: AssetShockDetail[];
  recommendations: string[];

  calculatedAt: Date;
}
