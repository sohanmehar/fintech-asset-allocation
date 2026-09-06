import { Portfolio } from '../../models/Portfolio';
import { Asset } from '../../models/Asset';
import { RiskPolicy } from '../../models/RiskPolicy';
import { Alert } from '../../models/Alert';
import { validatePortfolioAllocation } from '../../utils/validation';
import {
  RiskReport,
  RiskSummaryReport,
  AssetRiskMetrics,
} from './types';
import {
  alignPriceSeries,
  calculateDailyReturns,
  calculateExpectedAnnualReturn,
  calculatePortfolioExpectedReturn,
} from './returnCalculator';
import {
  calculateAnnualVolatility,
  calculatePortfolioVolatility,
} from './volatilityCalculator';
import { calculateCovarianceAndCorrelation } from './covarianceCalculator';
import { calculateParametricVaR } from './varCalculator';
import { calculateHistoricalMaxDrawdown } from './drawdownCalculator';
import { calculateConcentration } from './concentrationCalculator';
import { calculatePortfolioLiquidityScore } from './liquidityCalculator';
import { evaluateRiskPolicy } from './policyEvaluator';
import { calculateCompositeRiskScore } from './riskScoreCalculator';
import { generateRecommendations } from './recommendationEngine';

export class RiskEngine {
  /**
   * Evaluates portfolio risk using historical price data and configured risk policy.
   * 
   * IMPORTANT: The Risk Engine does NOT mutate the portfolio. It only analyzes and reports.
   */
  public async analyzePortfolio(portfolioId: string): Promise<RiskReport> {
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

    // 2. Validate Portfolio Allocation
    const allocationValidation = validatePortfolioAllocation(portfolio.holdings);

    // 3. Load Asset Documents
    const assetIds = portfolio.holdings.map((h) => h.assetId);
    const assetDocs = await Asset.find({ _id: { $in: assetIds } });

    if (assetDocs.length !== portfolio.holdings.length) {
      throw new Error(
        `Database mismatch: Found ${assetDocs.length} assets out of ${portfolio.holdings.length} portfolio holdings.`
      );
    }

    const assetMap = new Map(assetDocs.map((a) => [a._id.toString(), a]));

    // Build asset price histories array for alignment
    const assetHistories = portfolio.holdings.map((h) => {
      const doc = assetMap.get(h.assetId.toString());
      if (!doc) {
        throw new Error(`Asset ID '${h.assetId}' missing from database.`);
      }
      return {
        symbol: doc.symbol,
        prices: doc.historicalPrices || [],
      };
    });

    // 4. Align Asset Historical Price Series
    const alignedPrices = alignPriceSeries(assetHistories);
    const dailyReturnsData = calculateDailyReturns(alignedPrices);

    // Order of symbols from alignment
    const symbols = alignedPrices.symbols;

    // Map holdings to aligned symbol order
    const holdingBySymbol = new Map(
      portfolio.holdings.map((h) => {
        const doc = assetMap.get(h.assetId.toString())!;
        return [
          doc.symbol,
          {
            assetId: h.assetId,
            symbol: h.symbol,
            quantity: h.quantity,
            currentValue: h.currentValue,
            weight: h.weight,
            assetDoc: doc,
          },
        ];
      })
    );

    const orderedHoldings = symbols.map((sym) => holdingBySymbol.get(sym)!);
    const weights = orderedHoldings.map((h) => h.weight);

    // 5. Calculate Asset-Level Metrics
    const expectedReturnsPerAsset: number[] = [];
    const volatilityPerAsset: number[] = [];
    const assetMetrics: AssetRiskMetrics[] = [];

    let equityExposure = 0;
    let cashAllocation = 0;

    for (let a = 0; a < symbols.length; a++) {
      const sym = symbols[a];
      const holding = orderedHoldings[a];
      const doc = holding.assetDoc;
      const returnsSeries = dailyReturnsData.returnsMatrix.map((row) => row[a]);

      const expRet = calculateExpectedAnnualReturn(returnsSeries);
      const annVol = calculateAnnualVolatility(returnsSeries);

      expectedReturnsPerAsset.push(expRet);
      volatilityPerAsset.push(annVol);

      assetMetrics.push({
        assetId: doc._id.toString(),
        symbol: doc.symbol,
        name: doc.name,
        assetClass: doc.assetClass,
        weight: holding.weight,
        expectedReturn: Math.round(expRet * 10000) / 10000,
        volatility: Math.round(annVol * 10000) / 10000,
        liquidityScore: doc.liquidityScore || 80,
      });

      if (doc.assetClass === 'EQUITY') {
        equityExposure += holding.weight;
      } else if (doc.assetClass === 'CASH') {
        cashAllocation += holding.weight;
      }
    }

    equityExposure = Math.round(equityExposure * 10000) / 10000;
    cashAllocation = Math.round(cashAllocation * 10000) / 10000;

    // 6. Covariance and Correlation Matrices
    const { annualCovariance, correlation } = calculateCovarianceAndCorrelation(
      symbols,
      dailyReturnsData.returnsMatrix
    );

    // 7. Portfolio-Level Statistics
    const expectedReturn = calculatePortfolioExpectedReturn(weights, expectedReturnsPerAsset);
    const portfolioVolatility = calculatePortfolioVolatility(weights, annualCovariance.matrix);
    const var95 = calculateParametricVaR(portfolioVolatility, portfolio.totalCapital);
    const maximumDrawdown = calculateHistoricalMaxDrawdown(alignedPrices, weights);

    // 8. Load Risk Policy
    const riskProfileName = portfolio.riskProfile || 'BALANCED';
    const policyDoc = await RiskPolicy.findOne({ name: riskProfileName });

    if (!policyDoc) {
      throw new Error(`RiskPolicy for profile '${riskProfileName}' not found in database.`);
    }

    // 9. Concentrations & Liquidity
    const concentration = calculateConcentration(
      orderedHoldings.map((h) => ({ symbol: h.assetDoc.symbol, weight: h.weight })),
      policyDoc.maxIndividualAssetWeight
    );

    const liquidityScore = calculatePortfolioLiquidityScore(
      orderedHoldings.map((h) => ({ weight: h.weight, liquidityScore: h.assetDoc.liquidityScore || 80 }))
    );

    // 10. Evaluate Policy Rules
    const policyEvaluation = evaluateRiskPolicy({
      portfolioHoldings: orderedHoldings.map((h) => ({
        symbol: h.assetDoc.symbol,
        weight: h.weight,
        assetClass: h.assetDoc.assetClass,
      })),
      equityExposure,
      cashAllocation,
      portfolioLiquidity: liquidityScore,
      portfolioVolatility,
      maximumDrawdown,
      allocationValid: allocationValidation.valid,
      allocationTotalWeight: allocationValidation.totalWeight,
      policy: policyDoc,
    });

    // 11. Composite Risk Score
    const riskScore = calculateCompositeRiskScore({
      portfolioVolatility,
      var95Percentage: var95.percentage,
      hhi: concentration.hhi,
      maximumDrawdown,
      portfolioLiquidity: liquidityScore,
      policy: policyDoc,
    });

    // 12. Recommendations
    const recommendations = generateRecommendations(policyEvaluation.breaches);

    // 13. System Alerts Generation (avoid duplicate open alerts for exact portfolio + breach type)
    const generatedAlerts: any[] = [];
    if (!policyEvaluation.passed) {
      for (const breach of policyEvaluation.breaches) {
        const existingOpenAlert = await Alert.findOne({
          portfolioId: portfolio._id,
          type: breach.type,
          status: 'OPEN',
        });

        if (!existingOpenAlert) {
          const alertDoc = await Alert.create({
            portfolioId: portfolio._id,
            severity: breach.severity,
            type: breach.type,
            message: breach.message,
            metric: breach.type,
            currentValue: breach.currentValue,
            threshold: breach.limit,
            status: 'OPEN',
          });
          generatedAlerts.push(alertDoc);
        } else {
          generatedAlerts.push(existingOpenAlert);
        }
      }
    }

    // 14. Construct Structured RiskReport
    return {
      portfolioId: portfolio._id.toString(),
      portfolioName: portfolio.name,
      totalCapital: portfolio.totalCapital,
      riskProfile: portfolio.riskProfile,

      metrics: {
        expectedReturn: Math.round(expectedReturn * 10000) / 10000,
        portfolioVolatility: Math.round(portfolioVolatility * 10000) / 10000,
        var95,
        maximumDrawdown: Math.round(maximumDrawdown * 10000) / 10000,
        concentration,
        liquidityScore,
        equityExposure,
        cashAllocation,
      },

      riskScore,
      assetMetrics,
      covarianceMatrix: annualCovariance,
      correlationMatrix: correlation,
      policyEvaluation,
      alerts: generatedAlerts,
      recommendations,
      calculatedAt: new Date(),
    };
  }

