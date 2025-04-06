import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';
import { getPaymentStatus } from '@/app/lib/mercadopago';
import { getOrderById, updateOrder } from '@/app/lib/orders';
import logger from '@/app/lib/logger';

// Logger simples
const loggerSimple = {
  info: (message: string, ...args: any[]) => console.log(`[API:PAYMENT:CHECK INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:PAYMENT:CHECK ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:PAYMENT:CHECK WARN] ${message}`, ...args)
};

// Armazenar o último tempo de verificação para cada pedido
const lastCheckTimes = new Map<string, number>();
// Tempo mínimo entre verificações (em milissegundos) - 10 segundos
const MIN_CHECK_INTERVAL = 10000;

// Tempo máximo para expiração do pagamento (em milissegundos) - 30 minutos por padrão
const PAYMENT_EXPIRATION_TIME = 30 * 60 * 1000;

/**
 * Verifica e atualiza pedidos com status de pagamento expirado
 */
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

    // Buscar o pedido no banco de dados
    const order = await getOrderById(orderId);
    
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

    // Se não houver ID de pagamento, não é possível verificar
    if (!order.paymentId) {
      logger.warn(`Pedido ${orderId} não possui ID de pagamento`);
      return NextResponse.json({
        status: 'error',
        paymentStatus: order.paymentStatus,
        message: 'Pedido sem informações de pagamento'
      });
    }

    // Verificar o status do pagamento no Mercado Pago
    const paymentStatus = await getPaymentStatus(order.paymentId);
    logger.info(`Status do pagamento para o pedido ${orderId}: ${paymentStatus}`);

    // Atualizar o status do pedido no banco de dados se o status mudou
    if (paymentStatus !== order.paymentStatus) {
      await updateOrder(orderId, { paymentStatus });
      logger.info(`Status do pedido ${orderId} atualizado para ${paymentStatus}`);
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

/**
 * Verifica o status de um pagamento e atualiza o pedido se necessário
 */
export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
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
    
    // Verificar se a última verificação foi recente demais
    const now = Date.now();
    const lastCheckTime = lastCheckTimes.get(orderId) || 0;
    const timeSinceLastCheck = now - lastCheckTime;
    
    if (timeSinceLastCheck < MIN_CHECK_INTERVAL) {
      const waitTime = Math.ceil((MIN_CHECK_INTERVAL - timeSinceLastCheck) / 1000);
      logger.warn(
        `Verificação muito frequente para o pedido ${orderId}. ` +
        `Última verificação: ${new Date(lastCheckTime).toISOString()} ` +
        `(${Math.floor(timeSinceLastCheck/1000)}s atrás). ` + 
        `Aguarde mais ${waitTime}s antes de verificar novamente.`
      );
      
      // Retornar um status específico para indicar que a verificação está sendo feita com muita frequência
      return NextResponse.json({
        success: true,
        isPaid: false,
        orderId,
        message: 'Verificação muito frequente, aguarde alguns segundos',
        paymentStatus: 'rate_limited', // Retornar status pendente por padrão
        lastCheck: lastCheckTime,
        nextCheckAllowed: lastCheckTime + MIN_CHECK_INTERVAL,
        waitSeconds: Math.ceil(waitTime/1000)
      });
    }
    
    // Atualizar o tempo da última verificação
    lastCheckTimes.set(orderId, now);
    
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
    
    // Verificar se o pedido já foi expirado/cancelado
    if (order.paymentStatus === 'expired' || 
        order.orderStatus === 'canceled' || 
        (order.paymentInfo && order.paymentInfo.status === 'expired')) {
      logger.info(`Pedido ${orderId} já está marcado como expirado/cancelado`);
      return NextResponse.json({ 
        success: true, 
        isPaid: false,
        orderId,
        paymentStatus: 'expired',
        orderStatus: 'canceled',
        isExpired: true
      });
    }
    
    // Verificar expiração para pagamentos PIX
    if (order.metadata?.pixExpiresAt) {
      const expirationDate = new Date(order.metadata.pixExpiresAt);
      if (expirationDate < new Date()) {
        // Atualizar pedido para expirado/cancelado
        await ordersCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(orderId) },
          {
            $set: {
              paymentStatus: 'expired',
              orderStatus: 'canceled',
              'paymentInfo.status': 'expired',
              'metadata.expiredAt': new Date(),
              updatedAt: new Date()
            },
            $push: {
              statusHistory: {
                status: 'expired',
                changedBy: 'Sistema (Verificação Automática)',
                changedAt: new Date()
              }
            }
          }
        );
        
        logger.info(`Pedido ${orderId} marcado como expirado/cancelado durante verificação`);
        
        return NextResponse.json({ 
          success: true, 
          isPaid: false,
          orderId,
          paymentStatus: 'expired',
          orderStatus: 'canceled',
          isExpired: true
        });
      }
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
            },
            $push: {
              statusHistory: {
                status: 'paid',
                changedBy: 'Sistema (Verificação Automática)',
                changedAt: new Date()
              }
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
      } else if (paymentStatus.status === 'rejected' || paymentStatus.status === 'cancelled') {
        // Pagamento foi rejeitado ou cancelado
        await ordersCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(orderId) },
          { 
            $set: {
              paymentStatus: 'canceled',
              orderStatus: 'canceled',
              'paymentInfo.status': 'canceled',
              'metadata.paymentStatusResponse': paymentStatus,
              updatedAt: new Date()
            },
            $push: {
              statusHistory: {
                status: 'canceled',
                changedBy: 'Sistema (Verificação Automática)',
                changedAt: new Date(),
                reason: `Pagamento ${paymentStatus.status}`
              }
            }
          }
        );
        
        logger.info(`Pedido ${orderId} marcado como cancelado devido a status ${paymentStatus.status}`);
        
        return NextResponse.json({ 
          success: true, 
          isPaid: false,
          orderId,
          paymentStatus: 'canceled',
          orderStatus: 'canceled'
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
    const productsCollection = db.collection('products');
    
    let allItemsAssigned = true;
    
    // Array para armazenar os IDs dos produtos atribuídos
    const assignedProductIds = [];
    
    // Processar cada item do pedido
    for (const item of orderItems) {
      try {
        // Verificar se o item possui os campos necessários
        let productId = null;
        let variantId = null; // Inicialmente null para produtos sem variantes
        
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
        
        // Extrair variantId de diferentes formatos - só deve ser definido se existir
        if (item.variantId && item.variantId !== 'single' && item.variantId !== 'undefined' && item.variantId !== 'null') {
          variantId = item.variantId;
        } else if (item.variant && item.variant !== 'single' && item.variant !== 'undefined' && item.variant !== 'null') {
          if (typeof item.variant === 'string' && item.variant !== 'null' && item.variant !== 'undefined') {
            variantId = item.variant;
          } else if (item.variant && item.variant._id) {
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
        logger.info(`Processando item: ${itemName} (${productId}/${variantId || 'sem variante'})`);
        
        // Convertendo IDs para ObjectId de forma segura
        const productObjectId = typeof productId === 'string' 
          ? new mongoose.Types.ObjectId(productId)
          : productId;
        
        // Verificar se o produto tem variantes
        const product = await productsCollection.findOne({ _id: productObjectId });
        if (!product) {
          logger.error(`Produto ${productId} não encontrado no banco de dados`);
          allItemsAssigned = false;
          continue;
        }
        
        const hasVariants = product.variants && product.variants.length > 0;
        logger.info(`Produto ${productId} ${hasVariants ? 'tem variantes' : 'não tem variantes'}`);
        
        // Encontrar itens disponíveis no estoque
        const quantity = item.quantity || 1;
        logger.info(`Buscando ${quantity} itens em estoque para o produto ${productId}, ${hasVariants ? `variante ${variantId}` : 'sem variante'}`);
        
        // Construir filtro baseado no tipo de produto (com ou sem variantes)
        let stockFilter: any = {
          product: productObjectId,
          isUsed: false,
          assignedTo: null
        };
        
        if (hasVariants && variantId) {
          // Para produtos com variantes, incluir o ID da variante
          stockFilter.variant = variantId;
          logger.info(`Filtro para produto COM variante: ${JSON.stringify(stockFilter)}`);
        } else if (!hasVariants) {
          // Para produtos sem variantes, procurar por variant: null
          stockFilter.variant = null;
          logger.info(`Filtro para produto SEM variante: ${JSON.stringify(stockFilter)}`);
        } else {
          // Se for produto com variantes mas sem variantId, há um erro
          logger.error(`Produto ${productId} tem variantes, mas nenhum variantId válido foi fornecido.`);
          allItemsAssigned = false;
          continue;
        }
        
        logger.info(`Filtro de estoque: ${JSON.stringify(stockFilter)}`);
        const stockItems = await stockItemsCollection.find(stockFilter).limit(quantity).toArray();
        
        logger.info(`Encontrados ${stockItems.length} itens disponíveis para atribuição (necessários: ${quantity})`);
        
        // Verificar se há itens suficientes
        if (stockItems.length < quantity) {
          logger.error(`Estoque insuficiente para o item ${itemName}. Encontrado: ${stockItems.length}, Necessário: ${quantity}`);
          allItemsAssigned = false;
          continue;
        }
        
        // Processar o estoque do produto após a atribuição e garantir a extração correta dos produtos atribuídos
        for (const stockItem of stockItems) {
          try {
            // Extrair ID do produto de forma segura antes da atualização
            let productIdToAssign = null;
            
            if (stockItem.product) {
              if (typeof stockItem.product === 'string') {
                productIdToAssign = stockItem.product;
              } else if (stockItem.product._id) {
                productIdToAssign = stockItem.product._id.toString();
              } else {
                productIdToAssign = stockItem.product.toString();
              }
              
              // Só adiciona ao array se tiver um ID válido
              if (productIdToAssign && mongoose.Types.ObjectId.isValid(productIdToAssign)) {
                if (!assignedProductIds.includes(productIdToAssign)) {
                  assignedProductIds.push(productIdToAssign);
                  logger.info(`Produto ${productIdToAssign} será adicionado à lista do usuário`);
                }
              } else {
                logger.warn(`ID de produto inválido extraído de stockItem: ${productIdToAssign}`);
              }
            }
            
            // Atualizar o item de estoque para atribuí-lo ao usuário
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
            
            logger.info(`Item ${stockItem._id} atribuído ao usuário ${userId} (produto: ${productIdToAssign || 'desconhecido'})`);
          } catch (updateError) {
            logger.error(`Erro ao atualizar item ${stockItem._id}: ${updateError}`);
            allItemsAssigned = false;
          }
        }
        
        // Atualizar o estoque do produto após a atribuição
        try {
          // Contar estoque restante
          const remainingStockFilter = {
            product: productObjectId,
            isUsed: false
          };
          
          // Adicionar condição de variante adequada ao filtro
          if (hasVariants && variantId) {
            remainingStockFilter['variant'] = variantId;
          } else if (!hasVariants) {
            remainingStockFilter['variant'] = null;
          }
          
          const remainingStock = await stockItemsCollection.countDocuments(remainingStockFilter);
          
          // Atualizar o produto
          if (hasVariants && variantId) {
            // Para produtos com variantes, atualizar o estoque da variante
            await productsCollection.updateOne(
              { _id: productObjectId, 'variants._id': new mongoose.Types.ObjectId(variantId) },
              { $set: { 'variants.$.stock': remainingStock } }
            );
            logger.info(`Estoque da variante ${variantId} atualizado para ${remainingStock}`);
          } else if (!hasVariants) {
            // Para produtos sem variantes, atualizar o estoque diretamente
            // Se não houver estoque restante, definir como null para evitar o problema de "unidade fantasma"
            const stockValue = remainingStock > 0 ? remainingStock : null;
            await productsCollection.updateOne(
              { _id: productObjectId },
              { $set: { stock: stockValue } }
            );
            logger.info(`Estoque do produto ${productId} (sem variante) atualizado para ${stockValue === null ? 'null (sem estoque)' : stockValue}`);
          }
        } catch (stockUpdateError) {
          logger.error(`Erro ao atualizar o estoque do produto: ${stockUpdateError}`);
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
          // Converter todos os IDs para ObjectId se necessário
          const productObjectIds = assignedProductIds.map(id => 
            typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id
          );
          
          logger.info(`Atualizando lista de produtos do usuário ${userId} com: ${JSON.stringify(productObjectIds)}`);
          
          // Atualizar a lista de produtos do usuário ($addToSet para evitar duplicatas)
          const updateResult = await usersCollection.updateOne(
            { _id: userObjectId },
            { $addToSet: { products: { $each: productObjectIds } } }
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