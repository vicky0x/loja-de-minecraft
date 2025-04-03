import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import connectDBModule from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

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
    // Verificar se a requisição é multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    let username, email, password;
    let profileImage = null;
    
    if (contentType.includes('multipart/form-data')) {
      // Processar como FormData
      const formData = await request.formData();
      username = formData.get('username') as string;
      email = formData.get('email') as string;
      password = formData.get('password') as string;
      
      // Verificar se há imagem de perfil
      profileImage = formData.get('profileImage') as File | null;
    } else {
      // Tentar processar como JSON para compatibilidade
      try {
        const jsonData = await request.json();
        username = jsonData.username;
        email = jsonData.email;
        password = jsonData.password;
      } catch (jsonError) {
        console.error('Erro ao processar dados JSON:', jsonError);
        return NextResponse.json(
          { message: 'Formato de dados inválido' },
          { status: 400 }
        );
      }
    }

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Usar a função de conexão apropriada
    if (connectDB) {
      await connectDB();
    } else if (connectDBModule) {
      await connectDBModule();
    } else {
      throw new Error('Função de conexão com o MongoDB não encontrada');
    }

    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'Este e-mail já está em uso' },
        { status: 400 }
      );
    }

    // Verificar se o username já está em uso
    const existingUsername = await User.findOne({ username });
    
    if (existingUsername) {
      return NextResponse.json(
        { message: 'Este nome de usuário já está em uso' },
        { status: 400 }
      );
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Dados do usuário para criação
    const userData = {
      username,
      email,
      password: hashedPassword,
      role: 'user'
    };

    // Processar imagem de perfil, se fornecida
    let imageUrl = '';
    if (profileImage && typeof profileImage === 'object' && 'type' in profileImage) {
      console.log('Processando imagem de perfil...');
      
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
      
      // Ler os bytes da imagem
      const bytes = await profileImage.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Gerar um ID único para a imagem
      const imageId = uuidv4();
      const filename = `${imageId}.${profileImage.type.split('/')[1]}`;
      
      // Definir URL da imagem
      imageUrl = `/api/images/${imageId}`;
      
      // Adicionar URL da imagem aos dados do usuário
      userData.profileImage = imageUrl;
      
      // Criar imagem temporária no modelo - será atualizada após criar o usuário
      const newImage = new Image({
        filename: filename,
        contentType: profileImage.type,
        data: buffer
      });
      
      // Salvar a imagem no banco de dados
      await newImage.save();
      console.log('Imagem de perfil salva temporariamente:', imageId);
    }

    // Criar novo usuário
    const user = await User.create(userData);
    
    // Se houver imagem, atualizar a referência do usuário
    if (imageUrl && Image) {
      const userObjectId = new mongoose.Types.ObjectId(user._id);
      await Image.findOneAndUpdate(
        { filename: new RegExp(`^${imageUrl.split('/').pop()}`) },
        { userId: userObjectId }
      );
    }

    // Gerar token JWT
    const token = await new SignJWT({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key'));

    // Definir o cookie de autenticação
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
    });

    // Retornar dados do usuário (sem a senha)
    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: userData.profileImage
      }
    });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
} 