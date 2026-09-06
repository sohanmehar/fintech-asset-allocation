export type AlertType =
  | 'EQUITY_EXPOSURE'
  | 'INDIVIDUAL_ASSET_CONCENTRATION'
  | 'MIN_CASH'
  | 'PORTFOLIO_VOLATILITY'
  | 'MAX_DRAWDOWN'
  | 'LIQUIDITY'
  | 'RISK_SCORE'
  | 'SCENARIO_BREACH'
  | 'GENERAL_POLICY_BREACH';

export type AlertSeverityLevel = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatusLevel = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface AlertCandidate {
  portfolioId: string;
  type: AlertType;
  severity: AlertSeverityLevel;
  title: string;
  message: string;
  metric: string;
  currentValue: number;
  limitValue: number;
  excessValue: number;
  recommendation: string;
  source: string;
}

export interface GovernanceEvaluationResult {
  portfolioId: string;
  portfolioName: string;
  totalAlertsGenerated: number;
  criticalCount: number;
  highCount: number;
  warningCount: number;
  infoCount: number;
  alerts: AlertCandidate[];
}
