import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import Order from '@/app/lib/models/order';

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

    // Buscar pedidos do usuário autenticado
    const orders = await Order.find({ user: authData.user._id })
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name images')
      .lean();

    // Retornar resposta formatada
    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        ...order,
        _id: order._id.toString(),
        user: order.user.toString(),
        orderItems: order.orderItems.map(item => {
          // Verificar se item ou product existe
          if (!item) return null;
          
          return {
            ...item,
            _id: item._id?.toString() || '',
            product: item.product 
              ? {
                  ...item.product,
                  _id: item.product._id?.toString() || ''
                }
              : {
                  _id: '',
                  name: 'Produto indisponível',
                  images: []
                }
          };
        }).filter(Boolean), // Remover itens nulos
        couponApplied: order.couponApplied ? order.couponApplied.toString() : undefined,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
} 