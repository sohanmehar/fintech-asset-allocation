import { scenarioEngine } from '../engines/scenario/scenarioEngine';
import { PREDEFINED_SCENARIOS } from '../engines/scenario/scenarioDefinitions';
import { ScenarioRunResult, ScenarioType } from '../engines/scenario/types';
import { ScenarioRun } from '../models/ScenarioRun';
import { governanceService } from './governance.service';

export class ScenarioService {
  /**
   * Returns list of predefined scenario definitions.
   */
  public getScenarios() {
    return Object.values(PREDEFINED_SCENARIOS);
  }

  /**
   * Runs a stress test scenario and persists the run details.
   */
  public async runScenario(
    portfolioId: string,
    scenarioType: ScenarioType,
    customShocks?: Record<string, number>
  ): Promise<ScenarioRunResult> {
    // 1. Execute scenario calculation
    const result = await scenarioEngine.runScenario(portfolioId, scenarioType, customShocks);

    // 2. Persist scenario run in MongoDB asynchronously
    try {
      const runDoc = new ScenarioRun({
        portfolioId: result.portfolioId,
        scenarioType: result.scenarioType,
        parameters: {
          scenarioName: result.scenarioName,
          shocksApplied: result.shocksApplied,
        },
        beforeMetrics: result.currentSnapshot,
        stressedMetrics: result.stressedSnapshot,
        assetImpacts: result.assetImpacts,
        recommendations: result.recommendations,
        createdAt: result.calculatedAt,
      });
      await runDoc.save();
      result.scenarioRunId = runDoc._id.toString();

      await governanceService.logAudit('SCENARIO_EXECUTED', 'SCENARIO_RUN', runDoc._id.toString(), {
        portfolioId,
        scenarioType,
        scenarioName: result.scenarioName,
      });
    } catch (saveErr) {
      console.warn('ScenarioRun persistence warning:', saveErr);
    }

    return result;
  }
}

export const scenarioService = new ScenarioService();
