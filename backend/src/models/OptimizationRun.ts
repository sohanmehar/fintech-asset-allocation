import mongoose, { Schema, Document } from 'mongoose';

export type OptimizationStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface IOptimizationRun extends Document {
  portfolioId: mongoose.Types.ObjectId;
  riskProfile: string;
  parameters: Record<string, any>;
  beforeMetrics: Record<string, any>;
  afterMetrics: Record<string, any>;
  allocationBefore: Record<string, any>;
  allocationAfter: Record<string, any>;
  rebalanceActions: Record<string, any>;
  constraintResults: Record<string, any>;
  objectiveValue: number;
  status: OptimizationStatus;
  createdAt: Date;
}

const OptimizationRunSchema: Schema = new Schema(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    riskProfile: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed, default: {} },
    beforeMetrics: { type: Schema.Types.Mixed, default: {} },
    afterMetrics: { type: Schema.Types.Mixed, default: {} },
    allocationBefore: { type: Schema.Types.Mixed, default: {} },
    allocationAfter: { type: Schema.Types.Mixed, default: {} },
    rebalanceActions: { type: Schema.Types.Mixed, default: {} },
    constraintResults: { type: Schema.Types.Mixed, default: {} },
    objectiveValue: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    createdAt: { type: Date, default: Date.now },
  }
);

export const OptimizationRun = mongoose.model<IOptimizationRun>('OptimizationRun', OptimizationRunSchema);
