import assert from 'assert';
import {
  alignPriceSeries,
  calculateDailyReturns,
  calculateExpectedAnnualReturn,
  calculatePortfolioExpectedReturn,
} from '../engines/risk/returnCalculator';
import {
  calculateSampleStandardDeviation,
  calculateAnnualVolatility,
  calculatePortfolioVolatility,
} from '../engines/risk/volatilityCalculator';
import { calculateCovarianceAndCorrelation } from '../engines/risk/covarianceCalculator';
import { calculateParametricVaR } from '../engines/risk/varCalculator';
import { calculateHistoricalMaxDrawdown } from '../engines/risk/drawdownCalculator';
import { calculateConcentration } from '../engines/risk/concentrationCalculator';
import { calculatePortfolioLiquidityScore } from '../engines/risk/liquidityCalculator';
import { evaluateRiskPolicy } from '../engines/risk/policyEvaluator';
import { calculateCompositeRiskScore } from '../engines/risk/riskScoreCalculator';
import { generateRecommendations } from '../engines/risk/recommendationEngine';
import { IRiskPolicy } from '../models/RiskPolicy';

async function runAllRiskEngineTests() {
  console.log('\n==================================================');
  console.log('    CAPITALGUARD RISK ENGINE SUITE (19 TESTS)    ');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  const test = (name: string, fn: () => void) => {
    total++;
    try {
      fn();
      passed++;
      console.log(`✓ Test ${total}: ${name}`);
    } catch (err: any) {
      console.error(`✗ Test ${total} FAILED: ${name}`);
      console.error('  Details:', err.message);
    }
  };

  // Mock Risk Policy
  const mockPolicy: IRiskPolicy = {
    name: 'BALANCED',
    maxIndividualAssetWeight: 0.30,
    maxEquityExposure: 0.60,
    minCashAllocation: 0.05,
    minLiquidityScore: 70,
    maxPortfolioVolatility: 0.15,
    maxDrawdown: 0.20,
    warningThreshold: 0.85,
    enabled: true,
  } as any;

  // 1. Daily return calculation
  test('Daily return calculation formula (Price[t] / Price[t-1] - 1)', () => {
    const alignedPrices = {
      dates: ['2026-01-01', '2026-01-02'],
      symbols: ['ASSET1'],
      priceMatrix: [[100], [105]],
    };
    const res = calculateDailyReturns(alignedPrices);
    assert.strictEqual(res.returnsMatrix.length, 1);
    assert.strictEqual(Math.round(res.returnsMatrix[0][0] * 100) / 100, 0.05);
  });

  // 2. Annualized return calculation
  test('Annualized expected return (meanDaily * 252)', () => {
    const returns = [0.001, 0.001, 0.001, 0.001]; // mean 0.001
    const annRet = calculateExpectedAnnualReturn(returns);
    assert.strictEqual(Math.round(annRet * 1000) / 1000, 0.252);
  });

  // 3. Volatility calculation
  test('Annualized asset volatility calculation', () => {
    const returns = [0.01, -0.01, 0.01, -0.01];
    const stdDev = calculateSampleStandardDeviation(returns);
    const annVol = calculateAnnualVolatility(returns);
    assert.ok(annVol > 0);
    assert.strictEqual(Math.round(annVol * 100) / 100, Math.round(stdDev * Math.sqrt(252) * 100) / 100);
  });

  // 4. Covariance matrix
  test('Covariance matrix symmetric structure and annualization', () => {
    const symbols = ['A', 'B'];
    const returnsMatrix = [
      [0.01, 0.02],
      [-0.01, -0.02],
      [0.02, 0.04],
      [-0.02, -0.04],
    ];
    const { annualCovariance } = calculateCovarianceAndCorrelation(symbols, returnsMatrix);
    assert.strictEqual(annualCovariance.matrix.length, 2);
    assert.strictEqual(annualCovariance.matrix[0][1], annualCovariance.matrix[1][0]);
  });

  // 5. Correlation matrix
  test('Correlation matrix bounds [-1, 1] and identity diagonal', () => {
    const symbols = ['A', 'B'];
    const returnsMatrix = [
      [0.01, 0.02],
      [-0.01, -0.02],
    ];
    const { correlation } = calculateCovarianceAndCorrelation(symbols, returnsMatrix);
    assert.strictEqual(correlation.matrix[0][0], 1);
    assert.strictEqual(correlation.matrix[1][1], 1);
    assert.ok(correlation.matrix[0][1] >= -1 && correlation.matrix[0][1] <= 1);
  });

  // 6. Portfolio volatility
  test('Portfolio volatility quadratic form calculation', () => {
    const weights = [0.5, 0.5];
    const covMatrix = [
      [0.04, 0.01],
      [0.01, 0.04],
    ];
    const portVol = calculatePortfolioVolatility(weights, covMatrix);
    // var = 0.25*0.04 + 0.25*0.01 + 0.25*0.01 + 0.25*0.04 = 0.025 => vol = sqrt(0.025) ~ 0.1581
    assert.strictEqual(Math.round(portVol * 1000) / 1000, 0.158);
  });

  // 7. Parametric VaR
  test('Parametric 1-Day 95% Value at Risk (z=1.645)', () => {
    const annualVol = 0.15811388; // daily vol = 0.15811388 / sqrt(252) ~ 0.009956
    const totalCapital = 10000000;
    const varRes = calculateParametricVaR(annualVol, totalCapital);
    assert.strictEqual(varRes.confidenceLevel, 0.95);
    assert.strictEqual(varRes.horizonDays, 1);
    assert.ok(varRes.amount > 0);
    assert.strictEqual(varRes.label, 'Parametric 1-day 95% VaR');
  });

  // 8. Maximum Drawdown
  test('Historical Maximum Drawdown calculation', () => {
    const alignedPrices = {
      dates: ['d1', 'd2', 'd3', 'd4'],
      symbols: ['A'],
      priceMatrix: [[100], [120], [96], [110]], // Peak 120, low 96 => drawdown = (96-120)/120 = -0.20 => 20%
    };
    const weights = [1.0];
    const maxDD = calculateHistoricalMaxDrawdown(alignedPrices, weights);
    assert.strictEqual(Math.round(maxDD * 100) / 100, 0.20);
  });

  // 9. HHI Concentration
  test('Herfindahl-Hirschman Index (HHI) concentration classification', () => {
    const holdings = [
      { symbol: 'A', weight: 0.60 },
      { symbol: 'B', weight: 0.40 },
    ];
    // HHI = 0.6^2 + 0.4^2 = 0.36 + 0.16 = 0.52 (HIGH)
    const conc = calculateConcentration(holdings, 0.30);
    assert.strictEqual(conc.hhi, 0.52);
    assert.strictEqual(conc.concentrationLevel, 'HIGH');
    assert.strictEqual(conc.exceededMaxAssetWeight, true);
  });

  // 10. Liquidity score
  test('Weighted average portfolio liquidity score', () => {
    const holdings = [
      { weight: 0.6, liquidityScore: 90 },
      { weight: 0.4, liquidityScore: 70 },
    ];
    // 0.6*90 + 0.4*70 = 54 + 28 = 82
    const liq = calculatePortfolioLiquidityScore(holdings);
    assert.strictEqual(liq, 82);
  });

  // 11. Equity exposure breach detection
  test('Equity exposure breach detection (68% vs 60% limit)', () => {
    const evalRes = evaluateRiskPolicy({
      portfolioHoldings: [{ symbol: 'EQ', weight: 0.68, assetClass: 'EQUITY' }],
      equityExposure: 0.68,
      cashAllocation: 0.05,
      portfolioLiquidity: 85,
      portfolioVolatility: 0.12,
      maximumDrawdown: 0.10,
      allocationValid: true,
      allocationTotalWeight: 1.0,
      policy: mockPolicy,
    });
    assert.strictEqual(evalRes.passed, false);
    const eqBreach = evalRes.breaches.find((b) => b.type === 'EQUITY_EXPOSURE');
    assert.ok(eqBreach);
    assert.strictEqual(eqBreach?.currentValue, 0.68);
    assert.strictEqual(eqBreach?.limit, 0.60);
  });

  // 12. Cash allocation breach detection
  test('Minimum cash allocation breach detection (3% vs 5% min)', () => {
    const evalRes = evaluateRiskPolicy({
      portfolioHoldings: [],
      equityExposure: 0.40,
      cashAllocation: 0.03, // below 0.05
      portfolioLiquidity: 85,
      portfolioVolatility: 0.10,
      maximumDrawdown: 0.10,
      allocationValid: true,
      allocationTotalWeight: 1.0,
      policy: mockPolicy,
    });
    const cashBreach = evalRes.breaches.find((b) => b.type === 'MIN_CASH');
    assert.ok(cashBreach);
  });

  // 13. Individual asset limit breach
  test('Individual asset weight limit breach detection (35% vs 30% limit)', () => {
    const evalRes = evaluateRiskPolicy({
      portfolioHoldings: [{ symbol: 'BIG_ASSET', weight: 0.35, assetClass: 'EQUITY' }],
      equityExposure: 0.35,
      cashAllocation: 0.10,
      portfolioLiquidity: 85,
      portfolioVolatility: 0.10,
      maximumDrawdown: 0.10,
      allocationValid: true,
      allocationTotalWeight: 1.0,
      policy: mockPolicy,
    });
    const assetBreach = evalRes.breaches.find((b) => b.type === 'INDIVIDUAL_ASSET_WEIGHT');
    assert.ok(assetBreach);
    assert.strictEqual(assetBreach?.assetSymbol, 'BIG_ASSET');
  });

  // 14. Composite Risk Score
  test('Composite Risk Score calculation and breakdown structure', () => {
    const scoreRes = calculateCompositeRiskScore({
      portfolioVolatility: 0.18, // exceeds 0.15 limit
      var95Percentage: 0.02,
      hhi: 0.30,
      maximumDrawdown: 0.15,
      portfolioLiquidity: 75,
      policy: mockPolicy,
    });
    assert.ok(scoreRes.score >= 0 && scoreRes.score <= 100);
    assert.ok(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(scoreRes.level));
    assert.ok(scoreRes.breakdown.volatility);
    assert.ok(scoreRes.breakdown.var);
  });

  // 15. Policy breach detection
  test('Policy breach evaluator aggregated output', () => {
    const evalRes = evaluateRiskPolicy({
      portfolioHoldings: [],
      equityExposure: 0.70, // breach
      cashAllocation: 0.02, // breach
      portfolioLiquidity: 60, // breach (min 70)
      portfolioVolatility: 0.22, // breach (max 0.15)
      maximumDrawdown: 0.25, // breach (max 0.20)
      allocationValid: true,
      allocationTotalWeight: 1.0,
      policy: mockPolicy,
    });
    assert.strictEqual(evalRes.passed, false);
    assert.ok(evalRes.totalBreaches >= 5);
  });

  // 16. Recommendation generation
  test('Explainable recommendation generation matching actual breaches', () => {
    const breaches = [
      {
        type: 'EQUITY_EXPOSURE' as const,
        severity: 'CRITICAL' as const,
        currentValue: 0.68,
        limit: 0.60,
        excess: 0.08,
        message: 'Equity breach',
      },
    ];
    const recs = generateRecommendations(breaches);
    assert.strictEqual(recs.length, 1);
    assert.ok(recs[0].includes('Reduce equity exposure'));
  });

  // 17. Invalid allocation error handling
  test('Invalid allocation detection (total != 100%)', () => {
    const evalRes = evaluateRiskPolicy({
      portfolioHoldings: [],
      equityExposure: 0.50,
      cashAllocation: 0.10,
      portfolioLiquidity: 85,
      portfolioVolatility: 0.10,
      maximumDrawdown: 0.10,
      allocationValid: false,
      allocationTotalWeight: 1.08,
      policy: mockPolicy,
    });
    const allocBreach = evalRes.breaches.find((b) => b.type === 'ALLOCATION_INCONSISTENCY');
    assert.ok(allocBreach);
  });

  // 18. Missing asset error handling
  test('Alignment error on empty asset histories', () => {
    assert.throws(() => {
      alignPriceSeries([]);
    }, /Insufficient data/);
  });

  // 19. Insufficient history error handling
  test('Insufficient historical price observations (<30) rejection', () => {
    const shortHistory = [
      {
        symbol: 'SHORT',
        prices: Array.from({ length: 15 }, (_, i) => ({ date: `2026-01-${i + 1}`, close: 100 + i })),
      },
    ];
    assert.throws(() => {
      alignPriceSeries(shortHistory);
    }, /minimum 30 required/);
  });

  console.log(`\n==================================================`);
  console.log(`    RISK ENGINE SUITE RESULT: ${passed}/${total} PASSED   `);
  console.log(`==================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runAllRiskEngineTests();
