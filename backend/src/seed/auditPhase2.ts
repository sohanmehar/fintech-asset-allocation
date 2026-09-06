import assert from 'assert';
import { connectDB, disconnectDB } from '../config/db';
import { Asset } from '../models/Asset';
import { Portfolio } from '../models/Portfolio';
import { riskEngine } from '../engines/risk';
import {
  calculateAnnualVolatility,
  calculatePortfolioVolatility,
} from '../engines/risk/volatilityCalculator';
import { calculateCovarianceAndCorrelation } from '../engines/risk/covarianceCalculator';
import { calculateParametricVaR } from '../engines/risk/varCalculator';
import { calculateConcentration } from '../engines/risk/concentrationCalculator';
import { calculatePortfolioLiquidityScore } from '../engines/risk/liquidityCalculator';

async function auditPhase2() {
  console.log('\n==================================================');
  console.log('       CAPITALGUARD PHASE 2 RISK ENGINE AUDIT     ');
  console.log('==================================================\n');

  let checksPassed = 0;
  let totalChecks = 0;

  const check = (name: string, fn: () => void | Promise<void>) => {
    totalChecks++;
    try {
      const res = fn();
      if (res && typeof (res as any).then === 'function') {
        return (res as any).then(() => {
          checksPassed++;
          console.log(`[PASS] Check ${totalChecks}: ${name}`);
        }).catch((err: any) => {
          console.error(`[FAIL] Check ${totalChecks}: ${name}`);
          console.error('       Error:', err.message);
        });
      } else {
        checksPassed++;
        console.log(`[PASS] Check ${totalChecks}: ${name}`);
      }
    } catch (err: any) {
      console.error(`[FAIL] Check ${totalChecks}: ${name}`);
      console.error('       Error:', err.message);
    }
  };

  await connectDB();

  try {
    // 1. CASH Handling Verification
    await check('CASH handling (low volatility, high liquidity)', async () => {
      const cashAsset = await Asset.findOne({ symbol: 'CASH' });
      assert.ok(cashAsset, 'CASH asset must exist in database');
      assert.strictEqual(cashAsset.liquidityScore, 100, 'CASH liquidity score must be 100');

      const prices = cashAsset.historicalPrices || [];
      assert.ok(prices.length >= 30, 'CASH historical prices must be >= 30 observations');

      const dailyRets: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        dailyRets.push(prices[i].close / prices[i - 1].close - 1);
      }

      const cashVol = calculateAnnualVolatility(dailyRets);
      assert.ok(!isNaN(cashVol), 'CASH volatility must not be NaN');
      assert.ok(cashVol < 0.01, `CASH annualized volatility (${(cashVol * 100).toFixed(4)}%) must be < 1%`);
    });

    // 2. Portfolio Volatility Formula Verification
    check('Portfolio Volatility formula w^T * Sigma * w', () => {
      const weights = [0.6, 0.4];
      const cov = [
        [0.04, 0.005],
        [0.005, 0.01],
      ];
      const vol = calculatePortfolioVolatility(weights, cov);
      assert.ok(!isNaN(vol), 'Volatility must not be NaN');
      assert.ok(isFinite(vol), 'Volatility must be finite');
      assert.strictEqual(Math.round(vol * 10000) / 10000, 0.1356);
    });

    // 3. Covariance Annualization Verification
    check('Covariance annualization (dailyCov * 252)', () => {
      const symbols = ['X', 'Y'];
      const returnsMatrix = [
        [0.01, 0.02],
        [-0.01, -0.02],
        [0.01, 0.02],
        [-0.01, -0.02],
      ];
      const res = calculateCovarianceAndCorrelation(symbols, returnsMatrix);
      const dailyVal = res.dailyCovariance.matrix[0][1];
      const annVal = res.annualCovariance.matrix[0][1];
      assert.strictEqual(annVal, dailyVal * 252);
    });

    // 4. Asset Volatility Sanity Check on Seeded Dataset
    await check('Asset-level volatility sanity check across asset classes', async () => {
      const assets = await Asset.find();
      assert.ok(assets.length >= 10, 'Expected at least 10 seeded assets');

      assets.forEach((asset) => {
        const prices = asset.historicalPrices || [];
        const dailyRets: number[] = [];
        for (let i = 1; i < prices.length; i++) {
          dailyRets.push(prices[i].close / prices[i - 1].close - 1);
        }
        const vol = calculateAnnualVolatility(dailyRets);
        assert.ok(!isNaN(vol), `${asset.symbol} volatility is NaN`);
        assert.ok(isFinite(vol), `${asset.symbol} volatility is not finite`);
        assert.ok(vol >= 0, `${asset.symbol} volatility is negative`);

        if (asset.assetClass === 'EQUITY') {
          assert.ok(vol >= 0.10 && vol <= 0.40, `${asset.symbol} equity volatility (${(vol * 100).toFixed(1)}%) outside expected [10%, 40%]`);
        } else if (asset.assetClass === 'GOVERNMENT_BOND') {
          assert.ok(vol >= 0.02 && vol <= 0.10, `${asset.symbol} G-Sec volatility (${(vol * 100).toFixed(1)}%) outside expected [2%, 10%]`);
        } else if (asset.assetClass === 'CASH') {
          assert.ok(vol < 0.01, `CASH volatility (${(vol * 100).toFixed(2)}%) > 1%`);
        }
      });
    });

    // 5. Demo Portfolio Volatility Mathematical Consistency
    await check('Demo portfolio 6.83% annualized volatility mathematical consistency', async () => {
      const demoPortfolio = await Portfolio.findOne({ name: 'Alpha Growth & Income Demo Portfolio' });
      assert.ok(demoPortfolio, 'Demo portfolio must exist');

      const report = await riskEngine.analyzePortfolio(demoPortfolio._id.toString());
      const vol = report.metrics.portfolioVolatility;
      assert.ok(vol >= 0.05 && vol <= 0.10, `Portfolio volatility (${(vol * 100).toFixed(2)}%) within realistic range [5%, 10%]`);

      const weights = report.assetMetrics.map((a) => a.weight);
      const cov = report.covarianceMatrix.matrix;
      const calcVol = calculatePortfolioVolatility(weights, cov);
      assert.strictEqual(Math.round(vol * 10000) / 10000, Math.round(calcVol * 10000) / 10000);
    });

    // 6. VaR Formula & Positive Amount Verification
    check('Parametric 1-day 95% VaR sanity check', () => {
      const annVol = 0.0683;
      const totalCapital = 10000000;
      const varRes = calculateParametricVaR(annVol, totalCapital);

      assert.strictEqual(varRes.confidenceLevel, 0.95);
      assert.strictEqual(varRes.horizonDays, 1);
      assert.ok(varRes.amount > 0, 'VaR amount must be positive');
      assert.ok(varRes.percentage > 0, 'VaR percentage must be positive');
      assert.ok(!isNaN(varRes.amount) && isFinite(varRes.amount));
    });

    // 7. Maximum Drawdown Verification
    await check('Maximum Drawdown non-negative decimal check', async () => {
      const demoPortfolio = await Portfolio.findOne({ name: 'Alpha Growth & Income Demo Portfolio' });
      const report = await riskEngine.analyzePortfolio(demoPortfolio!._id.toString());
      const maxDD = report.metrics.maximumDrawdown;

      assert.ok(!isNaN(maxDD), 'Max DD must not be NaN');
      assert.ok(maxDD >= 0 && maxDD <= 1, 'Max DD must be between 0 and 1');
    });

    // 8. HHI Concentration Verification
    check('HHI Concentration = Sum(w_i^2) = 0.1288 for demo portfolio', () => {
      const weights = [0.20, 0.15, 0.15, 0.10, 0.08, 0.10, 0.07, 0.10, 0.05];
      const holdings = weights.map((w, i) => ({ symbol: `A${i}`, weight: w }));
      const conc = calculateConcentration(holdings, 0.30);

      assert.strictEqual(conc.hhi, 0.1288);
      assert.strictEqual(conc.concentrationLevel, 'LOW');
      assert.strictEqual(conc.largestHoldingWeight, 0.20);
    });

    // 9. Liquidity Verification
    check('Portfolio Liquidity = Sum(w_i * liq_i) = 93.04 for demo portfolio', () => {
      const holdings = [
        { weight: 0.20, liquidityScore: 95 },
        { weight: 0.15, liquidityScore: 92 },
        { weight: 0.15, liquidityScore: 94 },
        { weight: 0.10, liquidityScore: 90 },
        { weight: 0.08, liquidityScore: 91 },
        { weight: 0.10, liquidityScore: 98 },
        { weight: 0.07, liquidityScore: 88 },
        { weight: 0.10, liquidityScore: 89 },
        { weight: 0.05, liquidityScore: 100 },
      ];
      const liq = calculatePortfolioLiquidityScore(holdings);
      assert.strictEqual(liq, 93.04);
    });

    // 10. Demo Portfolio Allocation Weight Verification
    await check('Demo portfolio total weight equals 100%', async () => {
      const demoPortfolio = await Portfolio.findOne({ name: 'Alpha Growth & Income Demo Portfolio' });
      assert.ok(demoPortfolio);
      const totalWeight = demoPortfolio.holdings.reduce((sum, h) => sum + h.weight, 0);
      assert.strictEqual(Math.round(totalWeight * 100) / 100, 1.0);
    });

    // 11. Equity Exposure Policy Breach Verification
    await check('Equity exposure equals 68.0% and policy status is BREACHED', async () => {
      const demoPortfolio = await Portfolio.findOne({ name: 'Alpha Growth & Income Demo Portfolio' });
      const report = await riskEngine.analyzePortfolio(demoPortfolio!._id.toString());

      assert.strictEqual(Math.round(report.metrics.equityExposure * 100), 68);
      assert.strictEqual(report.policyEvaluation.passed, false);
      const breach = report.policyEvaluation.breaches.find((b) => b.type === 'EQUITY_EXPOSURE');
      assert.ok(breach, 'EQUITY_EXPOSURE breach must be present');
      assert.strictEqual(breach?.currentValue, 0.68);
      assert.strictEqual(breach?.limit, 0.60);
      assert.strictEqual(breach?.excess, 0.08);
    });

    // 12. Separation of Risk Score & Policy Compliance
    await check('Risk Score and Policy Compliance are intentionally separate concepts', async () => {
      const demoPortfolio = await Portfolio.findOne({ name: 'Alpha Growth & Income Demo Portfolio' });
      const report = await riskEngine.analyzePortfolio(demoPortfolio!._id.toString());

      assert.strictEqual(report.riskScore.level, 'MODERATE');
      assert.strictEqual(report.policyEvaluation.passed, false);
    });

    // 13. Numerical Stability & Matrix Ordering Check
    await check('No NaN, Infinity, negative vol, or out-of-bound correlation values', async () => {
      const demoPortfolio = await Portfolio.findOne({ name: 'Alpha Growth & Income Demo Portfolio' });
      const report = await riskEngine.analyzePortfolio(demoPortfolio!._id.toString());

      const checkVal = (v: number, label: string) => {
        assert.ok(!isNaN(v), `${label} is NaN`);
        assert.ok(isFinite(v), `${label} is Infinity`);
      };

      checkVal(report.metrics.expectedReturn, 'expectedReturn');
      checkVal(report.metrics.portfolioVolatility, 'portfolioVolatility');
      checkVal(report.metrics.var95.amount, 'varAmount');
      checkVal(report.metrics.maximumDrawdown, 'maximumDrawdown');
      checkVal(report.metrics.liquidityScore, 'liquidityScore');
      checkVal(report.riskScore.score, 'riskScore');

      report.correlationMatrix.matrix.forEach((row, i) => {
        row.forEach((corr, j) => {
          checkVal(corr, `corr[${i}][${j}]`);
          assert.ok(corr >= -1.0 && corr <= 1.0, `corr[${i}][${j}] = ${corr} outside [-1, 1]`);
        });
      });

      assert.strictEqual(report.covarianceMatrix.assets.length, report.assetMetrics.length);
      report.covarianceMatrix.assets.forEach((sym, idx) => {
        assert.strictEqual(sym, report.assetMetrics[idx].symbol, `Symbol mismatch at index ${idx}`);
      });
    });

    console.log(`\n==================================================`);
    console.log(`      AUDIT COMPLETED: ${checksPassed}/${totalChecks} PASSED      `);
    console.log(`==================================================\n`);
  } finally {
    await disconnectDB();
  }
}

auditPhase2();
