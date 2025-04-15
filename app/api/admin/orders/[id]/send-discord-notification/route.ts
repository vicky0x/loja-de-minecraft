import { NextRequest, NextResponse } from 'next/server';
import mongoose, { isValidObjectId } from 'mongoose';
import dbConnect from '@/app/lib/db/mongodb';
import { sendDiscordNotification } from '@/app/lib/services/discordService';

// Função para verificar autenticação de administrador
async function verifyAdmin(request: NextRequest) {
  try {
    const { checkAuth, isAdmin } = await import('@/app/lib/auth');
    const { isAuthenticated, user } = await checkAuth(request);
    
    if (!isAuthenticated || !user) {
      return { isAdmin: false, error: 'Não autenticado', status: 401 };
    }
    
    if (!isAdmin(user)) {
      return { isAdmin: false, error: 'Não autorizado', status: 403 };
    }
    
    return { isAdmin: true, user, error: null, status: 200 };
  } catch (error) {
    console.error('Erro ao verificar autenticação admin:', error);
    return { isAdmin: false, error: 'Erro ao verificar autenticação', status: 500 };
  }
}

// POST /api/admin/orders/[id]/send-discord-notification - Enviar notificação de pedido para o Discord
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obter ID do pedido a partir dos parâmetros
    const id = params?.id;
    
    if (!id) {
      return NextResponse.json({ 
        message: 'ID do pedido é obrigatório', 
        status: 'error' 
      }, { status: 400 });
    }
    
    console.log(`Enviando notificação para o Discord do pedido: ${id}`);
    
    // Verificar autenticação
    const auth = await verifyAdmin(request);
    
    if (!auth.isAdmin) {
      console.warn(`Tentativa não autorizada de enviar notificação para o pedido ${id}: ${auth.error}`);
      return NextResponse.json({ message: auth.error }, { status: auth.status });
    }
    
    // Validar ID
    if (!isValidObjectId(id)) {
      console.warn(`ID de pedido inválido: ${id}`);
      return NextResponse.json({ message: 'ID de pedido inválido' }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    await dbConnect();
    
    // Obter modelo Order
    const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}));
    
    // Buscar o pedido
    const order = await Order.findById(id);
    
    if (!order) {
      console.warn(`Pedido não encontrado: ${id}`);
      return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
    }
    
    // Verificar se o pedido está pago - aceitando mais variações de estados
    const acceptedStatuses = ['paid', 'approved', 'Pago', 'Aprovado', 'completed', 'Completo', 'processing', 'Processando'];
    const orderStatus = (order.status || '').toString().toLowerCase();
    const paymentStatus = (order.paymentStatus || '').toString().toLowerCase();
    const paymentInfoStatus = (order.paymentInfo?.status || '').toString().toLowerCase();
    
    const isStatusApproved = 
      acceptedStatuses.includes(orderStatus) || 
      acceptedStatuses.includes(paymentStatus) || 
      acceptedStatuses.includes(paymentInfoStatus);
    
    if (!isStatusApproved) {
      console.warn(`Pedido ${id} com status inválido: status=${order.status}, paymentStatus=${order.paymentStatus}, paymentInfo.status=${order.paymentInfo?.status}`);
      return NextResponse.json({ 
        message: 'Somente pedidos aprovados podem receber notificações',
        status: 'error',
        currentStatus: {
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentInfoStatus: order.paymentInfo?.status
        }
      }, { status: 400 });
    }
    
    // Enviar notificação para o Discord
    try {
      await sendDiscordNotification(order);
      console.log(`Notificação do pedido ${id} enviada para o Discord com sucesso`);
      
      return NextResponse.json({ 
        message: 'Notificação enviada com sucesso',
        status: 'success'
      });
    } catch (error) {
      console.error(`Erro ao enviar notificação para o Discord:`, error);
      return NextResponse.json({ 
        message: 'Erro ao enviar notificação',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        status: 'error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao processar solicitação:', error);
    return NextResponse.json({ 
      message: 'Erro ao processar solicitação',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      status: 'error'
    }, { status: 500 });
  }
} 