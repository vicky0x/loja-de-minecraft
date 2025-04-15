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
    
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Erro de conexão com o banco de dados:', dbError);
      return NextResponse.json(
        { 
          error: 'Erro de conexão com o banco de dados',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Se há um termo de busca, precisamos encontrar IDs de usuários que correspondem ao termo
    let userIds: string[] = [];
    try {
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
    } catch (searchError) {
      console.error('Erro na busca de usuários:', searchError);
      // Continuar sem a busca por termo
    }
    
    // Contar total de registros para paginação
    let total = 0;
    try {
      total = await Order.countDocuments(filter);
    } catch (countError) {
      console.error('Erro ao contar pedidos:', countError);
      // Continuar com total 0
    }
    
    // Buscar pedidos com população do usuário
    let orders = [];
    try {
      orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email name profilePicture phone')
        .lean();
    } catch (fetchError) {
      console.error('Erro ao buscar pedidos:', fetchError);
      // Retornar array vazio se houver erro
      orders = [];
    }
    
    // Adicionar verificação adicional para garantir que os pedidos tenham informações de usuário
    const formattedOrders = orders.map(order => {
      try {
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
      } catch (formatError) {
        console.error('Erro ao formatar pedido:', formatError, order);
        // Retornar objeto com valores padrão em caso de erro
        return {
          _id: order._id ? order._id.toString() : 'erro',
          createdAt: order.createdAt || new Date(),
          totalAmount: order.totalAmount || 0,
          paymentInfo: order.paymentInfo || { status: 'unknown' },
          user: null
        };
      }
    });
    
    // Calcular informações de paginação
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    // Adicionar timestamp para controle de cache
    const responseData = {
      orders: formattedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(responseData, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar pedidos',
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString() 
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}

// PUT - Atualizar status de pedido
export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await isAdmin(request);
    if (!adminCheck) {
      return NextResponse.json({ 
        error: 'Não autorizado',
        timestamp: new Date().toISOString()
      }, { 
        status: 403,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Erro ao processar corpo da requisição:', parseError);
      return NextResponse.json(
        { 
          error: 'Corpo da requisição inválido', 
          timestamp: new Date().toISOString()
        },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    const { orderId, status, notes } = body;
    
    if (!orderId || !status) {
      return NextResponse.json(
        { 
          error: 'ID do pedido e status são obrigatórios',
          timestamp: new Date().toISOString()
        },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    try {
      await connectDB();
    } catch (dbError) {
      console.error('Erro de conexão com o banco de dados:', dbError);
      return NextResponse.json(
        { 
          error: 'Erro de conexão com o banco de dados',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
    
    // Buscar pedido
    let order;
    try {
      order = await Order.findById(orderId);
      
      if (!order) {
        return NextResponse.json(
          { 
            error: 'Pedido não encontrado',
            timestamp: new Date().toISOString() 
          },
          { 
            status: 404,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );
      }
    } catch (findError) {
      console.error('Erro ao buscar pedido:', findError);
      return NextResponse.json(
        { 
          error: 'Erro ao buscar pedido',
          message: findError instanceof Error ? findError.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
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
    
    try {
      await order.save();
      
      return NextResponse.json({
        success: true,
        message: 'Status atualizado com sucesso',
        order,
        timestamp: new Date().toISOString()
      }, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    } catch (saveError) {
      console.error('Erro ao salvar alterações do pedido:', saveError);
      return NextResponse.json(
        { 
          error: 'Erro ao salvar alterações do pedido',
          message: saveError instanceof Error ? saveError.message : 'Erro desconhecido',
          timestamp: new Date().toISOString()
        },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
  } catch (error) {
    console.error('Erro ao atualizar status do pedido:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao atualizar status do pedido', 
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
} 