import { Request, Response } from 'express';
import { governanceService } from '../services/governance.service';

export class GovernanceController {
  // GET /api/alerts
  public async getAlerts(req: Request, res: Response): Promise<void> {
    try {
      const portfolioId = req.query.portfolioId ? String(req.query.portfolioId) : undefined;
      const alerts = await governanceService.getAlerts(portfolioId);
      res.status(200).json({
        success: true,
        count: alerts.length,
        data: alerts,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch alerts.',
      });
    }
  }

  // GET /api/alerts/:id
  public async getAlertById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const alert = await governanceService.getAlertById(id);
      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: err.message || 'Alert not found.',
      });
    }
  }

  // GET /api/alerts/portfolio/:portfolioId
  public async getAlertsByPortfolio(req: Request, res: Response): Promise<void> {
    try {
      const portfolioId = String(req.params.portfolioId);
      const alerts = await governanceService.getAlerts(portfolioId);
      res.status(200).json({
        success: true,
        count: alerts.length,
        data: alerts,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch portfolio alerts.',
      });
    }
  }

  // POST /api/alerts/generate
  public async generateAlerts(req: Request, res: Response): Promise<void> {
    try {
      const { portfolioId } = req.body;
      if (!portfolioId) {
        res.status(400).json({
          success: false,
          error: 'portfolioId is required in request body.',
        });
        return;
      }

      const alerts = await governanceService.generateAlertsForPortfolio(String(portfolioId));
      res.status(200).json({
        success: true,
        count: alerts.length,
        data: alerts,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to generate governance alerts.',
      });
    }
  }

  // PATCH /api/alerts/:id/acknowledge
  public async acknowledgeAlert(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const alert = await governanceService.acknowledgeAlert(id);
      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to acknowledge alert.',
      });
    }
  }

  // PATCH /api/alerts/:id/resolve
  public async resolveAlert(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const alert = await governanceService.resolveAlert(id);
      res.status(200).json({
        success: true,
        data: alert,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to resolve alert.',
      });
    }
  }

  // GET /api/audit-logs
  public async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const portfolioId = req.query.portfolioId ? String(req.query.portfolioId) : undefined;
      const action = req.query.action ? String(req.query.action) : undefined;
      const entityType = req.query.entityType ? String(req.query.entityType) : undefined;
      const limitStr = req.query.limit ? String(req.query.limit) : undefined;
      const limit = limitStr ? parseInt(limitStr, 10) : 50;

      const logs = await governanceService.getAuditLogs(portfolioId, action, entityType, limit);
      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch audit logs.',
      });
    }
  }

  // GET /api/risk-policies
  public async getRiskPolicies(req: Request, res: Response): Promise<void> {
    try {
      const policies = await governanceService.getRiskPolicies();
      res.status(200).json({
        success: true,
        count: policies.length,
        data: policies,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err.message || 'Failed to fetch risk policies.',
      });
    }
  }

  // GET /api/risk-policies/:id
  public async getRiskPolicyById(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const policy = await governanceService.getRiskPolicyById(id);
      res.status(200).json({
        success: true,
        data: policy,
      });
    } catch (err: any) {
      res.status(404).json({
        success: false,
        error: err.message || 'Risk policy not found.',
      });
    }
  }

  // PUT / PATCH /api/risk-policies/:id
  public async updateRiskPolicy(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const updates = req.body;
      const policy = await governanceService.updateRiskPolicy(id, updates);
      res.status(200).json({
        success: true,
        data: policy,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: err.message || 'Failed to update risk policy.',
      });
    }
  }
}

export const governanceController = new GovernanceController();
