import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import Order from '@/app/lib/models/order';
import mongoose from 'mongoose';
// Remover importações explícitas que estão causando problemas
// Mongoose vai resolver automaticamente as referências

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:USER:ORDERS INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:USER:ORDERS ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:USER:ORDERS WARN] ${message}`, ...args)
};

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authData = await checkAuth(request);
    if (!authData?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Conectar ao banco de dados
    await connectDB();
    
    // Importação dinâmica para garantir que o modelo Product esteja registrado
    try {
      const ProductModel = mongoose.models.Product || (await import('@/app/lib/models/product')).default;
      logger.info('Modelo Product carregado com sucesso');
    } catch (error) {
      logger.warn('Erro ao carregar modelo Product:', error);
      // Continue mesmo com erro, para tentar usar o modelo que pode já estar em cache
    }

    // Parâmetros de paginação
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status');
    
    // Construir query de filtro
    const query: any = { user: authData.user._id };
    
    if (status) {
      query['paymentInfo.status'] = status;
    }

    // Calcular total para paginação
    const total = await Order.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    // Buscar pedidos com paginação
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('orderItems.product', 'name price images')
      .lean();

    logger.info(`Usuário ${authData.user._id} acessando seus pedidos`);

    // Formatação de dados para resposta
    const formattedOrders = orders.map(order => ({
      ...order,
      _id: order._id.toString(),
      user: order.user.toString(),
      orderItems: order.orderItems.map(item => ({
        ...item,
        _id: item._id.toString(),
        product: item.product ? {
          _id: item.product._id.toString(),
          name: item.product.name,
          price: item.product.price,
          image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : null
        } : null
      })),
      couponApplied: order.couponApplied ? order.couponApplied.toString() : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      paymentInfo: {
        ...order.paymentInfo,
        expirationDate: order.paymentInfo.expirationDate ? order.paymentInfo.expirationDate.toISOString() : null
      }
    }));

    // Resposta com dados paginados
    return NextResponse.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        total,
        totalPages,
        currentPage: page,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar pedidos do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 