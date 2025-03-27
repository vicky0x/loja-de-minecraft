import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';
import User from '@/app/lib/models/user';
import Product from '@/app/lib/models/product';
import Order from '@/app/lib/models/order';
import Category from '@/app/lib/models/category';
import Coupon from '@/app/lib/models/coupon';

export async function GET() {
  try {
    // Conecta ao MongoDB
    await connectDB();
    
    // Obtém as contagens
    const usersCount = await User.countDocuments({});
    const productsCount = await Product.countDocuments({});
    const ordersCount = await Order.countDocuments({});
    const categoriesCount = await Category.countDocuments({});
    const couponsCount = await Coupon.countDocuments({});
    
    // Calcula estatísticas adicionais
    const pendingOrdersCount = await Order.countDocuments({ status: 'pending' });
    const completedOrdersCount = await Order.countDocuments({ status: 'completed' });
    
    // Calcula o valor total de pedidos
    const orders = await Order.find({});
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    return NextResponse.json({
      counts: {
        users: usersCount,
        products: productsCount,
        orders: ordersCount,
        categories: categoriesCount,
        coupons: couponsCount
      },
      orders: {
        pending: pendingOrdersCount,
        completed: completedOrdersCount,
        totalRevenue: totalRevenue.toFixed(2)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Erro ao obter estatísticas do sistema:', error);
    
    return NextResponse.json({
      error: error.message || 'Erro desconhecido',
      message: 'Falha ao obter estatísticas do sistema'
    }, { status: 500 });
  }
} 