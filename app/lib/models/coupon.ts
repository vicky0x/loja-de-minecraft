import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number;
  currentUses: number;
  validFrom: Date;
  validUntil: Date;
  active: boolean;
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
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Tipo de desconto é obrigatório'],
    },
    value: {
      type: Number,
      required: [true, 'Valor do desconto é obrigatório'],
      min: [0, 'Valor do desconto não pode ser negativo'],
    },
    maxUses: {
      type: Number,
      default: 0, // 0 significa ilimitado
    },
    currentUses: {
      type: Number,
      default: 0,
    },
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: [true, 'Data de validade é obrigatória'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Verificar se o modelo já existe antes de criar um novo
const Coupon = mongoose.models.Coupon || mongoose.model<ICoupon>('Coupon', couponSchema);

export default Coupon; 