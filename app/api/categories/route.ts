import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Category from '@/app/lib/models/category';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '@/app/lib/models/user';

// JWT Secret para autenticação
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente');
  throw new Error('JWT_SECRET não configurado');
}

// Função para verificar autenticação
async function checkAuth(request: NextRequest) {
  // Obter o token diretamente do cookie da request
  const token = request.cookies.get('auth_token')?.value;
  
  console.log('---- DEBUG AUTH ----');
  console.log('Cookies disponíveis:', request.cookies.getAll().map(c => c.name).join(', '));
  console.log('Token encontrado:', token ? 'Sim' : 'Não');
  
  if (!token) {
    console.log('Nenhum token encontrado nos cookies');
    return null;
  }
  
  try {
    // Verificar e decodificar o token JWT
    console.log('Tentando verificar o token JWT');
    console.log('JWT_SECRET disponível:', !!JWT_SECRET);
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role?: string };
    console.log('Token decodificado:', decoded);

    if (!decoded || !decoded.id) {
      console.log('Token decodificado inválido ou sem ID');
      return null;
    }

    // Conectar ao banco de dados
    console.log('Conectando ao banco de dados');
    await connectDB();

    // Buscar o usuário no banco de dados
    console.log('Buscando usuário com ID:', decoded.id);
    const user = await User.findById(decoded.id).select('-password');
    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');
    
    if (user) {
      console.log('Role do usuário:', user.role);
    }

    if (!user) {
      console.log('Usuário não encontrado no banco de dados');
      return null;
    }
    
    console.log('Autenticação bem-sucedida');
    return user;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return null;
  }
}

// GET /api/categories - Listar todas as categorias
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Buscar todas as categorias ordenadas por nome
    const categories = await Category.find({})
      .sort({ name: 1 })
      .select('-__v')
      .lean();
    
    return NextResponse.json(
      { categories },
      { 
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error: any) {
    console.error('Erro ao listar categorias:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao listar categorias' },
      { status: 500 }
    );
  }
}

// POST /api/categories - Criar uma nova categoria (apenas admin)
export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando POST /api/categories');
    
    // Verificar autenticação e permissões
    const user = await checkAuth(request);
    
    console.log('Resultado da verificação de autenticação:', user ? `Usuário: ${user.username}, Role: ${user.role}` : 'Não autenticado');
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      console.log('Usuário não tem permissão de admin. Role:', user.role);
      return NextResponse.json(
        { message: 'Acesso proibido' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Extrair dados da categoria do corpo da requisição
    const data = await request.json();
    const { name, description, icon } = data;
    
    console.log('Dados recebidos:', { name, description, icon: icon ? 'Presente' : 'Ausente' });
    
    // Validar dados obrigatórios
    if (!name || !description) {
      return NextResponse.json(
        { message: 'Nome e descrição são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Gerar slug a partir do nome
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Verificar se já existe uma categoria com este slug
    const existingCategory = await Category.findOne({ slug });
    
    if (existingCategory) {
      return NextResponse.json(
        { message: 'Já existe uma categoria com este nome' },
        { status: 400 }
      );
    }
    
    // Criar a nova categoria
    const newCategory = new Category({
      name,
      slug,
      description,
      icon: icon || 'default-icon', // Usar um ícone padrão se não for fornecido
    });
    
    await newCategory.save();
    console.log('Categoria criada com sucesso:', newCategory);
    
    // Buscar a lista atualizada de categorias
    const updatedCategories = await Category.find({})
      .sort({ name: 1 })
      .select('-__v')
      .lean();
    
    return NextResponse.json({
      message: 'Categoria criada com sucesso',
      category: newCategory,
      categories: updatedCategories
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao criar categoria' },
      { status: 500 }
    );
  }
}

// Função auxiliar para debug
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  });
} 