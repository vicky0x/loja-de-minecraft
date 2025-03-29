import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import StockItem from '@/app/lib/models/stock';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// GET /api/user/products/[id] - Obter detalhes de um produto específico atribuído ao usuário
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const userId = authResult.user._id;
    
    // Aguardar os parâmetros antes de usá-los
    const { id } = await params;
    
    // Validar o ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID de produto inválido' }, { status: 400 });
    }
    
    await connectDB();
    
    // Registrar modelos necessários
    // Garantir que o modelo Product esteja registrado
    const ProductSchema = require('@/app/lib/models/product').default.schema;
    const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

    // Garantir que o modelo Category esteja registrado
    const CategorySchema = require('@/app/lib/models/category').default.schema;
    const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
    
    // Buscar o item de estoque com detalhes do produto
    const stockItem = await StockItem.findOne({ 
      _id: id,
      assignedTo: userId 
    })
    .populate({
      path: 'product',
      select: 'name slug description status images shortDescription requirements variants'
    })
    .lean();
    
    if (!stockItem) {
      return NextResponse.json(
        { message: 'Produto não encontrado ou você não tem acesso a ele' },
        { status: 404 }
      );
    }
    
    // Encontrar a variante correspondente no produto
    const variant = stockItem.product.variants.find(
      (v: any) => v._id.toString() === stockItem.variant
    );
    
    // Verificar e corrigir a data de atribuição se necessário
    let assignedAt = stockItem.assignedAt;
    
    // Se a data de atribuição for inválida ou muito antiga (antes de 2020)
    if (!assignedAt || new Date(assignedAt).getFullYear() < 2020) {
      console.log('Detectada data de atribuição inválida:', assignedAt);
      
      // Utilizar a data de criação do objeto ou a data atual como fallback
      assignedAt = stockItem.createdAt || new Date();
      
      // Atualizar a data no banco de dados para corrigir o problema permanentemente
      await StockItem.updateOne(
        { _id: id },
        { $set: { assignedAt: assignedAt } }
      );
      
      console.log('Data de atribuição corrigida para:', assignedAt);
    }
    
    // Formatar a resposta
    const productDetail = {
      _id: stockItem._id,
      productId: stockItem.product._id,
      name: stockItem.product.name,
      slug: stockItem.product.slug,
      description: stockItem.product.description,
      shortDescription: stockItem.product.shortDescription,
      status: stockItem.product.status ? (
        stockItem.product.status === 'indetectavel' ? 'Ativo' : 
        stockItem.product.status === 'manutencao' ? 'Em Manutenção' : 
        stockItem.product.status === 'beta' ? 'Beta' : 'Detectável'
      ) : '',
      image: stockItem.product.images[0] || '',
      images: stockItem.product.images || [],
      code: stockItem.code,
      assignedAt: assignedAt,
      requirements: stockItem.product.requirements || [],
      variant: variant ? {
        _id: variant._id,
        name: variant.name,
        features: variant.features || []
      } : null
    };
    
    return NextResponse.json({ 
      product: productDetail
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes do produto:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar detalhes do produto' },
      { status: 500 }
    );
  }
} 