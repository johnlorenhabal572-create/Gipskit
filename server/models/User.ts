import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'customer' | 'admin' | 'staff';
  createdAt: Date;
  lastLogin: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['customer', 'admin', 'staff'], 
      default: 'customer',
      index: true
    },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
