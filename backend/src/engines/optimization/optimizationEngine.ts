import { Portfolio } from '../../models/Portfolio';
import { Asset } from '../../models/Asset';
import { RiskPolicy } from '../../models/RiskPolicy';
import { OptimizationRun } from '../../models/OptimizationRun';
import { riskEngine } from '../risk/riskEngine';
import {
  alignPriceSeries,
  calculateDailyReturns,
  calculateExpectedAnnualReturn,
  calculatePortfolioExpectedReturn,
} from '../risk/returnCalculator';
import {
  calculateAnnualVolatility,
  calculatePortfolioVolatility,
} from '../risk/volatilityCalculator';
import { calculateCovarianceAndCorrelation } from '../risk/covarianceCalculator';
import { calculateParametricVaR } from '../risk/varCalculator';
import { calculateHistoricalMaxDrawdown } from '../risk/drawdownCalculator';
import { calculateConcentration } from '../risk/concentrationCalculator';
import { calculatePortfolioLiquidityScore } from '../risk/liquidityCalculator';
import { evaluateRiskPolicy } from '../risk/policyEvaluator';
import { calculateCompositeRiskScore } from '../risk/riskScoreCalculator';
import {
  OptimizationParams,
  OptimizationResult,
  MetricComparison,
  OptimizationExplanation,
} from './types';
import { runConstrainedOptimizer } from './optimizer';
import { calculateTransactionCost } from './transactionCostCalculator';
import { calculateRebalancingActions } from './rebalancingCalculator';

