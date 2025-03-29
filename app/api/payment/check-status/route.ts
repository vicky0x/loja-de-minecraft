import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';
import { getPaymentStatus } from '@/app/lib/mercadopago';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:PAYMENT:CHECK INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:PAYMENT:CHECK ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:PAYMENT:CHECK WARN] ${message}`, ...args)
};

// Cache simples para controle de rate limiting
const checkCache = new Map<string, number>();

// Tempo mínimo entre verificações para um mesmo pedido (em ms)
const MIN_CHECK_INTERVAL = 10000; // 10 segundos (reduzido de 30 segundos)

/**
 * Verifica o status de um pagamento e atualiza o pedido se necessário
 */
export async function POST(request: NextRequest) {
  try {
    // Obter dados do corpo da requisição com tratamento de erro
    let data;
    try {
      // Verificar se o corpo da requisição não está vazio
      const contentType = request.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        logger.error('Requisição sem conteúdo JSON válido');
        return NextResponse.json({ 
          success: false, 
          isPaid: false,
          error: 'Conteúdo da requisição deve ser JSON válido' 
        }, { status: 400 });
      }
      
      // Clonar a requisição para garantir que podemos ler o corpo
      const clonedRequest = request.clone();
      const text = await clonedRequest.text();
      
      if (!text || text.trim() === '') {
        logger.error('Corpo da requisição vazio');
        return NextResponse.json({ 
          success: false, 
          isPaid: false,
          error: 'Corpo da requisição vazio' 
        }, { status: 400 });
      }
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        logger.error(`Erro ao analisar JSON: ${text}`);
        return NextResponse.json({ 
          success: false, 
          isPaid: false,
          error: 'JSON inválido no corpo da requisição' 
        }, { status: 400 });
      }
    } catch (parseError) {
      logger.error('Erro ao analisar corpo da requisição:', parseError);
      return NextResponse.json({ 
        success: false, 
        isPaid: false,
        error: 'Erro ao analisar corpo da requisição' 
      }, { status: 400 });
    }
    
    const { orderId, paymentId } = data;
    
    logger.info(`Verificando status do pagamento para o pedido ${orderId}`);
    
    // Validar os dados
    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        isPaid: false,
        error: 'ID do pedido não fornecido' 
      }, { status: 400 });
    }
    
    // Verificar rate limiting
    const lastCheckTime = checkCache.get(orderId);
    const now = Date.now();
    
    if (lastCheckTime && (now - lastCheckTime) < MIN_CHECK_INTERVAL) {
      const timeElapsed = now - lastCheckTime;
      const waitTime = MIN_CHECK_INTERVAL - timeElapsed;
      logger.warn(
        `Verificação muito frequente para o pedido ${orderId}. ` +
        `Última verificação: ${new Date(lastCheckTime).toISOString()} ` +
        `(${Math.round(timeElapsed/1000)}s atrás). ` + 
        `Aguarde mais ${Math.round(waitTime/1000)}s antes de verificar novamente.`
      );
      
      return NextResponse.json({
        success: true,
        isPaid: false,
        orderId,
        message: 'Verificação muito frequente, aguarde alguns segundos',
        paymentStatus: 'pending', // Retornar status pendente por padrão
        lastCheck: lastCheckTime,
        nextCheckAllowed: lastCheckTime + MIN_CHECK_INTERVAL,
        waitSeconds: Math.ceil(waitTime/1000)
      });
    }
    
    // Atualizar o timestamp da última verificação
    checkCache.set(orderId, now);
    
    // Limitar o tamanho do cache para evitar crescimento descontrolado
    if (checkCache.size > 1000) {
      // Limpar entradas mais antigas se o cache ficar muito grande
      const oldest = [...checkCache.entries()].sort(([, a], [, b]) => a - b)[0];
      if (oldest) checkCache.delete(oldest[0]);
    }
    
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
      return NextResponse.json({ 
        success: false, 
        isPaid: false,
        error: 'Pedido não encontrado' 
      }, { status: 404 });
    }
    
    // Se o status do pedido já for pago, retornar sucesso
    if (order.paymentStatus === 'paid' || 
        order.orderStatus === 'paid' || 
        (order.paymentInfo && order.paymentInfo.status === 'paid') ||
        order.productAssigned === true) {
      logger.info(`Pedido ${orderId} já está marcado como pago`);
      return NextResponse.json({ 
        success: true, 
        isPaid: true,
        orderId,
        paymentStatus: 'paid'
      });
    }
    
    // Obter o ID do pagamento associado ao pedido, se não for fornecido diretamente
    const actualPaymentId = paymentId || order.metadata?.paymentId;
    
    if (!actualPaymentId) {
      return NextResponse.json({ 
        success: false, 
        isPaid: false,
        error: 'ID do pagamento não encontrado para este pedido' 
      }, { status: 400 });
    }
    
    // Verificar o status do pagamento na API do Mercado Pago
    try {
      const paymentStatus = await getPaymentStatus(actualPaymentId);
      logger.info(`Status do pagamento ${actualPaymentId}: ${paymentStatus.status}`);
      
      // Se o pagamento for aprovado, atualizar o pedido
      const isPaid = paymentStatus.status === 'approved';
      
      if (isPaid) {
        // Atualizar o status do pedido
        await ordersCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(orderId) },
          { 
            $set: {
              paymentStatus: 'paid',
              orderStatus: 'processing',
              'paymentInfo.status': 'paid',
              'metadata.paymentVerifiedAt': new Date(),
              'metadata.paymentStatusResponse': paymentStatus,
              updatedAt: new Date()
            }
          }
        );
        
        logger.info(`Pedido ${orderId} atualizado para pago`);
        
        // Atribuir os itens do estoque ao usuário
        const assignResult = await assignProductsToUser(order, db);
        logger.info(`Resultado da atribuição de produtos: ${JSON.stringify(assignResult)}`);
        
        // Marcar o pedido como tendo produtos atribuídos
        if (assignResult) {
          await ordersCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(orderId) },
            { $set: { productAssigned: true } }
          );
          logger.info(`Pedido ${orderId} marcado como tendo produtos atribuídos`);
        }
        
        return NextResponse.json({ 
          success: true, 
          isPaid: true,
          orderId,
          paymentStatus: 'paid',
          orderStatus: 'processing'
        });
      } else {
        // Pagamento ainda está pendente
        return NextResponse.json({ 
          success: true, 
          isPaid: false,
          orderId,
          paymentStatus: paymentStatus.status,
          orderStatus: order.orderStatus || 'pending'
        });
      }
    } catch (mpError) {
      logger.error(`Erro ao verificar pagamento ${actualPaymentId}:`, mpError);
      
      return NextResponse.json({ 
        success: false, 
        isPaid: false,
        error: `Erro ao verificar pagamento: ${mpError instanceof Error ? mpError.message : String(mpError)}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    logger.error('Erro ao processar verificação de pagamento:', error);
    
    return NextResponse.json({ 
      success: false, 
      isPaid: false,
      error: `Erro ao processar a verificação: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 });
  }
}

// Função para atribuir produtos ao usuário após pagamento confirmado
async function assignProductsToUser(order: any, db: mongoose.mongo.Db) {
  try {
    logger.info(`Iniciando atribuição de produtos para o pedido ${order._id}`);
    
    // Verificar se já foram atribuídos produtos
    if (order.productAssigned) {
      logger.info(`Produtos já foram atribuídos anteriormente para o pedido ${order._id}`);
      return true;
    }

    // Extrair ID do usuário do pedido de forma mais robusta
    const userId = order.userId || 
                  (order.user && (typeof order.user === 'string' ? order.user : 
                  (order.user._id ? order.user._id.toString() : order.user.toString())));
    
    if (!userId) {
      logger.error(`Pedido ${order._id} não tem usuário associado válido`);
      return false;
    }
    
    logger.info(`Atribuindo produtos ao usuário ${userId} para o pedido ${order._id}`);
    
    // Verificar se o pedido tem itens
    const orderItems = order.orderItems || order.items;
    
    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      logger.error(`Pedido ${order._id} não tem itens válidos para atribuição`);
      return false;
    }
    
    logger.info(`Pedido tem ${orderItems.length} itens para atribuir`);
    
    const stockItemsCollection = db.collection('stockitems');
    const usersCollection = db.collection('users');
    const ordersCollection = db.collection('orders');
    
    let allItemsAssigned = true;
    
    // Array para armazenar os IDs dos produtos atribuídos
    const assignedProductIds = [];
    
    // Processar cada item do pedido
    for (const item of orderItems) {
      try {
        // Verificar se o item possui os campos necessários
        let productId = null;
        let variantId = 'default';
        
        // Extrair productId de diferentes formatos
        if (item.productId) {
          productId = item.productId;
        } else if (item.product) {
          if (typeof item.product === 'string') {
            productId = item.product;
          } else if (item.product._id) {
            productId = typeof item.product._id === 'string' ? 
                        item.product._id : 
                        item.product._id.toString();
          }
        }
        
        // Extrair variantId de diferentes formatos
        if (item.variantId) {
          variantId = item.variantId;
        } else if (item.variant) {
          if (typeof item.variant === 'string') {
            variantId = item.variant;
          } else if (item.variant._id) {
            variantId = typeof item.variant._id === 'string' ? 
                        item.variant._id : 
                        item.variant._id.toString();
          }
        }
        
        if (!productId) {
          logger.error(`Dados do produto insuficientes no pedido ${order._id}: ${JSON.stringify(item)}`);
          allItemsAssigned = false;
          continue;
        }
        
        const itemName = item.name || (item.productName ? `${item.productName} - ${item.variantName || ''}` : 'Produto não identificado');
        logger.info(`Processando item: ${itemName} (${productId}/${variantId})`);
        
        // Convertendo IDs para ObjectId de forma segura
        const productObjectId = typeof productId === 'string' 
          ? new mongoose.Types.ObjectId(productId)
          : productId;
          
        // Encontrar itens disponíveis no estoque
        const quantity = item.quantity || 1;
        logger.info(`Buscando ${quantity} itens em estoque para o produto ${productId}, variante ${variantId}`);
        
        const stockItems = await stockItemsCollection.find({
          product: productObjectId,
          variant: variantId,
          isUsed: false,
          assignedTo: null
        }).limit(quantity).toArray();
        
        logger.info(`Encontrados ${stockItems.length} itens disponíveis para atribuição (necessários: ${quantity})`);
        
        // Verificar se há itens suficientes
        if (stockItems.length < quantity) {
          logger.error(`Estoque insuficiente para o item ${itemName}. Encontrado: ${stockItems.length}, Necessário: ${quantity}`);
          allItemsAssigned = false;
          continue;
        }
        
        // Atribuir cada item ao usuário
        for (const stockItem of stockItems) {
          try {
            await stockItemsCollection.updateOne(
              { _id: stockItem._id },
              {
                $set: {
                  assignedTo: new mongoose.Types.ObjectId(userId),
                  assignedAt: new Date(),
                  isUsed: true,
                  'metadata.orderId': order._id.toString(),
                  'metadata.assignedBy': 'payment-api',
                  updatedAt: new Date()
                }
              }
            );
            
            // Adicionar o productId ao array de produtos atribuídos
            if (stockItem.product) {
              assignedProductIds.push(stockItem.product);
              logger.info(`Item ${stockItem._id} atribuído ao usuário ${userId} (produto: ${stockItem.product})`);
            } else {
              logger.warn(`Item ${stockItem._id} não possui referência ao produto`);
            }
          } catch (updateError) {
            logger.error(`Erro ao atualizar item ${stockItem._id}: ${updateError}`);
            allItemsAssigned = false;
          }
        }
        
        logger.info(`${stockItems.length} itens atribuídos com sucesso para o produto ${productId}`);
      } catch (itemError) {
        logger.error(`Erro ao processar item ${JSON.stringify(item)}: ${itemError}`);
        allItemsAssigned = false;
        continue;
      }
    }
    
    // Adicionar todos os produtos à lista do usuário de uma vez
    if (assignedProductIds.length > 0) {
      logger.info(`Adicionando ${assignedProductIds.length} produtos à lista do usuário ${userId}`);
      
      try {
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // Verificar se o usuário existe
        const userExists = await usersCollection.findOne({ _id: userObjectId });
        if (!userExists) {
          logger.error(`Usuário ${userId} não encontrado no banco de dados`);
          allItemsAssigned = false;
        } else {
          // Atualizar a lista de produtos do usuário ($addToSet para evitar duplicatas)
          logger.info(`Atualizando lista de produtos do usuário ${userId} com: ${JSON.stringify(assignedProductIds)}`);
          
          const updateResult = await usersCollection.updateOne(
            { _id: userObjectId },
            { $addToSet: { products: { $each: assignedProductIds } } }
          );
          
          logger.info(`Lista de produtos do usuário ${userId} atualizada com sucesso: ${JSON.stringify(updateResult)}`);
        }
      } catch (userUpdateError) {
        logger.error(`Erro ao atualizar a lista de produtos do usuário ${userId}: ${userUpdateError}`);
        allItemsAssigned = false;
      }
    } else {
      logger.warn(`Nenhum produto para adicionar ao usuário ${userId} - todos os itens falharam?`);
      allItemsAssigned = false;
    }
    
    // Atualizar o status do pedido
    try {
      await ordersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(order._id.toString()) },
        {
          $set: {
            orderStatus: 'completed',
            productAssigned: allItemsAssigned,
            'metadata.completedAt': new Date(),
            updatedAt: new Date()
          }
        }
      );
      
      // Tentar adicionar ao histórico de status, com tratamento de erro adequado
      try {
        await ordersCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(order._id.toString()) },
          { 
            $push: { 
              statusHistory: {
                status: 'fulfilled',
                changedBy: 'Sistema (Pagamento Automático)',
                changedAt: new Date()
              }
            } 
          }
        );
      } catch (historyError) {
        logger.warn(`Não foi possível atualizar o histórico de status, mas a atribuição foi concluída: ${historyError}`);
      }
      
      logger.info(`Pedido ${order._id} marcado como ${allItemsAssigned ? 'completado' : 'parcialmente completado'} após atribuição dos produtos`);
    } catch (orderUpdateError) {
      logger.error(`Erro ao atualizar o status do pedido ${order._id}: ${orderUpdateError}`);
      allItemsAssigned = false;
    }
    
    return allItemsAssigned;
  } catch (error) {
    logger.error(`Erro geral ao atribuir produtos ao usuário: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
} 