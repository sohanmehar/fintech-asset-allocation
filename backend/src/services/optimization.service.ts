import { optimizationEngine } from '../engines/optimization';
import { OptimizationParams, OptimizationResult } from '../engines/optimization/types';
import { OptimizationRun } from '../models/OptimizationRun';
import { governanceService } from './governance.service';

export class OptimizationService {
  async runOptimization(params: OptimizationParams): Promise<OptimizationResult> {
    const result = await optimizationEngine.runOptimization(params);
    try {
      await governanceService.logAudit('OPTIMIZATION_EXECUTED', 'OPTIMIZATION_RUN', (result as any)._id || (result as any).optimizationId, {
        portfolioId: params.portfolioId,
        status: result.status,
      });
    } catch (err) {
      console.warn('Audit log warning in runOptimization:', err);
    }
    return result;
  }

  async getOptimizationRunById(optimizationId: string) {
    const run = await OptimizationRun.findById(optimizationId).populate('portfolioId', 'name riskProfile totalCapital');
    if (!run) {
      throw new Error(`Optimization run with ID '${optimizationId}' not found.`);
    }
    return run;
  }

  async getOptimizationRunsByPortfolio(portfolioId: string) {
    return OptimizationRun.find({ portfolioId }).sort({ createdAt: -1 }).limit(10);
  }
}

export const optimizationService = new OptimizationService();
