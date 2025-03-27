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
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const user = authResult.user;
    
    // Apenas admins podem executar atribuições manuais
    const isAdmin = user.role === 'admin';
    
    await connectDB();
    
    // Extrair dados da requisição
    const { productId, variantId, userId, quantity, orderId } = await request.json();
    
    // Validar dados
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    if (!variantId) {
      return NextResponse.json(
        { message: 'ID de variante inválido' },
        { status: 400 }
      );
    }
    
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: 'ID de usuário inválido' },
        { status: 400 }
      );
    }
    
    if (!quantity || quantity <= 0) {
      return NextResponse.json(
        { message: 'Quantidade deve ser maior que zero' },
        { status: 400 }
      );
    }
    
    // Se não for admin, apenas permitir atribuir ao próprio usuário
    if (!isAdmin && userId !== user.id) {
      return NextResponse.json(
        { message: 'Você só pode atribuir itens a si mesmo' },
        { status: 403 }
      );
    }
    
    // Verificar disponibilidade de estoque
    const availableItems = await StockItem.find({
      product: productId,
      variant: variantId,
      isUsed: false
    }).limit(quantity);
    
    if (availableItems.length < quantity) {
      return NextResponse.json(
        { 
          message: 'Estoque insuficiente',
          available: availableItems.length,
          requested: quantity
        },
        { status: 400 }
      );
    }
    
    // Obter IDs dos itens a serem atribuídos
    const itemIds = availableItems.map(item => item._id);
    
    // Marcar itens como usados e atribuídos ao usuário
    const now = new Date();
    await StockItem.updateMany(
      { _id: { $in: itemIds } },
      { 
        $set: { 
          isUsed: true, 
          assignedTo: userId, 
          assignedAt: now,
          metadata: {
            ...(orderId ? { orderId } : {}),
            assignedBy: isAdmin ? user._id : 'system'
          }
        } 
      }
    );
    
    // Atualizar contagem de estoque na variante do produto
    const remainingStock = await StockItem.countDocuments({
      product: productId,
      variant: variantId,
      isUsed: false
    });
    
    // Atualizar o estoque da variante
    await Product.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $set: { 'variants.$.stock': remainingStock } }
    );
    
    // Obter os itens com detalhes após a atribuição
    const assignedItems = await StockItem.find({ _id: { $in: itemIds } })
      .select('code product variant assignedAt');
    
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