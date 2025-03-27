import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import User from '@/app/lib/models/user';
import Product from '@/app/lib/models/product';
import Order from '@/app/lib/models/order';

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se é administrador
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar estatísticas
    const [totalUsers, totalProducts, orders] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(50).lean()
    ]);
    
    // Calcular estatísticas de pedidos
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    // Formatar atividades recentes (últimos 10 pedidos, usuários, etc.)
    const recentActivity = await getRecentActivity();
    
    const stats = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
      recentActivity
    };
    
    return NextResponse.json({ stats }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de admin:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}

// Função auxiliar para obter atividades recentes
async function getRecentActivity() {
  try {
    // Buscar pedidos recentes
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    // Buscar usuários recentes
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username createdAt')
      .lean();
    
    // Buscar produtos recentes
    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt')
      .lean();
    
    // Combinar e formatar para a exibição
    const orderActivities = recentOrders.map(order => ({
      id: order._id.toString(),
      type: 'order',
      description: `Novo pedido #${order._id.toString().slice(-6)} no valor de R$ ${order.total.toFixed(2)}`,
      date: order.createdAt
    }));
    
    const userActivities = recentUsers.map(user => ({
      id: user._id.toString(),
      type: 'user',
      description: `Novo usuário "${user.username}" registrado`,
      date: user.createdAt
    }));
    
    const productActivities = recentProducts.map(product => ({
      id: product._id.toString(),
      type: 'product',
      description: `Novo produto "${product.name}" adicionado`,
      date: product.createdAt
    }));
    
    // Combinar todas as atividades
    return [
      ...orderActivities,
      ...userActivities,
      ...productActivities
    ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);  // Limitar aos 10 mais recentes
    
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    return [];
  }
} 