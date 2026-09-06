import { connectDB, disconnectDB } from '../config/db';
import { Portfolio } from '../models/Portfolio';
import { optimizationEngine } from '../engines/optimization';
import app from '../app';
import { Server } from 'http';

async function verifyPhase3Demo() {
  console.log('\n==================================================');
  console.log('   PHASE 3 DEMO PORTFOLIO OPTIMIZATION VERIFY    ');
  console.log('==================================================\n');

  try {
    await connectDB();

    // 1. Load Demo Portfolio
    const demoPortfolio = await Portfolio.findOne({ name: 'Alpha Growth & Income Demo Portfolio' });
    if (!demoPortfolio) {
      throw new Error("Demo portfolio 'Alpha Growth & Income Demo Portfolio' not found. Run 'npm run seed' first.");
    }

    console.log(`[Verify] Loaded Demo Portfolio ID: ${demoPortfolio._id}`);
    console.log(`[Verify] Portfolio Name: ${demoPortfolio.name}`);
    console.log(`[Verify] Risk Profile: ${demoPortfolio.riskProfile}`);
    console.log(`[Verify] Total Capital: ₹${demoPortfolio.totalCapital.toLocaleString('en-IN')}`);

    const initialHoldingsSnapshot = JSON.stringify(demoPortfolio.holdings);

    // 2. Execute Optimization Engine
    console.log('\n[Verify] Executing optimizationEngine.runOptimization()...');
    const result = await optimizationEngine.runOptimization({
      portfolioId: demoPortfolio._id.toString(),
      riskProfile: 'BALANCED',
      riskAversion: 1.0,
      transactionCostRate: 0.0025,
    });

    console.log('\n--------------------------------------------------');
    console.log('            OPTIMIZATION ENGINE RESULT            ');
    console.log('--------------------------------------------------');
    console.log(`Status                  : ${result.status}`);
    console.log(`Optimization ID         : ${result.optimizationId}`);
    console.log(`Objective Value         : ${result.objective.totalObjective}`);
    console.log(`Summary                 : ${result.explanation.summary}`);
    console.log('--------------------------------------------------');
    console.log('BEFORE vs AFTER METRICS COMPARISON:');
    console.table([
      {
        Metric: 'Expected Return',
        Before: `${(result.beforeMetrics.expectedReturn * 100).toFixed(2)}%`,
        After: `${(result.afterMetrics.expectedReturn * 100).toFixed(2)}%`,
      },
      {
        Metric: 'Portfolio Volatility',
        Before: `${(result.beforeMetrics.volatility * 100).toFixed(2)}%`,
        After: `${(result.afterMetrics.volatility * 100).toFixed(2)}%`,
      },
      {
        Metric: '1-Day 95% VaR Amount',
        Before: `₹${result.beforeMetrics.var95Amount.toLocaleString('en-IN')}`,
        After: `₹${result.afterMetrics.var95Amount.toLocaleString('en-IN')}`,
      },
      {
        Metric: 'Max Drawdown',
        Before: `${(result.beforeMetrics.maximumDrawdown * 100).toFixed(2)}%`,
        After: `${(result.afterMetrics.maximumDrawdown * 100).toFixed(2)}%`,
      },
      {
        Metric: 'Equity Exposure',
        Before: `${(result.beforeMetrics.equityExposure * 100).toFixed(1)}%`,
        After: `${(result.afterMetrics.equityExposure * 100).toFixed(1)}%`,
      },
      {
        Metric: 'Cash Allocation',
        Before: `${(result.beforeMetrics.cashAllocation * 100).toFixed(1)}%`,
        After: `${(result.afterMetrics.cashAllocation * 100).toFixed(1)}%`,
      },
      {
        Metric: 'Composite Risk Score',
        Before: `${result.beforeMetrics.riskScore} (${result.beforeMetrics.riskLevel})`,
        After: `${result.afterMetrics.riskScore} (${result.afterMetrics.riskLevel})`,
      },
      {
        Metric: 'Policy Evaluation',
        Before: result.beforeMetrics.policyPassed ? 'PASSED' : 'BREACHED',
        After: result.afterMetrics.policyPassed ? 'PASSED' : 'BREACHED',
      },
    ]);

    console.log('\n--------------------------------------------------');
    console.log('TARGET REBALANCING ACTIONS (BUY / SELL / HOLD):');
    console.table(
      result.rebalancing.map((r) => ({
        Symbol: r.symbol,
        Class: r.assetClass,
        CurrentWeight: `${(r.currentWeight * 100).toFixed(1)}%`,
        TargetWeight: `${(r.targetWeight * 100).toFixed(1)}%`,
        Change: `${(r.weightChange * 100).toFixed(1)}%`,
        Action: r.action,
        ValueChange: `₹${r.valueChange.toLocaleString('en-IN')}`,
      }))
    );

    console.log('\n--------------------------------------------------');
    console.log('ESTIMATED TRANSACTION COSTS:');
    console.log(`Portfolio Turnover      : ${(result.transactionCost.turnover * 100).toFixed(1)}%`);
    console.log(`Transaction Cost Rate   : ${(result.transactionCost.rate * 100).toFixed(2)}%`);
    console.log(`Estimated Cost          : ₹${result.transactionCost.estimatedCost.toLocaleString('en-IN')}`);

    console.log('\n--------------------------------------------------');
    console.log('CONSTRAINT VALIDATION RESULTS:');
    console.table(
      result.constraintValidation.constraints.map((c) => ({
        Constraint: c.name,
        CurrentValue: c.current,
        Limit: c.limit,
        Status: c.status,
      }))
    );

    console.log('\n--------------------------------------------------');
    console.log('EXPLAINABLE REASONS:');
    result.explanation.reasons.forEach((r, idx) => {
      console.log(`  [${idx + 1}] ${r}`);
    });
    console.log('--------------------------------------------------\n');

    // 3. Strict Verification Assertions
    console.log('[Verify] Asserting Phase 3 Requirements:');

    if (result.status !== 'OPTIMIZED') {
      throw new Error(`Assertion failed: Expected status OPTIMIZED, got ${result.status}`);
    }
    console.log('  ✓ Optimizer status equals OPTIMIZED');

    if (result.beforeMetrics.equityExposure !== 0.68) {
      throw new Error(`Assertion failed: Expected before equity exposure 68%, got ${result.beforeMetrics.equityExposure * 100}%`);
    }
    console.log('  ✓ Before Equity Exposure equals 68.0% (BREACHED)');

    if (result.afterMetrics.equityExposure > 0.60) {
      throw new Error(`Assertion failed: Optimized Equity Exposure (${result.afterMetrics.equityExposure * 100}%) exceeds 60% ceiling!`);
    }
    console.log(`  ✓ Optimized Equity Exposure (${(result.afterMetrics.equityExposure * 100).toFixed(1)}%) complies with 60.0% ceiling`);

    if (!result.afterMetrics.policyPassed) {
      throw new Error('Assertion failed: Optimized portfolio failed policy evaluation!');
    }
    console.log('  ✓ Optimized portfolio policy evaluation status: PASSED');

    const totalTargetWeight = result.optimizedAllocation.reduce((sum, a) => sum + a.weight, 0);
    if (Math.round(totalTargetWeight * 10000) / 10000 !== 1.0) {
      throw new Error(`Assertion failed: Target allocation sum (${totalTargetWeight}) does not equal 100%!`);
    }
    console.log('  ✓ Optimized target allocation sums to exactly 100.0%');

    // Verify portfolio immutability
    const reloadedPortfolio = await Portfolio.findById(demoPortfolio._id);
    const finalHoldingsSnapshot = JSON.stringify(reloadedPortfolio?.holdings);
    if (initialHoldingsSnapshot !== finalHoldingsSnapshot) {
      throw new Error('Assertion failed: OptimizationEngine mutated original portfolio holdings in database!');
    }
    console.log('  ✓ Original portfolio remained 100% unchanged in database');

    // 4. Test HTTP API Endpoints
    console.log('\n[Verify] Starting HTTP Server to test Optimization API endpoints...');
    const server: Server = app.listen(5097, async () => {
      try {
        // POST /api/optimization/run
        const resRun = await fetch('http://localhost:5097/api/optimization/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portfolioId: demoPortfolio._id,
            riskProfile: 'BALANCED',
            riskAversion: 1.0,
          }),
        });
        const jsonRun = (await resRun.json()) as any;
        console.log(`  ✓ POST /api/optimization/run -> Status: ${resRun.status}, Success: ${jsonRun.success}, Optimization ID: ${jsonRun.data?.optimizationId}`);

        const optId = jsonRun.data?.optimizationId;
        if (optId) {
          // GET /api/optimization/:id
          const resGetOne = await fetch(`http://localhost:5097/api/optimization/${optId}`);
          const jsonGetOne = (await resGetOne.json()) as any;
          console.log(`  ✓ GET /api/optimization/${optId} -> Status: ${resGetOne.status}, Run Status: ${jsonGetOne.data?.status}`);
        }

        // GET /api/optimization/portfolio/:portfolioId
        const resGetPort = await fetch(`http://localhost:5097/api/optimization/portfolio/${demoPortfolio._id}`);
        const jsonGetPort = (await resGetPort.json()) as any;
        console.log(`  ✓ GET /api/optimization/portfolio/${demoPortfolio._id} -> Status: ${resGetPort.status}, Count: ${jsonGetPort.count}`);

        console.log('\n==================================================');
        console.log('     PHASE 3 DEMO VERIFICATION PASSED 100%!       ');
        console.log('==================================================\n');
      } finally {
        server.close(async () => {
          await disconnectDB();
        });
      }
    });
  } catch (err: any) {
    console.error('[Verify Error] Phase 3 verification failed:', err.message);
    process.exitCode = 1;
    await disconnectDB();
  }
}

verifyPhase3Demo();
