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
  variants?: IVariant[];
  stock?: number; // Estoque do produto (quando não usa variantes)
  price?: number; // Preço do produto (quando não usa variantes)
  originalPrice?: number; // Preço original para mostrar desconto
  discountPercentage?: number; // Porcentagem de desconto
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
      required: false,
      default: [],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'Estoque não pode ser negativo'],
    },
    price: {
      type: Number,
      min: [0, 'Preço não pode ser negativo'],
    },
    originalPrice: {
      type: Number,
      min: [0, 'Preço original não pode ser negativo'],
      default: 0,
    },
    discountPercentage: {
      type: Number,
      min: [0, 'Desconto não pode ser negativo'],
      max: [99, 'Desconto não pode ser maior que 99%'],
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['indetectavel', 'detectavel', 'manutencao', 'beta'],
      required: false,
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

// Adicionar hook pre-save para log de depuração
productSchema.pre('save', function(next) {
  console.log('Pre-save do produto:');
  console.log('Status original:', this.status);

  // Normalizar o status apenas se ele existir
  if (this.status) {
    const statusLower = this.status.toLowerCase();
    
    // Normalizar para os valores aceitos pelo enum
    if (statusLower === 'indetectavel' || statusLower.includes('indetect')) {
      this.status = 'indetectavel';
    } 
    else if (statusLower === 'detectavel' || (statusLower.includes('detect') && !statusLower.includes('indetect'))) {
      this.status = 'detectavel';
    }
    else if (statusLower === 'manutencao' || statusLower.includes('manut')) {
      this.status = 'manutencao';
    }
    else if (statusLower === 'beta' || statusLower.includes('beta')) {
      this.status = 'beta';
    }
  }
  
  console.log('Status normalizado:', this.status);
  console.log('Produto completo:', this);
  next();
});

productSchema.pre('findOneAndUpdate', function(next) {
  console.log('Pre-findOneAndUpdate do produto:');
  console.log('Update operation:', this.getUpdate());
  next();
});

// Verificar se o modelo já existe antes de criar um novo
const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product; 