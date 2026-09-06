import { Request, Response, NextFunction } from 'express';
import { portfolioService } from '../services/portfolio.service';

export const getPortfolios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const portfolios = await portfolioService.getAllPortfolios();
    res.status(200).json({
      success: true,
      count: portfolios.length,
      data: portfolios,
    });
  } catch (error) {
    next(error);
  }
};

export const getPortfolioById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const result = await portfolioService.getPortfolioById(id);

    if (!result) {
      res.status(404).json({
        success: false,
        message: `Portfolio with ID '${id}' not found.`,
        error: 'PORTFOLIO_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.portfolio,
      allocationValidation: result.allocationValidation,
    });
  } catch (error) {
    next(error);
  }
};
