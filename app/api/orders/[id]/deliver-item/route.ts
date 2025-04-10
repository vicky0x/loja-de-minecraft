import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Order from '@/app/lib/models/order';
import { checkAuth } from '@/app/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: any
) {
  try {
    // Verificar autenticação e permissões
    const authData = await checkAuth(request);
    if (!authData?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é administrador
    if (authData.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso não autorizado' },
        { status: 403 }
      );
    }

    // Conectar ao banco de dados
    await connectDB();

    // Obter ID do pedido e item a ser marcado como entregue
    const id = params?.id;
    const { itemId, note } = await request.json();

    if (!id || !itemId) {
      return NextResponse.json(
        { error: 'ID do pedido e do item são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar o pedido
    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o status do pagamento é "paid"
    if (order.paymentInfo.status !== 'paid') {
      return NextResponse.json(
        { error: 'Este pedido ainda não foi pago' },
        { status: 400 }
      );
    }

    // Encontrar o item do pedido
    const orderItem = order.orderItems.find(
      (item: any) => item._id.toString() === itemId
    );

    if (!orderItem) {
      return NextResponse.json(
        { error: 'Item do pedido não encontrado' },
        { status: 404 }
      );
    }

    // Marcar item como entregue
    orderItem.delivered = true;

    // Adicionar nota ao pedido, se fornecida
    if (note) {
      order.notes.push({
        content: note,
        addedBy: authData.user.username || 'Administrador',
        addedAt: new Date()
      });
    }

    // Adicionar ao histórico de status
    order.statusHistory.push({
      status: 'item_delivered',
      changedBy: authData.user.username || 'Administrador',
      changedAt: new Date()
    });

    // Atualizar o metadata do pedido
    if (!order.metadata) {
      order.metadata = {};
    }
    
    order.metadata.lastUpdatedBy = authData.user.username || 'Administrador';
    order.metadata.lastUpdatedAt = new Date();

    // Salvar as alterações
    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Item marcado como entregue com sucesso',
      deliveredAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao marcar item como entregue:', error);
    return NextResponse.json(
      {
        error: 'Erro ao processar a solicitação',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 