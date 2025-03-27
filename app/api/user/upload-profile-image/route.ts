import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
    
    // Criar nome de arquivo único
    const fileExt = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExt}`;
    
    // Definir caminho de upload
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    const filePath = path.join(uploadDir, fileName);
    
    console.log('Tentando salvar imagem em:', filePath);
    
    // Garantir que o diretório exista
    try {
      // Criar diretório recursivamente se não existir
      await mkdir(uploadDir, { recursive: true });
      console.log('Diretório de upload verificado/criado com sucesso');
      
      // Salvar arquivo
      await writeFile(filePath, buffer);
      console.log('Arquivo salvo com sucesso');
    } catch (error) {
      console.error('Erro ao salvar arquivo:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar imagem' },
        { status: 500 }
      );
    }
    
    // Caminho relativo para salvar no banco de dados
    const imageUrl = `/uploads/profiles/${fileName}`;
    
    // Atualizar o usuário no banco de dados
    await connectDB();
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
    
    // Remover a imagem de perfil
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