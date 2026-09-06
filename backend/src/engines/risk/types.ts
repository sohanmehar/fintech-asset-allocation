export const TRADING_DAYS_PER_YEAR = 252;
export const VAR_Z_95 = 1.645; // 95% one-tailed confidence z-score

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type SeverityLevel = 'INFO' | 'WARNING' | 'CRITICAL';

export type PolicyBreachType =
  | 'EQUITY_EXPOSURE'
  | 'INDIVIDUAL_ASSET_WEIGHT'
  | 'MIN_CASH'
  | 'MIN_LIQUIDITY'
  | 'MAX_VOLATILITY'
  | 'MAX_DRAWDOWN'
  | 'ALLOCATION_INCONSISTENCY';

export interface AssetRiskMetrics {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  weight: number;
  expectedReturn: number;
  volatility: number;
  liquidityScore: number;
}

export interface CovarianceMatrixResult {
  assets: string[];
  matrix: number[][];
}

export interface CorrelationMatrixResult {
  assets: string[];
  matrix: number[][];
}

export interface VaRResult {
  confidenceLevel: number;
  horizonDays: number;
  amount: number;
  percentage: number;
  label: string;
}

export interface ConcentrationResult {
  hhi: number;
  concentrationLevel: 'LOW' | 'MODERATE' | 'HIGH';
  largestHoldingSymbol: string;
  largestHoldingWeight: number;
  holdingCount: number;
  maxWeightAllowed: number;
  exceededMaxAssetWeight: boolean;
}

export interface PolicyBreachItem {
  type: PolicyBreachType;
  severity: SeverityLevel;
  currentValue: number;
  limit: number;
  excess: number;
  message: string;
  assetSymbol?: string;
}

export interface PolicyEvaluationResult {
  passed: boolean;
  totalBreaches: number;
  breaches: PolicyBreachItem[];
}

export interface RiskScoreComponent {
  score: number;
  weight: number;
  contribution: number;
  currentValue: number;
  threshold: number;
}

export interface RiskScoreBreakdown {
  volatility: RiskScoreComponent;
  var: RiskScoreComponent;
  concentration: RiskScoreComponent;
  drawdown: RiskScoreComponent;
  liquidity: RiskScoreComponent;
}

export interface CompositeRiskScoreResult {
  score: number;
  level: RiskLevel;
  breakdown: RiskScoreBreakdown;
}

export interface RiskReport {
  portfolioId: string;
  portfolioName: string;
  totalCapital: number;
  riskProfile: string;

  metrics: {
    expectedReturn: number;
    portfolioVolatility: number;
    var95: VaRResult;
    maximumDrawdown: number;
    concentration: ConcentrationResult;
    liquidityScore: number;
    equityExposure: number;
    cashAllocation: number;
  };

  riskScore: CompositeRiskScoreResult;

  assetMetrics: AssetRiskMetrics[];

  covarianceMatrix: CovarianceMatrixResult;
  correlationMatrix: CorrelationMatrixResult;

  policyEvaluation: PolicyEvaluationResult;

  alerts: any[];
  recommendations: string[];

  calculatedAt: Date;
}

export interface RiskSummaryReport {
  portfolioId: string;
  portfolioName: string;
  riskProfile: string;
  riskScore: number;
  riskLevel: RiskLevel;
  expectedReturn: number;
  portfolioVolatility: number;
  var95Amount: number;
  var95Percentage: number;
  maximumDrawdown: number;
  liquidityScore: number;
  equityExposure: number;
  cashAllocation: number;
  totalBreaches: number;
  criticalAlertsCount: number;
  calculatedAt: Date;
}
