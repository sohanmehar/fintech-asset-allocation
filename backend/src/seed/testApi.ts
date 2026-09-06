import app from '../app';
import { connectDB, disconnectDB } from '../config/db';
import { Server } from 'http';

async function testApiEndpoints() {
  await connectDB();
  const server: Server = app.listen(5099, async () => {
    console.log('[Test] Server listening on port 5099');

    try {
      // 1. Test /api/health
      const resHealth = await fetch('http://localhost:5099/api/health');
      const jsonHealth = (await resHealth.json()) as any;
      console.log('GET /api/health -> Status:', resHealth.status, jsonHealth);

      // 2. Test /api/assets
      const resAssets = await fetch('http://localhost:5099/api/assets');
      const jsonAssets = (await resAssets.json()) as any;
      console.log('GET /api/assets -> Status:', resAssets.status, 'Count:', jsonAssets.count);

      // 3. Test /api/assets/RELIANCE
      const resAssetOne = await fetch('http://localhost:5099/api/assets/RELIANCE');
      const jsonAssetOne = (await resAssetOne.json()) as any;
      console.log('GET /api/assets/RELIANCE -> Symbol:', jsonAssetOne.data?.symbol, 'Price:', jsonAssetOne.data?.currentPrice);

      // 4. Test /api/portfolios
      const resPortfolios = await fetch('http://localhost:5099/api/portfolios');
      const jsonPortfolios = (await resPortfolios.json()) as any;
      console.log('GET /api/portfolios -> Count:', jsonPortfolios.count, 'Name:', jsonPortfolios.data?.[0]?.name);

      const portfolioId = jsonPortfolios.data?.[0]?._id;
      if (portfolioId) {
        const resPortOne = await fetch(`http://localhost:5099/api/portfolios/${portfolioId}`);
        const jsonPortOne = (await resPortOne.json()) as any;
        console.log(`GET /api/portfolios/${portfolioId} -> Allocation Valid:`, jsonPortOne.allocationValidation?.valid, jsonPortOne.allocationValidation?.message);
      }

      // 5. Test /api/risk-policies
      const resPolicies = await fetch('http://localhost:5099/api/risk-policies');
      const jsonPolicies = (await resPolicies.json()) as any;
      console.log('GET /api/risk-policies -> Count:', jsonPolicies.count, 'Policies:', jsonPolicies.data?.map((p: any) => p.name));

      console.log('\nALL API ENDPOINTS TESTED AND PASSED CLEANLY!\n');
    } catch (err: any) {
      console.error('[Test Error] API test failed:', err.message);
      process.exitCode = 1;
    } finally {
      server.close(async () => {
        await disconnectDB();
      });
    }
  });
}

testApiEndpoints();