  /**
   * Generates a lightweight dashboard summary report for a portfolio.
   */
  public async getSummaryReport(portfolioId: string): Promise<RiskSummaryReport> {
    const fullReport = await this.analyzePortfolio(portfolioId);
    const criticalAlertsCount = fullReport.alerts.filter((a) => a.severity === 'CRITICAL').length;

    return {
      portfolioId: fullReport.portfolioId,
      portfolioName: fullReport.portfolioName,
      riskProfile: fullReport.riskProfile,
      riskScore: fullReport.riskScore.score,
      riskLevel: fullReport.riskScore.level,
      expectedReturn: fullReport.metrics.expectedReturn,
      portfolioVolatility: fullReport.metrics.portfolioVolatility,
      var95Amount: fullReport.metrics.var95.amount,
      var95Percentage: fullReport.metrics.var95.percentage,
      maximumDrawdown: fullReport.metrics.maximumDrawdown,
      liquidityScore: fullReport.metrics.liquidityScore,
      equityExposure: fullReport.metrics.equityExposure,
      cashAllocation: fullReport.metrics.cashAllocation,
      totalBreaches: fullReport.policyEvaluation.totalBreaches,
      criticalAlertsCount,
      calculatedAt: fullReport.calculatedAt,
    };
  }
}

export const riskEngine = new RiskEngine();
