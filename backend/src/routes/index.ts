import { Router } from 'express';
import healthRoutes from './health.routes';
import assetRoutes from './asset.routes';
import portfolioRoutes from './portfolio.routes';
import riskPolicyRoutes from './riskPolicy.routes';
import riskRoutes from './risk.routes';
import optimizationRoutes from './optimization.routes';
import scenarioRoutes from './scenario.routes';
import governanceRoutes from './governance.routes';

const router = Router();

router.use('/', healthRoutes);
router.use('/', assetRoutes);
router.use('/', portfolioRoutes);
router.use('/', riskPolicyRoutes);
router.use('/', riskRoutes);
router.use('/', optimizationRoutes);
router.use('/scenarios', scenarioRoutes);
router.use('/', governanceRoutes);

export default router;
