import { Request, Response, NextFunction } from 'express';
import { riskService } from '../services/risk.service';

export const getRiskReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioId = req.params.portfolioId as string;
    if (!portfolioId) {
      res.status(400).json({
        success: false,
        message: 'Portfolio ID parameter is required.',
        error: 'MISSING_PORTFOLIO_ID',
      });
      return;
    }

    const report = await riskService.getPortfolioRiskReport(portfolioId);

    res.status(200).json({
      success: true,
      data: report,
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
    if (error.message.includes('Insufficient') || error.message.includes('Invalid')) {
      res.status(400).json({
        success: false,
        message: error.message,
        error: 'INVALID_PORTFOLIO_DATA',
      });
      return;
    }
    next(error);
  }
};

export const getRiskSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolioId = req.params.portfolioId as string;
    if (!portfolioId) {
      res.status(400).json({
        success: false,
        message: 'Portfolio ID parameter is required.',
        error: 'MISSING_PORTFOLIO_ID',
      });
      return;
    }

    const summary = await riskService.getPortfolioRiskSummary(portfolioId);

    res.status(200).json({
      success: true,
      data: summary,
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
