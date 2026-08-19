import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  inventoryLinkId?: string | null;
  status: 'Available' | 'Unavailable' | 'Not Available' | 'Out of Stock';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema<IProduct> = new Schema(
  {
    id: { type: Number, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: [0, 'Price must be a non-negative number'] },
    category: { type: String, required: true, trim: true, index: true },
    stock: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    image: { type: String, default: '' },
    inventoryLinkId: { type: String, default: null },
    status: { 
      type: String, 
      enum: ['Available', 'Unavailable', 'Not Available', 'Out of Stock'], 
      default: 'Available' 
    },
    description: { type: String, default: '' }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.__v;
        return ret;
      }
    }
  }
);

export const Product: Model<IProduct> = 
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
