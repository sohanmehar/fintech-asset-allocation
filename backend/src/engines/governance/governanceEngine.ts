import { Portfolio } from '../../models/Portfolio';
import { RiskPolicy } from '../../models/RiskPolicy';
import { Alert, IAlert } from '../../models/Alert';
import { RiskEngine } from '../risk/riskEngine';
import { generateAlertCandidates } from './alertGenerator';
import { GovernanceEvaluationResult } from './types';

export class GovernanceEngine {
  private riskEngine: RiskEngine;

  constructor() {
    this.riskEngine = new RiskEngine();
  }

  /**
   * Runs governance evaluation for a portfolio, generating/updating deduplicated alerts in MongoDB.
   * DOES NOT mutate portfolio holdings or allocation.
   */
  public async evaluatePortfolioGovernance(portfolioId: string): Promise<{
    result: GovernanceEvaluationResult;
    alerts: IAlert[];
  }> {
    // 1. Load Portfolio
    const portfolioDoc = await Portfolio.findById(portfolioId);
    if (!portfolioDoc) {
      throw new Error(`Portfolio with ID '${portfolioId}' not found.`);
    }

    // 2. Load Risk Policy for portfolio risk profile
    const riskProfile = portfolioDoc.riskProfile || 'BALANCED';
    const policyDoc = await RiskPolicy.findOne({ name: riskProfile, enabled: true });
    if (!policyDoc) {
      throw new Error(`Risk policy for profile '${riskProfile}' not found.`);
    }

    // 3. Obtain Risk Engine report (read-only calculation)
    const riskReport = await this.riskEngine.analyzePortfolio(portfolioId);

    // 4. Generate alert candidates from Risk Report
    const candidates = generateAlertCandidates(portfolioId, riskReport, policyDoc);

    // 5. Fetch existing OPEN and ACKNOWLEDGED alerts for this portfolio
    const activeAlerts = await Alert.find({
      portfolioId,
      status: { $in: ['OPEN', 'ACKNOWLEDGED'] },
    });

    const activeAlertMap = new Map<string, IAlert>();
    activeAlerts.forEach((a) => {
      // Key by alert type
      activeAlertMap.set(a.type, a);
    });

    const candidateTypeSet = new Set(candidates.map((c) => c.type));
    const processedAlerts: IAlert[] = [];

    // 6. Deduplicate & Sync Candidate Alerts
    for (const candidate of candidates) {
      const existingAlert = activeAlertMap.get(candidate.type);

      if (existingAlert) {
        // Update existing unresolved alert
        existingAlert.severity = candidate.severity;
        existingAlert.title = candidate.title;
        existingAlert.message = candidate.message;
        existingAlert.currentValue = candidate.currentValue;
        existingAlert.threshold = candidate.limitValue;
        existingAlert.limitValue = candidate.limitValue;
        existingAlert.excessValue = candidate.excessValue;
        existingAlert.recommendation = candidate.recommendation;
        existingAlert.source = candidate.source;
        existingAlert.updatedAt = new Date();

        await existingAlert.save();
        processedAlerts.push(existingAlert);
      } else {
        // Create new OPEN alert
        const newAlert = new Alert({
          portfolioId,
          type: candidate.type,
          severity: candidate.severity,
          title: candidate.title,
          message: candidate.message,
          metric: candidate.metric,
          currentValue: candidate.currentValue,
          threshold: candidate.limitValue,
          limitValue: candidate.limitValue,
          excessValue: candidate.excessValue,
          recommendation: candidate.recommendation,
          source: candidate.source,
          status: 'OPEN',
        });

        await newAlert.save();
        processedAlerts.push(newAlert);
      }
    }

    // 7. Auto-resolve active alerts whose breach no longer exists
    for (const [type, activeAlert] of activeAlertMap.entries()) {
      if (!candidateTypeSet.has(type as any)) {
        activeAlert.status = 'RESOLVED';
        activeAlert.updatedAt = new Date();
        await activeAlert.save();
      }
    }

    // 8. Fetch all current alerts for portfolio (including recent RESOLVED)
    const allAlerts = await Alert.find({ portfolioId }).sort({ createdAt: -1 });

    const criticalCount = processedAlerts.filter((a) => a.severity === 'CRITICAL').length;
    const highCount = processedAlerts.filter((a) => a.severity === 'HIGH').length;
    const warningCount = processedAlerts.filter((a) => a.severity === 'WARNING').length;
    const infoCount = processedAlerts.filter((a) => a.severity === 'INFO').length;

    const result: GovernanceEvaluationResult = {
      portfolioId,
      portfolioName: portfolioDoc.name,
      totalAlertsGenerated: processedAlerts.length,
      criticalCount,
      highCount,
      warningCount,
      infoCount,
      alerts: candidates,
    };

    return { result, alerts: allAlerts };
  }
}

export const governanceEngine = new GovernanceEngine();
