import { RiskProfile } from '../../models/Portfolio';

export interface OptimizationParams {
  portfolioId: string;
  riskProfile?: RiskProfile;
  riskAversion?: number; // e.g. 0.5 (LOW), 1.0 (MEDIUM), 2.0 (HIGH), default 1.0
  transactionCostRate?: number; // e.g. 0.0025 (0.25%), default 0.0025

  // Optional constraint overrides
  maxEquityExposure?: number;
  minCashAllocation?: number;
  maxPortfolioVolatility?: number;
  minLiquidityScore?: number;
  maxIndividualAssetWeight?: number;
  maxDrawdown?: number;
}

export interface CandidateHolding {
  assetId: string;
  symbol: string;
  weight: number; // 0.0 - 1.0
}

export interface CandidateAllocation {
  name: string;
  weights: number[]; // Index aligned with asset universe
  holdings: CandidateHolding[];
}

export interface ConstraintValidationItem {
  name: string;
  current: number;
  limit: number;
  status: 'PASS' | 'FAIL';
  message?: string;
}

export interface ConstraintEvaluationResult {
  feasible: boolean;
  totalViolations: number;
  violations: string[];
  constraintItems: ConstraintValidationItem[];
}

export interface ObjectiveBreakdown {
  expectedReturnComponent: number;
  riskPenalty: number;
  transactionCostPenalty: number;
  totalObjective: number;
}

export interface TransactionCostSummary {
  turnover: number; // Sum |w_target - w_current|
  rate: number; // e.g. 0.0025
  estimatedCost: number; // turnover * totalCapital * rate
}

export type RebalanceAction = 'BUY' | 'SELL' | 'HOLD';

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

  calculatedAt: Date;
}
