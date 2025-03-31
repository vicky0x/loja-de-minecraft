import { NextRequest, NextResponse } from 'next/server';
import mongoose, { isValidObjectId } from 'mongoose';
import dbConnect from '@/app/lib/db/mongodb';

// Logger para depuração
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:ADMIN:ORDER] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:ADMIN:ORDER] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:ADMIN:ORDER] ${message}`, ...args)
};

// Função para carregar os modelos necessários de forma segura
async function getModels() {
  try {
    await dbConnect();
    
    // Verificar se os esquemas já existem, caso contrário, importá-los
    let User, Order, StockItem, Product;
    
    try {
      // Tenta obter os modelos já registrados
      User = mongoose.model('User');
      Order = mongoose.model('Order');
      StockItem = mongoose.model('StockItem');
      Product = mongoose.model('Product');
      
      logger.info('Modelos carregados do registro existente');
    } catch (error) {
      // Se algum modelo não existir, tenta importar diretamente dos arquivos
      logger.warn('Importando modelos manualmente:', error);
      
      // Estrutura de fallback - em produção, importaria corretamente
      const userSchema = new mongoose.Schema({
        username: String,
        email: String,
        name: String,
        isAdmin: Boolean,
        cpf: String,
        phone: String,
        address: String
      });
      
      const orderSchema = new mongoose.Schema({
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        orderItems: [{ 
          product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
          variantId: String,
          quantity: Number,
          price: Number,
          name: String
        }],
        totalAmount: Number,
        paymentInfo: {
          method: String,
          status: String,
          transactionId: String,
          pixQrCodeBase64: String,
          pixCopyPaste: String,
          expirationDate: Date
        },
        statusHistory: [{
          status: String,
          changedBy: String,
          changedAt: Date
        }],
        notes: [{
          content: String,
          addedBy: String,
          addedAt: Date
        }],
        customerData: Object,
        productAssigned: Boolean,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now }
      });
      
      const stockItemSchema = new mongoose.Schema({
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        variantId: String,
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedAt: Date,
        active: Boolean,
        metadata: Object
      });
      
      const productSchema = new mongoose.Schema({
        name: String,
        price: Number,
        images: [String]
      });
      
      User = mongoose.models.User || mongoose.model('User', userSchema);
      Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
      StockItem = mongoose.models.StockItem || mongoose.model('StockItem', stockItemSchema);
      Product = mongoose.models.Product || mongoose.model('Product', productSchema);
    }
    
    return { User, Order, StockItem, Product };
  } catch (error) {
    logger.error('Erro ao carregar modelos:', error);
    throw new Error('Erro ao carregar modelos necessários: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Função para verificar autenticação do administrador
async function verifyAdmin(request: NextRequest) {
  try {
    // Verificar o cookie de autenticação ou cabeçalho de autorização
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    // Usar regex para extrair o token do cookie
    let token = null;
    if (cookieHeader) {
      const authTokenMatch = cookieHeader.match(/auth_token=([^;]+)/);
      if (authTokenMatch && authTokenMatch[1]) {
        token = authTokenMatch[1];
      }
    }
    
    // Se não houver token no cookie, verificar o cabeçalho de autorização
    if (!token && authHeader) {
      const bearerMatch = authHeader.match(/Bearer\s+(.+)/i);
      if (bearerMatch && bearerMatch[1]) {
        token = bearerMatch[1];
      }
    }
    
    if (!token) {
      logger.warn('Nenhum token de autenticação encontrado');
      return { isAdmin: false, error: 'Não autorizado', status: 401 };
    }
    
    // Decodificar o token JWT (em uma implementação real, usaríamos verificação de assinatura)
    let decodedToken;
    try {
      // Esta é uma decodificação simples apenas para obter o payload, sem verificação criptográfica
      const base64Payload = token.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      decodedToken = JSON.parse(payload);
    } catch (tokenError) {
      logger.error('Erro ao decodificar token:', tokenError);
      return { isAdmin: false, error: 'Token inválido', status: 401 };
    }
    
    if (!decodedToken || !decodedToken.id) {
      logger.warn('Token não contém ID do usuário');
      return { isAdmin: false, error: 'Token inválido', status: 401 };
    }
    
    const userId = decodedToken.id;
    const userRole = decodedToken.role;
    
    // Verificar se o usuário é admin pelo role no token
    if (userRole !== 'admin') {
      logger.warn(`Usuário ${userId} não é admin (role: ${userRole})`);
      return { isAdmin: false, error: 'Acesso negado', status: 403 };
    }
    
    // Carregar dados do usuário do banco de dados
    const { User } = await getModels();
    
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        logger.warn(`Usuário não encontrado: ${userId}`);
        return { isAdmin: false, error: 'Usuário não encontrado', status: 401 };
      }
      
      if (user.role !== 'admin') {
        logger.warn(`Usuário ${user.username} (${user.email}) não tem permissão de administrador`);
        return { isAdmin: false, error: 'Acesso negado', status: 403 };
      }
      
      logger.info(`Admin autenticado: ${user.username} (${user.email})`);
      return { isAdmin: true, user };
    } catch (userError) {
      logger.error(`Erro ao buscar usuário ${userId}:`, userError);
      return { isAdmin: false, error: 'Erro ao verificar usuário', status: 500 };
    }
  } catch (error) {
    logger.error('Erro ao verificar admin:', error);
    return { isAdmin: false, error: 'Erro ao verificar autenticação', status: 500 };
  }
}

// GET - Obter detalhes de um pedido específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Garantir que params seja await no Next.js 14
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    logger.info(`Requisição GET para pedido ${id}`);
    
    // Verificar autenticação
    const authResult = await verifyAdmin(request);
    if (!authResult.isAdmin) {
      logger.warn(`Acesso não autorizado ao pedido ${id}`);
      return NextResponse.json({ 
        error: authResult.error, 
        success: false 
      }, { status: authResult.status });
    }

    // Validar ID
    if (!isValidObjectId(id)) {
      logger.warn(`ID de pedido inválido: ${id}`);
      return NextResponse.json({ 
        error: 'ID de pedido inválido', 
        success: false 
      }, { status: 400 });
    }

    const { Order } = await getModels();

    // Buscar o pedido com relacionamentos populados
    try {
      const order = await Order.findById(id)
        .populate('user', 'username email name cpf phone address')
        .populate({
          path: 'orderItems.product',
          select: 'name price images'
        })
        .lean();

      if (!order) {
        logger.warn(`Pedido não encontrado: ${id}`);
        return NextResponse.json({ 
          error: 'Pedido não encontrado', 
          success: false,
          order: null
        }, { status: 404 });
      }

      // Formatar o pedido para garantir que todos os campos estejam presentes
      const formattedOrder = {
        _id: order._id.toString(),
        user: order.user ? {
          _id: order.user._id.toString(),
          username: order.user.username || 'Usuário desconhecido',
          email: order.user.email || 'Email não disponível',
          name: order.user.name || '',
          cpf: order.user.cpf || '',
          phone: order.user.phone || '',
          address: order.user.address || ''
        } : {
          _id: 'desconhecido',
          username: 'Usuário desconhecido',
          email: 'Email não disponível',
          name: '',
          cpf: '',
          phone: '',
          address: ''
        },
        orderItems: Array.isArray(order.orderItems) ? order.orderItems.map((item: any) => ({
          _id: item._id ? item._id.toString() : 'item-' + Math.random().toString(36).substr(2, 9),
          product: item.product ? {
            _id: item.product._id ? item.product._id.toString() : 'produto-desconhecido',
            name: item.product.name || 'Produto sem nome',
            price: item.product.price || 0,
            images: Array.isArray(item.product.images) ? item.product.images : []
          } : null,
          variantId: item.variantId || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          name: item.name || 'Item sem nome'
        })) : [],
        totalAmount: order.totalAmount || 0,
        paymentInfo: {
          method: order.paymentInfo?.method || 'desconhecido',
          status: order.paymentInfo?.status || 'pending',
          transactionId: order.paymentInfo?.transactionId || order.paymentInfo?.id || '',
          pixQrCodeBase64: order.paymentInfo?.pixQrCodeBase64 || '',
          pixCopyPaste: order.paymentInfo?.pixCopyPaste || '',
          expirationDate: order.paymentInfo?.expirationDate || null
        },
        statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory.map((item: any) => ({
          status: item.status,
          changedBy: item.changedBy,
          changedAt: item.changedAt ? item.changedAt.toISOString() : new Date().toISOString()
        })) : [],
        notes: Array.isArray(order.notes) ? order.notes.map((item: any) => ({
          content: item.content,
          addedBy: item.addedBy,
          addedAt: item.addedAt ? item.addedAt.toISOString() : new Date().toISOString()
        })) : [],
        customerData: order.customerData || null,
        productAssigned: !!order.productAssigned,
        createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: order.updatedAt ? order.updatedAt.toISOString() : new Date().toISOString()
      };

      logger.info(`Pedido ${id} encontrado e formatado com sucesso`);
      
      return NextResponse.json({ 
        order: formattedOrder, 
        success: true 
      });
    } catch (findError) {
      logger.error(`Erro ao buscar pedido ${id}:`, findError);
      return NextResponse.json({ 
        error: 'Erro ao buscar pedido', 
        details: findError instanceof Error ? findError.message : 'Erro desconhecido',
        success: false,
        order: null
      }, { status: 500 });
    }
  } catch (error) {
    logger.error(`Erro geral ao buscar detalhes do pedido ${id}:`, error);
    return NextResponse.json({ 
      error: 'Falha ao buscar detalhes do pedido', 
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false,
      order: null
    }, { status: 500 });
  }
}

// PUT - Atualizar status de pedido
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Garantir que params seja await no Next.js 14
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    logger.info(`Requisição PUT para pedido ${id}`);
    
    // Verificar autenticação
    const authResult = await verifyAdmin(request);
    if (!authResult.isAdmin) {
      return NextResponse.json({ 
        error: authResult.error, 
        success: false 
      }, { status: authResult.status });
    }
    
    const currentUser = authResult.user;

    if (!isValidObjectId(id)) {
      return NextResponse.json({ 
        error: 'ID de pedido inválido', 
        success: false 
      }, { status: 400 });
    }

    // Obter dados da requisição
    let status, notes;
    try {
      const body = await request.json();
      status = body.status;
      notes = body.notes;
    } catch (parseError) {
      logger.error(`Erro ao processar body da requisição:`, parseError);
      return NextResponse.json({ 
        error: 'Erro ao processar dados da requisição', 
        details: 'O formato JSON enviado é inválido',
        success: false 
      }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ 
        error: 'Status é obrigatório', 
        success: false 
      }, { status: 400 });
    }

    // Validar status
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Status inválido', 
        success: false 
      }, { status: 400 });
    }

    const { Order } = await getModels();
    
    // Buscar o pedido atual
    try {
      const order = await Order.findById(id);
      if (!order) {
        return NextResponse.json({ 
          error: 'Pedido não encontrado', 
          success: false 
        }, { status: 404 });
      }

      // Verificar se o status atual é igual ao novo status
      const currentStatus = order.paymentInfo?.status || 'pending';
      const isStatusChanging = currentStatus !== status;

      // Atualizar pedido
      const updateData: any = {
        'paymentInfo.status': status,
      };

      // Adicionar o histórico de status se o status for alterado
      if (isStatusChanging) {
        const statusHistoryItem = {
          status,
          changedBy: `${currentUser.username || currentUser.email} (Admin)`,
          changedAt: new Date()
        };

        updateData.$push = { statusHistory: statusHistoryItem };
      }

      // Adicionar nota se fornecida
      if (notes && notes.trim()) {
        const noteItem = {
          content: notes.trim(),
          addedBy: `${currentUser.username || currentUser.email} (Admin)`,
          addedAt: new Date()
        };

        if (!updateData.$push) {
          updateData.$push = {};
        }
        updateData.$push.notes = noteItem;
      }

      // Atualizar em uma única operação
      await Order.findByIdAndUpdate(id, {
        ...updateData,
        ...(status === 'paid' ? { 
          'paymentInfo.status': 'paid',
          paymentStatus: 'paid', 
          orderStatus: 'processing'
        } : {})
      });

      // Assinalar produtos ao usuário se o status mudou para 'paid'
      if (isStatusChanging && status === 'paid' && !order.productAssigned) {
        try {
          logger.info(`Iniciando atribuição de produtos para o pedido ${id} após aprovação manual`);
          
          // Buscar ordem completa para atribuição de produtos
          const orderForAssignment = await Order.findById(id).lean();
          
          // Verificar se existem produtos sem variante
          const orderItems = orderForAssignment.orderItems || [];
          const hasSingleProductItems = orderItems.some(item => {
            return !item.variantId || item.variantId === 'null' || item.variantId === 'undefined';
          });
          
          if (hasSingleProductItems) {
            logger.info(`Pedido ${id} contém produtos sem variantes`);
          }
          
          const result = await assignProductsToUser(orderForAssignment);
          logger.info(`Resultado da atribuição de produtos: ${JSON.stringify(result)}`);
          
          // Marcar pedido como tendo produtos atribuídos
          await Order.findByIdAndUpdate(id, {
            productAssigned: true,
            'metadata.productAssignmentResult': result,
            'metadata.productAssignmentTimestamp': new Date()
          });
          
          // Verificar se a atribuição foi bem-sucedida
          if (result.success) {
            logger.info(`Produtos atribuídos com sucesso para o pedido ${id}`);
          } else {
            logger.warn(`Falha na atribuição automática de produtos para o pedido ${id}: ${result.message}`);
          }
        } catch (assignError) {
          logger.error(`Erro ao atribuir produtos para o pedido ${id}:`, assignError);
          // Continua a execução mesmo se falhar a atribuição
        }
      }

      logger.info(`Pedido ${id} atualizado com sucesso para status ${status}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Pedido atualizado com sucesso'
      });
    } catch (updateError) {
      logger.error(`Erro ao atualizar pedido ${id}:`, updateError);
      return NextResponse.json({ 
        error: 'Falha ao atualizar pedido', 
        details: updateError instanceof Error ? updateError.message : 'Erro desconhecido',
        success: false 
      }, { status: 500 });
    }
  } catch (error) {
    logger.error(`Erro geral ao atualizar pedido ${id}:`, error);
    return NextResponse.json({ 
      error: 'Falha ao atualizar pedido', 
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false 
    }, { status: 500 });
  }
}

