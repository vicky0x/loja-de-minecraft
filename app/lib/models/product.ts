import mongoose, { Schema, Document } from 'mongoose';

// Interface para cada variante/plano do produto
interface IVariant {
  name: string;
  description?: string;
  price: number;
  stock: number;
  features: string[];
  deliveryType?: 'automatic' | 'manual'; // Tipo de entrega por variante
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
  deliveryType: 'automatic' | 'manual'; // Tipo de entrega - automática ou manual
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
  deliveryType: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'automatic',
  },
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
      default: null,
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
    deliveryType: {
      type: String,
      enum: ['automatic', 'manual'],
      default: 'automatic',
      required: [true, 'Tipo de entrega é obrigatório'],
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
productSchema.index({ deliveryType: 1 });

// Adicionar hook pre-save para log de depuração e gestão de estoque para entrega manual
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

  // Para produtos com entrega manual, definir estoque como um número alto (praticamente infinito)
  if (this.deliveryType === 'manual') {
    // Se o produto principal tiver entrega manual, definir estoque como "infinito"
    if (!this.variants || this.variants.length === 0) {
      this.stock = 99999;
    } else {
      // Para variantes com entrega manual, definir estoque como "infinito"
      this.variants = this.variants.map(variant => {
        if (variant.deliveryType === 'manual') {
          variant.stock = 99999;
        }
        return variant;
      });
    }
  }
  
  console.log('Status normalizado:', this.status);
  console.log('Produto completo:', this);
  next();
});

productSchema.pre('findOneAndUpdate', async function(next) {
  console.log('Pre-findOneAndUpdate do produto:');
  console.log('Update operation:', this.getUpdate());

  // Verificar se estamos atualizando o tipo de entrega
  const update = this.getUpdate() as any;
  
  try {
    // Sempre buscar o produto atual primeiro para poder comparar valores
    const currentProduct = await this.model.findOne(this.getQuery());
    
    if (!currentProduct) {
      console.warn('Produto não encontrado durante pre-findOneAndUpdate');
      return next();
    }
    
    // Registrar valores para debug
    console.log('Produto atual:', {
      id: currentProduct._id,
      nome: currentProduct.name,
      deliveryType: currentProduct.deliveryType,
      stock: currentProduct.stock
    });
    
    // Se tivermos um tipo de entrega definido, vamos registrá-lo
    if (update && update.deliveryType) {
      console.log('Tipo de entrega sendo atualizado para:', update.deliveryType);
      
      // Verificar se o tipo de entrega é válido
      if (!['automatic', 'manual'].includes(update.deliveryType)) {
        console.warn(`Tipo de entrega inválido: ${update.deliveryType}, definindo para 'automatic'`);
        update.deliveryType = 'automatic';
      }
      
      // Se estiver mudando de manual para automático
      if (update.deliveryType === 'automatic' && currentProduct.deliveryType === 'manual') {
        console.log('ALTERAÇÃO CRÍTICA: Mudando de entrega manual para automática, ajustando estoque');
        
        // Verificar se o estoque atual é infinito (99999)
        if (currentProduct.stock === 99999) {
          // Forçar estoque para 0
          update.stock = 0;
          console.log('CORREÇÃO: Estoque redefinido de infinito (99999) para zero (0)');
        } else if (!update.stock && update.stock !== 0) {
          // Se não houver definição de estoque na atualização, definir como 0
          update.stock = 0;
          console.log('CORREÇÃO: Estoque não definido na atualização, definindo como zero (0)');
        }
      }
      // Se estiver mudando para entrega manual, definir estoque como "infinito"
      else if (update.deliveryType === 'manual') {
        // Atualizar estoque apenas se não houver variantes
        if (!update.variants || update.variants.length === 0) {
          update.stock = 99999;
          console.log('Entrega manual: estoque definido como 99999');
        }
      }
    } else if (update) {
      // Se o tipo de entrega não estiver definido na atualização,
      // vamos manter o valor atual para garantir consistência
      update.deliveryType = currentProduct.deliveryType;
      console.log(`Preservando tipo de entrega existente: ${currentProduct.deliveryType}`);
      
      // Se for manual, garantir que o estoque seja mantido como infinito
      if (currentProduct.deliveryType === 'manual') {
        if (!update.variants || update.variants.length === 0) {
          update.stock = 99999;
          console.log('Preservando estoque infinito para entrega manual');
        }
      }
    }

    // Processar variantes se existirem
    if (update && update.variants) {
      // Atualizar o estoque das variantes com base no tipo de entrega
      update.variants = update.variants.map((variant: IVariant, index: number) => {
        // Verificar se havia uma variante correspondente antes
        const currentVariant = currentProduct && 
                              currentProduct.variants && 
                              currentProduct.variants[index];
        
        // Se estiver mudando de manual para automático
        if (variant.deliveryType === 'automatic' && 
            currentVariant && 
            currentVariant.deliveryType === 'manual' && 
            currentVariant.stock === 99999) {
          
          variant.stock = 0; // Redefinir estoque para 0
          console.log(`Variante ${variant.name}: alterada para entrega automática, estoque redefinido para 0`);
        }
        // Se continuar como manual ou mudar para manual
        else if (variant.deliveryType === 'manual') {
          variant.stock = 99999;
          console.log(`Variante ${variant.name}: entrega manual, estoque definido como 99999`);
        }
        
        return variant;
      });
    }
  } catch (err) {
    console.error('Erro ao processar atualização de produto:', err);
    
    // Em caso de erro, proceder com cuidado
    if (update && update.deliveryType === 'automatic') {
      // Se estiver definindo como automático, garantir estoque mínimo
      if (!update.stock && update.stock !== 0) {
        update.stock = 0;
      }
    } else if (update && update.deliveryType === 'manual') {
      // Se estiver definindo como manual, garantir estoque infinito
      update.stock = 99999;
    }
    
    // Processar variantes com lógica básica
    if (update && update.variants) {
      update.variants = update.variants.map((variant: IVariant) => {
        if (variant.deliveryType === 'manual') {
          variant.stock = 99999;
        }
        return variant;
      });
    }
  }

  next();
});

// Verificar se o modelo já existe antes de criar um novo
const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);

export default Product; 