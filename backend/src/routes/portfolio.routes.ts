import { Router } from 'express';
import { getPortfolios, getPortfolioById } from '../controllers/portfolio.controller';

const router = Router();

router.get('/portfolios', getPortfolios);
router.get('/portfolios/:id', getPortfolioById);

export default router;
