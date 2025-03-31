import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import Order from '@/app/lib/models/order';

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = authResult.user.id;
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar estatísticas de pedidos
    const orders = await Order.find({ user: userId });
    
    // Calcular estatísticas - diferenciando pedidos totais vs produtos adquiridos
    const stats = {
      // Total de pedidos realizados (todos os pedidos)
      count: orders.length,
      
      // Valor total gasto
      total: orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      
      // Produtos efetivamente adquiridos (somente de pedidos aprovados/pagos)
      products: orders
        .filter(order => order.paymentInfo?.status === 'paid')
        .reduce((sum, order) => sum + (order.orderItems?.length || 0), 0)
    };
    
    // Log para debug
    console.log('Estatísticas calculadas:', stats);
    console.log('Usuário ID:', userId);
    console.log('Quantidade de pedidos encontrados:', orders.length);
    console.log('Quantidade de produtos adquiridos:', stats.products);
    
    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
} 