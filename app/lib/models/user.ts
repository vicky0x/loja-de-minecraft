import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  name: string;
  profileImage?: string;
  role: 'admin' | 'user';
  products: mongoose.Types.ObjectId[];
  memberNumber: number | null;
  cpf?: string;
  address?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Gera um número de membro aleatório único
async function generateMemberNumber() {
  // Gerar um número aleatório de 6 dígitos
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  
  // Verificar se já existe um usuário com este número
  const existingUser = await mongoose.models.User?.findOne({ memberNumber: randomNumber });
  
  // Se existir, tentar novamente de forma recursiva
  if (existingUser) {
    return generateMemberNumber();
  }
  
  return randomNumber;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Nome de usuário é obrigatório'],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [6, 'A senha deve ter no mínimo 6 caracteres'],
      select: false,
    },
    name: {
      type: String,
      trim: true,
      default: '',
    },
    profileImage: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'user',
    },
    memberNumber: {
      type: Number,
      unique: true,
      default: null,
    },
    cpf: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    products: [{
      type: Schema.Types.ObjectId,
      ref: 'Product',
    }],
  },
  {
    timestamps: true,
  }
);

// Gerar memberNumber antes de salvar, se não existir
userSchema.pre('save', async function(next) {
  try {
    // Se for um novo documento e não tiver memberNumber definido
    if (this.isNew && this.memberNumber === null) {
      this.memberNumber = await generateMemberNumber();
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Criptografar senha antes de salvar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar senhas
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

// Verificar se o modelo já existe antes de criar um novo
const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User; 