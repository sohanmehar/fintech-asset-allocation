import { Router } from 'express';
import { getScenarios, runScenario } from '../controllers/scenario.controller';

const router = Router();

router.get('/', getScenarios);
router.post('/run', runScenario);

export default router;
