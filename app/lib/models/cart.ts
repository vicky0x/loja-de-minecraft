import mongoose, { Schema, Document } from 'mongoose';

// Interface para o item no carrinho
export interface ICartItem extends Document {
  productId: mongoose.Types.ObjectId;
  productName: string;
  productImage?: string;
  variantId: mongoose.Types.Mixed;
  variantName: string;
  price: number;
  quantity: number;
  stock?: number;
  hasVariants?: boolean;
  updatedAt: Date;
}

// Interface principal do carrinho
export interface ICart extends Document {
  userId: mongoose.Types.ObjectId;
  items: ICartItem[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema para item no carrinho
const cartItemSchema = new Schema<ICartItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    default: '',
  },
  variantId: {
    type: Schema.Types.Mixed,
    required: true,
  },
  variantName: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  stock: {
    type: Number,
    default: null,
  },
  hasVariants: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

// Schema principal do carrinho
const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Um usuário só pode ter um carrinho
    },
    items: [cartItemSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Atualizar o timestamp do carrinho sempre que for modificado
cartSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

// Índices para melhorar performance
cartSchema.index({ userId: 1 }, { unique: true });
cartSchema.index({ 'items.productId': 1 });
cartSchema.index({ 'items.variantId': 1 });

// Verificar se o modelo já existe antes de criar um novo
const Cart = mongoose.models.Cart || mongoose.model<ICart>('Cart', cartSchema);

export default Cart; 