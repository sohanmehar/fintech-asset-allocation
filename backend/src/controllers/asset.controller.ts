import { Request, Response, NextFunction } from 'express';
import { assetService } from '../services/asset.service';

export const getAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const assets = await assetService.getAllAssets();
    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
};

export const getAssetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id as string;
    const asset = await assetService.getAssetByIdOrSymbol(id);

    if (!asset) {
      res.status(404).json({
        success: false,
        message: `Asset with ID or symbol '${id}' not found.`,
        error: 'ASSET_NOT_FOUND',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
};
