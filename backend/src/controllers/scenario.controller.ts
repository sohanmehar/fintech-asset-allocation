import { Request, Response, NextFunction } from 'express';
import { scenarioService } from '../services/scenario.service';

export const getScenarios = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const scenarios = scenarioService.getScenarios();
    res.status(200).json({
      success: true,
      count: scenarios.length,
      data: scenarios,
    });
  } catch (error) {
    next(error);
  }
};

export const runScenario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { portfolioId, scenarioType, customShocks } = req.body;

    if (!portfolioId) {
      res.status(400).json({
        success: false,
        message: 'Field "portfolioId" is required.',
        error: 'MISSING_PORTFOLIO_ID',
      });
      return;
    }

    if (!scenarioType) {
      res.status(400).json({
        success: false,
        message: 'Field "scenarioType" is required.',
        error: 'MISSING_SCENARIO_TYPE',
      });
      return;
    }

    // Custom shock validation if scenarioType === 'CUSTOM'
    if (scenarioType === 'CUSTOM') {
      if (!customShocks || typeof customShocks !== 'object' || Object.keys(customShocks).length === 0) {
        res.status(400).json({
          success: false,
          message: 'For CUSTOM scenario, non-empty "customShocks" map is required.',
          error: 'MISSING_CUSTOM_SHOCKS',
        });
        return;
      }

      for (const [key, val] of Object.entries(customShocks)) {
        const num = Number(val);
        if (isNaN(num) || num < -1.0 || num > 1.0) {
          res.status(400).json({
            success: false,
            message: `Custom shock for '${key}' must be a number between -1.0 (-100%) and +1.0 (+100%). Received: ${val}`,
            error: 'INVALID_SHOCK_BOUNDS',
          });
          return;
        }
      }
    }

    const result = await scenarioService.runScenario(portfolioId, scenarioType, customShocks);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        message: error.message,
        error: 'NOT_FOUND',
      });
      return;
    }
    next(error);
  }
};
