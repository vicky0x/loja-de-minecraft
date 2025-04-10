import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';
import { formatProductName } from '@/app/utils/formatters';

// Cache para produtos do usuário (validade de 5 minutos)
const userProductsCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// GET /api/user/products - Obter produtos atribuídos ao usuário autenticado
export async function GET(request: NextRequest) {
  try {
    // Parâmetros de paginação (opcionais)
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skipCache = url.searchParams.get('skipCache') === 'true';
    
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = authResult.user._id.toString();
    
    // Verificar cache primeiro (se não for solicitado para ignorar)
    if (!skipCache) {
      const cacheKey = `${userId}_${page}_${limit}`;
      const now = Date.now();
      const cachedData = userProductsCache.get(cacheKey);
      
      if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
        return NextResponse.json(cachedData.data);
      }
    }
    
    console.log(`Conectando ao MongoDB para buscar produtos para o usuário ID: ${userId}`);
    await connectDB();
    console.log('Utilizando conexão existente com MongoDB');
    
    // Importações dinâmicas de modelos
    const StockItem = mongoose.models.StockItem || (await import('@/app/lib/models/stock')).default;
    const User = mongoose.models.User || (await import('@/app/lib/models/user')).default;
    const Product = mongoose.models.Product || (await import('@/app/lib/models/product')).default;
    
    // Calcular skip para paginação
    const skip = (page - 1) * limit;
    
    // Buscar itens de estoque atribuídos ao usuário com paginação
    const stockItems = await StockItem.find({ 
      assignedTo: new mongoose.Types.ObjectId(userId)
    })
    .populate({
      path: 'product',
      select: 'name slug status images shortDescription variants'
    })
    .sort({ assignedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
    console.log(`Encontrados ${stockItems.length} itens de estoque para o usuário`);
    
    // Verificar se há produtos com referências inválidas
    const invalidItems = stockItems.filter(item => !item.product);
    if (invalidItems.length > 0) {
      console.warn(`AVISO: Encontrados ${invalidItems.length} itens de estoque com referências de produto inválidas`);
      console.warn('IDs dos itens com problema:', 
        invalidItems.map(item => ({
          stockItemId: item._id.toString(),
          productRef: item.product,
          assignedAt: item.assignedAt
        }))
      );
      // Opcional: Tente corrigir os registros problemáticos
      try {
        for (const item of invalidItems) {
          console.log(`Tentando atualizar o item de estoque ${item._id} para marcar como não usado`);
          // Marcar como não atribuído para evitar mais erros
          await StockItem.updateOne(
            { _id: item._id },
            { $set: { assignedTo: null, isUsed: false } }
          );
        }
      } catch (fixError) {
        console.error('Erro ao tentar corrigir itens inválidos:', fixError);
      }
    }
    
    // Contar total para paginação
    const totalStockItems = await StockItem.countDocuments({
      assignedTo: new mongoose.Types.ObjectId(userId)
    });
    
    // Formatar resultados
    const formattedProducts = stockItems
      .filter(item => item.product !== null && item.product !== undefined) // Filtrar itens com produto nulo
      .map(item => ({
        _id: item._id.toString(),
        productId: item.product._id.toString(),
        name: formatProductName(item.product.name),
        slug: item.product.slug,
        status: mapStatusToPortuguese(item.product.status), // Converter para formato visível
        image: item.product.images && item.product.images.length > 0 
          ? ensureValidImageUrl(item.product.images[0])
          : null,
        shortDescription: item.product.shortDescription,
        assignedAt: item.assignedAt,
        code: item.code,
        variant: {
          _id: item.variant || 'default',
          name: getVariantName(item.product, item.variant)
        }
      }));
    
    // Função auxiliar para mapear status para português
    function mapStatusToPortuguese(status) {
      switch(status) {
        case 'indetectavel': return 'Ativo';
        case 'detectavel': return 'Detectável';
        case 'manutencao': return 'Em Manutenção';
        case 'beta': return 'Beta';
        default: return status;
      }
    }
    
    // Função auxiliar para obter o nome da variante
    function getVariantName(product, variantId) {
      if (!variantId || variantId === 'default') return 'Padrão';
      
      // Tentar encontrar a variante pelo ID
      if (product.variants && Array.isArray(product.variants)) {
        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (variant) return variant.name;
      }
      
      return 'Padrão';
    }
    
    // Função auxiliar para garantir que a URL da imagem seja válida
    function ensureValidImageUrl(imageUrl) {
      if (!imageUrl) return null;
      
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
    
    // Dados para retornar
    const responseData = { 
      success: true, 
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total: totalStockItems,
        totalPages: Math.ceil(totalStockItems / limit)
      }
    };
    
    // Atualizar cache
    const cacheKey = `${userId}_${page}_${limit}`;
    userProductsCache.set(cacheKey, { 
      data: responseData, 
      timestamp: Date.now() 
    });
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Erro ao buscar produtos do usuário:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erro ao buscar produtos do usuário'
    }, { status: 500 });
  }
} 