import { connectDB, disconnectDB } from '../config/db';
import { User, Asset, Portfolio, RiskPolicy, Alert, OptimizationRun, ScenarioRun, AuditLog } from '../models';
import { rawAssetConfigs, riskPoliciesSeedData, demoUserSeed, demoPortfolioTargetWeights } from './seedData';
import { generateHistoricalPrices } from './historicalDataGenerator';
import { validatePortfolioAllocation } from '../utils/validation';

export async function runSeed(): Promise<void> {
  console.log('\n==================================================');
  console.log('       CAPITALGUARD SEED SCRIPT STARTING          ');
  console.log('==================================================\n');

  try {
    await connectDB();

    console.log('[Seed] Clearing existing demo collections...');
    await User.deleteMany({});
    await Asset.deleteMany({});
    await Portfolio.deleteMany({});
    await RiskPolicy.deleteMany({});
    await Alert.deleteMany({});
    await OptimizationRun.deleteMany({});
    await ScenarioRun.deleteMany({});
    await AuditLog.deleteMany({});
    console.log('[Seed] Demo collections cleared.');

    // 1. Seed Assets
    console.log('[Seed] Creating demo assets with ~500 days of synthetic historical prices...');
    const createdAssets = [];
    for (let i = 0; i < rawAssetConfigs.length; i++) {
      const cfg = rawAssetConfigs[i];
      const historicalPrices = generateHistoricalPrices(
        cfg.currentPrice,
        cfg.annualDrift,
        cfg.annualVolatility,
        500, // ~2 years trading days
        i + 1
      );

      const assetDoc = await Asset.create({
        symbol: cfg.symbol,
        name: cfg.name,
        assetClass: cfg.assetClass,
        sector: cfg.sector,
        currentPrice: cfg.currentPrice,
        currency: cfg.currency,
        historicalPrices,
        liquidityScore: cfg.liquidityScore,
        minWeight: cfg.minWeight,
        maxWeight: cfg.maxWeight,
        scenarioShock: cfg.scenarioShock || {},
        metadata: {
          annualDrift: cfg.annualDrift,
          annualVolatility: cfg.annualVolatility,
          isSyntheticDemoData: true,
        },
      });

      createdAssets.push(assetDoc);
    }
    console.log(`[Seed] Created ${createdAssets.length} financial assets successfully.`);

    // 2. Seed Risk Policies
    console.log('[Seed] Creating Risk Policies (CONSERVATIVE, BALANCED, AGGRESSIVE)...');
    const createdPolicies = await RiskPolicy.insertMany(riskPoliciesSeedData);
    console.log(`[Seed] Created ${createdPolicies.length} risk policies.`);

    // 3. Seed Demo User
    console.log('[Seed] Creating Demo Risk Officer user...');
    const demoUser = await User.create(demoUserSeed);
    console.log(`[Seed] Created demo user: ${demoUser.name} (${demoUser.email})`);

    // 4. Seed Demo Portfolio
    console.log('[Seed] Building deliberate demo portfolio (Total Capital: ₹10,000,000)...');
    const totalCapital = 10000000; // 1 Crore INR

    // Map target weights to holdings
    const holdings = [];
    const assetMap = new Map(createdAssets.map((a) => [a.symbol, a]));

    for (const target of demoPortfolioTargetWeights) {
      const asset = assetMap.get(target.symbol);
      if (!asset) {
        throw new Error(`Asset '${target.symbol}' missing during portfolio seed.`);
      }

      const valueForAsset = totalCapital * target.weight;
      const quantity = Math.round((valueForAsset / asset.currentPrice) * 100) / 100;

      holdings.push({
        assetId: asset._id,
        symbol: asset.symbol,
        quantity,
        currentValue: valueForAsset,
        weight: target.weight,
      });
    }

    // Validate Portfolio Allocation
    const validation = validatePortfolioAllocation(holdings);
    console.log(`[Seed] Portfolio allocation validation result: ${validation.message}`);
    if (!validation.valid) {
      throw new Error(`Seed failed: Invalid portfolio allocation total. ${validation.message}`);
    }

    const demoPortfolio = await Portfolio.create({
      name: 'Alpha Growth & Income Demo Portfolio',
      userId: demoUser._id,
      totalCapital,
      holdings,
      riskProfile: 'BALANCED',
    });

    console.log(`[Seed] Created Demo Portfolio ID: ${demoPortfolio._id}`);

    // 5. Create Sample Alert for the Equity Breach
    console.log('[Seed] Creating initial risk breach alert...');
    const alertDoc = await Alert.create({
      portfolioId: demoPortfolio._id,
      severity: 'WARNING',
      type: 'EQUITY_EXPOSURE_BREACH',
      message: 'Portfolio equity allocation (68.0%) exceeds BALANCED risk policy maximum threshold (60.0%).',
      metric: 'Equity Exposure',
      currentValue: 0.68,
      threshold: 0.60,
      status: 'OPEN',
    });

    // 6. Create Audit Log entry
    await AuditLog.create({
      userId: demoUser._id,
      action: 'SEED_INITIALIZATION',
      entityType: 'Portfolio',
      entityId: demoPortfolio._id.toString(),
      details: {
        totalAssetsSeeded: createdAssets.length,
        totalCapital,
        riskProfile: 'BALANCED',
        holdingsCount: holdings.length,
      },
    });

    console.log('\n==================================================');
    console.log('       SEED PROCESS COMPLETED SUCCESSFULLY!        ');
    console.log('==================================================');
    console.log(`- Assets Seeded: ${createdAssets.length}`);
    console.log(`- Risk Policies Seeded: ${createdPolicies.length}`);
    console.log(`- Users Seeded: 1 (${demoUser.email})`);
    console.log(`- Portfolios Seeded: 1 (${demoPortfolio.name})`);
    console.log(`- Alerts Seeded: 1 (ID: ${alertDoc._id})`);
    console.log('==================================================\n');

  } catch (error: any) {
    console.error('[Seed Error] Database seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}

// Execute directly if run via CLI
if (require.main === module) {
  runSeed();
}
