import { NextRequest, NextResponse } from 'next/server';
import { checkAuth, isAdmin as isAdminCheck } from '@/app/lib/auth';
import User from '@/app/lib/models/user';
import Order from '@/app/lib/models/order';
import connectDB from '@/app/lib/db/mongodb';

// Define a interface User
interface IUser {
  _id: string;
  username: string;
  email: string;
  role: string;
}

// Função para verificar se o usuário é admin
async function isAdmin(req: NextRequest) {
  const { isAuthenticated, user } = await checkAuth(req);
  if (!isAuthenticated || !user) return false;
  
  return isAdminCheck(user);
}

// GET - Listar pedidos (com paginação)
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await isAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    
    // Parâmetros de query
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const searchTerm = searchParams.get('search') || '';
    
    // Preparar filtros
    const filter: any = {};
    
    if (status) {
      filter['paymentInfo.status'] = status;
    }
    
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      filter.createdAt = { $lte: new Date(endDate) };
    }
    
    // Calcular skip para paginação
    const skip = (page - 1) * limit;
    
    await connectDB();
    
    // Se há um termo de busca, precisamos encontrar IDs de usuários que correspondem ao termo
    let userIds: string[] = [];
    if (searchTerm) {
      const users = await User.find({
        $or: [
          { username: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      }).select('_id');
      
      userIds = users.map(user => user._id.toString());
      
      // Adicionar busca por ID de pedido
      filter.$or = [
        { _id: { $regex: searchTerm, $options: 'i' } },
        { user: { $in: userIds } }
      ];
    }
    
    // Contar total de registros para paginação
    const total = await Order.countDocuments(filter);
    
    // Buscar pedidos com população do usuário
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'username email name profilePicture phone')
      .lean();
    
    // Adicionar verificação adicional para garantir que os pedidos tenham informações de usuário
    const formattedOrders = orders.map(order => {
      // Se o usuário não existe ou não foi encontrado, criar um objeto com valores padrão
      if (!order.user) {
        console.log('Pedido sem usuário associado:', order._id);
        
        order.user = {
          _id: 'desconhecido',
          username: 'Usuário não disponível',
          email: 'Email não disponível'
        };
      }
      
      return {
        ...order,
        _id: order._id.toString(),
        user: order.user ? {
          _id: order.user._id.toString(),
          username: order.user.username || 'Usuário não disponível',
          email: order.user.email || 'Email não disponível',
          name: order.user.name,
          profilePicture: order.user.profilePicture,
          phone: order.user.phone
        } : null
      };
    });
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar status de pedido
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await isAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }
    
    const body = await request.json();
    const { orderId, status, notes } = body;
    
    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'ID do pedido e status são obrigatórios' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Buscar pedido
    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }
    
    // Obter dados do usuário autenticado para registro
    const { user } = await checkAuth(request);
    
    // Atualizar status
    order.paymentInfo.status = status;
    
    // Adicionar notas se fornecidas
    if (notes) {
      if (!order.notes) order.notes = [];
      
      order.notes.push({
        content: notes,
        addedBy: user?.email || 'Sistema',
        addedAt: new Date()
      });
    }
    
    // Adicionar histórico de status
    if (!order.statusHistory) order.statusHistory = [];
    
    order.statusHistory.push({
      status,
      changedBy: user?.email || 'Sistema',
      changedAt: new Date()
    });
    
    await order.save();
    
    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso',
      order
    });
    
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status do pedido' },
      { status: 500 }
    );
  }
} 