// Função auxiliar para atribuir produtos ao usuário
async function assignProductsToUser(order: any) {
  try {
    logger.info(`Tentando atribuir produtos ao usuário para o pedido ${order._id || order.id}`);
    
    // Verificar se os produtos já foram atribuídos
    if (order.productAssigned) {
      logger.info(`Produtos já foram atribuídos anteriormente para o pedido ${order._id || order.id}`);
      return { success: true, message: 'Produtos já atribuídos anteriormente' };
    }
    
    // Estabelecer conexão com o banco de dados
    await dbConnect();
    
    const connection = mongoose.connection;
    if (!connection || !connection.db) {
      throw new Error('Falha na conexão com o banco de dados');
    }
    
    const db = connection.db;
    const stockItemsCollection = db.collection('stockitems');
    const usersCollection = db.collection('users');
    const ordersCollection = db.collection('orders');
    
    // Verificar os itens do pedido
    const orderItems = Array.isArray(order.orderItems) ? order.orderItems : [];
    
    if (orderItems.length === 0) {
      logger.error(`Nenhum item encontrado no pedido ${order._id || order.id}`);
      return { success: false, message: 'Nenhum item encontrado no pedido' };
    }
    
    // Extrair o ID do usuário
    let userId;
    
    if (order.userId) {
      userId = order.userId;
    } else if (order.user) {
      if (typeof order.user === 'string') {
        userId = order.user;
      } else if (order.user._id) {
        userId = typeof order.user._id === 'string' ? order.user._id : order.user._id.toString();
      }
    }
    
    if (!userId) {
      logger.error(`Usuário não encontrado no pedido ${order._id || order.id}`);
      return { success: false, message: 'Usuário não encontrado no pedido' };
    }
    
    logger.info(`Atribuindo produtos ao usuário ${userId} para o pedido ${order._id || order.id}`);
    
    // Verificar se o usuário existe
    const userExists = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    if (!userExists) {
      logger.error(`Usuário com ID ${userId} não existe no banco de dados`);
      return { success: false, message: `Usuário com ID ${userId} não encontrado` };
    }
    
    logger.info(`Usuário encontrado: ${userExists.username} (${userExists.email})`);
    
    // Array para armazenar os IDs dos produtos atribuídos
    const assignedProductIds = [];
    let allItemsSuccessful = true;
    
    // Processar cada item do pedido
    for (const item of orderItems) {
      try {
        // Verificar se o item possui os campos necessários
        let productId = null;
        let variantId = 'default';
        
        // Extrair productId e variantId de diferentes formatos
        if (item.productId) {
          productId = item.productId;
        } else if (item.product) {
          if (typeof item.product === 'string') {
            productId = item.product;
          } else if (item.product._id) {
            productId = item.product._id.toString();
          }
        }
        
        // Extrair variante, se existir
        if (item.variantId) {
          variantId = item.variantId;
        } else if (item.variant) {
          if (typeof item.variant === 'string') {
            variantId = item.variant;
          } else if (item.variant._id) {
            variantId = item.variant._id.toString();
          }
        }
        
        if (!productId) {
          logger.error(`ID do produto não encontrado no item ${JSON.stringify(item)}`);
          allItemsSuccessful = false;
          continue;
        }
        
        const itemQty = item.quantity || 1;
        const productObjectId = typeof productId === 'string' 
          ? new mongoose.Types.ObjectId(productId) 
          : productId;
        
        logger.info(`Buscando ${itemQty} itens em estoque para o produto ${productId}, variante ${variantId || 'null (sem variante)'}`);
        
        // Verificar se o produto tem variantes
        const productsCollection = db.collection('products');
        const product = await productsCollection.findOne({ _id: productObjectId });
        
        if (!product) {
          logger.error(`Produto ${productId} não encontrado`);
          allItemsSuccessful = false;
          continue;
        }
        
        const hasVariants = product.variants && product.variants.length > 0;
        logger.info(`Produto ${productId} ${hasVariants ? 'tem variantes' : 'não tem variantes'}`);
        
        // Construir filtro baseado no tipo de produto (com ou sem variantes)
        let stockFilter = {
          product: productObjectId,
          isUsed: false,
          assignedTo: null
        };
        
        if (hasVariants) {
          // Para produtos com variantes, incluir o ID da variante
          stockFilter.variant = variantId;
        } else {
          // Para produtos sem variantes, procurar por variant: null
          stockFilter.variant = null;
        }
        
        logger.info(`Filtro de busca de estoque: ${JSON.stringify(stockFilter)}`);
        
        // Buscar itens disponíveis no estoque
        const stockItems = await stockItemsCollection.find(stockFilter).limit(itemQty).toArray();
        
        if (stockItems.length < itemQty) {
          logger.error(`Estoque insuficiente. Encontrados: ${stockItems.length}, Necessários: ${itemQty}`);
          allItemsSuccessful = false;
          continue;
        }
        
        // Atribuir cada item ao usuário
        for (const stockItem of stockItems) {
          // Atualizar o item no estoque
          const updateStockResult = await stockItemsCollection.updateOne(
            { _id: stockItem._id },
            {
              $set: {
                assignedTo: new mongoose.Types.ObjectId(userId),
                assignedAt: new Date(),
                isUsed: true,
                'metadata.orderId': order._id.toString(),
                'metadata.assignedBy': 'admin-api',
                'metadata.assignmentMethod': hasVariants ? 'admin-variants' : 'admin-noVariants',
                updatedAt: new Date()
              }
            }
          );
          
          logger.info(`Item ${stockItem._id} atribuído ao usuário ${userId} - resultado: ${JSON.stringify(updateStockResult)}`);
          
          // Guardar o ID do produto para adicionar à lista do usuário
          if (stockItem.product) {
            assignedProductIds.push(stockItem.product);
          }
        }
      } catch (itemError) {
        logger.error(`Erro ao processar item: ${itemError}`);
        allItemsSuccessful = false;
      }
    }
    
    // Adicionar produtos à lista do usuário
    if (assignedProductIds.length > 0) {
      try {
        // Log detalhado dos produtos atribuídos
        logger.info(`Produtos a serem adicionados ao usuário ${userId}: ${assignedProductIds.map(p => p.toString()).join(', ')}`);
        
        // Atualizar a lista de produtos do usuário usando $addToSet para evitar duplicatas
        const updateResult = await usersCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { $addToSet: { products: { $each: assignedProductIds } } }
        );
        
        logger.info(`Resultado da atualização do usuário: ${JSON.stringify(updateResult)}`);
        logger.info(`${assignedProductIds.length} produtos adicionados à lista do usuário ${userId}`);
        
        // Verificar quantos produtos o usuário tem agora
        const updatedUser = await usersCollection.findOne(
          { _id: new mongoose.Types.ObjectId(userId) }
        );
        
        if (updatedUser && updatedUser.products) {
          logger.info(`Usuário ${userId} agora tem ${updatedUser.products.length} produtos no total`);
        }
      } catch (userError) {
        logger.error(`Erro ao atualizar a lista de produtos do usuário: ${userError}`);
        allItemsSuccessful = false;
      }
    }
    
    // Atualizar o status do pedido como completado
    try {
      // Primeiro, atualizar os campos básicos
      await ordersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(order._id.toString()) },
        {
          $set: {
            orderStatus: 'completed',
            productAssigned: true,
            'metadata.completedAt': new Date(),
            updatedAt: new Date()
          }
        }
      );
      
      // Depois, adicionar ao histórico de status em uma operação separada
      await ordersCollection.updateOne(
        { _id: new mongoose.Types.ObjectId(order._id.toString()) },
        {
          $push: {
            statusHistory: {
              status: 'fulfilled',
              changedBy: 'Sistema (Atribuição Manual)',
              changedAt: new Date()
            }
          }
        }
      );
      
      logger.info(`Pedido ${order._id} marcado como completado após atribuição dos produtos`);
    } catch (updateError) {
      logger.error(`Erro ao atualizar o status do pedido: ${updateError}`);
      allItemsSuccessful = false;
    }
    
    const resultMessage = allItemsSuccessful 
      ? 'Todos os produtos foram atribuídos com sucesso' 
      : 'Alguns produtos não puderam ser atribuídos';
    
    return { 
      success: assignedProductIds.length > 0, 
      message: resultMessage,
      assignedProducts: assignedProductIds.length
    };
  } catch (error) {
    logger.error(`Erro geral ao atribuir produtos: ${error instanceof Error ? error.message : String(error)}`);
    return { success: false, message: `Erro: ${error instanceof Error ? error.message : String(error)}` };
  }
}

