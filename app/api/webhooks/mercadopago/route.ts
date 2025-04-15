import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';
import { getPaymentStatus } from '@/app/lib/mercadopago';
import { sendDiscordNotification } from '@/app/lib/services/discordService';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[WEBHOOK:MP INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[WEBHOOK:MP ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[WEBHOOK:MP WARN] ${message}`, ...args)
};

export async function POST(request: NextRequest) {
  try {
    // Extrair dados da requisição
    const data = await request.json();
    logger.info('Webhook do Mercado Pago recebido:', JSON.stringify(data));
    
    // Verificar tipo de notificação
    const { action, data: notification } = data;
    
    if (action !== 'payment.updated' && action !== 'payment.created') {
      logger.info(`Evento ignorado: ${action}`);
      return NextResponse.json({ message: 'Evento ignorado' });
    }
    
    // Obter ID do pagamento
    if (!notification?.id) {
      logger.error('ID do pagamento não fornecido');
      return NextResponse.json(
        { message: 'ID do pagamento não fornecido' },
        { status: 400 }
      );
    }
    
    const paymentId = notification.id;
    logger.info(`Processando pagamento ID: ${paymentId}`);
    
    await connectDB();
    
    // Consultar status do pagamento no Mercado Pago
    const paymentInfo = await getPaymentStatus(paymentId);
    logger.info(`Status do pagamento ${paymentId}: ${paymentInfo.status}`);
    
    // Se não for um pagamento aprovado, apenas registrar e não tomar ação
    if (paymentInfo.status !== 'approved') {
      logger.info(`Pagamento ${paymentId} com status: ${paymentInfo.status}. Aguardando aprovação.`);
      return NextResponse.json({ 
        message: `Notificação recebida: ${paymentInfo.status}. Aguardando aprovação.` 
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
      logger.error(`Pedido não encontrado para o pagamento ${paymentId}`);
      return NextResponse.json(
        { message: 'Pedido não encontrado para este pagamento' },
        { status: 404 }
      );
    }
    
    // Verificar se o pedido já está com status pago
    if (order.paymentStatus === 'paid') {
      logger.info(`Pedido ${order._id} já está marcado como pago`);
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
          'metadata.paymentVerifiedAt': new Date(),
          'metadata.paymentStatusResponse': paymentInfo,
          updatedAt: new Date()
        }
      }
    );
    
    logger.info(`Pedido ${order._id} atualizado para pago via webhook`);
    
    // Atribuir os itens do estoque ao usuário
    await assignProductsToUser(order, db);
    
    // Enviar notificação para o Discord
    try {
      await sendDiscordNotification(order);
      logger.info(`Notificação do pedido ${order._id} enviada para o Discord`);
    } catch (discordError) {
      logger.error(`Erro ao enviar notificação para o Discord: ${discordError instanceof Error ? discordError.message : 'Erro desconhecido'}`);
      // Não interrompemos o fluxo principal se a notificação falhar
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Pagamento processado com sucesso',
      orderId: order._id,
      paymentStatus: 'paid',
      orderStatus: 'completed'
    });
    
  } catch (error) {
    logger.error('Erro ao processar webhook do Mercado Pago:', error);
    return NextResponse.json(
      { 
        message: 'Erro ao processar webhook', 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}

// Função para atribuir produtos ao usuário após pagamento confirmado
async function assignProductsToUser(order: any, db: mongoose.mongo.Db) {
  try {
    logger.info(`Atribuindo produtos ao usuário ${order.userId} para o pedido ${order._id}`);
    
    // Verificar se o pedido tem itens
    if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
      logger.error(`Pedido ${order._id} não tem itens válidos para atribuição`);
      return false;
    }
    
    const stockItemsCollection = db.collection('stockitems');
    
    // Processar cada item do pedido
    for (const item of order.items) {
      // Verificar se o item possui os campos necessários
      if (!item.productId || !item.variantId) {
        logger.error(`Item inválido no pedido ${order._id}: ${JSON.stringify(item)}`);
        continue;
      }
      
      logger.info(`Processando item: ${item.name || 'Não identificado'} (${item.productId}/${item.variantId})`);
      
      try {
        // Convertendo IDs para ObjectId de forma segura
        const productId = typeof item.productId === 'string' 
          ? new mongoose.Types.ObjectId(item.productId)
          : item.productId;
          
        const variantId = typeof item.variantId === 'string'
          ? new mongoose.Types.ObjectId(item.variantId)
          : item.variantId;
        
        // Encontrar itens disponíveis no estoque
        const stockItems = await stockItemsCollection.find({
          productId: productId,
          variantId: variantId,
          assignedTo: { $exists: false }, // Filtrar apenas itens não atribuídos
          disabled: { $ne: true } // Ignorar itens desativados
        }).limit(item.quantity || 1).toArray();
        
        logger.info(`Encontrados ${stockItems.length} itens disponíveis para atribuição (necessários: ${item.quantity || 1})`);
        
        // Verificar se há itens suficientes
        if (stockItems.length < (item.quantity || 1)) {
          logger.error(`Estoque insuficiente para o item ${item.name || item.productId}. Encontrado: ${stockItems.length}, Necessário: ${item.quantity || 1}`);
          continue;
        }
        
        // Atribuir cada item ao usuário
        for (const stockItem of stockItems) {
          await stockItemsCollection.updateOne(
            { _id: stockItem._id },
            {
              $set: {
                assignedTo: new mongoose.Types.ObjectId(order.userId),
                assignedAt: new Date(),
                'metadata.orderId': order._id,
                'metadata.assignedBy': 'payment',
                updatedAt: new Date()
              }
            }
          );
        }
        
        logger.info(`${stockItems.length} itens atribuídos com sucesso ao usuário ${order.userId}`);
        
        // Atualizar o estoque do produto após a atribuição
        try {
          // Verificar se o produto tem variantes
          const productsCollection = db.collection('products');
          const product = await productsCollection.findOne({ _id: new mongoose.Types.ObjectId(item.productId) });
          
          if (product) {
            const hasVariants = product.variants && product.variants.length > 0;
            
            // Contar estoque restante
            const remainingStockFilter = {
              product: new mongoose.Types.ObjectId(item.productId),
              isUsed: false
            };
            
            // Adicionar condição de variante adequada ao filtro
            if (hasVariants && item.variantId) {
              remainingStockFilter['variant'] = new mongoose.Types.ObjectId(item.variantId);
            } else if (!hasVariants) {
              remainingStockFilter['variant'] = null;
            }
            
            const remainingStock = await stockItemsCollection.countDocuments(remainingStockFilter);
            logger.info(`Estoque restante para o produto ${item.productId}: ${remainingStock}`);
            
            // Atualizar o produto
            if (hasVariants && item.variantId) {
              // Para produtos com variantes, atualizar o estoque da variante
              await productsCollection.updateOne(
                { 
                  _id: new mongoose.Types.ObjectId(item.productId), 
                  'variants._id': new mongoose.Types.ObjectId(item.variantId) 
                },
                { $set: { 'variants.$.stock': remainingStock } }
              );
              logger.info(`Estoque da variante ${item.variantId} atualizado para ${remainingStock}`);
            } else if (!hasVariants) {
              // Para produtos sem variantes, atualizar o estoque diretamente
              // Se não houver estoque restante, definir como null para evitar o problema de "unidade fantasma"
              const stockValue = remainingStock > 0 ? remainingStock : null;
              await productsCollection.updateOne(
                { _id: new mongoose.Types.ObjectId(item.productId) },
                { $set: { stock: stockValue } }
              );
              logger.info(`Estoque do produto ${item.productId} (sem variante) atualizado para ${stockValue === null ? 'null (sem estoque)' : stockValue}`);
            }
          }
        } catch (stockUpdateError) {
          logger.error(`Erro ao atualizar o estoque do produto: ${stockUpdateError}`);
        }
      } catch (itemError) {
        logger.error(`Erro ao processar item ${JSON.stringify(item)}: ${itemError}`);
        continue; // Continuar com o próximo item em caso de erro
      }
    }
    
    // Atualizar o status do pedido para completado
    await db.collection('orders').updateOne(
      { _id: order._id },
      {
        $set: {
          orderStatus: 'completed',
          'metadata.completedAt': new Date(),
          updatedAt: new Date()
        }
      }
    );
    
    logger.info(`Pedido ${order._id} marcado como completado após atribuição dos produtos`);
    return true;
  } catch (error) {
    logger.error('Erro ao atribuir produtos ao usuário:', error);
    throw error;
  }
} 