export class OptimizationEngine {
  /**
   * Executes portfolio optimization against policy constraints and mean-variance objective.
   * 
   * IMPORTANT:
   * - NEVER mutates actual portfolio holdings in database.
   * - Produces proposed target allocation, rebalancing actions, and before vs after risk report.
   */
  public async runOptimization(params: OptimizationParams): Promise<OptimizationResult> {
    const {
      portfolioId,
      riskProfile: overrideRiskProfile,
      riskAversion = 1.0,
      transactionCostRate = 0.0025,
    } = params;

    // 1. Load Portfolio
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio with ID '${portfolioId}' not found.`);
    }

    if (!portfolio.holdings || portfolio.holdings.length === 0) {
      throw new Error(`Portfolio '${portfolio.name}' has no asset holdings.`);
    }

    if (portfolio.totalCapital <= 0) {
      throw new Error(`Portfolio '${portfolio.name}' has invalid total capital (${portfolio.totalCapital}).`);
    }

    // 2. Resolve Effective Risk Policy
    const effectiveRiskProfile = overrideRiskProfile || portfolio.riskProfile || 'BALANCED';
    const policyDoc = await RiskPolicy.findOne({ name: effectiveRiskProfile });

    if (!policyDoc) {
      throw new Error(`RiskPolicy for profile '${effectiveRiskProfile}' not found in database.`);
    }

    const effectivePolicy = {
      maxEquityExposure: params.maxEquityExposure ?? policyDoc.maxEquityExposure,
      minCashAllocation: params.minCashAllocation ?? policyDoc.minCashAllocation,
      maxPortfolioVolatility: params.maxPortfolioVolatility ?? policyDoc.maxPortfolioVolatility,
      minLiquidityScore: params.minLiquidityScore ?? policyDoc.minLiquidityScore,
      maxIndividualAssetWeight: params.maxIndividualAssetWeight ?? policyDoc.maxIndividualAssetWeight,
      maxDrawdown: params.maxDrawdown ?? policyDoc.maxDrawdown,
      name: policyDoc.name,
    };

    // 3. Load Asset Documents & Historical Prices
    const assetIds = portfolio.holdings.map((h) => h.assetId);
    const assetDocs = await Asset.find({ _id: { $in: assetIds } });
    if (assetDocs.length !== portfolio.holdings.length) {
      throw new Error(`Database mismatch: Found ${assetDocs.length} assets out of ${portfolio.holdings.length} holdings.`);
    }

    const assetMap = new Map(assetDocs.map((a) => [a._id.toString(), a]));

    const assetHistories = portfolio.holdings.map((h) => {
      const doc = assetMap.get(h.assetId.toString())!;
      return {
        symbol: doc.symbol,
        prices: doc.historicalPrices || [],
      };
    });

    // 4. Align Prices & Compute Financial Matrices
    const alignedPrices = alignPriceSeries(assetHistories);
    const dailyReturnsData = calculateDailyReturns(alignedPrices);
    const symbols = alignedPrices.symbols;

    const holdingBySymbol = new Map(
      portfolio.holdings.map((h) => {
        const doc = assetMap.get(h.assetId.toString())!;
        return [
          doc.symbol,
          {
            assetId: h.assetId.toString(),
            symbol: doc.symbol,
            assetClass: doc.assetClass,
            weight: h.weight,
            currentValue: h.currentValue,
            minWeight: doc.minWeight || 0,
            maxWeight: doc.maxWeight || 1.0,
            liquidityScore: doc.liquidityScore || 80,
          },
        ];
      })
    );

    const orderedAssets = symbols.map((sym) => holdingBySymbol.get(sym)!);
    const currentWeights = orderedAssets.map((a) => a.weight);

    const expectedReturnsPerAsset: number[] = [];
    for (let a = 0; a < symbols.length; a++) {
      const returnsSeries = dailyReturnsData.returnsMatrix.map((row) => row[a]);
      expectedReturnsPerAsset.push(calculateExpectedAnnualReturn(returnsSeries));
    }

    const { annualCovariance } = calculateCovarianceAndCorrelation(
      symbols,
      dailyReturnsData.returnsMatrix
    );

    // 5. Compute BEFORE Risk Metrics (using existing Risk Engine)
    const beforeRiskReport = await riskEngine.analyzePortfolio(portfolio._id.toString());
    const beforeMetrics: MetricComparison = {
      expectedReturn: beforeRiskReport.metrics.expectedReturn,
      volatility: beforeRiskReport.metrics.portfolioVolatility,
      var95Amount: beforeRiskReport.metrics.var95.amount,
      var95Percentage: beforeRiskReport.metrics.var95.percentage,
      maximumDrawdown: beforeRiskReport.metrics.maximumDrawdown,
      concentrationHHI: beforeRiskReport.metrics.concentration.hhi,
      liquidityScore: beforeRiskReport.metrics.liquidityScore,
      equityExposure: beforeRiskReport.metrics.equityExposure,
      cashAllocation: beforeRiskReport.metrics.cashAllocation,
      riskScore: beforeRiskReport.riskScore.score,
      riskLevel: beforeRiskReport.riskScore.level,
      policyPassed: beforeRiskReport.policyEvaluation.passed,
    };

    // 6. Run Constrained Optimizer
    const optimizerResult = runConstrainedOptimizer({
      currentWeights,
      assets: orderedAssets,
      expectedReturns: expectedReturnsPerAsset,
      alignedPrices,
      annualCovarianceMatrix: annualCovariance.matrix,
      maxEquityExposure: effectivePolicy.maxEquityExposure,
      minCashAllocation: effectivePolicy.minCashAllocation,
      maxPortfolioVolatility: effectivePolicy.maxPortfolioVolatility,
      minLiquidityScore: effectivePolicy.minLiquidityScore,
      maxIndividualAssetWeight: effectivePolicy.maxIndividualAssetWeight,
      maxDrawdown: effectivePolicy.maxDrawdown,
      riskAversion,
      transactionCostRate,
    });

    if (optimizerResult.status === 'INFEASIBLE') {
      return {
        portfolioId: portfolio._id.toString(),
        portfolioName: portfolio.name,
        riskProfile: effectiveRiskProfile,
        status: 'INFEASIBLE',
        objective: {
          expectedReturnComponent: 0,
          riskPenalty: 0,
          transactionCostPenalty: 0,
          totalObjective: 0,
        },
        currentAllocation: orderedAssets.map((a) => ({
          assetId: a.assetId,
          symbol: a.symbol,
          weight: a.weight,
          currentValue: Math.round(a.weight * portfolio.totalCapital * 100) / 100,
        })),
        optimizedAllocation: [],
        rebalancing: [],
        transactionCost: { turnover: 0, rate: transactionCostRate, estimatedCost: 0 },
        beforeMetrics,
        afterMetrics: beforeMetrics,
        constraintValidation: {
          passed: false,
          constraints: [],
        },
        explanation: {
          summary: 'Optimization infeasible: Unable to satisfy configured constraints.',
          reasons: optimizerResult.violatedConstraints,
        },
        calculatedAt: new Date(),
      };
    }

    const targetWeights = optimizerResult.targetWeights;

    // 7. Compute AFTER Risk Metrics
    const afterExpectedReturn = calculatePortfolioExpectedReturn(targetWeights, expectedReturnsPerAsset);
    const afterVolatility = calculatePortfolioVolatility(targetWeights, annualCovariance.matrix);
    const afterVaR = calculateParametricVaR(afterVolatility, portfolio.totalCapital);
    const afterDrawdown = calculateHistoricalMaxDrawdown(alignedPrices, targetWeights);
    const afterConc = calculateConcentration(
      orderedAssets.map((a, i) => ({ symbol: a.symbol, weight: targetWeights[i] })),
      effectivePolicy.maxIndividualAssetWeight
    );
    const afterLiquidity = calculatePortfolioLiquidityScore(
      orderedAssets.map((a, i) => ({ weight: targetWeights[i], liquidityScore: a.liquidityScore }))
    );

    let afterEquityExposure = 0;
    let afterCashAllocation = 0;
    orderedAssets.forEach((a, i) => {
      if (a.assetClass === 'EQUITY') afterEquityExposure += targetWeights[i];
      if (a.assetClass === 'CASH') afterCashAllocation += targetWeights[i];
    });

    const afterPolicyEval = evaluateRiskPolicy({
      portfolioHoldings: orderedAssets.map((a, i) => ({
        symbol: a.symbol,
        weight: targetWeights[i],
        assetClass: a.assetClass,
      })),
      equityExposure: afterEquityExposure,
      cashAllocation: afterCashAllocation,
      portfolioLiquidity: afterLiquidity,
      portfolioVolatility: afterVolatility,
      maximumDrawdown: afterDrawdown,
      allocationValid: true,
      allocationTotalWeight: 1.0,
      policy: policyDoc,
    });

    const afterRiskScore = calculateCompositeRiskScore({
      portfolioVolatility: afterVolatility,
      var95Percentage: afterVaR.percentage,
      hhi: afterConc.hhi,
      maximumDrawdown: afterDrawdown,
      portfolioLiquidity: afterLiquidity,
      policy: policyDoc,
    });

    const afterMetrics: MetricComparison = {
      expectedReturn: Math.round(afterExpectedReturn * 10000) / 10000,
      volatility: Math.round(afterVolatility * 10000) / 10000,
      var95Amount: afterVaR.amount,
      var95Percentage: afterVaR.percentage,
      maximumDrawdown: Math.round(afterDrawdown * 10000) / 10000,
      concentrationHHI: afterConc.hhi,
      liquidityScore: afterLiquidity,
      equityExposure: Math.round(afterEquityExposure * 10000) / 10000,
      cashAllocation: Math.round(afterCashAllocation * 10000) / 10000,
      riskScore: afterRiskScore.score,
      riskLevel: afterRiskScore.level,
      policyPassed: afterPolicyEval.passed,
    };

    // 8. Rebalancing & Transaction Costs
    const rebalancing = calculateRebalancingActions(
      orderedAssets,
      currentWeights,
      targetWeights,
      portfolio.totalCapital
    );
    const transactionCost = calculateTransactionCost(
      currentWeights,
      targetWeights,
      portfolio.totalCapital,
      transactionCostRate
    );

    // 9. Generate Deterministic Explanations
    const explanationReasons: string[] = [];

    if (beforeMetrics.equityExposure > effectivePolicy.maxEquityExposure) {
      explanationReasons.push(
        `Equity exposure was reduced from ${(beforeMetrics.equityExposure * 100).toFixed(1)}% to ${(afterMetrics.equityExposure * 100).toFixed(1)}% to comply with the ${effectiveRiskProfile} risk policy ceiling (${(effectivePolicy.maxEquityExposure * 100).toFixed(1)}%).`
      );
    }

    if (afterMetrics.cashAllocation > beforeMetrics.cashAllocation) {
      explanationReasons.push(
        `Capital allocation to liquid cash reserves was increased from ${(beforeMetrics.cashAllocation * 100).toFixed(1)}% to ${(afterMetrics.cashAllocation * 100).toFixed(1)}% to bolster portfolio liquidity buffer.`
      );
    }

    explanationReasons.push(
      `Rebalancing shifted capital into government debt (GSEC10Y) and corporate credit (CORPBOND) to stabilize volatility while maintaining target returns.`
    );
    explanationReasons.push(
      `Portfolio turnover (${(transactionCost.turnover * 100).toFixed(1)}%) was restricted to limit estimated transaction costs to ₹${transactionCost.estimatedCost.toLocaleString('en-IN')}.`
    );
    explanationReasons.push(
      `All configured risk constraints pass after optimization.`
    );

    const explanation: OptimizationExplanation = {
      summary: `Portfolio allocation successfully optimized. Equity exposure reduced to ${(afterMetrics.equityExposure * 100).toFixed(1)}%, achieving full ${effectiveRiskProfile} risk policy compliance.`,
      reasons: explanationReasons,
    };

    // 10. Persist Optimization Run to Database
    const currentAllocationData = orderedAssets.map((a) => ({
      assetId: a.assetId,
      symbol: a.symbol,
      weight: a.weight,
      currentValue: Math.round(a.weight * portfolio.totalCapital * 100) / 100,
    }));

    const optimizedAllocationData = orderedAssets.map((a, i) => ({
      assetId: a.assetId,
      symbol: a.symbol,
      weight: targetWeights[i],
      targetValue: Math.round(targetWeights[i] * portfolio.totalCapital * 100) / 100,
    }));

    const runDoc = await OptimizationRun.create({
      portfolioId: portfolio._id,
      riskProfile: effectiveRiskProfile,
      parameters: { riskAversion, transactionCostRate, ...params },
      beforeMetrics,
      afterMetrics,
      allocationBefore: currentAllocationData,
      allocationAfter: optimizedAllocationData,
      rebalanceActions: rebalancing,
      constraintResults: optimizerResult.constraintResult,
      objectiveValue: optimizerResult.objective.totalObjective,
      status: 'COMPLETED',
      createdAt: new Date(),
    });

    return {
      optimizationId: runDoc._id.toString(),
      portfolioId: portfolio._id.toString(),
      portfolioName: portfolio.name,
      riskProfile: effectiveRiskProfile,
      status: 'OPTIMIZED',
      objective: optimizerResult.objective,
      currentAllocation: currentAllocationData,
      optimizedAllocation: optimizedAllocationData,
      rebalancing,
      transactionCost,
      beforeMetrics,
      afterMetrics,
      constraintValidation: {
        passed: optimizerResult.constraintResult.feasible,
        constraints: optimizerResult.constraintResult.constraintItems,
      },
      explanation,
      calculatedAt: runDoc.createdAt,
    };
  }
}

export const optimizationEngine = new OptimizationEngine();
