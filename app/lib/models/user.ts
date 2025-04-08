import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  name: string;
  profileImage?: string; // URL para a imagem (/api/images/[id])
  role: 'admin' | 'user' | 'developer';
  products: mongoose.Types.ObjectId[];
  memberNumber: number | null;
  cpf?: string;
  address?: string;
  phone?: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Estender a interface do modelo para incluir o método estático
interface UserModel extends mongoose.Model<IUser> {
  createWithHash(userData: any): Promise<IUser>;
}

// Função para gerar número de membro único
function generateUniqueNumber(min = 100000, max = 999999) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Método personalizado para gerar número de membro
async function generateUniqueMemberNumber(
  this: mongoose.Model<IUser>,
  retries = 5
): Promise<number | null> {
  if (retries <= 0) return null;

  const randomNumber = generateUniqueNumber();
  const existingUser = await this.findOne({ memberNumber: randomNumber });

  if (!existingUser) {
    return randomNumber;
  }

  // Tentar novamente se o número já estiver em uso
  return generateUniqueMemberNumber.call(this, retries - 1);
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
      // Agora pode armazenar URLs para o endpoint de imagens
      // ex: /api/images/[id]
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'user', 'developer'],
        message: "O campo 'role' deve ser 'admin', 'user' ou 'developer'"
      },
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
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpiry: {
      type: Date,
      default: undefined,
    }
  },
  {
    timestamps: true,
  }
);

// Gerar hash da senha antes de salvar
userSchema.pre('save', async function (next) {
  // Só executar se o documento for novo ou se a senha foi modificada
  if (this.isNew || this.isModified('password')) {
    try {
      // Hash da senha
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      
      // Gerar número de membro se for um novo usuário e não tiver um número
      if (this.isNew && !this.memberNumber) {
        this.memberNumber = await generateUniqueMemberNumber.call(this.constructor as any);
      }
      
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Método para comparar senha - simplificado e seguro
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    // Carregar a senha se necessário
    let storedHash = this.password;
    if (!storedHash) {
      const user = await (this.constructor as any).findById(this._id).select('+password');
      
      if (!user || !user.password) {
        return false;
      }
      
      storedHash = user.password;
    }
    
    // Verificar com bcrypt
    return await bcrypt.compare(candidatePassword, storedHash);
  } catch (error) {
    // Registro de erro apenas para fins de monitoramento, sem expor detalhes
    console.error('Erro ao verificar senha para usuário:', this._id);
    return false;
  }
};

// Método estático para criar um novo usuário com senha já hasheada
userSchema.statics.createWithHash = async function(userData) {
  try {
    console.log('Criando usuário com método otimizado');
    
    // Gerar hash da senha com bcrypt diretamente
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Criar objeto com todos os dados e senha hasheada
    const userWithHash = {
      ...userData,
      password: hashedPassword
    };
    
    // Se for novo usuário e não tiver número de membro, gerar um
    if (!userWithHash.memberNumber) {
      userWithHash.memberNumber = await generateUniqueMemberNumber.call(this);
    }
    
    console.log('Hash de senha gerado com bcrypt diretamente');
    
    // Usar create diretamente para pular o middleware pre-save
    return await this.create(userWithHash);
  } catch (error) {
    console.error('Erro ao criar usuário com hash direto:', error);
    throw error;
  }
};

// Verificar se o modelo já existe antes de criar um novo
const User = mongoose.models.User || mongoose.model<IUser, UserModel>('User', userSchema);

export default User; 