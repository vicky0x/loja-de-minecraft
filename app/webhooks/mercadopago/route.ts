import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[WEBHOOK:MP INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[WEBHOOK:MP ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WEBHOOK:MP WARN] ${message}`, ...args)
};

/**
 * Webhook do Mercado Pago para processar pagamentos
 */
export async function POST(request: NextRequest) {
  try {
    logger.info('⚡️ Webhook recebido do Mercado Pago');
    
    // Obter dados do corpo da requisição
    const text = await request.text();
    let data;
    try {
      data = JSON.parse(text);
      logger.info(`Dados do webhook: ${JSON.stringify(data)}`);
    } catch (e) {
      logger.error('⚠️ Erro ao analisar dados do webhook:', e);
      logger.error('Texto recebido:', text);
      return NextResponse.json({ message: 'Falha ao analisar o corpo da requisição' }, { status: 400 });
    }
    
    // Se o tipo do webhook não for sobre pagamento, ignorar
    if (data.type !== 'payment') {
      logger.info(`Ignorando webhook não relacionado a pagamento: ${data.type}`);
      return NextResponse.json({ message: 'Webhook não processado - tipo não suportado' });
    }
    
    // Extrair ID do pagamento
    const paymentId = data.data?.id;
    if (!paymentId) {
      logger.error('⚠️ ID de pagamento não encontrado no webhook');
      return NextResponse.json({ message: 'ID de pagamento não encontrado' }, { status: 400 });
    }
    
    logger.info(`🔍 Processando pagamento ID: ${paymentId}`);
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter detalhes do pagamento
    const { getPaymentStatus } = await import('@/app/lib/mercadopago');
    const paymentInfo = await getPaymentStatus(paymentId);
    
    logger.info(`💵 Status do pagamento ${paymentId}: ${paymentInfo.status}`);
    
    if (paymentInfo.status !== 'approved') {
      logger.info(`✋ Pagamento ${paymentId} não está aprovado. Status: ${paymentInfo.status}`);
      return NextResponse.json({ 
        message: `Pagamento não está aprovado (${paymentInfo.status})`,
        status: paymentInfo.status
      });
    }
    
    const connection = mongoose.connection;
    if (!connection || !connection.db) {
      throw new Error('Falha na conexão com o banco de dados');
    }
    
    const db = connection.db;
    
    // Buscar pedido pelo ID do pagamento
    const ordersCollection = db.collection('orders');
    let order = await ordersCollection.findOne({
      'metadata.paymentId': paymentId
    });
    
    // Se não encontrou pelo ID do pagamento, tenta por referência externa
    if (!order && paymentInfo.external_reference) {
      order = await ordersCollection.findOne({
        'metadata.externalReference': paymentInfo.external_reference
      });
    }
    
    if (!order) {
      logger.error(`⚠️ Pedido não encontrado para o pagamento ${paymentId}`);
      return NextResponse.json(
        { message: 'Pedido não encontrado para este pagamento' },
        { status: 404 }
      );
    }
    
    logger.info(`🧾 Pedido encontrado: ${order._id}`);
    
    // Verificar se o pedido já está com status pago
    if (order.paymentStatus === 'paid') {
      logger.info(`✅ Pedido ${order._id} já está marcado como pago`);
      return NextResponse.json({ 
        message: 'Pedido já processado anteriormente',
        orderId: order._id
      });
    }
    
    // Atualizar status do pedido
    await ordersCollection.updateOne(
      { _id: order._id },
      { 
        $set: {
          paymentStatus: 'paid',
          orderStatus: 'processing',
          'paymentInfo.status': 'paid',
          'metadata.paymentVerifiedAt': new Date(),
          'metadata.paymentStatusResponse': paymentInfo,
          updatedAt: new Date()
        }
      }
    );
    
    logger.info(`✅ Pedido ${order._id} atualizado para pago via webhook`);
    
    // Atribuir os itens do estoque ao usuário
    try {
      const { assignProductsToUser } = await import('@/app/api/payment/check-status/route');
      const result = await assignProductsToUser(order, db);
      
      if (result) {
        logger.info(`🎉 Produtos atribuídos com sucesso para o pedido ${order._id}`);
        
        // Marcar o pedido como tendo produtos atribuídos
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: { productAssigned: true } }
        );
      } else {
        logger.error(`⚠️ Falha ao atribuir produtos para o pedido ${order._id}`);
        
        // Verificar se há produtos sem variantes no pedido
        const orderItems = order.orderItems || order.items || [];
        if (orderItems.length > 0) {
          logger.info(`Detalhes dos itens do pedido: ${JSON.stringify(orderItems)}`);
          
          const { default: Product } = await import('@/app/lib/models/product');
          
          for (const item of orderItems) {
            const productId = item.productId || (item.product && (typeof item.product === 'string' ? item.product : item.product.toString()));
            
            if (productId) {
              const product = await Product.findById(productId);
              
              if (product) {
                const hasVariants = product.variants && product.variants.length > 0;
                logger.info(`📦 Produto ${productId} ${hasVariants ? 'tem variantes' : 'não tem variantes'}`);
                
                // Verificar estoque disponível
                const { default: StockItem } = await import('@/app/lib/models/stock');
                const stockFilter = {
                  product: new mongoose.Types.ObjectId(productId),
                  isUsed: false,
                  assignedTo: null,
                  ...(hasVariants ? { variant: item.variantId || item.variant } : { variant: null })
                };
                
                const stockCount = await StockItem.countDocuments(stockFilter);
                logger.info(`🏷️ Estoque disponível para o produto ${productId}: ${stockCount}`);
                
                // Se não houver estoque suficiente, registrar
                if (stockCount < (item.quantity || 1)) {
                  logger.error(`⚠️ Estoque insuficiente para o produto ${productId}: disponível ${stockCount}, necessário ${item.quantity || 1}`);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      logger.error(`⚠️ Erro ao atribuir produtos: ${error}`);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Pagamento processado com sucesso',
      orderId: order._id,
      paymentStatus: 'paid',
      orderStatus: 'completed'
    });
    
  } catch (error) {
    logger.error('⚠️ Erro ao processar webhook do Mercado Pago:', error);
    
    return NextResponse.json(
      { 
        message: 'Erro ao processar webhook',
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 