import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import User from '@/app/lib/models/user';
import Order from '@/app/lib/models/order';
import mongoose from 'mongoose';
import { isValidObjectId } from 'mongoose';

// Função auxiliar para verificar se o usuário é admin
async function verifyAdmin(request: NextRequest) {
  const authResult = await checkAuth(request);
  
  if (!authResult.isAuthenticated) {
    return {
      isAdmin: false,
      error: 'Não autorizado',
      status: 401
    };
  }
  
  if (!authResult.user || authResult.user.role !== 'admin') {
    return {
      isAdmin: false,
      error: 'Acesso restrito a administradores',
      status: 403,
      user: authResult.user
    };
  }
  
  return {
    isAdmin: true,
    user: authResult.user
  };
}

// GET - Obter detalhes de um usuário específico
export async function GET(
  request: NextRequest,
  context: any
) {
  const id = context?.params?.id;

  try {
    // Verificar se o usuário é administrador
    const adminCheck = await verifyAdmin(request);
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Não autorizado' }, 
        { status: adminCheck.status || 401 }
      );
    }
    
    // Validar ID do usuário
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" }, 
        { status: 400 }
      );
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
    const clientInfo = request.headers.get('user-agent') || 'Desconhecido';
    
    // Obter IP do cliente (pode ser necessário ajustes dependendo da configuração do servidor)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || 'Desconhecido';
    
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

// PUT - Atualizar um usuário
export async function PUT(
  request: NextRequest,
  context: any
) {
  const id = context?.params?.id;

  try {
    // Verificar se o usuário é administrador
    const adminCheck = await verifyAdmin(request);
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Não autorizado' }, 
        { status: adminCheck.status || 401 }
      );
    }
    
    // Validar ID do usuário
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" }, 
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Verificar se o usuário existe
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' }, 
        { status: 404 }
      );
    }
    
    // Obter dados da requisição
    const data = await request.json();
    
    // Campos permitidos para atualização
    const allowedFields = [
      'name', 
      'email', 
      'role', 
      'address', 
      'cpf', 
      'phone', 
      'profileImage'
    ];
    
    // Filtrar apenas campos permitidos
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key)) {
        updateData[key] = data[key];
      }
    });
    
    // Atualizar o usuário
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar usuário',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

// DELETE - Excluir um usuário
export async function DELETE(
  request: NextRequest,
  context: any
) {
  const id = context?.params?.id;

  try {
    // Verificar se o usuário é administrador
    const adminCheck = await verifyAdmin(request);
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Não autorizado' }, 
        { status: adminCheck.status || 401 }
      );
    }
    
    // Validar ID do usuário
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID de usuário inválido" }, 
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Verificar se o usuário existe
    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' }, 
        { status: 404 }
      );
    }
    
    // Verificar se existem pedidos vinculados a este usuário
    const ordersCount = await Order.countDocuments({ user: id });
    
    if (ordersCount > 0) {
      return NextResponse.json(
        { 
          error: 'Não é possível excluir este usuário porque existem pedidos associados a ele',
          ordersCount
        }, 
        { status: 400 }
      );
    }
    
    // Excluir o usuário
    await User.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao excluir usuário',
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
} 