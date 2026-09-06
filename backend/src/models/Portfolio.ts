import mongoose, { Schema, Document } from 'mongoose';

export type RiskProfile = 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';

export interface IHolding {
  assetId: mongoose.Types.ObjectId;
  symbol?: string;
  quantity: number;
  currentValue: number;
  weight: number;
}

export interface IPortfolio extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  totalCapital: number;
  holdings: IHolding[];
  riskProfile: RiskProfile;
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new Schema(
  {
    assetId: { type: Schema.Types.ObjectId, ref: 'Asset', required: true },
    symbol: { type: String, required: false },
    quantity: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0, max: 1 },
  },
  { _id: false }
);

const PortfolioSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalCapital: { type: Number, required: true, min: 0 },
    holdings: [HoldingSchema],
    riskProfile: {
      type: String,
      enum: ['CONSERVATIVE', 'BALANCED', 'AGGRESSIVE'],
      required: true,
    },
  },
  { timestamps: true }
);

export const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);
