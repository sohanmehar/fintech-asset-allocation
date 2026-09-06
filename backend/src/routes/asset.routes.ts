import { Router } from 'express';
import { getAssets, getAssetById } from '../controllers/asset.controller';

const router = Router();

router.get('/assets', getAssets);
router.get('/assets/:id', getAssetById);

export default router;
