import mongoose, { Schema, Document } from 'mongoose';

// Garantir que o modelo Product seja registrado antes de ser usado nas referências
try {
  // Importar o modelo Product se não estiver no cache
  if (!mongoose.models.Product) {
    require('./product');
    console.log('Modelo Product carregado pelo StockItem');
  }
} catch (error) {
  console.warn('Erro ao carregar modelo Product no StockItem:', error);
}

// Interface para cada item de estoque
export interface IStockItem extends Document {
  product: mongoose.Types.ObjectId;
  variant?: string; // ID da variante no array de variantes do produto (opcional para produtos sem variantes)
  code: string; // Código/chave única do produto digital
  isUsed: boolean; // Se já foi vendido/usado
  metadata?: Record<string, any>; // Metadados adicionais específicos do produto
  assignedTo?: mongoose.Types.ObjectId; // Usuário ao qual este item foi atribuído quando vendido
  assignedAt?: Date; // Data em que o item foi atribuído
  createdAt: Date;
  updatedAt: Date;
}

// Schema para itens de estoque
const stockItemSchema = new Schema<IStockItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Produto é obrigatório'],
    },
    variant: {
      type: String,
      required: false, // Não é mais obrigatório para permitir produtos sem variantes
      default: null,
    },
    code: {
      type: String,
      required: [true, 'Código/chave é obrigatório'],
      unique: true,
      trim: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar a performance de consultas
stockItemSchema.index({ product: 1, variant: 1 });
stockItemSchema.index({ isUsed: 1 });
stockItemSchema.index({ assignedTo: 1 });

// Verificar se o modelo já existe antes de criar um novo
const StockItem = mongoose.models.StockItem || mongoose.model<IStockItem>('StockItem', stockItemSchema);

export default StockItem; 