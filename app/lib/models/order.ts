import mongoose, { Schema, Document } from 'mongoose';

// Garantir que o modelo Product seja registrado antes de ser usado nas referências
try {
  // Importar o modelo Product se não estiver no cache
  if (!mongoose.models.Product) {
    require('./product');
    console.log('Modelo Product carregado pelo Order');
  }
} catch (error) {
  console.warn('Erro ao carregar modelo Product:', error);
}

// Interface para itens de pedido
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  variant: string;
  price: number;
  name: string;
}

// Interface para metadata
export interface IOrderMetadata {
  adminNotes?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
  trackingCode?: string;
  deliveryStatus?: string;
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
    pixQrCode?: string;
    pixQrCodeBase64?: string;
    pixCopyPaste?: string;
    expirationDate?: Date;
    notificationUrl?: string;
    externalReference?: string;
  };
  couponApplied?: mongoose.Types.ObjectId;
  discountAmount: number;
  createdAt: Date;
  updatedAt: Date;
  productAssigned: boolean; // Indica se o produto já foi atribuído ao usuário
  metadata?: IOrderMetadata;
  customerData?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    cpf?: string;
    phone?: string;
    address?: string;
  };
  notes?: Array<{
    content: string;
    addedBy: string;
    addedAt: Date;
  }>;
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
  }>;
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
      pixQrCode: String,
      pixQrCodeBase64: String,
      pixCopyPaste: String,
      expirationDate: Date,
      notificationUrl: String,
      externalReference: String,
    },
    couponApplied: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    productAssigned: {
      type: Boolean,
      default: false,
    },
    metadata: {
      adminNotes: String,
      lastUpdatedBy: String,
      lastUpdatedAt: Date,
      trackingCode: String,
      deliveryStatus: String
    },
    customerData: {
      firstName: String,
      lastName: String,
      email: String,
      cpf: String,
      phone: String,
      address: String
    },
    notes: [{
      content: String,
      addedBy: String,
      addedAt: { type: Date, default: Date.now }
    }],
    statusHistory: [{
      status: String,
      changedBy: String,
      changedAt: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar a performance
orderSchema.index({ user: 1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ 'paymentInfo.id': 1 });
orderSchema.index({ 'paymentInfo.externalReference': 1 });

// Verificar se o modelo já existe antes de criar um novo
const Order = mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);

export default Order; 