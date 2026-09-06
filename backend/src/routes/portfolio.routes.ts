import { Router } from 'express';
import { getPortfolios, getPortfolioById, createOrUpdatePortfolio } from '../controllers/portfolio.controller';

const router = Router();

router.get('/portfolios', getPortfolios);
router.get('/portfolios/:id', getPortfolioById);
router.post('/portfolios', createOrUpdatePortfolio);
router.put('/portfolios/:id', createOrUpdatePortfolio);

export default router;
