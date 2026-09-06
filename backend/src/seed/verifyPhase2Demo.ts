import { connectDB, disconnectDB } from '../config/db';
import { Portfolio } from '../models/Portfolio';
import { riskEngine } from '../engines/risk';
import app from '../app';
import { Server } from 'http';

async function verifyPhase2Demo() {
  console.log('\n==================================================');
  console.log('      PHASE 2 DEMO PORTFOLIO RISK VERIFICATION     ');
  console.log('==================================================\n');

  try {
    await connectDB();

    // 1. Find Demo Portfolio
    const demoPortfolio = await Portfolio.findOne({ name: 'Alpha Growth & Income Demo Portfolio' });
    if (!demoPortfolio) {
      throw new Error("Demo portfolio 'Alpha Growth & Income Demo Portfolio' not found. Run 'npm run seed' first.");
    }

    console.log(`[Verify] Loaded Demo Portfolio ID: ${demoPortfolio._id}`);
    console.log(`[Verify] Portfolio Name: ${demoPortfolio.name}`);
    console.log(`[Verify] Risk Profile: ${demoPortfolio.riskProfile}`);
    console.log(`[Verify] Total Capital: ₹${demoPortfolio.totalCapital.toLocaleString('en-IN')}`);

    // Store initial raw holdings JSON string for immutability check
    const initialHoldingsSnapshot = JSON.stringify(demoPortfolio.holdings);

    // 2. Execute RiskEngine.analyzePortfolio
    console.log('\n[Verify] Executing RiskEngine.analyzePortfolio()...');
    const report = await riskEngine.analyzePortfolio(demoPortfolio._id.toString());

    console.log('\n--------------------------------------------------');
    console.log('              RISK ENGINE REPORT SUMMARY          ');
    console.log('--------------------------------------------------');
    console.log(`Expected Annual Return  : ${(report.metrics.expectedReturn * 100).toFixed(2)}%`);
    console.log(`Annualized Volatility   : ${(report.metrics.portfolioVolatility * 100).toFixed(2)}%`);
    console.log(`Parametric 1-day 95% VaR: ₹${report.metrics.var95.amount.toLocaleString('en-IN')} (${(report.metrics.var95.percentage * 100).toFixed(2)}%)`);
    console.log(`Historical Max Drawdown : ${(report.metrics.maximumDrawdown * 100).toFixed(2)}%`);
    console.log(`Portfolio Liquidity     : ${report.metrics.liquidityScore}/100`);
    console.log(`Concentration HHI       : ${report.metrics.concentration.hhi} (${report.metrics.concentration.concentrationLevel})`);
    console.log(`Equity Exposure         : ${(report.metrics.equityExposure * 100).toFixed(1)}%`);
    console.log(`Cash Allocation         : ${(report.metrics.cashAllocation * 100).toFixed(1)}%`);
    console.log('--------------------------------------------------');
    console.log(`Composite Risk Score    : ${report.riskScore.score}/100 (${report.riskScore.level})`);
    console.log('Risk Score Breakdown    :', JSON.stringify(report.riskScore.breakdown, null, 2));
    console.log('--------------------------------------------------');
    console.log(`Policy Evaluation Passed: ${report.policyEvaluation.passed}`);
    console.log(`Total Policy Breaches   : ${report.policyEvaluation.totalBreaches}`);
    console.log('Detected Breaches       :');
    report.policyEvaluation.breaches.forEach((b, idx) => {
      console.log(`  [Breach ${idx + 1}] ${b.type} (${b.severity}): ${b.message}`);
    });
    console.log('--------------------------------------------------');
    console.log('Generated Recommendations:');
    report.recommendations.forEach((rec, idx) => {
      console.log(`  [Rec ${idx + 1}] ${rec}`);
    });
    console.log('--------------------------------------------------\n');

    // 3. Verify Expectations
    console.log('[Verify] Asserting Phase 2 Requirements:');

    // Requirement: Equity exposure = 68%
    if (Math.round(report.metrics.equityExposure * 100) !== 68) {
      throw new Error(`Assertion failed: Expected Equity Exposure 68%, got ${report.metrics.equityExposure * 100}%`);
    }
    console.log('  ✓ Equity exposure equals 68.0%');

    // Requirement: Equity breach detected
    const eqBreach = report.policyEvaluation.breaches.find((b) => b.type === 'EQUITY_EXPOSURE');
    if (!eqBreach) {
      throw new Error('Assertion failed: EQUITY_EXPOSURE breach was not detected!');
    }
    console.log('  ✓ EQUITY_EXPOSURE breach detected successfully against BALANCED 60% limit');

    // Requirement: Portfolio in database is unchanged
    const reloadedPortfolio = await Portfolio.findById(demoPortfolio._id);
    const finalHoldingsSnapshot = JSON.stringify(reloadedPortfolio?.holdings);
    if (initialHoldingsSnapshot !== finalHoldingsSnapshot) {
      throw new Error('Assertion failed: RiskEngine mutated the portfolio holdings in database!');
    }
    console.log('  ✓ Portfolio remained 100% unchanged in database');

    // 4. Test API HTTP Endpoints
    console.log('\n[Verify] Starting HTTP Server to test API endpoints...');
    const server: Server = app.listen(5098, async () => {
      try {
        const resReport = await fetch(`http://localhost:5098/api/risk/portfolio/${demoPortfolio._id}`);
        const jsonReport = (await resReport.json()) as any;
        console.log(`  ✓ GET /api/risk/portfolio/${demoPortfolio._id} -> Status: ${resReport.status}, Success: ${jsonReport.success}`);

        const resSummary = await fetch(`http://localhost:5098/api/risk/portfolio/${demoPortfolio._id}/summary`);
        const jsonSummary = (await resSummary.json()) as any;
        console.log(`  ✓ GET /api/risk/portfolio/${demoPortfolio._id}/summary -> Status: ${resSummary.status}, Score: ${jsonSummary.data?.riskScore}, Level: ${jsonSummary.data?.riskLevel}`);

        console.log('\n==================================================');
        console.log('     PHASE 2 DEMO VERIFICATION PASSED 100%!       ');
        console.log('==================================================\n');
      } finally {
        server.close(async () => {
          await disconnectDB();
        });
      }
    });
  } catch (err: any) {
    console.error('[Verify Error] Verification failed:', err.message);
    process.exitCode = 1;
    await disconnectDB();
  }
}

verifyPhase2Demo();
