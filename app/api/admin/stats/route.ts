import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import User from '@/app/lib/models/user';
import Product from '@/app/lib/models/product';
import Order from '@/app/lib/models/order';
import Coupon from '@/app/lib/models/coupon';
import mongoose from 'mongoose';

// Função para obter atividades recentes
async function getRecentActivity() {
  try {
    // Obter os 10 pedidos mais recentes
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'username email name')
      .lean();
    
    // Formatar as atividades
    return recentOrders.map(order => ({
      type: 'order',
      id: order._id,
      title: `Novo pedido #${order._id.toString().substr(-6)}`,
      description: `Novo pedido #${order._id.toString().substr(-6)} ${order.user ? `por ${order.user.name || order.user.username}` : 'por usuário anônimo'}`,
      user: order.user ? {
        id: order.user._id,
        username: order.user.username,
        name: order.user.name,
        email: order.user.email
      } : null,
      amount: order.totalAmount,
      status: order.paymentInfo?.status || 'pending',
      date: order.createdAt
    }));
  } catch (error) {
    console.error('Erro ao buscar atividades recentes:', error);
    return [];
  }
}

// Função para calcular estatísticas de faturamento por período
async function getRevenueStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  
  // Consultas para cada período
  const [dailyOrders, weeklyOrders, monthlyOrders, yearlyOrders, allTimeOrders] = await Promise.all([
    Order.find({
      createdAt: { $gte: today },
      'paymentInfo.status': 'paid'
    }).lean(),
    
    Order.find({
      createdAt: { $gte: startOfWeek },
      'paymentInfo.status': 'paid'
    }).lean(),
    
    Order.find({
      createdAt: { $gte: startOfMonth },
      'paymentInfo.status': 'paid'
    }).lean(),
    
    Order.find({
      createdAt: { $gte: startOfYear },
      'paymentInfo.status': 'paid'
    }).lean(),
    
    Order.find({
      'paymentInfo.status': 'paid'
    }).lean()
  ]);
  
  // Calcular faturamento para cada período
  const dailyRevenue = dailyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const weeklyRevenue = weeklyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const yearlyRevenue = yearlyOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const allTimeRevenue = allTimeOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  
  return {
    daily: {
      revenue: dailyRevenue,
      orders: dailyOrders.length
    },
    weekly: {
      revenue: weeklyRevenue,
      orders: weeklyOrders.length
    },
    monthly: {
      revenue: monthlyRevenue,
      orders: monthlyOrders.length
    },
    yearly: {
      revenue: yearlyRevenue,
      orders: yearlyOrders.length
    },
    allTime: {
      revenue: allTimeRevenue,
      orders: allTimeOrders.length
    }
  };
}

// Função para obter os produtos mais vendidos
async function getTopProducts(limit = 5) {
  // Agregação para contar quantidade de cada produto vendido
  const topProducts = await Order.aggregate([
    // Filtrar apenas pedidos pagos
    { $match: { 'paymentInfo.status': 'paid' } },
    
    // Descompactar os itens do pedido
    { $unwind: '$orderItems' },
    
    // Agrupar por produto e contar vendas
    { 
      $group: { 
        _id: '$orderItems.product', 
        name: { $first: '$orderItems.name' },
        sales: { $sum: 1 },
        revenue: { $sum: '$orderItems.price' }
      } 
    },
    
    // Ordenar por quantidade vendida (descendente)
    { $sort: { sales: -1 } },
    
    // Limitar aos top produtos
    { $limit: limit }
  ]);
  
  // Obter informações detalhadas dos produtos
  const productIds = topProducts.map(p => p._id);
  const productDetails = await Product.find(
    { _id: { $in: productIds } },
    'name slug images'
  ).lean();
  
  // Mesclar os detalhes com os resultados da agregação
  const productsMap = Object.fromEntries(
    productDetails.map(p => [p._id.toString(), p])
  );
  
  return topProducts.map(product => ({
    id: product._id,
    name: product.name,
    sales: product.sales,
    revenue: product.revenue,
    details: productsMap[product._id.toString()] || {}
  }));
}

// Função para obter os cupons mais usados
async function getTopCoupons(limit = 5) {
  const topCoupons = await Order.aggregate([
    // Filtrar apenas pedidos com cupons aplicados
    { $match: { couponApplied: { $exists: true, $ne: null } } },
    
    // Agrupar por cupom
    { 
      $group: { 
        _id: '$couponApplied', 
        count: { $sum: 1 },
        totalDiscount: { $sum: '$discountAmount' }
      } 
    },
    
    // Ordenar por uso (descendente)
    { $sort: { count: -1 } },
    
    // Limitar aos top cupons
    { $limit: limit }
  ]);
  
  // Obter informações detalhadas dos cupons
  const couponIds = topCoupons.map(c => c._id);
  const couponDetails = await Coupon.find(
    { _id: { $in: couponIds } },
    'code discount discountType maxUses'
  ).lean();
  
  // Mesclar os detalhes com os resultados da agregação
  const couponsMap = Object.fromEntries(
    couponDetails.map(c => [c._id.toString(), c])
  );
  
  return topCoupons.map(coupon => ({
    id: coupon._id,
    usageCount: coupon.count,
    totalDiscount: coupon.totalDiscount,
    details: couponsMap[coupon._id.toString()] || {}
  }));
}

// Função para calcular taxa de conversão
async function getConversionRate() {
  // Número total de visitantes (como não temos esse dado, vamos usar uma estimativa ou placeholder)
  // Em uma implementação real, você buscaria dados de analytics
  const visitorsLastMonth = 500; // Placeholder para demonstração
  
  // Número de pedidos concluídos no último mês
  const now = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  const completedOrders = await Order.countDocuments({
    createdAt: { $gte: oneMonthAgo, $lte: now },
    'paymentInfo.status': 'paid'
  });
  
  // Calcular taxa de conversão
  const conversionRate = visitorsLastMonth > 0 
    ? (completedOrders / visitorsLastMonth) * 100 
    : 0;
  
  return {
    rate: conversionRate.toFixed(2),
    orders: completedOrders,
    visitors: visitorsLastMonth
  };
}

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
    
    // Executar todas as consultas em paralelo para melhor performance
    const [
      totalUsers, 
      totalProducts, 
      pendingOrders,
      revenueStats,
      topProducts,
      topCoupons,
      conversionRate,
      recentActivity
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments({ 'paymentInfo.status': 'pending' }),
      getRevenueStats(),
      getTopProducts(),
      getTopCoupons(),
      getConversionRate(),
      getRecentActivity()
    ]);
    
    // Montar o objeto de estatísticas completo
    const stats = {
      users: {
        total: totalUsers
      },
      products: {
        total: totalProducts,
        topSelling: topProducts
      },
      orders: {
        pending: pendingOrders,
        revenue: revenueStats
      },
      coupons: {
        topUsed: topCoupons
      },
      conversion: conversionRate,
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