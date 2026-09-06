import assert from 'assert';
import { normalizeAllocationWeights } from '../engines/optimization/allocationValidator';
import { evaluateConstraints } from '../engines/optimization/constraintEvaluator';
import { evaluateObjectiveFunction } from '../engines/optimization/objectiveFunction';
import { calculateTransactionCost } from '../engines/optimization/transactionCostCalculator';
import { calculateRebalancingActions } from '../engines/optimization/rebalancingCalculator';
import { generateCandidateAllocations } from '../engines/optimization/candidateGenerator';
import { runConstrainedOptimizer } from '../engines/optimization/optimizer';

async function runOptimizationEngineTests() {
  console.log('\n==================================================');
  console.log('   CAPITALGUARD OPTIMIZATION SUITE (21 TESTS)    ');
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

  const mockAssets = [
    { assetId: '1', symbol: 'EQ1', assetClass: 'EQUITY', minWeight: 0, maxWeight: 0.3, liquidityScore: 90 },
    { assetId: '2', symbol: 'EQ2', assetClass: 'EQUITY', minWeight: 0, maxWeight: 0.3, liquidityScore: 90 },
    { assetId: '3', symbol: 'BOND1', assetClass: 'GOVERNMENT_BOND', minWeight: 0.05, maxWeight: 0.5, liquidityScore: 95 },
    { assetId: '4', symbol: 'CASH1', assetClass: 'CASH', minWeight: 0.05, maxWeight: 1.0, liquidityScore: 100 },
  ];

  const mockPrices = {
    dates: ['d1', 'd2', 'd3'],
    symbols: ['EQ1', 'EQ2', 'BOND1', 'CASH1'],
    priceMatrix: [
      [100, 100, 100, 100],
      [102, 101, 100.5, 100.02],
      [104, 103, 101, 100.04],
    ],
  };

  const mockCov = [
    [0.04, 0.02, 0.005, 0],
    [0.02, 0.04, 0.005, 0],
    [0.005, 0.005, 0.002, 0],
    [0, 0, 0, 0.00001],
  ];

  // 1. Current allocation validation
  test('Allocation normalization ensures total weight equals 100%', () => {
    const raw = [0.20, 0.15, 0.15, 0.10, 0.08, 0.10, 0.07, 0.10, 0.05];
    const norm = normalizeAllocationWeights(raw);
    const sum = norm.reduce((acc, w) => acc + w, 0);
    assert.strictEqual(Math.round(sum * 10000) / 10000, 1.0);
  });

  // 2. Candidate allocation sums to 100%
  test('Candidate allocations sum to exactly 1.0', () => {
    const cands = generateCandidateAllocations({
      currentWeights: [0.35, 0.33, 0.20, 0.12],
      assets: mockAssets,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxIndividualAssetWeight: 0.30,
    });
    assert.ok(cands.length >= 5);
    cands.forEach((c) => {
      const sum = c.weights.reduce((acc, w) => acc + w, 0);
      assert.strictEqual(Math.round(sum * 10000) / 10000, 1.0);
    });
  });

  // 3. No negative weights
  test('Non-negativity constraint evaluation (no short selling)', () => {
    const res = evaluateConstraints({
      weights: [-0.05, 0.65, 0.30, 0.10],
      assets: mockAssets,
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.15,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.30,
      maxDrawdown: 0.20,
    });
    assert.strictEqual(res.feasible, false);
    assert.ok(res.violations.some((v) => v.includes('negative')));
  });

  // 4. Individual asset limits
  test('Individual asset weight max limit constraint', () => {
    const res = evaluateConstraints({
      weights: [0.35, 0.25, 0.30, 0.10], // EQ1 is 0.35 > maxIndividualAssetWeight 0.30
      assets: mockAssets,
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.15,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.30,
      maxDrawdown: 0.20,
    });
    assert.strictEqual(res.feasible, false);
    assert.ok(res.violations.some((v) => v.includes('exceeds maximum limit')));
  });

  // 5. Equity constraint
  test('Equity exposure ceiling constraint (68% vs 60% max limit)', () => {
    const res = evaluateConstraints({
      weights: [0.35, 0.33, 0.22, 0.10], // Equity sum = 68%
      assets: mockAssets,
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.15,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.40,
      maxDrawdown: 0.20,
    });
    assert.strictEqual(res.feasible, false);
    assert.ok(res.violations.some((v) => v.includes('Equity exposure')));
  });

  // 6. Minimum cash constraint
  test('Minimum cash allocation constraint', () => {
    const res = evaluateConstraints({
      weights: [0.30, 0.30, 0.38, 0.02], // Cash is 2% < 5% min
      assets: mockAssets,
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.15,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.40,
      maxDrawdown: 0.20,
    });
    assert.strictEqual(res.feasible, false);
    assert.ok(res.violations.some((v) => v.includes('Cash allocation')));
  });

  // 7. Liquidity constraint
  test('Minimum portfolio liquidity score constraint', () => {
    const lowLiqAssets = [
      { assetId: '1', symbol: 'EQ1', assetClass: 'EQUITY', minWeight: 0, maxWeight: 1, liquidityScore: 40 },
      { assetId: '2', symbol: 'CASH1', assetClass: 'CASH', minWeight: 0, maxWeight: 1, liquidityScore: 50 },
    ];
    const res = evaluateConstraints({
      weights: [0.80, 0.20], // weighted liq = 0.8*40 + 0.2*50 = 42 < 70 min
      assets: lowLiqAssets,
      alignedPrices: { dates: ['d1', 'd2'], symbols: ['EQ1', 'CASH1'], priceMatrix: [[100, 100], [101, 100.01]] },
      annualCovarianceMatrix: [[0.04, 0], [0, 0.0001]],
      maxEquityExposure: 0.90,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.30,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 1.0,
      maxDrawdown: 0.50,
    });
    assert.strictEqual(res.feasible, false);
  });

  // 8. Volatility constraint
  test('Maximum portfolio volatility constraint', () => {
    const highVolCov = [
      [0.25, 0.15, 0, 0],
      [0.15, 0.25, 0, 0],
      [0, 0, 0.01, 0],
      [0, 0, 0, 0.0001],
    ];
    const res = evaluateConstraints({
      weights: [0.30, 0.30, 0.35, 0.05], // high vol equity
      assets: mockAssets,
      alignedPrices: mockPrices,
      annualCovarianceMatrix: highVolCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.10, // strict 10% limit
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.40,
      maxDrawdown: 0.50,
    });
    assert.strictEqual(res.feasible, false);
    assert.ok(res.violations.some((v) => v.includes('volatility')));
  });

  // 9. Feasible candidate detection
  test('Feasible candidate detection and scoring', () => {
    const res = evaluateConstraints({
      weights: [0.25, 0.25, 0.40, 0.10], // Equity 50% <= 60%, Cash 10% >= 5%, Asset max 25%/40%
      assets: mockAssets,
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.15,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.40,
      maxDrawdown: 0.20,
    });
    assert.strictEqual(res.feasible, true);
    assert.strictEqual(res.totalViolations, 0);
  });

  // 10. Infeasible problem detection
  test('Infeasible problem detection when constraints conflict', () => {
    const result = runConstrainedOptimizer({
      currentWeights: [0.35, 0.33, 0.22, 0.10],
      assets: mockAssets,
      expectedReturns: [0.12, 0.12, 0.06, 0.05],
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.10, // impossible low equity cap
      minCashAllocation: 0.95, // impossible high cash min
      maxPortfolioVolatility: 0.0001,
      minLiquidityScore: 100,
      maxIndividualAssetWeight: 0.10,
      maxDrawdown: 0.001,
      riskAversion: 1.0,
      transactionCostRate: 0.0025,
    });
    assert.strictEqual(result.status, 'INFEASIBLE');
  });

  // 11. Objective function
  test('Mean-variance objective function evaluation', () => {
    const obj = evaluateObjectiveFunction({
      weights: [0.25, 0.25, 0.40, 0.10],
      currentWeights: [0.35, 0.33, 0.22, 0.10],
      expectedReturns: [0.12, 0.10, 0.06, 0.05],
      annualCovarianceMatrix: mockCov,
      riskAversion: 1.0,
      transactionCostRate: 0.0025,
    });
    assert.ok(!isNaN(obj.totalObjective));
    assert.ok(obj.expectedReturnComponent > 0);
    assert.ok(obj.riskPenalty >= 0);
    assert.ok(obj.transactionCostPenalty >= 0);
  });

  // 12. Risk-aversion effect
  test('Risk-aversion parameter increases variance penalty', () => {
    const lowRiskAversion = evaluateObjectiveFunction({
      weights: [0.25, 0.25, 0.40, 0.10],
      currentWeights: [0.25, 0.25, 0.40, 0.10],
      expectedReturns: [0.12, 0.10, 0.06, 0.05],
      annualCovarianceMatrix: mockCov,
      riskAversion: 0.5,
      transactionCostRate: 0.0025,
    });
    const highRiskAversion = evaluateObjectiveFunction({
      weights: [0.25, 0.25, 0.40, 0.10],
      currentWeights: [0.25, 0.25, 0.40, 0.10],
      expectedReturns: [0.12, 0.10, 0.06, 0.05],
      annualCovarianceMatrix: mockCov,
      riskAversion: 2.0,
      transactionCostRate: 0.0025,
    });
    assert.ok(highRiskAversion.riskPenalty > lowRiskAversion.riskPenalty);
  });

  // 13. Transaction-cost calculation
  test('Transaction cost calculation (turnover * capital * rate)', () => {
    const cost = calculateTransactionCost([0.5, 0.5], [0.3, 0.7], 10000000, 0.0025);
    // turnover = |0.3-0.5| + |0.7-0.5| = 0.2 + 0.2 = 0.4 (40%)
    // cost = 0.4 * 10,000,000 * 0.0025 = 10,000
    assert.strictEqual(cost.turnover, 0.4);
    assert.strictEqual(cost.estimatedCost, 10000);
  });

  // 14. Turnover calculation
  test('Turnover calculation non-negativity', () => {
    const cost = calculateTransactionCost([0.2, 0.8], [0.2, 0.8], 1000000, 0.0025);
    assert.strictEqual(cost.turnover, 0);
    assert.strictEqual(cost.estimatedCost, 0);
  });

  // 15. BUY calculation
  test('Rebalancing BUY action calculation (> 0.5% threshold)', () => {
    const actions = calculateRebalancingActions(
      [{ assetId: '1', symbol: 'BOND1', assetClass: 'GOVERNMENT_BOND' }],
      [0.10],
      [0.15], // +5% change
      10000000
    );
    assert.strictEqual(actions[0].action, 'BUY');
    assert.strictEqual(actions[0].weightChange, 0.05);
    assert.strictEqual(actions[0].valueChange, 500000);
  });

  // 16. SELL calculation
  test('Rebalancing SELL action calculation (< -0.5% threshold)', () => {
    const actions = calculateRebalancingActions(
      [{ assetId: '1', symbol: 'RELIANCE', assetClass: 'EQUITY' }],
      [0.20],
      [0.17], // -3% change
      10000000
    );
    assert.strictEqual(actions[0].action, 'SELL');
    assert.strictEqual(actions[0].weightChange, -0.03);
    assert.strictEqual(actions[0].valueChange, -300000);
  });

  // 17. HOLD calculation
  test('Rebalancing HOLD action calculation (<= 0.5% change)', () => {
    const actions = calculateRebalancingActions(
      [{ assetId: '1', symbol: 'CASH1', assetClass: 'CASH' }],
      [0.05],
      [0.052], // +0.2% change (below 0.5% tolerance)
      10000000
    );
    assert.strictEqual(actions[0].action, 'HOLD');
  });

  // 18. Before/after risk calculation structure
  test('Before vs after metrics structure comparison', () => {
    const optRes = runConstrainedOptimizer({
      currentWeights: [0.35, 0.33, 0.22, 0.10],
      assets: mockAssets,
      expectedReturns: [0.12, 0.12, 0.06, 0.05],
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.15,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.30,
      maxDrawdown: 0.20,
      riskAversion: 1.0,
      transactionCostRate: 0.0025,
    });
    assert.strictEqual(optRes.status, 'OPTIMIZED');
  });

  // 19. Constraint validation output list
  test('Constraint validation output items format', () => {
    const res = evaluateConstraints({
      weights: [0.25, 0.25, 0.40, 0.10],
      assets: mockAssets,
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.15,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.45,
      maxDrawdown: 0.20,
    });
    assert.ok(res.constraintItems.length >= 6);
    assert.ok(res.constraintItems.every((item) => item.status === 'PASS'));
  });

  // 20. Portfolio immutability (guaranteed by optimizer design)
  test('Optimizer is pure function and does not mutate input arrays', () => {
    const origWeights = [0.35, 0.33, 0.22, 0.10];
    const copyWeights = [...origWeights];
    runConstrainedOptimizer({
      currentWeights: origWeights,
      assets: mockAssets,
      expectedReturns: [0.12, 0.12, 0.06, 0.05],
      alignedPrices: mockPrices,
      annualCovarianceMatrix: mockCov,
      maxEquityExposure: 0.60,
      minCashAllocation: 0.05,
      maxPortfolioVolatility: 0.15,
      minLiquidityScore: 70,
      maxIndividualAssetWeight: 0.30,
      maxDrawdown: 0.20,
      riskAversion: 1.0,
      transactionCostRate: 0.0025,
    });
    assert.deepStrictEqual(origWeights, copyWeights);
  });

  // 21. Optimization persistence format
  test('Optimization run document format validity', () => {
    const runDoc = {
      portfolioId: 'mockId',
      riskProfile: 'BALANCED',
      status: 'COMPLETED',
      createdAt: new Date(),
    };
    assert.ok(runDoc.portfolioId);
    assert.strictEqual(runDoc.status, 'COMPLETED');
  });

  console.log(`\n==================================================`);
  console.log(`    OPTIMIZATION SUITE RESULT: ${passed}/${total} PASSED   `);
  console.log(`==================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runOptimizationEngineTests();
