const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Configuração do MongoDB
const dbUrl = 'mongodb://localhost:27017/cheatsstore';

// Definir o modelo de usuário
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Adicionar método para criptografar a senha
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    console.log('Conectando ao MongoDB...');
    await mongoose.connect(dbUrl);
    console.log('Conectado com sucesso ao MongoDB');

    // Verificar se já existe um usuário admin
    const existingAdmin = await User.findOne({ email: 'admin@fantasia.com' });
    
    if (existingAdmin) {
      console.log('Um usuário administrador já existe no sistema.');
      console.log('Email: admin@fantasia.com');
      await mongoose.disconnect();
      return;
    }

    // Criar o usuário admin
    const adminUser = new User({
      username: 'admin',
      email: 'admin@fantasia.com',
      password: 'admin123',
      role: 'admin'
    });

    await adminUser.save();
    
    console.log('Usuário administrador criado com sucesso!');
    console.log('Email: admin@fantasia.com');
    console.log('Senha: admin123');
    
    await mongoose.disconnect();
    console.log('Desconectado do MongoDB');
    
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
    await mongoose.disconnect();
  }
}

// Executar a função
createAdminUser(); 