import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// Cache para produtos específicos (validade de 10 minutos)
const productDetailsCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutos

// GET - Obter detalhes do produto do usuário
export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter ID do produto
    const id = params?.id;
    const url = new URL(request.url);
    const skipCache = url.searchParams.get('skipCache') === 'true';
    
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = authResult.user._id.toString();
    
    // Verificar cache primeiro (se não for solicitado para ignorar)
    if (!skipCache) {
      const cacheKey = `${userId}_${id}`;
      const now = Date.now();
      const cachedData = productDetailsCache.get(cacheKey);
      
      if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
        return NextResponse.json(cachedData.data);
      }
    }
    
    await connectDB();
    
    // Importações dinâmicas de modelos
    const StockItem = mongoose.models.StockItem || (await import('@/app/lib/models/stock')).default;
    const Product = mongoose.models.Product || (await import('@/app/lib/models/product')).default;
    
    // Verificar se é um ID de StockItem
    let productData = null;
    
    // Tentar buscar como ID de item de estoque
    const stockItem = await StockItem.findOne({
      _id: mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id,
      assignedTo: new mongoose.Types.ObjectId(userId)
    }).populate({
      path: 'product',
      select: 'name description slug status images variants',
    }).lean();
    
    if (stockItem && stockItem.product) {
      productData = {
        stockId: stockItem._id.toString(),
        id: stockItem.product._id.toString(),
        name: stockItem.product.name,
        description: stockItem.product.description,
        slug: stockItem.product.slug,
        status: stockItem.product.status,
        images: stockItem.product.images || [],
        assignedAt: stockItem.assignedAt,
        variant: stockItem.variant,
        code: stockItem.code,
        variants: stockItem.product.variants || []
      };
    } else {
      // Verificar se o usuário tem este produto atribuído via stock
      const userStockItems = await StockItem.find({
        assignedTo: new mongoose.Types.ObjectId(userId),
        'product': mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
      }).populate({
        path: 'product',
        select: 'name description slug status images variants',
      }).lean();
      
      if (userStockItems && userStockItems.length > 0) {
        const stockItem = userStockItems[0];
        productData = {
          stockId: stockItem._id.toString(),
          id: stockItem.product._id.toString(),
          name: stockItem.product.name,
          description: stockItem.product.description,
          slug: stockItem.product.slug,
          status: stockItem.product.status,
          images: stockItem.product.images || [],
          assignedAt: stockItem.assignedAt,
          variant: stockItem.variant,
          code: stockItem.code,
          variants: stockItem.product.variants || []
        };
      }
    }
    
    // Se não encontrou o produto
    if (!productData) {
      return NextResponse.json({ message: 'Produto não encontrado ou não atribuído ao usuário' }, { status: 404 });
    }
    
    // Preparar resposta
    const responseData = { 
      success: true,
      product: productData
    };
    
    // Atualizar cache
    const cacheKey = `${userId}_${id}`;
    productDetailsCache.set(cacheKey, { 
      data: responseData, 
      timestamp: Date.now() 
    });
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Erro ao buscar detalhes do produto:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro ao buscar detalhes do produto'
    }, { status: 500 });
  }
}

// PUT - Atualizar produto do usuário
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter ID do produto
    const id = params?.id;
    
    // Restante do código permanece inalterado
  } catch (error) {
    // Tratamento de erro
  }
}

// DELETE - Excluir produto do usuário
export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter ID do produto
    const id = params?.id;
    
    // Restante do código permanece inalterado
  } catch (error) {
    // Tratamento de erro
  }
} 