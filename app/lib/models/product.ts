import mongoose, { Schema, Document } from 'mongoose';

// Interface para cada variante/plano do produto
interface IVariant {
  name: string;
  description?: string;
  price: number;
  stock: number;
  features: string[];
}

// Interface principal do produto
export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  images: string[];
  category?: mongoose.Types.ObjectId;
  variants: IVariant[];
  featured: boolean;
  requirements: string[];
  status: 'indetectavel' | 'detectavel' | 'manutencao' | 'beta';
  createdAt: Date;
  updatedAt: Date;
}

// Schema para a variante
const variantSchema = new Schema<IVariant>({
  name: {
    type: String,
    required: [true, 'Nome da variante é obrigatório'],
    trim: true,
  },
  description: {
    type: String,
    required: false,
    default: '',
  },
  price: {
    type: Number,
    required: [true, 'Preço é obrigatório'],
    min: [0, 'Preço não pode ser negativo'],
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Estoque não pode ser negativo'],
  },
  features: [{
    type: String,
    trim: true,
  }],
});

// Schema principal do produto
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Nome do produto é obrigatório'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Descrição é obrigatória'],
    },
    shortDescription: {
      type: String,
      required: false,
      default: '',
      maxlength: [200, 'Descrição curta não pode exceder 200 caracteres'],
    },
    images: [{
      type: String,
      required: [true, 'Pelo menos uma imagem é obrigatória'],
    }],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    variants: {
      type: [variantSchema],
      validate: {
        validator: function(variants: IVariant[]) {
          return variants && variants.length > 0;
        },
        message: 'Pelo menos uma variante é obrigatória',
      }
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['indetectavel', 'detectavel', 'manutencao', 'beta'],
      default: 'indetectavel',
    },
    requirements: [{
      type: String,
      trim: true,
    }],
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar a performance de consultas
productSchema.index({ name: 'text', description: 'text', shortDescription: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });

// Verificar se o modelo já existe antes de criar um novo
const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product; 