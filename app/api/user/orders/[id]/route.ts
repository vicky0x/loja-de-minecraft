import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import Order from '@/app/lib/models/order';
import mongoose from 'mongoose';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:USER:ORDER-DETAIL INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:USER:ORDER-DETAIL ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:USER:ORDER-DETAIL WARN] ${message}`, ...args)
};

// Função para processar e validar a quantidade do produto
function processQuantity(item: any): number {
  // Log para debug
  logger.info(`Processando quantidade do item ${item._id}: valor original = ${JSON.stringify({
    quantity: item.quantity,
    type: typeof item.quantity,
    rawValue: item.quantity,
    docValue: item._doc ? item._doc.quantity : undefined
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

// Carregar modelos necessários de forma segura
try {
  // Importar modelos se não estiverem no cache
  if (!mongoose.models.Product) require('@/app/lib/models/product');
  if (!mongoose.models.User) require('@/app/lib/models/user');
  if (!mongoose.models.Coupon) require('@/app/lib/models/coupon');
  logger.info('Modelos carregados com sucesso');
} catch (error) {
  logger.warn('Erro ao carregar modelos:', error);
}

// GET - Obter detalhes de um pedido específico do usuário
export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter ID do pedido
    const id = params?.id;
    
    // Verificar autenticação
    const authData = await checkAuth(request);
    if (!authData?.isAuthenticated) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Validar ID do pedido
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'ID do pedido inválido' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    await connectDB();

    // Buscar pedido com informações completas
    const order = await Order.findById(id)
      .populate('orderItems.product', 'name price description images deliveryType')
      .populate('couponApplied', 'code discount')
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se o pedido pertence ao usuário autenticado
    if (order.user.toString() !== authData.user._id.toString()) {
      logger.warn(`Usuário ${authData.user._id} tentou acessar pedido ${id} que não lhe pertence`);
      return NextResponse.json(
        { error: 'Você não tem permissão para acessar este pedido' },
        { status: 403 }
      );
    }

    logger.info(`Usuário ${authData.user._id} acessou detalhes do seu pedido ${id}`);

    // Formatação de dados para resposta com verificação de existência dos campos
    const formattedOrder = {
      ...order,
      _id: order._id.toString(),
      user: order.user.toString(),
      orderItems: Array.isArray(order.orderItems) ? order.orderItems.map((item: any) => {
        // Processar quantidade usando a função robusta
        const processedQuantity = processQuantity(item);
        
        return {
          ...item,
          _id: item._id ? item._id.toString() : null,
          quantity: processedQuantity,
          product: item.product ? {
            _id: item.product._id ? item.product._id.toString() : null,
            name: item.product.name || '',
            price: item.product.price || 0,
            description: item.product.description || '',
            deliveryType: item.product.deliveryType || 'manual',
            images: item.product.images && Array.isArray(item.product.images) 
              ? item.product.images.map((img: string) => ensureValidImageUrl(img))
              : [],
            image: item.product.images && item.product.images.length > 0 
              ? ensureValidImageUrl(item.product.images[0]) 
              : null
          } : null
        };
      }) : [],
      couponApplied: order.couponApplied ? {
        _id: order.couponApplied._id ? order.couponApplied._id.toString() : null,
        code: order.couponApplied.code || '',
        discount: order.couponApplied.discount || 0
      } : null,
      createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: order.updatedAt ? order.updatedAt.toISOString() : new Date().toISOString(),
      paymentInfo: {
        ...(order.paymentInfo || {}),
        status: order.paymentInfo ? order.paymentInfo.status || 'pending' : 'pending',
        method: order.paymentInfo ? order.paymentInfo.method || '' : '',
        expirationDate: order.paymentInfo && order.paymentInfo.expirationDate 
          ? order.paymentInfo.expirationDate.toISOString() 
          : null
      }
    };

    return NextResponse.json({
      success: true,
      order: formattedOrder
    });
  } catch (error) {
    logger.error(`Erro ao buscar detalhes do pedido:`, error);
    return NextResponse.json(
      { error: 'Erro ao buscar detalhes do pedido', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
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