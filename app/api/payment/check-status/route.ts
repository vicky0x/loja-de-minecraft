import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';
import { getPaymentStatus } from '@/app/lib/mercadopago';
import { getOrderById, updateOrder } from '@/app/lib/orders';
import logger from '@/app/lib/logger';
import { MercadoPagoConfig, Payment } from 'mercadopago';

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

// Cache para armazenar resultados de verificações recentes
// Isso evita múltiplas chamadas à API do Mercado Pago para o mesmo pagamento em um curto período
interface CacheEntry {
  result: any; // Resultado da verificação
  timestamp: number; // Quando foi armazenado
  orderStatus: string; // Status atual do pedido
}

// Cache com TTL de 30 segundos para pagamentos pendentes, 5 minutos para pagamentos finalizados
const paymentStatusCache = new Map<string, CacheEntry>();

// Limpar o cache periodicamente para evitar vazamento de memória
const CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of paymentStatusCache.entries()) {
    // Manter pagamentos confirmados em cache por mais tempo (5 minutos)
    const ttl = entry.orderStatus === 'paid' ? 5 * 60 * 1000 : 30 * 1000;
    if (now - entry.timestamp > ttl) {
      paymentStatusCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

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
  logger.info('API: Recebida requisição para verificar status de pagamento');
  
  try {
    // Extrair dados da requisição
    const data = await request.json();
    const { orderId, paymentId } = data;
    
    // Validar parâmetros obrigatórios
    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID do pedido é obrigatório' 
      }, { status: 400 });
    }
    
    // Gerar chave de cache (orderId + paymentId)
    const cacheKey = `${orderId}_${paymentId || 'no-payment-id'}`;
    
    // Verificar se temos um resultado em cache recente
    const cachedResult = paymentStatusCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedResult) {
      // Se o resultado estiver em cache, verificar se ainda é válido
      const cacheAge = now - cachedResult.timestamp;
      
      // Cache válido por 30 segundos para pagamentos pendentes, 5 minutos para pagamentos finalizados
      const cacheTTL = cachedResult.orderStatus === 'paid' ? 5 * 60 * 1000 : 30 * 1000;
      
      if (cacheAge < cacheTTL) {
        logger.info(`Usando resultado em cache para o pedido ${orderId} (${cacheAge}ms de idade)`);
        return NextResponse.json(cachedResult.result);
      }
      
      logger.info(`Cache expirado para o pedido ${orderId}, buscando dados atualizados`);
    }

    // Estabelecer conexão com o banco de dados
    const { db } = await connectDB();
    
    // Buscar o pedido no banco de dados
    const ordersCollection = db.collection('orders');
    
    // Verificações robustas para permitir pesquisa com string ou ObjectId
    let orderObjectId;
    try {
      orderObjectId = new mongoose.Types.ObjectId(orderId);
    } catch (error) {
      logger.warn(`ID do pedido inválido fornecido: ${orderId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'ID do pedido inválido' 
      }, { status: 400 });
    }
    
    // Buscar o pedido com uma consulta flexível para lidar com diferentes formatos de ID
    const order = await ordersCollection.findOne({
      $or: [
        { _id: orderObjectId },
        { _id: orderId }
      ]
    });
    
    if (!order) {
      logger.warn(`Pedido não encontrado: ${orderId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Pedido não encontrado' 
      }, { status: 404 });
    }
    
    // Verificar se o pedido já está marcado como pago no sistema
    if (order.orderStatus === 'paid' || order.isPaid === true) {
      logger.info(`Pedido ${orderId} já está marcado como pago no sistema`);
      
      const result = { 
        success: true, 
        isPaid: true,
        orderId,
        paymentStatus: 'approved',
        orderStatus: 'paid'
      };
      
      // Armazenar no cache com status de pago (TTL mais longo)
      paymentStatusCache.set(cacheKey, {
        result,
        timestamp: now,
        orderStatus: 'paid'
      });
      
      return NextResponse.json(result);
    }
    
    // Se o pedido estiver expirado, retornar essa informação
    if (order.orderStatus === 'expired' || order.isExpired === true) {
      logger.info(`Pedido ${orderId} está expirado`);
      
      const result = { 
        success: true, 
        isPaid: false,
        isExpired: true,
        orderId,
        paymentStatus: 'expired',
        orderStatus: 'expired'
      };
      
      // Armazenar no cache
      paymentStatusCache.set(cacheKey, {
        result,
        timestamp: now,
        orderStatus: 'expired'
      });
      
      return NextResponse.json(result);
    }
    
    // Determinar qual payment ID usar
    let actualPaymentId = paymentId;
    
    // Se não tiver paymentId na requisição, tentar obter do pedido
    if (!actualPaymentId) {
      actualPaymentId = order.paymentId || 
                        (order.paymentInfo && order.paymentInfo.paymentId) ||
                        (order.metadata && order.metadata.paymentId);
      
      if (!actualPaymentId) {
        logger.warn(`Pedido ${orderId} não tem ID de pagamento associado`);
        return NextResponse.json({ 
          success: false, 
          error: 'ID de pagamento não encontrado no pedido' 
        }, { status: 400 });
      }
    }
    
    // Verificar junto ao Mercado Pago
    try {
      logger.info(`Verificando status do pagamento ${actualPaymentId} no Mercado Pago`);
      
      // Configurar o cliente do Mercado Pago
      const client = new MercadoPagoConfig({ 
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '' 
      });
      
      // Obter dados do pagamento no Mercado Pago
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: actualPaymentId });
      
      // Log detalhado do status
      logger.info(`Status do pagamento ${actualPaymentId}: ${paymentData.status}`);
      
      // Extrair o status do pagamento
      const paymentStatus = {
        status: paymentData.status,
        statusDetail: paymentData.status_detail,
        data: paymentData
      };
      
      // Se o pagamento foi aprovado
      if (paymentStatus.status === 'approved') {
        logger.info(`Pagamento ${actualPaymentId} aprovado! Atualizando pedido ${orderId}`);
        
        // Atualizar o pedido no banco de dados
        const updateResult = await ordersCollection.updateOne(
          { _id: orderObjectId },
          {
            $set: {
              isPaid: true,
              paidAt: new Date(),
              paymentStatus: 'paid',
              orderStatus: 'paid',
              'paymentInfo.status': 'paid',
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
        
        logger.info(`Pedido ${orderId} atualizado: ${updateResult.modifiedCount} documento(s) modificado(s)`);
        
        // Atribuir produtos ao usuário
        await assignProductsToUser(order, db);
        
        const result = { 
          success: true, 
          isPaid: true,
          orderId,
          paymentStatus: 'approved',
          orderStatus: 'paid'
        };
        
        // Armazenar no cache com TTL mais longo (5 minutos)
        paymentStatusCache.set(cacheKey, {
          result,
          timestamp: now,
          orderStatus: 'paid'
        });
        
        return NextResponse.json(result);
      } else if (['cancelled', 'canceled', 'refunded', 'charged_back'].includes(paymentStatus.status)) {
        // Se o pagamento foi cancelado ou reembolsado
        logger.info(`Pagamento ${actualPaymentId} ${paymentStatus.status}. Atualizando pedido ${orderId}`);
        
        // Atualizar o pedido no banco de dados
        await ordersCollection.updateOne(
          { _id: orderObjectId },
          {
            $set: {
              isPaid: false,
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
        
        const result = { 
          success: true, 
          isPaid: false,
          orderId,
          paymentStatus: 'canceled',
          orderStatus: 'canceled'
        };
        
        // Armazenar no cache
        paymentStatusCache.set(cacheKey, {
          result,
          timestamp: now,
          orderStatus: 'canceled'
        });
        
        return NextResponse.json(result);
      } else {
        // Pagamento ainda está pendente
        const result = { 
          success: true, 
          isPaid: false,
          orderId,
          paymentStatus: paymentStatus.status,
          orderStatus: order.orderStatus || 'pending'
        };
        
        // Armazenar no cache
        paymentStatusCache.set(cacheKey, {
          result,
          timestamp: now,
          orderStatus: order.orderStatus || 'pending'
        });
        
        return NextResponse.json(result);
      }
    } catch (mpError) {
      logger.error(`Erro ao verificar pagamento ${actualPaymentId}:`, mpError);
      
      const result = { 
        success: false, 
        isPaid: false,
        error: `Erro ao verificar pagamento: ${mpError instanceof Error ? mpError.message : String(mpError)}` 
      };
      
      // Não armazenamos erros no cache para permitir novas tentativas
      
      return NextResponse.json(result, { status: 500 });
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