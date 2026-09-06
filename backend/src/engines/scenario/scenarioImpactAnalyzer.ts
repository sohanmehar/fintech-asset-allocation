import { AssetShockDetail } from './types';

export function rankAssetImpacts(impacts: AssetShockDetail[]): AssetShockDetail[] {
  return [...impacts].sort((a, b) => Math.abs(b.impactAmount) - Math.abs(a.impactAmount));
}
