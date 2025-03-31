import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/product';
import Category from '@/app/lib/models/category';
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

// GET /api/products/[id] - Buscar um produto pelo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Garantir que params seja await corretamente no Next.js 14
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    // Importar a categoria novamente para garantir que o esquema esteja registrado
    const Category = mongoose.models.Category || 
                     mongoose.model('Category', require('@/app/lib/models/category').default.schema);
    
    // Buscar o produto
    const product = await Product.findById(id)
      .select('-__v')
      .populate('category', 'name slug')
      .lean();
    
    if (!product) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Erro ao buscar produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao buscar produto' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Atualizar um produto (apenas admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Garantir que params seja await corretamente no Next.js 14
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
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
    
    // Parse do JSON da requisição
    const data = await request.json();
    
    // Extrair dados do produto
    const { 
      name, 
      description,
      shortDescription, 
      category: categoryId,
      featured, 
      status,
      variants,
      requirements,
      price,
      stock,
      images
    } = data;
    
    // Log de depuração
    console.log('Status recebido:', status);
    console.log('Tipo do status:', typeof status);
    console.log('Dados recebidos:', data);
    
    // Validações básicas
    if (!name || !description) {
      return NextResponse.json(
        { message: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }
    
    // Se o nome foi alterado, gerar novo slug e verificar duplicação
    let slug = product.slug;
    
    if (name !== product.name) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Verificar se o novo slug já existe em outro produto
      const existingProduct = await Product.findOne({ 
        slug, 
        _id: { $ne: id } 
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { message: 'Já existe um produto com este nome/slug' },
          { status: 400 }
        );
      }
    }
    
    // Verificar se a categoria é válida
    let categoryField;
    if (categoryId) {
      // Verificar se é um ID válido
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        console.log('ID de categoria inválido:', categoryId);
        return NextResponse.json(
          { message: 'ID de categoria inválido' },
          { status: 400 }
        );
      }
      categoryField = new mongoose.Types.ObjectId(categoryId);
    } else {
      // Se não tiver categoria, usar null ou manter a atual
      categoryField = product.category;
    }
    
    // Verificar se temos imagens
    if (!images || images.length === 0) {
      return NextResponse.json(
        { message: 'Pelo menos uma imagem é obrigatória' },
        { status: 400 }
      );
    }
    
    // Normalizar o status
    let normalizedStatus = status;
    if (status) {
      const statusLower = status.toLowerCase();
      
      if (statusLower === 'indetectavel' || statusLower.includes('indetect')) {
        normalizedStatus = 'indetectavel';
      }
      else if (statusLower === 'detectavel' || (statusLower.includes('detect') && !statusLower.includes('indetect'))) {
        normalizedStatus = 'detectavel';
      } 
      else if (statusLower === 'manutencao' || statusLower.includes('manut')) {
        normalizedStatus = 'manutencao';
      }
      else if (statusLower === 'beta' || statusLower.includes('beta')) {
        normalizedStatus = 'beta';
      }
    }
    
    // Criar objeto de atualização
    const updateObject: any = {
      name,
      slug,
      description,
      shortDescription,
      images,
      category: categoryField,
      variants: variants || [],
      featured: featured || false,
      requirements: requirements || [],
      // Definir status apenas se tiver um valor
      ...(normalizedStatus ? { status: normalizedStatus } : { $unset: { status: 1 } }),
    };
    
    // Adicionar price e stock se forem fornecidos (para produtos sem variantes)
    if (price !== undefined) {
      updateObject.price = price;
    }
    
    if (stock !== undefined) {
      updateObject.stock = stock;
    }
    
    // Atualizar o produto
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateObject,
      { new: true }
    );
    
    // Log para depuração final
    console.log('Produto atualizado:');
    console.log('ID:', id);
    console.log('Status final:', normalizedStatus);
    console.log('Produto após atualização:', updatedProduct);
    
    return NextResponse.json({ 
      message: 'Produto atualizado com sucesso', 
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao atualizar produto' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Excluir um produto (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Garantir que params seja await corretamente no Next.js 14
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
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
    
    // Na vida real, aqui você também removeria as imagens do armazenamento
    // e possivelmente verificaria se o produto está em algum pedido
    
    // Excluir o produto
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: 'Produto excluído com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao excluir produto' },
      { status: 500 }
    );
  }
} 