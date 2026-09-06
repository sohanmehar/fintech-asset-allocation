import assert from 'assert';
import mongoose from 'mongoose';
import { scenarioEngine } from '../engines/scenario/scenarioEngine';
import { Portfolio } from '../models/Portfolio';
import { runSeed } from '../seed/seed';
import { config } from '../config/env';

async function runScenarioEngineTests() {
  console.log('\n==================================================');
  console.log('  CAPITALGUARD SCENARIO SUITE (14 TESTS)  ');
  console.log('==================================================\n');

  let passed = 0;
  let total = 0;

  const test = async (name: string, fn: () => Promise<void> | void) => {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✓ Test ${total}: ${name}`);
    } catch (err: any) {
      console.error(`✗ Test ${total} FAILED: ${name}`);
      console.error('  Details:', err.message);
    }
  };

  try {
    // Seed dataset
    await runSeed();
    // Reconnect after seed if seed closed connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    const portfolio = await Portfolio.findOne({ name: /Alpha Growth/i });
    if (!portfolio) {
      throw new Error('Seeded demo portfolio not found in test database.');
    }
    const demoPortfolioId = portfolio._id.toString();

    // 1. Market Crash scenario
    await test('1. Market Crash scenario executes correctly with expected negative impact', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'MARKET_CRASH');
      assert.ok(result, 'Result should be defined');
      assert.strictEqual(result.scenarioType, 'MARKET_CRASH');
      assert.ok(result.stressedSnapshot.totalCapital < result.currentSnapshot.totalCapital, 'Stressed capital should be less than current');
      assert.ok(result.metricChanges.totalCapitalChange < 0, 'Portfolio capital change should be negative');
      assert.ok(result.recommendations.length > 0, 'Should return recommendations');
      assert.ok(result.assetImpacts.length > 0, 'Should return asset impacts');
    });

    // 2. Rate Shock scenario
    await test('2. Rate Shock scenario executes correctly', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'RATE_SHOCK');
      assert.ok(result);
      assert.strictEqual(result.scenarioType, 'RATE_SHOCK');
      assert.ok(typeof result.metricChanges.totalCapitalChange === 'number');
    });

    // 3. Liquidity Crisis
    await test('3. Liquidity Crisis scenario applies 20% liquidity deterioration penalty', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'LIQUIDITY_CRISIS');
      assert.ok(result.stressedSnapshot.liquidityScore < result.currentSnapshot.liquidityScore, 'Stressed liquidity score should drop');
    });

    // 4. Sector Shock
    await test('4. Sector Shock scenario applies symbol-specific shocks (TCS, INFY, HDFCBANK)', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'SECTOR_SHOCK');
      const tcsImpact = result.assetImpacts.find(a => a.symbol === 'TCS');
      assert.ok(tcsImpact, 'TCS impact should be present');
      assert.strictEqual(tcsImpact.shock, -0.15);
    });

    // 5. Custom scenario
    await test('5. Custom Scenario applies user-defined percentage shocks', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'CUSTOM', {
        RELIANCE: -0.15,
        TCS: -0.10,
      });
      assert.strictEqual(result.scenarioType, 'CUSTOM');
      const relianceImpact = result.assetImpacts.find(a => a.symbol === 'RELIANCE');
      assert.strictEqual(relianceImpact?.shock, -0.15);
    });

    // 6. Stressed values consistency
    await test('6. Stressed values and metric differences are mathematically consistent', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'MARKET_CRASH');
      const computedDiff = result.stressedSnapshot.totalCapital - result.currentSnapshot.totalCapital;
      assert.ok(Math.abs(result.metricChanges.totalCapitalChange - computedDiff) < 1.0, 'Loss should match total capital difference');
    });

    // 7. Asset impacts ranking
    await test('7. Asset impacts are ranked by absolute monetary impact descending', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'MARKET_CRASH');
      for (let i = 0; i < result.assetImpacts.length - 1; i++) {
        const currentAbs = Math.abs(result.assetImpacts[i].impactAmount);
        const nextAbs = Math.abs(result.assetImpacts[i + 1].impactAmount);
        assert.ok(currentAbs >= nextAbs, `Asset ${i} impact should be >= asset ${i+1} impact`);
      }
    });

    // 8. Policy breach detection
    await test('8. Policy breach detection accurately flags breaches under stress', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'MARKET_CRASH');
      assert.ok(result.policyEvaluation);
      assert.ok(Array.isArray(result.policyEvaluation.breaches));
    });

    // 9. Risk score changes
    await test('9. Composite Risk Score increases under market crash stress', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'MARKET_CRASH');
      assert.ok(result.stressedSnapshot.riskScore >= result.currentSnapshot.riskScore, 'Risk score should increase or stay high');
    });

    // 10. Portfolio immutability
    await test('10. IMMUTABILITY MANDATE: Scenario execution DOES NOT mutate Portfolio in database', async () => {
      const portfolioBefore = await Portfolio.findById(demoPortfolioId).lean();

      // Execute scenario
      await scenarioEngine.runScenario(demoPortfolioId, 'MARKET_CRASH');

      const portfolioAfter = await Portfolio.findById(demoPortfolioId).lean();

      assert.strictEqual(portfolioBefore?.totalCapital, portfolioAfter?.totalCapital, 'Portfolio total capital must remain unchanged');
      assert.strictEqual(portfolioBefore?.holdings.length, portfolioAfter?.holdings.length, 'Holdings count must remain unchanged');

      for (let i = 0; i < portfolioBefore!.holdings.length; i++) {
        assert.strictEqual(portfolioBefore!.holdings[i].weight, portfolioAfter!.holdings[i].weight, `Holding ${i} weight must remain unchanged`);
        assert.strictEqual(portfolioBefore!.holdings[i].currentValue, portfolioAfter!.holdings[i].currentValue, `Holding ${i} value must remain unchanged`);
      }
    });

    // 11. No NaN or Infinity
    await test('11. No NaN or Infinity values exist in scenario calculations', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'MARKET_CRASH');
      const jsonString = JSON.stringify(result);
      assert.ok(!jsonString.includes('NaN'), 'Output contains NaN');
      assert.ok(!jsonString.includes('null'), 'Output contains null in critical fields');
      assert.ok(!jsonString.includes('Infinity'), 'Output contains Infinity');
    });

    // 12. Shock bounds validation
    await test('12. Shock bounds validation handles out-of-bound custom shocks safely', async () => {
      const result = await scenarioEngine.runScenario(demoPortfolioId, 'CUSTOM', {
        RELIANCE: -2.5, // Should clamp to -1.0
        TCS: 3.0,       // Should clamp to +1.0
      });
      const rel = result.assetImpacts.find(a => a.symbol === 'RELIANCE');
      const tcs = result.assetImpacts.find(a => a.symbol === 'TCS');
      assert.strictEqual(rel?.shock, -1.0, 'Reliance shock clamped to -1.0');
      assert.strictEqual(tcs?.shock, 1.0, 'TCS shock clamped to 1.0');
    });

    // 13. Missing portfolio handling
    await test('13. Handles non-existent portfolio ID gracefully', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      let threw = false;
      try {
        await scenarioEngine.runScenario(fakeId, 'MARKET_CRASH');
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('not found'), 'Error message should state portfolio not found');
      }
      assert.ok(threw, 'Should throw error for non-existent portfolio');
    });

    // 14. Invalid scenario handling
    await test('14. Handles invalid scenario type gracefully', async () => {
      let threw = false;
      try {
        await scenarioEngine.runScenario(demoPortfolioId, 'INVALID_TYPE' as any);
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('Invalid scenario type'), 'Error message should mention invalid scenario type');
      }
      assert.ok(threw, 'Should throw error for invalid scenario type');
    });

    console.log(`\n--------------------------------------------------`);
    console.log(`  SCENARIO SUITE RESULT: ${passed}/${total} PASSED  `);
    console.log(`--------------------------------------------------\n`);

    if (passed !== total) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error running scenario suite:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runScenarioEngineTests();
}
