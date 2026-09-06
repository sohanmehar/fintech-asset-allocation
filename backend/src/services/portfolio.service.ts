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

  async createOrUpdatePortfolio(data: {
    portfolioId?: string;
    name: string;
    totalCapital: number;
    riskProfile: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
    holdings: Array<{ symbol: string; weight: number }>;
  }): Promise<IPortfolio> {
    let user = await User.findOne({ email: 'risk.officer@capitalguard.internal' });
    if (!user) {
      user = await User.findOne();
    }
    const userId = user?._id;

    const resolvedHoldings = [];
    for (const h of data.holdings) {
      const assetDoc = await Asset.findOne({ symbol: h.symbol.trim().toUpperCase() });
      if (!assetDoc) {
        throw new Error(`Asset with symbol '${h.symbol}' not found in database.`);
      }
      const currentValue = h.weight * data.totalCapital;
      const quantity = assetDoc.currentPrice > 0 ? currentValue / assetDoc.currentPrice : 0;
      resolvedHoldings.push({
        assetId: assetDoc._id,
        symbol: assetDoc.symbol,
        quantity: Math.round(quantity * 1000) / 1000,
        currentValue: Math.round(currentValue * 100) / 100,
        weight: h.weight,
      });
    }

    if (data.portfolioId && data.portfolioId.length === 24) {
      const existing = await Portfolio.findById(data.portfolioId);
      if (existing) {
        existing.name = data.name;
        existing.totalCapital = data.totalCapital;
        existing.riskProfile = data.riskProfile;
        existing.holdings = resolvedHoldings as any;
        await existing.save();
        return (await existing.populate([
          { path: 'holdings.assetId', select: 'symbol name assetClass currentPrice liquidityScore' },
          { path: 'userId', select: 'name email role' },
        ])) as IPortfolio;
      }
    }

    const created = await Portfolio.create({
      name: data.name,
      userId,
      totalCapital: data.totalCapital,
      riskProfile: data.riskProfile,
      holdings: resolvedHoldings,
    });

    return (await created.populate([
      { path: 'holdings.assetId', select: 'symbol name assetClass currentPrice liquidityScore' },
      { path: 'userId', select: 'name email role' },
    ])) as IPortfolio;
  }
}

export const portfolioService = new PortfolioService();
