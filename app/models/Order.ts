import mongoose, { Schema, Document } from 'mongoose';

// Interface para o item do pedido
export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  variantId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  name: string;
}

// Interface para informações de pagamento
export interface IPaymentInfo {
  id?: string;
  status?: string;
  method?: string;
  provider?: string;
  externalReference?: string;
  qrCodeData?: string;
  qrCodeImage?: string;
  ticketUrl?: string;
  expirationDate?: Date;
  createdAt?: Date;
  paidAt?: Date;
}

// Interface para o documento do pedido
export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  status: string;
  total: number;
  paymentMethod: string;
  paymentInfo: IPaymentInfo;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para itens do pedido
const OrderItemSchema = new Schema<IOrderItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  variantId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
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

// Schema para informações de pagamento
const PaymentInfoSchema = new Schema<IPaymentInfo>({
  id: String,
  status: String,
  method: String,
  provider: String,
  externalReference: String,
  qrCodeData: String,
  qrCodeImage: String,
  ticketUrl: String,
  expirationDate: Date,
  createdAt: Date,
  paidAt: Date,
});

// Schema principal do pedido
const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [OrderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled', 'refunded', 'failed', 'expired'],
      default: 'pending',
    },
    total: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ['pix', 'credit_card', 'other', 'card'],
      required: true,
    },
    paymentInfo: PaymentInfoSchema,
    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema); 