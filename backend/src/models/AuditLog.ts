import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  userId?: mongoose.Types.ObjectId | string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
}

const AuditLogSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.Mixed },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: String },
    details: { type: Schema.Types.Mixed, default: {} },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
  }
);

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
