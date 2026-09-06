import { Router } from 'express';
import { getRiskPolicies } from '../controllers/riskPolicy.controller';

const router = Router();

router.get('/risk-policies', getRiskPolicies);

export default router;
