import assert from 'assert';
import mongoose from 'mongoose';
import { governanceEngine } from '../engines/governance/governanceEngine';
import { governanceService } from '../services/governance.service';
import { Portfolio } from '../models/Portfolio';
import { Alert } from '../models/Alert';
import { AuditLog } from '../models/AuditLog';
import { RiskPolicy } from '../models/RiskPolicy';
import { runSeed } from '../seed/seed';
import { config } from '../config/env';
import { determineAlertSeverity } from '../engines/governance/alertSeverity';

async function runGovernanceEngineTests() {
  console.log('\n==================================================');
  console.log('   CAPITALGUARD GOVERNANCE SUITE (14 TESTS)   ');
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
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }

    const portfolio = await Portfolio.findOne({ name: /Alpha Growth/i });
    if (!portfolio) {
      throw new Error('Seeded demo portfolio not found in database.');
    }
    const demoPortfolioId = portfolio._id.toString();

    // 1. Equity breach creates alert
    await test('1. Equity breach creates alert', async () => {
      const { result, alerts } = await governanceEngine.evaluatePortfolioGovernance(demoPortfolioId);
      assert.ok(result);
      const equityAlert = alerts.find(a => a.type === 'EQUITY_EXPOSURE');
      assert.ok(equityAlert, 'Equity breach alert should be created');
      assert.ok(equityAlert.message.includes('Equity exposure'), 'Message should describe equity exposure');
    });

    // 2. Volatility breach creates alert
    await test('2. Volatility breach severity mapping logic', async () => {
      const severity = determineAlertSeverity('PORTFOLIO_VOLATILITY', 0.18, 0.15, 0.03);
      assert.strictEqual(severity, 'CRITICAL', 'Vol excess >= 3% should be CRITICAL');
    });

    // 3. Drawdown breach creates alert
    await test('3. Drawdown breach severity mapping logic', async () => {
      const severity = determineAlertSeverity('MAX_DRAWDOWN', 0.25, 0.20, 0.05);
      assert.strictEqual(severity, 'CRITICAL', 'Drawdown excess >= 5% should be CRITICAL');
    });

    // 4. Liquidity breach creates alert
    await test('4. Liquidity breach severity mapping logic', async () => {
      const severity = determineAlertSeverity('LIQUIDITY', 50, 70, 20);
      assert.strictEqual(severity, 'CRITICAL', 'Liquidity deficit >= 15 pts should be CRITICAL');
    });

    // 5. Risk score severity
    await test('5. Risk score severity calculation', async () => {
      assert.strictEqual(determineAlertSeverity('RISK_SCORE', 85, 60, 25), 'CRITICAL');
      assert.strictEqual(determineAlertSeverity('RISK_SCORE', 65, 60, 5), 'HIGH');
      assert.strictEqual(determineAlertSeverity('RISK_SCORE', 45, 60, 0), 'WARNING');
    });

    // 6. Alert deduplication
    await test('6. Alert deduplication ensures no duplicate open alerts are created', async () => {
      await governanceEngine.evaluatePortfolioGovernance(demoPortfolioId);
      const count1 = await Alert.countDocuments({ portfolioId: demoPortfolioId, status: 'OPEN' });

      // Run evaluation again
      await governanceEngine.evaluatePortfolioGovernance(demoPortfolioId);
      const count2 = await Alert.countDocuments({ portfolioId: demoPortfolioId, status: 'OPEN' });

      assert.strictEqual(count1, count2, 'Alert count should remain equal due to deduplication');
    });

    // 7. Alert acknowledgement
    await test('7. Alert acknowledgement updates status to ACKNOWLEDGED', async () => {
      const alert = await Alert.findOne({ portfolioId: demoPortfolioId, status: 'OPEN' });
      assert.ok(alert, 'Should have an open alert');

      const acked = await governanceService.acknowledgeAlert(alert._id.toString());
      assert.strictEqual(acked.status, 'ACKNOWLEDGED');
    });

    // 8. Alert resolution
    await test('8. Alert resolution updates status to RESOLVED', async () => {
      const alert = await Alert.findOne({ portfolioId: demoPortfolioId });
      assert.ok(alert);

      const resolved = await governanceService.resolveAlert(alert._id.toString());
      assert.strictEqual(resolved.status, 'RESOLVED');
    });

    // 9. Invalid alert transition rejected
    await test('9. Invalid alert transition rejected (cannot acknowledge resolved alert)', async () => {
      const alert = await Alert.findOne({ portfolioId: demoPortfolioId, status: 'RESOLVED' });
      assert.ok(alert);

      let threw = false;
      try {
        await governanceService.acknowledgeAlert(alert._id.toString());
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('RESOLVED'), 'Error should state alert is already resolved');
      }
      assert.ok(threw, 'Should throw error when acknowledging resolved alert');
    });

    // 10. Missing portfolio handled
    await test('10. Missing portfolio handled gracefully', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      let threw = false;
      try {
        await governanceEngine.evaluatePortfolioGovernance(fakeId);
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('not found'));
      }
      assert.ok(threw, 'Should throw error for non-existent portfolio');
    });

    // 11. Audit log creation
    await test('11. Audit log creation records system governance events', async () => {
      await governanceService.logAudit('TEST_ACTION', 'PORTFOLIO', demoPortfolioId, { test: true });
      const log = await AuditLog.findOne({ action: 'TEST_ACTION', entityId: demoPortfolioId });
      assert.ok(log, 'Audit log entry should exist');
      assert.strictEqual(log.entityType, 'PORTFOLIO');
    });

    // 12. Risk policy validation
    await test('12. Risk policy validation allows valid updates', async () => {
      const policy = await RiskPolicy.findOne({ name: 'BALANCED' });
      assert.ok(policy);

      const updated = await governanceService.updateRiskPolicy(policy._id.toString(), {
        maxEquityExposure: 0.65,
      });

      assert.strictEqual(updated.maxEquityExposure, 0.65);
    });

    // 13. Invalid policy rejected
    await test('13. Invalid policy rejected when limits are out of bounds', async () => {
      const policy = await RiskPolicy.findOne({ name: 'BALANCED' });
      assert.ok(policy);

      let threw = false;
      try {
        await governanceService.updateRiskPolicy(policy._id.toString(), {
          maxEquityExposure: 2.5, // Invalid (> 1.0)
        });
      } catch (err: any) {
        threw = true;
        assert.ok(err.message.includes('maxEquityExposure'), 'Error should mention maxEquityExposure');
      }
      assert.ok(threw, 'Should throw error for out-of-bounds policy values');
    });

    // 14. Portfolio remains unchanged
    await test('14. IMMUTABILITY MANDATE: Governance evaluation DOES NOT mutate Portfolio', async () => {
      const portfolioBefore = await Portfolio.findById(demoPortfolioId).lean();

      await governanceEngine.evaluatePortfolioGovernance(demoPortfolioId);

      const portfolioAfter = await Portfolio.findById(demoPortfolioId).lean();

      assert.strictEqual(portfolioBefore?.totalCapital, portfolioAfter?.totalCapital);
      assert.strictEqual(portfolioBefore?.holdings.length, portfolioAfter?.holdings.length);
      for (let i = 0; i < portfolioBefore!.holdings.length; i++) {
        assert.strictEqual(portfolioBefore!.holdings[i].weight, portfolioAfter!.holdings[i].weight);
        assert.strictEqual(portfolioBefore!.holdings[i].currentValue, portfolioAfter!.holdings[i].currentValue);
      }
    });

    console.log(`\n--------------------------------------------------`);
    console.log(`  GOVERNANCE SUITE RESULT: ${passed}/${total} PASSED  `);
    console.log(`--------------------------------------------------\n`);

    if (passed !== total) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error running governance suite:', err);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

if (require.main === module) {
  runGovernanceEngineTests();
}
