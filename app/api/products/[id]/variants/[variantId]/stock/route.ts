import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
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

// PATCH /api/products/[id]/variants/[variantId]/stock - Atualizar estoque de uma variante (apenas admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string, variantId: string } }
) {
  try {
    // Garantir que params seja await corretamente no Next.js 14
    const resolvedParams = await Promise.resolve(params);
    const { id, variantId } = resolvedParams;
    
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
    
    // Verificar se os IDs são válidos
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(variantId)) {
      return NextResponse.json(
        { message: 'ID de produto ou variante inválido' },
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
    
    // Verificar se a variante existe
    const variantIndex = product.variants.findIndex(
      (v: any) => v._id.toString() === variantId
    );
    
    if (variantIndex === -1) {
      return NextResponse.json(
        { message: 'Variante não encontrada para este produto' },
        { status: 404 }
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
    
    // Preparar a query para atualizar a variante específica
    const updateQuery = {
      $set: {
        [`variants.${variantIndex}.stock`]: stock
      }
    };
    
    // Atualizar apenas o estoque da variante específica
    await Product.findByIdAndUpdate(id, updateQuery);
    
    // Buscar o produto atualizado para retornar a variante atualizada
    const updatedProduct = await Product.findById(id);
    const updatedVariant = updatedProduct.variants[variantIndex];
    
    return NextResponse.json({ 
      message: 'Estoque da variante atualizado com sucesso', 
      variant: updatedVariant
    });
  } catch (error: any) {
    console.error('Erro ao atualizar estoque da variante:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao atualizar estoque da variante' },
      { status: 500 }
    );
  }
} 