import { Request, Response, NextFunction } from 'express';
import { optimizationService } from '../services/optimization.service';
import { OptimizationParams } from '../engines/optimization/types';

export const runOptimization = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { portfolioId, riskProfile, riskAversion, transactionCostRate, ...overrides } = req.body;

    if (!portfolioId) {
      res.status(400).json({
        success: false,
        message: 'Field "portfolioId" is required in request body.',
        error: 'MISSING_PORTFOLIO_ID',
      });
      return;
    }

    const params: OptimizationParams = {
      portfolioId,
      riskProfile,
      riskAversion: riskAversion !== undefined ? parseFloat(riskAversion) : undefined,
      transactionCostRate: transactionCostRate !== undefined ? parseFloat(transactionCostRate) : undefined,
      ...overrides,
    };

    const result = await optimizationService.runOptimization(params);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
        error: 'PORTFOLIO_NOT_FOUND',
      });
      return;
    }
    next(error);
  }
};

export const getOptimizationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const optimizationId = req.params.optimizationId as string;
    const run = await optimizationService.getOptimizationRunById(optimizationId);

    res.status(200).json({
      success: true,
      data: run,
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
        error: 'OPTIMIZATION_NOT_FOUND',
      });
      return;
    }
    next(error);
  }
};

export const getOptimizationByPortfolio = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioId = req.params.portfolioId as string;
    const runs = await optimizationService.getOptimizationRunsByPortfolio(portfolioId);

    res.status(200).json({
      success: true,
      count: runs.length,
      data: runs,
    });
  } catch (error: any) {
    next(error);
  }
};
