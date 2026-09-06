import { Router } from 'express';
import { getRiskReport, getRiskSummary } from '../controllers/risk.controller';

const router = Router();

router.get('/risk/portfolio/:portfolioId', getRiskReport);
router.get('/risk/portfolio/:portfolioId/summary', getRiskSummary);

export default router;
