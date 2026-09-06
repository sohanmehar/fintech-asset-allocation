import mongoose, { Schema, Document } from 'mongoose';

export interface IRiskPolicy extends Document {
  name: string; // e.g. 'CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'
  maxIndividualAssetWeight: number; // e.g. 0.30 (30%)
  maxEquityExposure: number; // e.g. 0.40 (40%)
  minCashAllocation: number; // e.g. 0.10 (10%)
  minLiquidityScore: number; // e.g. 70
  maxPortfolioVolatility: number; // e.g. 0.10 (10%)
  maxDrawdown: number; // e.g. 0.20 (20%)
  warningThreshold: number; // e.g. 0.85 (85% of limit triggers warning)
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RiskPolicySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    maxIndividualAssetWeight: { type: Number, required: true, min: 0, max: 1 },
    maxEquityExposure: { type: Number, required: true, min: 0, max: 1 },
    minCashAllocation: { type: Number, required: true, min: 0, max: 1 },
    minLiquidityScore: { type: Number, required: true, min: 0, max: 100 },
    maxPortfolioVolatility: { type: Number, required: true, min: 0, max: 1 },
    maxDrawdown: { type: Number, required: true, min: 0, max: 1 },
    warningThreshold: { type: Number, default: 0.85, min: 0, max: 1 },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const RiskPolicy = mongoose.model<IRiskPolicy>('RiskPolicy', RiskPolicySchema);
