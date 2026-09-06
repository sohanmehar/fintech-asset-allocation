import { Alert, IAlert, AlertStatus } from '../models/Alert';
import { AuditLog, IAuditLog } from '../models/AuditLog';
import { RiskPolicy, IRiskPolicy } from '../models/RiskPolicy';
import { governanceEngine } from '../engines/governance/governanceEngine';

export class GovernanceService {
  /**
   * Log an audit event to the AuditLog collection.
   */
  public async logAudit(
    action: string,
    entityType: string,
    entityId?: string,
    details?: Record<string, any>,
    userId?: string
  ): Promise<IAuditLog> {
    const entry = new AuditLog({
      userId: userId || 'SYSTEM',
      action,
      entityType,
      entityId,
      details: details || {},
      metadata: details || {},
      timestamp: new Date(),
    });

    return await entry.save();
  }

  /**
   * Fetch all alerts with optional portfolioId filter.
   */
  public async getAlerts(portfolioId?: string): Promise<IAlert[]> {
    const filter: Record<string, any> = {};
    if (portfolioId) {
      filter.portfolioId = portfolioId;
    }
    return await Alert.find(filter).sort({ createdAt: -1 });
  }

  /**
   * Fetch alert by ID.
   */
  public async getAlertById(id: string): Promise<IAlert> {
    const alert = await Alert.findById(id);
    if (!alert) {
      throw new Error(`Alert with ID '${id}' not found.`);
    }
    return alert;
  }

  /**
   * Evaluate governance and generate/update alerts for a portfolio.
   */
  public async generateAlertsForPortfolio(portfolioId: string, userId?: string): Promise<IAlert[]> {
    const { alerts } = await governanceEngine.evaluatePortfolioGovernance(portfolioId);
    
    await this.logAudit('GOVERNANCE_EVALUATED', 'PORTFOLIO', portfolioId, {
      totalAlerts: alerts.length,
    }, userId);

    return alerts;
  }

  /**
   * Acknowledge an alert (OPEN -> ACKNOWLEDGED).
   */
  public async acknowledgeAlert(alertId: string, userId?: string): Promise<IAlert> {
    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error(`Alert with ID '${alertId}' not found.`);
    }

    if (alert.status === 'RESOLVED') {
      throw new Error(`Cannot acknowledge an alert that is already RESOLVED.`);
    }

    if (alert.status === 'ACKNOWLEDGED') {
      return alert; // Idempotent
    }

    alert.status = 'ACKNOWLEDGED';
    alert.updatedAt = new Date();
    await alert.save();

    await this.logAudit('ALERT_ACKNOWLEDGED', 'ALERT', alertId, {
      type: alert.type,
      portfolioId: alert.portfolioId.toString(),
    }, userId);

