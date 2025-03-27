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
    
    // Calcular estatísticas
    const stats = {
      count: orders.length,
      total: orders.reduce((sum, order) => sum + order.total, 0),
      products: orders.reduce((sum, order) => sum + order.items.length, 0)
    };
    
    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
} 