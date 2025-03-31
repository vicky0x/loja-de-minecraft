import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import User from '@/app/lib/models/user';
import Order from '@/app/lib/models/order';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Aguardar os parâmetros antes de usá-los
    const { id } = await params;
    
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter dados do usuário
    const user = await User.findById(id)
      .select('-password')
      .lean();
    
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Buscar pedidos do usuário
    const orders = await Order.find({ user: id })
      .sort({ createdAt: -1 })
      .populate('orderItems.product', 'name images')
      .lean();
    
    // Buscar informações do cliente
    const clientInfo = req.headers.get('user-agent') || 'Desconhecido';
    
    // Obter IP do cliente (pode ser necessário ajustes dependendo da configuração do servidor)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.headers.get('x-real-ip') || 'Desconhecido';
    
    // Calcular estatísticas do usuário
    const totalSpent = orders.reduce((acc, order) => {
      // Verificar se order.totalAmount existe
      return acc + (order.totalAmount || order.total || 0);
    }, 0);
    
    // Preparar timeline básica
    const timeline = [];
    
    // Adicionar registro de usuário à timeline
    timeline.push({
      id: 'registration',
      type: 'registration',
      title: 'Registro de Conta',
      description: 'Usuário criou uma conta na plataforma',
      date: user.createdAt
    });
    
    // Adicionar pedidos à timeline
    orders.forEach(order => {
      timeline.push({
        id: order._id.toString(),
        type: 'order',
        title: `Pedido #${order._id.toString().slice(-6)}`,
        description: `Realizou um pedido com ${order.orderItems?.length || 0} item(s)`,
        status: order.paymentInfo?.status || 'pending',
        items: order.orderItems?.length || 0,
        date: order.createdAt
      });
    });
    
    // Preparar o objeto de usuário com todos os dados necessários
    const userDetail = {
      ...user,
      stats: {
        totalSpent: totalSpent,
        totalOrders: orders.length,
        lastActivity: orders.length > 0 ? orders[0].createdAt : user.createdAt
      },
      clientInfo: {
        ip: clientIp,
        userAgent: clientInfo
      },
      orders: orders,
      timeline: timeline
    };
    
    // Retornar dados do usuário com estatísticas
    return NextResponse.json({ user: userDetail });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    );
  }
} 