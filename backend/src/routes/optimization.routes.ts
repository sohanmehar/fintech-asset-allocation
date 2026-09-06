import { Router } from 'express';
import {
  runOptimization,
  getOptimizationById,
  getOptimizationByPortfolio,
} from '../controllers/optimization.controller';

const router = Router();

router.post('/optimization/run', runOptimization);
router.get('/optimization/:optimizationId', getOptimizationById);
router.get('/optimization/portfolio/:portfolioId', getOptimizationByPortfolio);

export default router;
