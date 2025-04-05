import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';
import { getPaymentStatus } from '@/app/lib/mercadopago';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:PAYMENT:VERIFY INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:PAYMENT:VERIFY ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:PAYMENT:VERIFY WARN] ${message}`, ...args)
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'ID do pedido não fornecido' },
        { status: 400 }
      );
    }

    logger.info(`Verificando status de pagamento para o pedido ${orderId}`);

    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar o pedido no banco de dados
    const connection = mongoose.connection;
    if (!connection || !connection.db) {
      throw new Error('Falha na conexão com o banco de dados');
    }

    const db = connection.db;
    const ordersCollection = db.collection('orders');

    const order = await ordersCollection.findOne({
      _id: new mongoose.Types.ObjectId(orderId)
    });
    
    if (!order) {
      logger.warn(`Pedido ${orderId} não encontrado`);
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Se o pedido já estiver pago, retornar sucesso
    if (order.paymentStatus === 'paid') {
      logger.info(`Pedido ${orderId} já está pago`);
      return NextResponse.json({
        status: 'success',
        paymentStatus: 'paid',
        message: 'Pagamento já confirmado'
      });
    }

    // Verificar qual ID de pagamento usar
    let paymentId = null;
    
    // Para pagamentos PIX
    if (order.paymentInfo?.transactionId) {
      paymentId = order.paymentInfo.transactionId;
    } 
    // Para pagamentos com cartão de crédito
    else if (order.metadata?.paymentId) {
      paymentId = order.metadata.paymentId;
    }

    // Se não houver ID de pagamento, não é possível verificar
    if (!paymentId) {
      logger.warn(`Pedido ${orderId} não possui ID de pagamento`);
      return NextResponse.json({
        status: 'error',
        paymentStatus: order.paymentStatus || 'unknown',
        message: 'Pedido sem informações de pagamento'
      });
    }

    // Verificar o status do pagamento no Mercado Pago
    const paymentStatus = await getPaymentStatus(paymentId);
    logger.info(`Status do pagamento para o pedido ${orderId}: ${paymentStatus}`);

    // Atualizar o status do pedido no banco de dados se o status mudou
    if (paymentStatus !== order.paymentStatus) {
      await ordersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(orderId) },
        { 
          $set: {
            paymentStatus: paymentStatus,
            'paymentInfo.status': paymentStatus,
            updatedAt: new Date()
          } 
        }
      );
      
      logger.info(`Status do pedido ${orderId} atualizado para ${paymentStatus}`);
      
      // Se o pagamento foi aprovado, processar a atribuição de produtos
      if (paymentStatus === 'approved' || paymentStatus === 'paid') {
        try {
          const { assignProductsToUser } = await import('@/app/api/payment/check-status/route');
          await assignProductsToUser(order, db);
          logger.info(`Produtos atribuídos com sucesso para o pedido ${orderId}`);
        } catch (error) {
          logger.error(`Erro ao atribuir produtos para o pedido ${orderId}:`, error);
        }
      }
    }

    return NextResponse.json({
      status: 'success',
      paymentStatus,
      message: 'Status do pagamento verificado com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao verificar status do pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar status do pagamento' },
      { status: 500 }
    );
  }
} 