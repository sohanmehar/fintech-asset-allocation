import { Portfolio, IPortfolio, User, Asset } from '../models';
import { validatePortfolioAllocation, AllocationValidationResult } from '../utils/validation';

// Ensure models are registered in Mongoose schema registry
const _models = { User, Asset };

export interface PortfolioWithValidation {
  portfolio: IPortfolio;
  allocationValidation: AllocationValidationResult;
}

export class PortfolioService {
  async getAllPortfolios(): Promise<IPortfolio[]> {
    return Portfolio.find()
      .populate('holdings.assetId', 'symbol name assetClass currentPrice liquidityScore')
      .populate('userId', 'name email role');
  }

  async getPortfolioById(id: string): Promise<PortfolioWithValidation | null> {
    const portfolio = await Portfolio.findById(id)
      .populate('holdings.assetId', 'symbol name assetClass currentPrice liquidityScore')
      .populate('userId', 'name email role');

    if (!portfolio) return null;

    const allocationValidation = validatePortfolioAllocation(portfolio.holdings);

    return {
      portfolio,
      allocationValidation,
    };
  }

  async validatePortfolioAllocationById(id: string): Promise<AllocationValidationResult> {
    const portfolio = await Portfolio.findById(id);
    if (!portfolio) {
      throw new Error(`Portfolio with ID '${id}' not found.`);
    }
    return validatePortfolioAllocation(portfolio.holdings);
  }
}

export const portfolioService = new PortfolioService();
