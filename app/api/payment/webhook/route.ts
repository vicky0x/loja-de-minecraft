import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:PAYMENT:WEBHOOK INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:PAYMENT:WEBHOOK ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:PAYMENT:WEBHOOK WARN] ${message}`, ...args)
};

/**
 * Processa webhooks do Mercado Pago
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('Recebido webhook do Mercado Pago');
    
    // Obter dados do corpo da requisição
    let data;
    try {
      const clonedRequest = request.clone();
      const text = await clonedRequest.text();
      
      if (!text || text.trim() === '') {
        logger.error('Corpo da requisição vazio');
        return NextResponse.json({ success: false, error: 'Corpo da requisição vazio' }, { status: 400 });
      }
      
      try {
        data = JSON.parse(text);
        logger.info(`Dados do webhook: ${JSON.stringify(data)}`);
      } catch (e) {
        logger.error(`Erro ao analisar JSON: ${text}`);
        return NextResponse.json({ success: false, error: 'JSON inválido no corpo da requisição' }, { status: 400 });
      }
    } catch (parseError) {
      logger.error('Erro ao analisar corpo da requisição:', parseError);
      return NextResponse.json({ success: false, error: 'Erro ao analisar corpo da requisição' }, { status: 400 });
    }
    
    // Verificar se é um evento de pagamento
    if (data.type !== 'payment' || !data.data || !data.data.id) {
      logger.info(`Ignorando webhook não relacionado a pagamento: ${data.type}`);
      return NextResponse.json({ success: true, message: 'Evento não processado' });
    }
    
    // Processar evento de pagamento
    const paymentId = data.data.id;
    logger.info(`Processando webhook de pagamento. ID: ${paymentId}`);
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar o pedido relacionado ao pagamento
    const connection = mongoose.connection;
    if (!connection || !connection.db) {
      throw new Error('Falha na conexão com o banco de dados');
    }
    
    const db = connection.db;
    const ordersCollection = db.collection('orders');
    
    // Buscar o pedido pelo ID do pagamento
    const order = await ordersCollection.findOne({ 
      $or: [
        { 'metadata.paymentId': paymentId.toString() },
        { 'paymentInfo.transactionId': paymentId.toString() }
      ]
    });
    
    if (!order) {
      logger.error(`Nenhum pedido encontrado para o pagamento ${paymentId}`);
      return NextResponse.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });
    }
    
    logger.info(`Pedido encontrado: ${order._id}`);
    
    // Se o pedido já estiver pago, retornar sucesso
    if (order.paymentStatus === 'paid' || order.orderStatus === 'paid' || 
        (order.paymentInfo && order.paymentInfo.status === 'paid')) {
      logger.info(`Pedido ${order._id} já está marcado como pago`);
      return NextResponse.json({ success: true, message: 'Pedido já processado' });
    }
    
    // Importar dinamicamente o módulo de Mercado Pago para obter status
    const { getPaymentStatus } = await import('@/app/lib/mercadopago');
    
    // Obter status do pagamento
    const paymentStatus = await getPaymentStatus(paymentId);
    logger.info(`Status do pagamento ${paymentId}: ${paymentStatus.status}`);
    
    // Se o pagamento estiver aprovado, marcar o pedido como pago
    if (paymentStatus.status === 'approved') {
      // Atualizar o status do pedido
      await ordersCollection.updateOne(
        { _id: order._id },
        { 
          $set: {
            paymentStatus: 'paid',
            orderStatus: 'processing',
            'paymentInfo.status': 'paid',
            'metadata.paymentVerifiedAt': new Date(),
            'metadata.paymentStatusResponse': paymentStatus,
            'metadata.webhookProcessedAt': new Date(),
            updatedAt: new Date()
          }
        }
      );
      
      logger.info(`Pedido ${order._id} atualizado para pago via webhook`);
      
      // Importar e executar a função de atribuição de produtos
      const { assignProductsToUser } = await import('@/app/api/payment/check-status/route');
      
      // Atribuir produtos ao usuário
      try {
        const assignResult = await assignProductsToUser(order, db);
        logger.info(`Produtos atribuídos com sucesso para o pedido ${order._id}: ${JSON.stringify(assignResult)}`);
        
        // Marcar o pedido como tendo produtos atribuídos
        if (assignResult) {
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { productAssigned: true } }
          );
          logger.info(`Pedido ${order._id} marcado como tendo produtos atribuídos`);
        }
      } catch (assignError) {
        logger.error(`Erro ao atribuir produtos: ${assignError}`);
        // Continuar para retornar sucesso, mesmo que a atribuição falhe
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Pagamento aprovado e pedido processado',
        orderId: order._id.toString()
      });
    } else {
      logger.info(`Pagamento ${paymentId} não está aprovado. Status: ${paymentStatus.status}`);
      
      // Atualizar o status do pagamento no pedido
      await ordersCollection.updateOne(
        { _id: order._id },
        { 
          $set: {
            'paymentInfo.status': paymentStatus.status,
            'metadata.paymentStatusResponse': paymentStatus,
            'metadata.webhookProcessedAt': new Date(),
            updatedAt: new Date()
          }
        }
      );
      
      return NextResponse.json({ 
        success: true, 
        message: `Status de pagamento atualizado: ${paymentStatus.status}`,
        orderId: order._id.toString()
      });
    }
    
  } catch (error) {
    logger.error('Erro ao processar webhook:', error);
    
    return NextResponse.json({ 
      success: false, 
      error: `Erro ao processar webhook: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
} 