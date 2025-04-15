import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/product';
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

// PATCH /api/products/[id]/stock - Atualizar estoque de um produto (apenas admin)
export async function PATCH(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter ID do produto
    const id = params?.id;
    
    // Verificar autenticação
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
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    // Buscar o produto para verificar se existe
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o produto tem variantes
    if (product.variants?.length > 0) {
      return NextResponse.json(
        { message: 'Este produto tem variantes. Use a API de variantes para atualizar o estoque.' },
        { status: 400 }
      );
    }
    
    // Parse do JSON da requisição
    const data = await request.json();
    
    // Extrair dados de estoque
    const { stock } = data;
    
    // Validar estoque
    if (stock === undefined || stock < 0) {
      return NextResponse.json(
        { message: 'Valor de estoque inválido' },
        { status: 400 }
      );
    }
    
    // Atualizar apenas o campo de estoque
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { stock },
      { new: true }
    ).select('name stock');
    
    return NextResponse.json({ 
      message: 'Estoque atualizado com sucesso', 
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar estoque do produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao atualizar estoque do produto' },
      { status: 500 }
    );
  }
}

// PUT - Alternativa ao PATCH, faz a mesma coisa para compatibilidade
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter ID do produto dos parâmetros da rota
    const id = params?.id;
    
    // Verificar autenticação
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
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    // Buscar o produto para verificar se existe
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o produto tem variantes
    if (product.variants?.length > 0) {
      return NextResponse.json(
        { message: 'Este produto tem variantes. Use a API de variantes para atualizar o estoque.' },
        { status: 400 }
      );
    }
    
    // Parse do JSON da requisição
    const data = await request.json();
    
    // Extrair dados de estoque
    const { stock } = data;
    
    // Validar estoque
    if (stock === undefined || stock < 0) {
      return NextResponse.json(
        { message: 'Valor de estoque inválido' },
        { status: 400 }
      );
    }
    
    // Atualizar apenas o campo de estoque
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { stock },
      { new: true }
    ).select('name stock');
    
    return NextResponse.json({ 
      message: 'Estoque atualizado com sucesso', 
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar estoque do produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao atualizar estoque do produto' },
      { status: 500 }
    );
  }
} 