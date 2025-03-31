import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
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

export async function POST(req: NextRequest) {
  console.log('Recebida requisição para upload de imagem de perfil');
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    console.log('Resultado da autenticação:', authResult);
    
    if (!authResult.isAuthenticated) {
      console.log('Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = authResult.user.id;
    console.log('ID do usuário autenticado:', userId);
    
    // Processar o upload de arquivo    
    const formData = await req.formData();
    const file = formData.get('profileImage') as File;
    
    if (!file) {
      console.log('Nenhuma imagem encontrada no formulário');
      return NextResponse.json(
        { error: 'Nenhuma imagem fornecida' },
        { status: 400 }
      );
    }
    
    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      console.log('Tipo de arquivo inválido:', file.type);
      return NextResponse.json(
        { error: 'O arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }
    
    // Verificar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.log('Tamanho do arquivo excede o limite:', file.size);
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 2MB' },
        { status: 400 }
      );
    }
    
    // Ler os bytes da imagem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Gerar um ID único para a imagem
    const imageId = uuidv4();
    const filename = `${imageId}.${file.type.split('/')[1]}`;
    
    await connectDB();
    
    // Armazenar imagem no MongoDB
    const newImage = new Image({
      filename: filename,
      contentType: file.type,
      data: buffer,
      userId: new mongoose.Types.ObjectId(userId)
    });
    
    console.log('Salvando imagem no MongoDB...');
    await newImage.save();
    console.log('Imagem salva com sucesso');
    
    // Criar URL para acessar a imagem
    const imageUrl = `/api/images/${imageId}`;
    
    // Atualizar o usuário no banco de dados
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { profileImage: imageUrl },
      { new: true }
    );
    
    if (!updatedUser) {
      console.log('Usuário não encontrado no banco de dados');
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('Perfil atualizado com sucesso');
    return NextResponse.json(
      { 
        message: 'Imagem de perfil atualizada com sucesso',
        imageUrl
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao processar upload de imagem:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upload de imagem' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = authResult.user.id;
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter o usuário para verificar a imagem atual
    const user = await User.findById(userId);
    if (user && user.profileImage) {
      // Extrair o ID da imagem da URL
      const imageId = user.profileImage.split('/').pop();
      
      // Remover a imagem do MongoDB se existir
      if (imageId) {
        await Image.deleteOne({ filename: new RegExp(`^${imageId}`) });
      }
    }
    
    // Remover a referência à imagem de perfil
    await User.findByIdAndUpdate(userId, { profileImage: '' });
    
    return NextResponse.json(
      { message: 'Imagem de perfil removida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover imagem de perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao remover imagem de perfil' },
      { status: 500 }
    );
  }
} 