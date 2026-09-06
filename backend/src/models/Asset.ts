import mongoose, { Schema, Document } from 'mongoose';

export type AssetClass = 'EQUITY' | 'GOVERNMENT_BOND' | 'CORPORATE_BOND' | 'GOLD' | 'CASH';

export interface IHistoricalPrice {
  date: Date;
  close: number;
}

export interface IAsset extends Document {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  sector: string;
  currentPrice: number;
  currency: string;
  historicalPrices: IHistoricalPrice[];
  liquidityScore: number;
  minWeight: number;
  maxWeight: number;
  scenarioShock?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const HistoricalPriceSchema = new Schema(
  {
    date: { type: Date, required: true },
    close: { type: Number, required: true },
  },
  { _id: false }
);

const AssetSchema: Schema = new Schema(
  {
    symbol: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    assetClass: {
      type: String,
      enum: ['EQUITY', 'GOVERNMENT_BOND', 'CORPORATE_BOND', 'GOLD', 'CASH'],
      required: true,
    },
    sector: { type: String, default: 'General' },
    currentPrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    historicalPrices: [HistoricalPriceSchema],
    liquidityScore: { type: Number, default: 80, min: 0, max: 100 },
    minWeight: { type: Number, default: 0, min: 0, max: 1 },
    maxWeight: { type: Number, default: 1, min: 0, max: 1 },
    scenarioShock: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Asset = mongoose.model<IAsset>('Asset', AssetSchema);
