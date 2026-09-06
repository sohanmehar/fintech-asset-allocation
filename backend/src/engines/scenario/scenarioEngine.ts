import { Portfolio } from '../../models/Portfolio';
import { Asset } from '../../models/Asset';
import { RiskPolicy } from '../../models/RiskPolicy';
import { RiskEngine } from '../risk/riskEngine';
import { getScenarioDefinition } from './scenarioDefinitions';
import { computeAssetShocks, RawHoldingInput } from './scenarioShockEngine';
import { calculateScenarioRiskMetrics } from './scenarioRiskCalculator';
import { generateScenarioRecommendations } from './scenarioRecommendationEngine';
import { ScenarioRunResult, ScenarioType } from './types';

export class ScenarioEngine {
  private riskEngine: RiskEngine;

  constructor() {
    this.riskEngine = new RiskEngine();
  }

  /**
   * Executes a stress test scenario on a portfolio.
   * IMMUTABILITY MANDATE: Operates purely on cloned in-memory representations.
   * Does NOT mutate database records for Portfolio, Holdings, or Assets.
   */
  public async runScenario(
    portfolioId: string,
    scenarioType: ScenarioType,
    customShocks?: Record<string, number>
  ): Promise<ScenarioRunResult> {
    // 1. Fetch Portfolio
    const portfolioDoc = await Portfolio.findById(portfolioId);
    if (!portfolioDoc) {
      throw new Error(`Portfolio with ID '${portfolioId}' not found.`);
    }

    if (!portfolioDoc.holdings || portfolioDoc.holdings.length === 0) {
      throw new Error(`Portfolio '${portfolioDoc.name}' has no asset holdings.`);
    }

    // 2. Load Policy for portfolio risk profile
    const riskProfile = portfolioDoc.riskProfile || 'BALANCED';
    const policyDoc = await RiskPolicy.findOne({ name: riskProfile, enabled: true });
    if (!policyDoc) {
      throw new Error(`Risk policy for profile '${riskProfile}' not found in database.`);
    }

    // 3. Obtain base Risk Engine report (read-only calculation)
    const baseRiskReport = await this.riskEngine.analyzePortfolio(portfolioId);

    // 4. Load Asset documents for symbol & assetClass mapping
    const assetIds = portfolioDoc.holdings.map((h) => h.assetId);
    const assetDocs = await Asset.find({ _id: { $in: assetIds } });
    const assetMap = new Map(assetDocs.map((a) => [a._id.toString(), a]));

    // Build raw holding inputs
    const rawHoldings: RawHoldingInput[] = portfolioDoc.holdings.map((h) => {
      const assetObj = assetMap.get(h.assetId.toString());
      const symbol = assetObj?.symbol || h.symbol || 'ASSET';
      const name = assetObj?.name || h.symbol || 'Asset';
      const assetClass = assetObj?.assetClass || 'EQUITY';
      const currentValue = h.currentValue || h.weight * portfolioDoc.totalCapital;

      return {
        assetId: h.assetId.toString(),
        symbol,
        name,
        assetClass,
        currentValue,
        weight: h.weight,
      };
    });

    // 5. Retrieve Scenario Definition
    const scenarioDef = getScenarioDefinition(scenarioType, customShocks);

    // 6. Compute Asset-Level Shocks & Stressed Values
    const { assetImpacts, shocksAppliedMap, stressedTotalCapital } = computeAssetShocks(
      rawHoldings,
      scenarioDef,
      customShocks
    );

    // 7. Calculate Stressed Portfolio Risk Metrics
    const { currentSnapshot, stressedSnapshot, metricChanges, policyEvaluation } =
      calculateScenarioRiskMetrics(
        baseRiskReport,
        assetImpacts,
        stressedTotalCapital,
        scenarioDef,
        policyDoc
      );

    // 8. Generate Scenario Recommendations
    const recommendations = generateScenarioRecommendations(
      scenarioDef,
      currentSnapshot,
      stressedSnapshot,
      policyEvaluation,
      assetImpacts
    );

    return {
      portfolioId: portfolioDoc._id.toString(),
      portfolioName: portfolioDoc.name,
      scenarioType,
      scenarioName: scenarioDef.name,
      scenarioDescription: scenarioDef.description,
      shocksApplied: shocksAppliedMap,

      currentSnapshot,
      stressedSnapshot,
      metricChanges,

      policyEvaluation,
      assetImpacts,
      recommendations,

      calculatedAt: new Date(),
    };
  }
}

export const scenarioEngine = new ScenarioEngine();