    return alert;
  }

  /**
   * Resolve an alert (OPEN/ACKNOWLEDGED -> RESOLVED).
   */
  public async resolveAlert(alertId: string, userId?: string): Promise<IAlert> {
    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error(`Alert with ID '${alertId}' not found.`);
    }

    if (alert.status === 'RESOLVED') {
      return alert; // Idempotent
    }

    alert.status = 'RESOLVED';
    alert.updatedAt = new Date();
    await alert.save();

    await this.logAudit('ALERT_RESOLVED', 'ALERT', alertId, {
      type: alert.type,
      portfolioId: alert.portfolioId.toString(),
    }, userId);

    return alert;
  }

  /**
   * Fetch audit logs with optional filters.
   */
  public async getAuditLogs(
    portfolioId?: string,
    action?: string,
    entityType?: string,
    limit: number = 50
  ): Promise<IAuditLog[]> {
    const filter: Record<string, any> = {};

    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;
    if (portfolioId) {
      filter.$or = [
        { entityId: portfolioId },
        { 'details.portfolioId': portfolioId },
        { 'metadata.portfolioId': portfolioId },
      ];
    }

    return await AuditLog.find(filter).sort({ timestamp: -1 }).limit(limit);
  }

  /**
   * Fetch all Risk Policies.
   */
  public async getRiskPolicies(): Promise<IRiskPolicy[]> {
    return await RiskPolicy.find().sort({ name: 1 });
  }

  /**
   * Fetch Risk Policy by ID or name.
   */
  public async getRiskPolicyById(idOrName: string): Promise<IRiskPolicy> {
    let policy = await RiskPolicy.findById(idOrName).catch(() => null);
    if (!policy) {
      policy = await RiskPolicy.findOne({ name: idOrName.toUpperCase() });
    }
    if (!policy) {
      throw new Error(`Risk policy '${idOrName}' not found.`);
    }
    return policy;
  }

  /**
   * Update a Risk Policy with strict input validation.
   */
  public async updateRiskPolicy(
    id: string,
    updates: Partial<IRiskPolicy>,
    userId?: string
  ): Promise<IRiskPolicy> {
    const policy = await RiskPolicy.findById(id);
    if (!policy) {
      throw new Error(`Risk Policy with ID '${id}' not found.`);
    }

    // Validation
    if (updates.maxEquityExposure !== undefined) {
      if (typeof updates.maxEquityExposure !== 'number' || updates.maxEquityExposure < 0 || updates.maxEquityExposure > 1) {
        throw new Error('maxEquityExposure must be a number between 0 and 1 (0% to 100%).');
      }
      policy.maxEquityExposure = updates.maxEquityExposure;
    }

    if (updates.maxIndividualAssetWeight !== undefined) {
      if (typeof updates.maxIndividualAssetWeight !== 'number' || updates.maxIndividualAssetWeight < 0 || updates.maxIndividualAssetWeight > 1) {
        throw new Error('maxIndividualAssetWeight must be a number between 0 and 1 (0% to 100%).');
      }
      policy.maxIndividualAssetWeight = updates.maxIndividualAssetWeight;
    }

    if (updates.minCashAllocation !== undefined) {
      if (typeof updates.minCashAllocation !== 'number' || updates.minCashAllocation < 0 || updates.minCashAllocation > 1) {
        throw new Error('minCashAllocation must be a number between 0 and 1 (0% to 100%).');
      }
      policy.minCashAllocation = updates.minCashAllocation;
    }

    if (updates.minLiquidityScore !== undefined) {
      if (typeof updates.minLiquidityScore !== 'number' || updates.minLiquidityScore < 0 || updates.minLiquidityScore > 100) {
        throw new Error('minLiquidityScore must be a number between 0 and 100.');
      }
      policy.minLiquidityScore = updates.minLiquidityScore;
    }

    if (updates.maxPortfolioVolatility !== undefined) {
      if (typeof updates.maxPortfolioVolatility !== 'number' || updates.maxPortfolioVolatility < 0 || updates.maxPortfolioVolatility > 1) {
        throw new Error('maxPortfolioVolatility must be a number between 0 and 1 (0% to 100%).');
      }
      policy.maxPortfolioVolatility = updates.maxPortfolioVolatility;
    }

    if (updates.maxDrawdown !== undefined) {
      if (typeof updates.maxDrawdown !== 'number' || updates.maxDrawdown < 0 || updates.maxDrawdown > 1) {
        throw new Error('maxDrawdown must be a number between 0 and 1 (0% to 100%).');
      }
      policy.maxDrawdown = updates.maxDrawdown;
    }

    if (updates.warningThreshold !== undefined) {
      let wt = updates.warningThreshold;
      // Convert percentage input e.g. 85 -> 0.85 if > 1
      if (wt > 1) wt = wt / 100;
      if (typeof wt !== 'number' || wt < 0 || wt > 1) {
        throw new Error('warningThreshold must be between 0 and 1 (or 0 to 100%).');
      }
      policy.warningThreshold = wt;
    }

    if (updates.enabled !== undefined) {
      policy.enabled = Boolean(updates.enabled);
    }

    policy.updatedAt = new Date();
    await policy.save();

    await this.logAudit('RISK_POLICY_UPDATED', 'RISK_POLICY', policy._id.toString(), {
      policyName: policy.name,
      updatedFields: Object.keys(updates),
    }, userId);

    return policy;
  }
}

export const governanceService = new GovernanceService();
