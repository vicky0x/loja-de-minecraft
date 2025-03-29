import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// GET /api/user/products - Obter produtos atribuídos ao usuário autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = authResult.user._id;
    console.log(`Buscando produtos para o usuário: ${userId}`);
    
    await connectDB();
    
    // Importações dinâmicas de modelos para evitar problemas de importação circular
    const StockItem = mongoose.models.StockItem || (await import('@/app/lib/models/stock')).default;
    const User = mongoose.models.User || (await import('@/app/lib/models/user')).default;
    const Product = mongoose.models.Product || (await import('@/app/lib/models/product')).default;
    
    // Obter o usuário com seus produtos
    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ message: 'Usuário não encontrado' }, { status: 404 });
    }
    
    console.log(`Usuário encontrado com ${user.products ? user.products.length : 0} produtos atribuídos`);
    
    // MÉTODO 1: Buscar itens de estoque atribuídos ao usuário
    const stockItems = await StockItem.find({ 
      assignedTo: new mongoose.Types.ObjectId(userId)
    })
    .populate({
      path: 'product',
      select: 'name slug status images shortDescription variants'
    })
    .sort({ assignedAt: -1 })
    .lean();
    
    console.log(`MÉTODO 1: Encontrados ${stockItems.length} itens de estoque para o usuário ${userId}`);
    
    // MÉTODO 2: Verificar os produtos do usuário
    let userProducts = [];
    if (user.products && user.products.length > 0) {
      userProducts = await Product.find({
        _id: { $in: user.products }
      })
      .select('name slug status images shortDescription variants')
      .lean();
      
      console.log(`MÉTODO 2: Encontrados ${userProducts.length} produtos na lista do usuário`);
    }
    
    // Array para acompanhar itens que precisam ter a data de atribuição corrigida
    const itemsToFix = [];
    
    // Combinar resultados dos dois métodos
    let products = [];
    
    // Processar os itens de estoque
    if (stockItems && stockItems.length > 0) {
      const stockItemsProducts = stockItems.map(item => {
        // Verificar e corrigir data de atribuição inválida
        if (!item.assignedAt || new Date(item.assignedAt).getFullYear() < 2020) {
          // Usar a data de criação ou a data atual como fallback
          item.assignedAt = item.createdAt || new Date();
          // Adicionar à lista de itens que precisam ser corrigidos no banco de dados
          itemsToFix.push({
            id: item._id,
            newDate: item.assignedAt
          });
        }
        
        // Processar o status apenas se estiver definido
        let status = '';
        if (item.product && item.product.status) {
          status = item.product.status === 'indetectavel' ? 'Ativo' : 
                  item.product.status === 'manutencao' ? 'Em Manutenção' : 
                  item.product.status === 'beta' ? 'Beta' : 'Detectável';
        }
        
        // Encontrar informações da variante diretamente do produto populado
        let variantName = 'Padrão';
        if (item.product && item.product.variants && Array.isArray(item.product.variants)) {
          const variant = item.product.variants.find(
            (v: any) => v._id.toString() === item.variant || v._id === item.variant
          );
          if (variant) {
            variantName = variant.name;
          }
        }
        
        return {
          _id: item._id,
          productId: item.product?._id || null,
          name: item.product?.name || 'Produto Desconhecido',
          slug: item.product?.slug || '',
          status: status,
          image: item.product?.images?.[0] || '',
          shortDescription: item.product?.shortDescription || '',
          code: item.code,
          assignedAt: item.assignedAt,
          variant: {
            _id: item.variant,
            name: variantName
          }
        };
      });
      
      products = [...stockItemsProducts];
    }
    
    // Adicionar produtos do usuário que não foram encontrados nos itens de estoque
    if (userProducts && userProducts.length > 0) {
      const productIds = stockItems.map(item => item.product?._id?.toString()).filter(Boolean);
      
      for (const product of userProducts) {
        if (!productIds.includes(product._id.toString())) {
          console.log(`Adicionando produto ${product.name} da lista do usuário que não estava nos itens de estoque`);
          
          // Usar a primeira variante disponível
          const variant = product.variants && product.variants.length > 0 
            ? product.variants[0] 
            : { _id: 'default', name: 'Padrão' };
          
          let status = '';
          if (product.status) {
            status = product.status === 'indetectavel' ? 'Ativo' : 
                    product.status === 'manutencao' ? 'Em Manutenção' : 
                    product.status === 'beta' ? 'Beta' : 'Detectável';
          }
          
          products.push({
            _id: new mongoose.Types.ObjectId(),
            productId: product._id,
            name: product.name,
            slug: product.slug || '',
            status: status,
            image: product.images?.[0] || '',
            shortDescription: product.shortDescription || '',
            code: 'N/A',
            assignedAt: new Date(),
            variant: {
              _id: variant._id,
              name: variant.name
            }
          });
        }
      }
    }
    
    // Corrigir as datas no banco de dados
    if (itemsToFix.length > 0) {
      console.log(`Corrigindo datas de atribuição para ${itemsToFix.length} itens`);
      
      // Atualizar cada item que precisa de correção
      for (const item of itemsToFix) {
        await StockItem.updateOne(
          { _id: item.id },
          { $set: { assignedAt: item.newDate } }
        );
      }
    }
    
    console.log(`Retornando ${products.length} produtos para o cliente`);
    
    return NextResponse.json({ 
      products,
      count: products.length
    });
  } catch (error) {
    console.error('Erro ao buscar produtos do usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar produtos', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 