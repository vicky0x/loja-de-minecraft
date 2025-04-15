import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/product';
import Category from '@/app/lib/models/category';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '@/app/lib/models/user';

// Segredo usado para verificar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente');
  throw new Error('JWT_SECRET não configurado');
}

// Função para verificar autenticação
async function checkAuth(request: NextRequest) {
  // Obter o token diretamente do cookie da request
  const token = request.cookies.get('auth_token')?.value;
  
  console.log('Verificando autenticação para atualização de produto');
  
  if (!token) {
    console.log('Erro de autenticação: Token não encontrado nos cookies');
    return null;
  }
  
  try {
    // Verificar e decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role?: string };

    if (!decoded || !decoded.id) {
      console.log('Erro de autenticação: Token JWT inválido ou não contém ID');
      return null;
    }

    console.log(`Token decodificado para usuário: ${decoded.id}, role: ${decoded.role || 'não definida'}`);

    // Conectar ao banco de dados
    await connectDB();

    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log(`Erro de autenticação: Usuário com ID ${decoded.id} não encontrado`);
      return null;
    }
    
    console.log(`Autenticação bem-sucedida: ${user.username || user.email}, role: ${user.role || 'não definida'}`);
    return user;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('Erro específico do JWT:', error.message);
    }
    return null;
  }
}

// GET /api/products/[id] - Buscar um produto pelo ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Obter o ID do produto - corrigido para usar await em params
    const params = await context.params;
    const { id } = params;
    
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
  context: { params: { id: string } }
) {
  try {
    // Obter o ID do produto
    const params = await context.params;
    const { id } = params;
    
    // Verificar autenticação
    const user = await checkAuth(request);
    
    if (!user) {
      console.log('Tentativa de atualização de produto sem autenticação');
      
      // Verificar e reportar o erro específico de autenticação
      const authError = request.cookies.get('auth_token') 
        ? 'Token inválido ou expirado' 
        : 'Token de autenticação não encontrado';
      
      return NextResponse.json(
        { 
          message: 'Não autorizado', 
          details: `Erro de autenticação: ${authError}. Faça login novamente.`,
          code: 'AUTH_REQUIRED'
        },
        { status: 401 }
      );
    }
    
    // Verificação detalhada do papel do usuário
    console.log(`Verificando permissões: usuário ${user.username || user.email} com papel: "${user.role}" tentando atualizar produto`);
    
    if (user.role !== 'admin') {
      console.log(`Acesso negado: usuário ${user.username || user.email} não é admin (papel atual: ${user.role || 'não definido'})`);
      return NextResponse.json(
        { message: 'Acesso proibido - permissão de administrador necessária' },
        { status: 403 }
      );
    }
    
    console.log(`Usuário ${user.username || user.email} autenticado como admin, prosseguindo com atualização do produto`);
    
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
      images,
      originalPrice,
      discountPercentage,
      deliveryType
    } = data;
    
    // Log de depuração
    console.log('Dados recebidos:', data);
    console.log('Status recebido:', status);
    console.log('Tipo do status:', typeof status);
    console.log('Preço original:', originalPrice);
    console.log('Desconto:', discountPercentage);
    console.log('Tipo de entrega recebido:', deliveryType);
    
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
    let category;
    if (categoryId) {
      // Verificar se é um ID válido
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        console.log('ID de categoria inválido:', categoryId);
        return NextResponse.json(
          { message: 'ID de categoria inválido' },
          { status: 400 }
        );
      }
      category = new mongoose.Types.ObjectId(categoryId);
    } else {
      // Se não tiver categoria, usar null ou manter a atual
      category = product.category;
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
      category,
      variants: variants || [],
      featured: featured || false,
      requirements: requirements || [],
      // Definir status apenas se tiver um valor
      ...(normalizedStatus ? { status: normalizedStatus } : { $unset: { status: 1 } }),
      // Adicionar preço e estoque para produtos sem variantes
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(stock !== undefined ? { stock: Number(stock) } : {}),
      // Adicionar preço original e porcentagem de desconto
      ...(originalPrice !== undefined && originalPrice !== '' ? { originalPrice: Number(originalPrice) } : {}),
      ...(discountPercentage !== undefined && discountPercentage !== '' ? { discountPercentage: Number(discountPercentage) } : {}),
      // Garantir que o deliveryType seja sempre incluído na atualização
      deliveryType: deliveryType || 'automatic'
    };
    
    // Adicionar log detalhado para depuração
    console.log('Atualizando produto com:', {
      id,
      nome: name,
      deliveryType: deliveryType || 'não especificado',
      currentDeliveryType: product.deliveryType,
      stock: stock || 'não especificado',
      currentStock: product.stock
    });

    // Verificar se estamos alterando o tipo de entrega
    if (product.deliveryType !== deliveryType) {
      console.log(`ALTERAÇÃO CRÍTICA: Alterando tipo de entrega de ${product.deliveryType} para ${deliveryType}`);
      
      // Se estiver alterando de manual para automatic, verificar o estoque
      if (product.deliveryType === 'manual' && deliveryType === 'automatic') {
        if (product.stock === 99999) {
          console.log('CORREÇÃO: Redefinindo estoque de infinito (99999) para zero (0)');
          updateObject.stock = 0;
        }
      } else if (product.deliveryType === 'automatic' && deliveryType === 'manual') {
        // Se estiver alterando de automatic para manual, definir estoque como infinito
        console.log('CORREÇÃO: Alterando de automático para manual, definindo estoque como infinito');
        updateObject.stock = 99999;
      }
    }

    // Garantir que a lógica de estoque esteja correta baseada no tipo de entrega final
    const finalDeliveryType = deliveryType || product.deliveryType;
    if (finalDeliveryType === 'automatic') {
      if (updateObject.stock === 99999) {
        console.log('CORREÇÃO: Produto automático não pode ter estoque infinito, redefinindo para zero');
        updateObject.stock = 0;
      } else if (!('stock' in updateObject)) {
        // Se o estoque não foi especificado mas o produto é automático, inicializar com valor anterior ou zero
        updateObject.stock = product.stock !== 99999 ? product.stock : 0;
        console.log(`CORREÇÃO: Produto automático sem estoque definido, inicializando com ${updateObject.stock}`);
      }
    } else if (finalDeliveryType === 'manual') {
      // Produtos com entrega manual sempre têm estoque infinito
      updateObject.stock = 99999;
      console.log('CORREÇÃO: Produto manual deve ter estoque infinito (99999)');
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
  context: { params: { id: string } }
) {
  try {
    // Obter o ID do produto
    const params = await context.params;
    const { id } = params;
    
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