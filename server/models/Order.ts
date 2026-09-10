import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  id: number | string;
  name: string;
  price: number;
  quantity: number;
  inventoryLinkId?: string | null;
  inventoryLinkIds?: string[];
  unit?: string;
  image?: string;
  category?: string;
}

export interface IOrderCustomer {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  facebook?: string;
}

export interface IOrder extends Document {
  id: string; // e.g. 'ORD-1718...'
  customer: IOrderCustomer;
  userEmail?: string;
  userName?: string;
  items: IOrderItem[];
  subtotal?: number;
  total: number;
  amountPaid?: number;
  change?: number;
  paymentMethod: string;
  paymentStatus: 'Unpaid' | 'Paid' | 'Refunded' | 'Cancelled';
  status: 'Pending' | 'Paid' | 'Processing' | 'Cooking' | 'Ready for Pickup' | 'Ready to Pickup' | 'On Delivery' | 'Completed' | 'Cancelled';
  orderType: 'POS' | 'Online';
  paymentScreenshot?: string;
  adminViewed?: boolean;
  adminViewedAt?: Date | null;
  customerViewedStatus?: string;
  customerLastViewedAt?: Date | null;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    id: { type: Schema.Types.Mixed, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    inventoryLinkId: { type: String, default: null },
    inventoryLinkIds: { type: [String], default: [] },
    unit: { type: String, default: 'pcs' },
    image: { type: String, default: '' },
    category: { type: String, default: '' }
  },
  { _id: false }
);

const OrderCustomerSchema = new Schema<IOrderCustomer>(
  {
    name: { type: String, required: true, default: 'Walk-in Customer' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    facebook: { type: String, default: '' }
  },
  { _id: false }
);

const OrderSchema: Schema<IOrder> = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    customer: { type: OrderCustomerSchema, required: true },
    userEmail: { type: String, default: '', index: true },
    userName: { type: String, default: '' },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, default: 0 },
    total: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    change: { type: Number, default: 0 },
    paymentMethod: { 
      type: String, 
      default: 'Cash',
      index: true
    },
    paymentStatus: { 
      type: String, 
      enum: ['Unpaid', 'Paid', 'Refunded', 'Cancelled'], 
      default: 'Unpaid',
      index: true
    },
    status: { 
      type: String, 
      enum: ['Pending', 'Paid', 'Processing', 'Cooking', 'Ready for Pickup', 'Ready to Pickup', 'On Delivery', 'Completed', 'Cancelled'], 
      default: 'Pending',
      index: true
    },
    orderType: { 
      type: String, 
      enum: ['POS', 'Online'], 
      default: 'Online',
      index: true
    },
    paymentScreenshot: { type: String, default: '' },
    adminViewed: { type: Boolean, default: false, index: true },
    adminViewedAt: { type: Date, default: null },
    customerViewedStatus: { type: String, default: '' },
    customerLastViewedAt: { type: Date, default: null },
    date: { type: Date, default: Date.now, index: true }
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

export const Order: Model<IOrder> = 
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
