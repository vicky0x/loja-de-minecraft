import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Category from '@/app/lib/models/category';
import Product from '@/app/lib/models/product';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '@/app/lib/models/user';

// Segredo usado para verificar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

// Função para verificar autenticação
async function checkAuth(request: NextRequest) {
  // Obter o token diretamente do cookie da request
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    // Verificar e decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role?: string };

    if (!decoded || !decoded.id) {
      return null;
    }

    // Conectar ao banco de dados
    await connectDB();

    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return null;
  }
}

// GET /api/categories/[id] - Buscar uma categoria pelo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    const { id } = params;
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de categoria inválido' },
        { status: 400 }
      );
    }
    
    // Buscar a categoria
    const category = await Category.findById(id).select('-__v').lean();
    
    if (!category) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ category });
  } catch (error: any) {
    console.error('Erro ao buscar categoria:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao buscar categoria' },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Atualizar uma categoria (apenas admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação e permissões
    const user = await checkAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso proibido' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { id } = params;
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de categoria inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se a categoria existe
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Extrair dados da requisição
    const data = await request.json();
    const { name, description, icon } = data;
    
    // Validação básica
    if (!name || !description) {
      return NextResponse.json(
        { message: 'Nome e descrição são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Se o nome mudou, atualizar o slug e verificar duplicatas
    let slug = category.slug;
    
    if (name !== category.name) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Verificar se já existe outra categoria com este slug
      const existingCategory = await Category.findOne({ 
        slug, 
        _id: { $ne: id } 
      });
      
      if (existingCategory) {
        return NextResponse.json(
          { message: 'Já existe uma categoria com este nome' },
          { status: 400 }
        );
      }
    }
    
    // Atualizar a categoria
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description,
        icon: icon || category.icon, // Manter o ícone atual se não for fornecido
      },
      { new: true }
    );
    
    return NextResponse.json({
      message: 'Categoria atualizada com sucesso',
      category: updatedCategory,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao atualizar categoria' },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Excluir uma categoria (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação e permissões
    const user = await checkAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso proibido' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    const { id } = params;
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de categoria inválido' },
        { status: 400 }
      );
    }
    
    // Verificar se a categoria existe
    const category = await Category.findById(id);
    
    if (!category) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Verificar se existem produtos usando esta categoria
    const productsWithCategory = await Product.countDocuments({ category: id });
    
    if (productsWithCategory > 0) {
      return NextResponse.json(
        { 
          message: 'Não é possível excluir esta categoria pois existem produtos associados a ela',
          productsCount: productsWithCategory 
        },
        { status: 400 }
      );
    }
    
    // Excluir a categoria
    await Category.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: 'Categoria excluída com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao excluir categoria:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao excluir categoria' },
      { status: 500 }
    );
  }
} 