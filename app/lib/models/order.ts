import mongoose, { Schema, Document } from 'mongoose';

// Interface para itens de pedido
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  variant: string;
  price: number;
  name: string;
}

// Interface para pedido
export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  orderItems: IOrderItem[];
  totalAmount: number;
  paymentMethod: 'pix' | 'credit_card';
  paymentInfo: {
    id?: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    method: string;
    receiptUrl?: string;
  };
  couponApplied?: mongoose.Types.ObjectId;
  discountAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variant: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderItems: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['pix', 'credit_card'],
      required: true,
    },
    paymentInfo: {
      id: String,
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
      },
      method: String,
      receiptUrl: String,
    },
    couponApplied: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Verificar se o modelo já existe antes de criar um novo
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order; 