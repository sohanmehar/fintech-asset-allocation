import { riskEngine } from '../engines/risk';
import { RiskReport, RiskSummaryReport } from '../engines/risk/types';

export class RiskService {
  async getPortfolioRiskReport(portfolioId: string): Promise<RiskReport> {
    return riskEngine.analyzePortfolio(portfolioId);
  }

  async getPortfolioRiskSummary(portfolioId: string): Promise<RiskSummaryReport> {
    return riskEngine.getSummaryReport(portfolioId);
  }
}

export const riskService = new RiskService();
