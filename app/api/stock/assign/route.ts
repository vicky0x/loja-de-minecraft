import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import StockItem from '@/app/lib/models/stock';
import Product from '@/app/lib/models/product';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// POST /api/stock/assign - Atribuir itens de estoque a um usuário (usado durante compra ou pelo admin)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    console.log('Iniciando verificação de autenticação para atribuição de estoque');
    const authResult = await checkAuth(request);
    
    console.log('Resultado da autenticação:', JSON.stringify(authResult, null, 2));
    
    if (!authResult.isAuthenticated || !authResult.user) {
      console.log('Usuário não autenticado ou indefinido');
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const user = authResult.user;
    console.log('Usuário autenticado:', user._id, 'Role:', user.role);
    
    // Apenas admins podem executar atribuições manuais
    const isAdmin = user.role === 'admin';
    console.log('É administrador:', isAdmin);
    
    await connectDB();
    console.log('Conectado ao banco de dados');
    
    // Extrair dados da requisição
    const requestData = await request.json();
    console.log('Dados recebidos para atribuição:', requestData);
    const { productId, variantId, userId, quantity, orderId } = requestData;
    
    // Validar dados
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      console.log('ID de produto inválido:', productId);
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.log('ID de usuário inválido:', userId);
      return NextResponse.json(
        { message: 'ID de usuário inválido' },
        { status: 400 }
      );
    }
    
    if (!quantity || quantity <= 0) {
      console.log('Quantidade inválida:', quantity);
      return NextResponse.json(
        { message: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }
    
    // Se não for admin, apenas permitir atribuir ao próprio usuário
    if (!isAdmin && userId !== user.id) {
      console.log('Usuário não admin tentando atribuir a outro usuário');
      return NextResponse.json(
        { message: 'Você só pode atribuir itens a si mesmo' },
        { status: 403 }
      );
    }
    
    // Verificar se o produto existe e se tem variantes
    const product = await Product.findById(productId);
    if (!product) {
      console.log('Produto não encontrado:', productId);
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se o produto tem variantes
    const hasVariants = product.variants && product.variants.length > 0;
    
    // Se o produto tem variantes, o variantId é obrigatório
    if (hasVariants && !variantId) {
      console.log('ID de variante não fornecido para produto com variantes');
      return NextResponse.json(
        { message: 'ID de variante é obrigatório para produtos com variantes' },
        { status: 400 }
      );
    }
    
    // Verificar disponibilidade de estoque
    console.log('Verificando disponibilidade de estoque para:', {
      productId,
      variantId: hasVariants ? variantId : null,
      isUsed: false
    });
    
    // Construir filtro baseado no tipo de produto (com ou sem variantes)
    const stockFilter = {
      product: productId,
      isUsed: false,
    };
    
    if (hasVariants) {
      stockFilter['variant'] = variantId;
    } else {
      stockFilter['variant'] = null;
    }
    
    // Primeiro, verificar a contagem total de itens disponíveis
    const totalAvailable = await StockItem.countDocuments(stockFilter);
    
    console.log(`Total de itens disponíveis (contagem): ${totalAvailable}`);
    
    if (totalAvailable < quantity) {
      console.log(`Estoque insuficiente: solicitado ${quantity}, disponível ${totalAvailable}`);
      return NextResponse.json(
        { 
          message: 'Estoque insuficiente',
          available: totalAvailable,
          requested: quantity
        },
        { status: 400 }
      );
    }
    
    // Buscar os itens disponíveis
    const availableItems = await StockItem.find(stockFilter).limit(quantity);
    
    console.log(`Encontrados ${availableItems.length} itens disponíveis em estoque para atribuir`);
    
    if (availableItems.length < quantity) {
      console.log(`Estoque insuficiente após busca: solicitado ${quantity}, disponível ${availableItems.length}`);
      return NextResponse.json(
        { 
          message: 'Estoque insuficiente',
          available: availableItems.length,
          requested: quantity
        },
        { status: 400 }
      );
    }
    
    // Obter APENAS a quantidade solicitada de IDs dos itens a serem atribuídos
    const itemIds = availableItems.slice(0, quantity).map(item => item._id);
    
    console.log(`Atribuindo ${itemIds.length} itens ao usuário ${userId}`);
    console.log('IDs dos itens a serem atribuídos:', itemIds);
    
    // Marcar itens como usados e atribuídos ao usuário
    const now = new Date();
    const updateResult = await StockItem.updateMany(
      { _id: { $in: itemIds } },
      { 
        $set: { 
          isUsed: true, 
          assignedTo: userId, 
          assignedAt: now,
          metadata: {
            ...(orderId ? { orderId } : {}),
            assignedBy: isAdmin ? user._id.toString() : 'system'
          }
        } 
      }
    );
    
    console.log('Resultado da atualização:', updateResult);
    
    // Atualizar contagem de estoque no produto
    const remainingStock = await StockItem.countDocuments(stockFilter);
    
    console.log(`Estoque restante após atribuição: ${remainingStock}`);
    
    // Atualizar o estoque com base no tipo de produto
    let productUpdateResult;
    
    if (hasVariants) {
      // Para produtos com variantes, atualizar o estoque da variante específica
      productUpdateResult = await Product.updateOne(
        { _id: productId, 'variants._id': variantId },
        { $set: { 'variants.$.stock': remainingStock } }
      );
    } else {
      // Para produtos sem variantes, atualizar o estoque diretamente no produto
      productUpdateResult = await Product.updateOne(
        { _id: productId },
        { $set: { stock: remainingStock } }
      );
    }
    
    console.log('Resultado da atualização do produto:', productUpdateResult);
    
    // Obter os itens com detalhes após a atribuição
    const assignedItems = await StockItem.find({ _id: { $in: itemIds } })
      .select('code product variant assignedAt');
    
    console.log(`Atribuição concluída: ${assignedItems.length} itens atribuídos`);
    
    return NextResponse.json({
      message: 'Itens atribuídos com sucesso',
      assigned: assignedItems.length,
      remaining_stock: remainingStock,
      items: assignedItems
    });
  } catch (error) {
    console.error('Erro ao atribuir itens de estoque:', error);
    return NextResponse.json(
      { message: 'Erro ao atribuir itens de estoque' },
      { status: 500 }
    );
  }
}

// GET /api/stock/assign - Listar itens de estoque atribuídos ao usuário atual
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const user = authResult.user;
    
    await connectDB();
    
    // Obter parâmetros de filtro da URL
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product');
    const orderId = searchParams.get('order');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Construir o filtro
    const filter: any = {
      assignedTo: user.id
    };
    
    if (productId) {
      filter.product = productId;
    }
    
    if (orderId) {
      filter['metadata.orderId'] = orderId;
    }
    
    // Consultar itens de estoque com paginação
    const items = await StockItem.find(filter)
      .sort({ assignedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name slug images')
      .lean();
    
    // Obter contagem total para paginação
    const total = await StockItem.countDocuments(filter);
    
    // Agrupar itens por produto e variante para uma melhor visualização
    const groupedItems = {};
    
    items.forEach(item => {
      // Verificar se item.product existe antes de acessar propriedades
      if (!item.product) {
        console.error('Item com produto nulo encontrado:', item);
        return; // Pular este item
      }
      
      const productId = item.product._id.toString();
      const variantId = item.variant;
      
      const key = `${productId}-${variantId}`;
      
      if (!groupedItems[key]) {
        groupedItems[key] = {
          product: item.product,
          variant: variantId,
          items: []
        };
      }
      
      groupedItems[key].items.push({
        _id: item._id,
        code: item.code,
        assignedAt: item.assignedAt
      });
    });
    
    return NextResponse.json({
      items: Object.values(groupedItems),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar itens atribuídos:', error);
    return NextResponse.json(
      { message: 'Erro ao listar itens atribuídos' },
      { status: 500 }
    );
  }
} 