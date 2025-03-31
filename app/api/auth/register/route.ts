import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Verificar se já existe o modelo de imagem, se não existir, criar
let Image;
try {
  Image = mongoose.model('Image');
} catch (error) {
  // Criar esquema para armazenar imagens
  const imageSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    data: Buffer,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  });
  
  Image = mongoose.model('Image', imageSchema);
}

export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Processar o formData
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const profileImage = formData.get('profileImage') as File | null;
    
    // Validar dados
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { message: 'Este email já está em uso' },
          { status: 400 }
        );
      }
      
      if (existingUser.username === username) {
        return NextResponse.json(
          { message: 'Este nome de usuário já está em uso' },
          { status: 400 }
        );
      }
    }
    
    // Criar objeto de usuário inicial
    const userData = {
      username,
      email,
      password,
      role: 'user', // Papel padrão é usuário comum
    };
    
    // Processar imagem de perfil se fornecida
    let imageUrl = null;
    let newImage = null;
    if (profileImage) {
      // Verificar tipo de arquivo
      if (!profileImage.type.startsWith('image/')) {
        return NextResponse.json(
          { message: 'O arquivo deve ser uma imagem' },
          { status: 400 }
        );
      }
      
      // Verificar tamanho (2MB)
      if (profileImage.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          { message: 'A imagem deve ter no máximo 2MB' },
          { status: 400 }
        );
      }
      
      try {
        // Ler os bytes da imagem
        const bytes = await profileImage.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Gerar um ID único para a imagem
        const imageId = uuidv4();
        const filename = `${imageId}.${profileImage.type.split('/')[1]}`;
        
        // Criar nova imagem para armazenar no MongoDB (sem salvar ainda)
        newImage = new Image({
          filename,
          contentType: profileImage.type,
          data: buffer,
          // Não definimos userId ainda pois o usuário ainda não existe
        });
        
        // Gerar URL para acessar a imagem
        imageUrl = `/api/images/${imageId}`;
        
        // Adicionar a URL da imagem ao usuário
        userData.profileImage = imageUrl;
      } catch (imageError) {
        console.error('Erro ao processar imagem:', imageError);
        // Continuar com o registro sem a imagem se houver erro
      }
    }
    
    // Criar novo usuário com possível imagem de perfil
    const user = new User(userData);
    
    // Salvar usuário no banco de dados
    await user.save();
    
    // Se tiver imagem, salvar e associar ao usuário recém-criado
    if (newImage && user._id) {
      try {
        // Atribuir o ID do usuário à imagem e salvar
        newImage.userId = user._id;
        await newImage.save();
        console.log('Imagem de perfil salva com sucesso para o usuário:', user.username);
      } catch (imageSaveError) {
        console.error('Erro ao salvar imagem de perfil:', imageSaveError);
        // Não falharemos o registro apenas porque a imagem falhou
      }
    }
    
    // Retornar resposta de sucesso
    return NextResponse.json(
      {
        message: 'Usuário registrado com sucesso',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          profileImage: userData.profileImage
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro no registro:', error);
    
    // Erro de validação do Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      
      return NextResponse.json(
        { message: messages.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
} 