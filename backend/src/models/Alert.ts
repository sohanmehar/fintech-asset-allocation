import mongoose, { Schema, Document } from 'mongoose';

export type AlertSeverity = 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface IAlert extends Document {
  portfolioId: mongoose.Types.ObjectId;
  severity: AlertSeverity;
  type: string;
  title?: string;
  message: string;
  metric?: string;
  currentValue?: number;
  threshold?: number;
  limitValue?: number;
  excessValue?: number;
  recommendation?: string;
  source?: string;
  status: AlertStatus;
  createdAt: Date;
  updatedAt?: Date;
}

const AlertSchema: Schema = new Schema(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: 'Portfolio', required: true },
    severity: {
      type: String,
      enum: ['INFO', 'WARNING', 'HIGH', 'CRITICAL'],
      required: true,
    },
    type: { type: String, required: true },
    title: { type: String },
    message: { type: String, required: true },
    metric: { type: String },
    currentValue: { type: Number },
    threshold: { type: Number },
    limitValue: { type: Number },
    excessValue: { type: Number },
    recommendation: { type: String },
    source: { type: String, default: 'GOVERNANCE_ENGINE' },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'OPEN',
    },
  },
  { timestamps: true }
);

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
