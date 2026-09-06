import mongoose, { Schema, Document } from 'mongoose';

export interface IScenarioRun extends Document {
  portfolioId: mongoose.Types.ObjectId;
  scenarioType: string;
  parameters: Record<string, any>;
  beforeMetrics: Record<string, any>;
  stressedMetrics: Record<string, any>;
  assetImpacts: Record<string, any>;
  recommendations: string[];
  createdAt: Date;
}

const ScenarioRunSchema: Schema = new Schema(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    scenarioType: { type: String, required: true },
    parameters: { type: Schema.Types.Mixed, default: {} },
    beforeMetrics: { type: Schema.Types.Mixed, default: {} },
    stressedMetrics: { type: Schema.Types.Mixed, default: {} },
    assetImpacts: { type: Schema.Types.Mixed, default: {} },
    recommendations: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  }
);

export const ScenarioRun = mongoose.model<IScenarioRun>('ScenarioRun', ScenarioRunSchema);
