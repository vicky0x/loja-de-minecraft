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
        images: [String],
        deliveryType: String
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

// Função auxiliar para garantir que a URL da imagem seja válida
function ensureValidImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  
  // Se a URL já começar com http ou https, retornar como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se for um caminho relativo começando com /uploads, adicionar o domínio base
  if (imageUrl.startsWith('/uploads/')) {
    // Em ambiente de desenvolvimento, usar localhost
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${baseUrl}${imageUrl}`;
  }
  
  // Caso específico para imagens que começam com /api
  if (imageUrl.startsWith('/api/')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    return `${baseUrl}${imageUrl}`;
  }
  
  // Se não for nenhum dos casos acima, retornar a URL original
  return imageUrl;
}

// Função robusta para processar a quantidade do produto
function processQuantity(item: any): number {
  // Log para diagnóstico detalhado
  logger.info(`Processando quantidade do item ${item._id}: valor original = ${JSON.stringify({
    quantity: item.quantity,
    type: typeof item.quantity,
    rawValue: item.quantity,
    docValue: item._doc ? item._doc.quantity : undefined,
    hasNestedOrder: !!item.orderItem,
    hasProductQuantity: item.product && typeof item.product.quantity === 'number'
  })}`);
  
  // ESTRATÉGIA 1: Verificar a propriedade direta
  if (typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) {
    logger.info(`Quantidade encontrada na propriedade direta: ${item.quantity}`);
    return Math.floor(item.quantity);
  }
  
  // ESTRATÉGIA 2: Verificar no objeto MongoDB original
  if (item._doc && typeof item._doc.quantity === 'number' && !isNaN(item._doc.quantity) && item._doc.quantity > 0) {
    logger.info(`Quantidade encontrada no objeto _doc: ${item._doc.quantity}`);
    return Math.floor(item._doc.quantity);
  }
  
  // ESTRATÉGIA 3: Verificar propriedades aninhadas
  // Em alguns casos, a quantidade pode estar em item.orderItem.quantity
  if (item.orderItem && typeof item.orderItem.quantity === 'number' && !isNaN(item.orderItem.quantity) && item.orderItem.quantity > 0) {
    logger.info(`Quantidade encontrada em orderItem.quantity: ${item.orderItem.quantity}`);
    return Math.floor(item.orderItem.quantity);
  }
  
  // ESTRATÉGIA 4: Verificar se está no objeto produto
  if (item.product && typeof item.product.quantity === 'number' && !isNaN(item.product.quantity) && item.product.quantity > 0) {
    logger.info(`Quantidade encontrada em product.quantity: ${item.product.quantity}`);
    return Math.floor(item.product.quantity);
  }
  
  // ESTRATÉGIA 5: Tentar converter de string
  if (typeof item.quantity === 'string' && item.quantity.trim() !== '') {
    const parsedValue = parseInt(item.quantity.trim(), 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      logger.info(`Quantidade convertida de string: ${parsedValue}`);
      return parsedValue;
    }
  }
  
  // ESTRATÉGIA 6: Verificar como subpropriedades do item
  const itemObject = typeof item.toObject === 'function' ? item.toObject() : item;
  for (const key in itemObject) {
    // Pular propriedades padrão que sabemos que não são a quantidade
    if (['_id', 'product', 'variant', 'name', 'price', 'delivered'].includes(key)) continue;
    
    // Verificar se esta propriedade parece ser a quantidade
    if (typeof itemObject[key] === 'number' && !isNaN(itemObject[key]) && itemObject[key] > 0) {
      logger.info(`Quantidade encontrada em propriedade alternativa ${key}: ${itemObject[key]}`);
      return Math.floor(itemObject[key]);
    }
  }
  
  // ESTRATÉGIA 7: Último recurso - buscar em metadados
  if (item.metadata) {
    for (const key in item.metadata) {
      if (typeof item.metadata[key] === 'number' && !isNaN(item.metadata[key]) && item.metadata[key] > 0) {
        logger.info(`Quantidade encontrada em metadata.${key}: ${item.metadata[key]}`);
        return Math.floor(item.metadata[key]);
      }
    }
  }
  
  // Se chegamos aqui, não encontramos uma quantidade válida
  logger.warn(`Quantidade inválida para o item ${item._id}, usando valor padrão 1. 
               Objeto de item: ${JSON.stringify(item, (key, value) => 
                 key === '_id' || key === 'product' ? '[Referência]' : value, 2)}`);
  return 1;
}

// GET - Obter detalhes de um pedido específico
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar se o usuário é administrador
    const adminCheck = await verifyAdmin(request);
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Não autorizado' }, 
        { status: adminCheck.status || 401 }
      );
    }
    
    // Garantir que params seja await corretamente no Next.js 15
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    // Validar ID do pedido
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID de pedido inválido" }, 
        { status: 400 }
      );
    }
    
    // Conectar à base de dados e carregar modelos
    const { Order, User, Product } = await getModels();
    
    // Buscar o pedido com suas relações
    const order = await Order.findById(id)
      .populate({
        path: 'user',
        select: 'email username name cpf phone address'
      })
      .populate({
        path: 'orderItems.product',
        select: 'name slug images variants price deliveryType featured status'
      })
      .lean();
    
    if (!order) {
      return NextResponse.json(
        { error: "Pedido não encontrado" }, 
        { status: 404 }
      );
    }
    
    // Processar as imagens dos produtos no pedido
    if (order.orderItems && Array.isArray(order.orderItems)) {
      order.orderItems.forEach(item => {
        if (item.product && item.product.images && Array.isArray(item.product.images)) {
          item.product.images = item.product.images.map(ensureValidImageUrl);
        }
      });
    }
    
    // Retornar o pedido com informações completas
    return NextResponse.json({ 
      success: true, 
      order
    });
  } catch (error) {
    logger.error("Erro ao buscar pedido:", error);
    
    return NextResponse.json(
      { 
        error: "Erro ao buscar detalhes do pedido", 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

// PUT - Atualizar status de pedido
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação de admin
    const adminCheck = await verifyAdmin(request);
    
    if (!adminCheck.isAdmin) {
      return NextResponse.json(
        { error: adminCheck.error || 'Não autorizado' }, 
        { status: adminCheck.status || 401 }
      );
    }
    
    // Garantir que params seja await corretamente no Next.js 15
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams.id;
    
    // Validar ID do pedido
    if (!id || !isValidObjectId(id)) {
      return NextResponse.json(
        { error: "ID de pedido inválido" }, 
        { status: 400 }
      );
    }
    
    // Obter dados da requisição
    const updateData = await request.json();
    
    // Conectar ao banco de dados
    const { Order, StockItem } = await getModels();
    
    // Buscar o pedido existente
    const existingOrder = await Order.findById(id);
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "Pedido não encontrado" }, 
        { status: 404 }
      );
    }
    
    // Verificar quais campos estão sendo atualizados e validá-los
    const updates: any = {};
    
    // Atualizar status
    if (updateData.status && typeof updateData.status === 'string') {
      const validStatus = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'];
      
      if (!validStatus.includes(updateData.status)) {
        return NextResponse.json(
          { error: "Status inválido" }, 
          { status: 400 }
        );
      }
      
      updates.status = updateData.status;
      
      // Adicionar ao histórico de status
      const statusEntry = {
        status: updateData.status,
        changedBy: adminCheck.user?.username || adminCheck.user?.email || 'Admin',
        changedAt: new Date()
      };
      
      if (!existingOrder.statusHistory) {
        existingOrder.statusHistory = [];
      }
      
      existingOrder.statusHistory.push(statusEntry);
      updates.statusHistory = existingOrder.statusHistory;
    }
    
    // Adicionar notas
    if (updateData.note && typeof updateData.note === 'string' && updateData.note.trim()) {
      const noteEntry = {
        content: updateData.note.trim(),
        addedBy: adminCheck.user?.username || adminCheck.user?.email || 'Admin',
        addedAt: new Date()
      };
      
      if (!existingOrder.notes) {
        existingOrder.notes = [];
      }
      
      existingOrder.notes.push(noteEntry);
      updates.notes = existingOrder.notes;
    }
    
    // Atualizar dados de pagamento
    if (updateData.paymentInfo) {
      if (!existingOrder.paymentInfo) {
        existingOrder.paymentInfo = {};
      }
      
      if (updateData.paymentInfo.status) {
        existingOrder.paymentInfo.status = updateData.paymentInfo.status;
      }
      
      if (updateData.paymentInfo.transactionId) {
        existingOrder.paymentInfo.transactionId = updateData.paymentInfo.transactionId;
      }
      
      updates.paymentInfo = existingOrder.paymentInfo;
    }
    
    // Marcar como entregue
    if (updateData.deliverItems === true && !existingOrder.productAssigned) {
      // Atribuir produtos ao usuário
      await assignProductsToUser(existingOrder);
      updates.productAssigned = true;
    }
    
    // Aplicar atualizações
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nenhum dado válido para atualização" }, 
        { status: 400 }
      );
    }
    
    // Atualizar a data de modificação
    updates.updatedAt = new Date();
    
    // Atualizar o pedido
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
    .populate('user', 'email username name')
    .populate({
      path: 'orderItems.product',
      select: 'name slug images price'
    })
    .lean();
    
    return NextResponse.json({
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    logger.error("Erro ao atualizar pedido:", error);
    
    return NextResponse.json(
      { 
        error: "Erro ao atualizar pedido", 
        details: error instanceof Error ? error.message : String(error) 
      }, 
      { status: 500 }
    );
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
        
        // Atualizar o estoque do produto após atribuir os itens
        try {
          // Preparar filtro para contar o estoque restante
          const remainingStockFilter = {
            product: productObjectId,
            isUsed: false
          };
          
          // Adicionar condição de variante adequada
          if (hasVariants && variantId) {
            remainingStockFilter['variant'] = variantId;
          } else if (!hasVariants) {
            remainingStockFilter['variant'] = null;
          }
          
          // Contar o estoque restante
          const remainingStock = await stockItemsCollection.countDocuments(remainingStockFilter);
          logger.info(`Estoque restante para o produto ${productId}: ${remainingStock}`);
          
          // Obter informações completas do produto antes de atualizar
          const productsCollection = db.collection('products');
          const productDetails = await productsCollection.findOne({ _id: productObjectId });
          
          // Verificar se o produto tem entrega manual configurada
          const isManualDelivery = productDetails && 
                                  (productDetails.deliveryType === 'manual' || 
                                   (hasVariants && variantId && 
                                    productDetails.variants && 
                                    productDetails.variants.some(v => 
                                      v._id.toString() === variantId.toString() && 
                                      v.deliveryType === 'manual'
                                    )));
          
          logger.info(`Produto ${productId} tem entrega manual? ${isManualDelivery ? 'SIM' : 'NÃO'}`);
          
          // Se for entrega manual, não alterar o estoque
          if (isManualDelivery) {
            logger.info(`Produto ${productId} tem entrega manual configurada. Não alterando o estoque.`);
            // Não fazer nada, preservar o tipo de entrega manual
          } else {
            // Para produtos com entrega automática, atualizar o estoque normalmente
            if (hasVariants && variantId) {
              // Para produtos com variantes, atualizar o estoque da variante
              await productsCollection.updateOne(
                { _id: productObjectId, 'variants._id': new mongoose.Types.ObjectId(variantId) },
                { $set: { 'variants.$.stock': remainingStock } }
              );
              logger.info(`Estoque da variante ${variantId} atualizado para ${remainingStock}`);
            } else if (!hasVariants) {
              // Para produtos sem variantes, atualizar o estoque diretamente
              // Se não houver estoque restante, definir como null para evitar o problema da "unidade fantasma"
              const stockValue = remainingStock > 0 ? remainingStock : null;
              await productsCollection.updateOne(
                { _id: productObjectId },
                { $set: { stock: stockValue } }
              );
              logger.info(`Estoque do produto ${productId} (sem variante) atualizado para ${stockValue === null ? 'null (sem estoque)' : stockValue}`);
            }
          }
        } catch (stockUpdateError) {
          logger.error(`Erro ao atualizar o estoque do produto: ${stockUpdateError}`);
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

