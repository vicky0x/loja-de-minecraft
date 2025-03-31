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
    // Conectar ao banco de dados
    await connectDB();
    
    logger.info('Recebido webhook do Mercado Pago');
    
    // Obter dados do corpo da requisição
    let data;
    try {
      const text = await request.text();
      data = JSON.parse(text);
      logger.info(`Dados do webhook: ${JSON.stringify(data)}`);
    } catch (e) {
      logger.error('Erro ao analisar dados do webhook:', e);
      return NextResponse.json({ error: 'Falha ao analisar o corpo da requisição' }, { status: 400 });
    }
    
    // Ignorar webhooks que não são de pagamento
    if (data.type !== 'payment') {
      logger.info(`Ignorando webhook não relacionado a pagamento: ${data.type}`);
      return NextResponse.json({ message: 'Webhook não relacionado a pagamento' });
    }
    
    // Obter o ID do pagamento
    const paymentId = data.data?.id;
    if (!paymentId) {
      return NextResponse.json({ error: 'ID de pagamento não fornecido no webhook' }, { status: 400 });
    }
    
    logger.info(`Processando webhook de pagamento. ID: ${paymentId}`);
    
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
        logger.info(`Iniciando atribuição de produtos do pedido ${order._id} para o usuário ${order.userId || order.user}`);
        
        const assignResult = await assignProductsToUser(order, db);
        logger.info(`Resultado da atribuição de produtos: ${JSON.stringify(assignResult)}`);
        
        // Marcar o pedido como tendo produtos atribuídos
        if (assignResult) {
          await ordersCollection.updateOne(
            { _id: order._id },
            { $set: { productAssigned: true } }
          );
          logger.info(`Pedido ${order._id} marcado como tendo produtos atribuídos`);
          
          // Verificar se os produtos foram corretamente adicionados à lista do usuário
          const { default: User } = await import('@/app/lib/models/user');
          const userId = order.userId || (order.user && (typeof order.user === 'string' ? order.user : order.user.toString()));
          
          if (userId) {
            const user = await User.findById(userId);
            logger.info(`Usuário ${userId} tem ${user?.products?.length || 0} produtos após atribuição`);
          }
        } else {
          logger.error(`Falha na atribuição de produtos para o pedido ${order._id}. Verificando itens...`);
          
          // Verificar os itens do pedido para diagnóstico
          const orderItems = order.orderItems || order.items;
          if (orderItems && Array.isArray(orderItems)) {
            logger.info(`Detalhes dos itens do pedido: ${JSON.stringify(orderItems)}`);
            
            // Verificar estoque disponível para cada item
            for (const item of orderItems) {
              const productId = item.productId || (item.product && (typeof item.product === 'string' ? item.product : item.product.toString()));
              const variantId = item.variantId || item.variant;
              
              if (productId) {
                // Buscar o produto para verificar se tem variantes
                const { default: Product } = await import('@/app/lib/models/product');
                const product = await Product.findById(productId);
                
                if (product) {
                  const hasVariants = product.variants && product.variants.length > 0;
                  logger.info(`Produto ${productId} ${hasVariants ? 'tem variantes' : 'não tem variantes'}`);
                  
                  // Verificar estoque disponível
                  const { default: StockItem } = await import('@/app/lib/models/stock');
                  const stockFilter = {
                    product: productId,
                    isUsed: false,
                    assignedTo: null,
                    ...(hasVariants ? { variant: variantId } : { variant: null })
                  };
                  
                  const stockCount = await StockItem.countDocuments(stockFilter);
                  logger.info(`Estoque disponível para o produto ${productId} ${hasVariants ? `variante ${variantId}` : 'sem variante'}: ${stockCount}`);
                }
              }
            }
          }
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