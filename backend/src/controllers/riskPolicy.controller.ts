import { Request, Response, NextFunction } from 'express';
import { riskPolicyService } from '../services/riskPolicy.service';

export const getRiskPolicies = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const policies = await riskPolicyService.getAllPolicies();
    res.status(200).json({
      success: true,
      count: policies.length,
      data: policies,
    });
  } catch (error) {
    next(error);
  }
};
