import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Nome da categoria é obrigatório'],
      unique: true,
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
    icon: {
      type: String,
      required: false,
      default: 'default-icon',
    },
  },
  {
    timestamps: true,
  }
);

// Índices para melhorar a performance de consultas
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ slug: 1 });

// Verificar se o modelo já existe antes de criar um novo
const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', categorySchema);

export default Category; 