import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  description: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  maxUses: number;
  usedCount: number;
  minAmount: number;
  maxAmount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  products: mongoose.Types.ObjectId[];
  categories: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    code: {
      type: String,
      required: [true, 'Código do cupom é obrigatório'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    discount: {
      type: Number,
      required: [true, 'Valor do desconto é obrigatório'],
      min: [0, 'Desconto não pode ser negativo'],
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    maxUses: {
      type: Number,
      default: 0, // 0 = ilimitado
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    minAmount: {
      type: Number,
      default: 0,
    },
    maxAmount: {
      type: Number,
      default: 0, // 0 = sem limite
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: function() {
        // Por padrão, válido por 30 dias a partir da criação
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    products: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
    categories: [{
      type: Schema.Types.ObjectId,
      ref: 'Category',
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar a performance
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

// Verificar se o modelo já existe antes de criar um novo
const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);

export default Coupon; 