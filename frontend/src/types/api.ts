export type AssetClass = 'EQUITY' | 'GOVERNMENT_BOND' | 'CORPORATE_BOND' | 'GOLD' | 'CASH';
export type RiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type SeverityLevel = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
export type RebalanceAction = 'BUY' | 'SELL' | 'HOLD';

export interface Asset {
  _id: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  sector: string;
  currentPrice: number;
  currency: string;
  liquidityScore: number;
  minWeight: number;
  maxWeight: number;
}

export interface Holding {
  assetId: Asset | string;
  symbol?: string;
  quantity: number;
  currentValue: number;
  weight: number;
}

export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'RISK_OFFICER' | 'FINANCIAL_OFFICER';
}

export interface Portfolio {
  _id: string;
  name: string;
  userId: UserInfo | string;
  totalCapital: number;
  holdings: Holding[];
  riskProfile: RiskProfile;
  createdAt: string;
  updatedAt: string;
}

export interface RiskPolicy {
  _id: string;
  name: RiskProfile | string;
  maxIndividualAssetWeight: number;
  maxEquityExposure: number;
  minCashAllocation: number;
  minLiquidityScore: number;
  maxPortfolioVolatility: number;
  maxDrawdown: number;
  warningThreshold: number;
  enabled: boolean;
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

export interface RiskBreach {
  type: string;
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
  breaches: RiskBreach[];
}

export interface RiskScoreComponent {
  score: number;
  weight: number;
  contribution: number;
  currentValue: number;
  threshold: number;
}

export interface RiskBreakdown {
  volatility: RiskScoreComponent;
  var: RiskScoreComponent;
  concentration: RiskScoreComponent;
  drawdown: RiskScoreComponent;
  liquidity: RiskScoreComponent;
}

export interface CompositeRiskScore {
  score: number;
  level: RiskLevel;
  breakdown: RiskBreakdown;
}

export interface AssetRiskMetrics {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  weight: number;
  expectedReturn: number;
  volatility: number;
  liquidityScore: number;
}

export interface SystemAlert {
  _id: string;
  portfolioId: string;
  severity: SeverityLevel;
  type: string;
  title?: string;
  message: string;
  metric?: string;
  currentValue?: number;
  threshold?: number;
  limitValue?: number;
  excessValue?: number;
  recommendation?: string;
  source?: string;
  status: AlertStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface AlertItem extends SystemAlert {
  portfolioName?: string;
}

export interface AuditLogItem {
  _id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface RiskReport {
  portfolioId: string;
  portfolioName: string;
  totalCapital: number;
  riskProfile: RiskProfile;

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

  riskScore: CompositeRiskScore;
  assetMetrics: AssetRiskMetrics[];
  covarianceMatrix: { assets: string[]; matrix: number[][] };
  correlationMatrix: { assets: string[]; matrix: number[][] };
  policyEvaluation: PolicyEvaluationResult;
  alerts: SystemAlert[];
  recommendations: string[];
  calculatedAt: string;
}

export interface RiskSummaryReport {
  portfolioId: string;
  portfolioName: string;
  riskProfile: RiskProfile;
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
  calculatedAt: string;
}

// Optimization Engine Types
export interface OptimizationParams {
  portfolioId: string;
  riskProfile?: string;
  riskAversion?: number; // 0.5 (LOW), 1.0 (MEDIUM), 2.0 (HIGH)
  transactionCostRate?: number; // e.g. 0.0025 (0.25%)
  maxEquityExposure?: number;
  minCashAllocation?: number;
  maxPortfolioVolatility?: number;
  minLiquidityScore?: number;
  maxIndividualAssetWeight?: number;
  maxDrawdown?: number;
}

export interface ConstraintValidationItem {
  name: string;
  current: number;
  limit: number;
  status: 'PASS' | 'FAIL';
  message?: string;
}

export interface ObjectiveBreakdown {
  expectedReturnComponent: number;
  riskPenalty: number;
  transactionCostPenalty: number;
  totalObjective: number;
}

export interface TransactionCostSummary {
  turnover: number;
  rate: number;
  estimatedCost: number;
}

export interface RebalancingActionItem {
  assetId: string;
  symbol: string;
  assetClass: string;
  currentWeight: number;
  targetWeight: number;
  weightChange: number;
  currentValue: number;
  targetValue: number;
  valueChange: number;
  action: RebalanceAction;
}

export interface MetricComparison {
  expectedReturn: number;
  volatility: number;
  var95Amount: number;
  var95Percentage: number;
  maximumDrawdown: number;
  concentrationHHI: number;
  liquidityScore: number;
  equityExposure: number;
  cashAllocation: number;
  riskScore: number;
  riskLevel: string;
  policyPassed: boolean;
}

export interface OptimizationExplanation {
  summary: string;
  reasons: string[];
}

export interface OptimizationResult {
  optimizationId?: string;
  _id?: string;
  portfolioId: string;
  portfolioName: string;
  riskProfile: string;
  status: 'OPTIMIZED' | 'INFEASIBLE';
  objective: ObjectiveBreakdown;
  currentAllocation: Array<{
    assetId: string;
    symbol: string;
    weight: number;
    currentValue: number;
  }>;
  optimizedAllocation: Array<{
    assetId: string;
    symbol: string;
    weight: number;
    targetValue: number;
  }>;
  rebalancing: RebalancingActionItem[];
  transactionCost: TransactionCostSummary;
  beforeMetrics: MetricComparison;
  afterMetrics: MetricComparison;
  constraintValidation: {
    passed: boolean;
    constraints: ConstraintValidationItem[];
  };
  explanation: OptimizationExplanation;
  calculatedAt: string | Date;
}

// Scenario Analysis Types
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
  assetClassShocks?: Record<string, number>;
  assetShocks?: Record<string, number>;
  liquidityPenalty?: number;
  isCustom?: boolean;
}

export interface AssetShockDetail {
  assetId: string;
  symbol: string;
  name: string;
  assetClass: string;
  shockPercentage?: number;
  shock?: number;
  currentValue: number;
  stressedValue: number;
  impactAmount: number;
  impactPercentage?: number;
}

export interface StressedMetricSnapshot {
  totalCapital: number;
  expectedReturn: number;
  volatility?: number;
  portfolioVolatility?: number;
  var95Amount: number;
  var95Percentage: number;
  maximumDrawdown: number;
  liquidityScore: number;
  concentrationHHI: number;
  equityExposure: number;
  cashAllocation: number;
  riskScore: number;
  riskLevel: string;
  policyStatus?: 'PASS' | 'WARNING' | 'BREACH';
  policyPassed?: boolean;
}

export interface MetricDifference {
  metric: string;
  label: string;
  currentValue: number;
  stressedValue: number;
  absoluteChange: number;
  percentagePointChange?: number;
  formattedCurrent: string;
  formattedStressed: string;
  formattedChange: string;
  unit: 'percentage' | 'pp' | 'currency' | 'risk_points' | 'liquidity_points' | 'ratio';
  impactDirection: 'UNFAVORABLE' | 'FAVORABLE' | 'NEUTRAL';
}

export interface StressedPolicyBreach {
  policyName: string;
  currentValue: number;
  stressedValue: number;
  limit: number;
  excess: number;
  status: 'PASS' | 'WARNING' | 'BREACH';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  unit: string;
}

export interface StressedPolicyEvaluation {
  status: 'PASS' | 'WARNING' | 'BREACH';
  totalBreaches: number;
  breaches: StressedPolicyBreach[];
}

export interface ScenarioRunResult {
  _id?: string;
  portfolioId: string;
  portfolioName: string;
  scenarioType: ScenarioType;
  scenarioName: string;
  scenarioDescription: string;
  currentSnapshot: StressedMetricSnapshot;
  stressedSnapshot: StressedMetricSnapshot;
  portfolioValueLoss: number;
  portfolioValueLossPercentage: number;
  metricChanges: MetricDifference[];
  policyEvaluation: StressedPolicyEvaluation;
  assetImpacts: AssetShockDetail[];
  recommendations: string[];
  createdAt?: string | Date;
}

export interface RunScenarioParams {
  portfolioId: string;
  scenarioType: ScenarioType;
  customShocks?: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  allocationValidation?: any;
  message?: string;
  error?: string;
}

