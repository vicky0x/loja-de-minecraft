import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import Order from '@/app/lib/models/order';
import mongoose from 'mongoose';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:USER:ORDER-DETAIL INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:USER:ORDER-DETAIL ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:USER:ORDER-DETAIL WARN] ${message}`, ...args)
};

// Carregar modelos necessários de forma segura
try {
  // Importar modelos se não estiverem no cache
  if (!mongoose.models.Product) require('@/app/lib/models/product');
  if (!mongoose.models.User) require('@/app/lib/models/user');
  if (!mongoose.models.Coupon) require('@/app/lib/models/coupon');
  logger.info('Modelos carregados com sucesso');
} catch (error) {
  logger.warn('Erro ao carregar modelos:', error);
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Usar Promise.resolve em vez de React.use
    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.id;
    
    // Verificar autenticação
    const authData = await checkAuth(request);
    if (!authData?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Validar ID do pedido
    if (!orderId || !mongoose.Types.ObjectId.isValid(orderId)) {
      return NextResponse.json(
        { error: 'ID do pedido inválido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    await connectDB();

    // Buscar pedido com informações completas
    const order = await Order.findById(orderId)
      .populate('orderItems.product', 'name price description images')
      .populate('couponApplied', 'code discount')
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o pedido pertence ao usuário autenticado
    if (order.user.toString() !== authData.user._id.toString()) {
      logger.warn(`Usuário ${authData.user._id} tentou acessar pedido ${orderId} que não lhe pertence`);
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este pedido' },
        { status: 403 }
      );
    }

    logger.info(`Usuário ${authData.user._id} acessou detalhes do seu pedido ${orderId}`);

    // Formatação de dados para resposta com verificação de existência dos campos
    const formattedOrder = {
      ...order,
      _id: order._id.toString(),
      user: order.user.toString(),
      orderItems: Array.isArray(order.orderItems) ? order.orderItems.map((item: any) => ({
        ...item,
        _id: item._id ? item._id.toString() : null,
        product: item.product ? {
          _id: item.product._id ? item.product._id.toString() : null,
          name: item.product.name || '',
          price: item.product.price || 0,
          description: item.product.description || '',
          image: item.product.images && item.product.images.length > 0 ? item.product.images[0] : null
        } : null
      })) : [],
      couponApplied: order.couponApplied ? {
        _id: order.couponApplied._id ? order.couponApplied._id.toString() : null,
        code: order.couponApplied.code || '',
        discount: order.couponApplied.discount || 0
      } : null,
      createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : new Date().toISOString(),
      paymentInfo: {
        ...(order.paymentInfo || {}),
        status: order.paymentInfo ? order.paymentInfo.status || 'pending' : 'pending',
        method: order.paymentInfo ? order.paymentInfo.method || '' : '',
        expirationDate: order.paymentInfo && order.paymentInfo.expirationDate 
          ? order.paymentInfo.expirationDate.toISOString() 
          : null
      }
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    logger.error(`Erro ao buscar detalhes do pedido:`, error);
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do pedido', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 