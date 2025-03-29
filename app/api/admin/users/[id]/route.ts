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
    
    // Retornar dados do usuário com estatísticas
    return NextResponse.json({
      user,
      orders,
      clientInfo: {
        userAgent: clientInfo,
        ip: clientIp
      },
      statistics: {
        totalOrders: orders.length,
        totalSpent: orders.reduce((acc, order) => acc + order.total, 0),
        lastOrder: orders[0]?.createdAt || null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar dados do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar dados do usuário' },
      { status: 500 }
    );
  }
} 