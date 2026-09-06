import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'ADMIN' | 'RISK_OFFICER' | 'FINANCIAL_OFFICER';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['ADMIN', 'RISK_OFFICER', 'FINANCIAL_OFFICER'],
      default: 'RISK_OFFICER',
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
