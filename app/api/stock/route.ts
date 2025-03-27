import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import StockItem from '@/app/lib/models/stock';
import Product from '@/app/lib/models/product';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// GET /api/stock - Listar todos os itens de estoque (somente admin)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const authResult = await checkAuth(request);
    console.log('Auth result:', authResult);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const user = authResult.user;
    
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso proibido' }, { status: 403 });
    }
    
    await connectDB();
    
    // Obter parâmetros de filtro da URL
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product');
    const variantId = searchParams.get('variant');
    const isUsed = searchParams.get('isUsed');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    // Construir o filtro
    const filter: any = {};
    
    if (productId) {
      filter.product = productId;
    }
    
    if (variantId) {
      filter.variant = variantId;
    }
    
    if (isUsed !== null) {
      filter.isUsed = isUsed === 'true';
    }
    
    // Consultar itens de estoque com paginação
    const items = await StockItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name slug')
      .populate('assignedTo', 'username email');
    
    // Obter contagem total para paginação
    const total = await StockItem.countDocuments(filter);
    
    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar estoque:', error);
    return NextResponse.json(
      { message: 'Não foi possível carregar os itens de estoque.' },
      { status: 500 }
    );
  }
}

// POST /api/stock - Adicionar itens ao estoque (somente admin)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const user = authResult.user;
    
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso proibido' }, { status: 403 });
    }
    
    await connectDB();
    
    // Extrair dados da requisição
    const { productId, variantId, items } = await request.json();
    
    // Validar dados
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    if (!variantId) {
      return NextResponse.json(
        { message: 'ID de variante inválido' },
        { status: 400 }
      );
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'É necessário fornecer pelo menos um item de estoque' },
        { status: 400 }
      );
    }
    
    // Verificar se o produto existe
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Verificar se a variante existe
    const variantExists = product.variants.some((v) => v._id.toString() === variantId);
    
    if (!variantExists) {
      return NextResponse.json(
        { message: 'Variante não encontrada' },
        { status: 404 }
      );
    }
    
    // Preparar itens para inserção
    const stockItems = items.map((code: string) => ({
      product: productId,
      variant: variantId,
      code: code.trim(),
      isUsed: false,
    }));
    
    // Inserir itens no estoque
    const result = await StockItem.insertMany(stockItems, { ordered: false })
      .catch(error => {
        // Verificar erros de duplicação e continuar inserindo itens não duplicados
        if (error.code === 11000) {
          return error.insertedDocs; // Retorna documentos que foram inseridos com sucesso
        }
        throw error; // Relança outros erros
      });
    
    // Atualizar contagem de estoque na variante do produto
    const stockCount = await StockItem.countDocuments({
      product: productId,
      variant: variantId,
      isUsed: false
    });
    
    // Atualizar o estoque da variante
    await Product.updateOne(
      { _id: productId, 'variants._id': variantId },
      { $set: { 'variants.$.stock': stockCount } }
    );
    
    return NextResponse.json({
      message: 'Itens adicionados ao estoque com sucesso',
      added: result.length,
      current_stock: stockCount
    });
  } catch (error) {
    console.error('Erro ao adicionar itens ao estoque:', error);
    
    // Verificar erro de duplicidade
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'Alguns códigos já existem no estoque' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Erro ao adicionar itens ao estoque' },
      { status: 500 }
    );
  }
}

// DELETE /api/stock - Remover itens do estoque (somente admin)
export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const user = authResult.user;
    
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso proibido' }, { status: 403 });
    }
    
    await connectDB();
    
    // Extrair dados da requisição
    const { ids } = await request.json();
    
    // Validar dados
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: 'É necessário fornecer pelo menos um ID para remover' },
        { status: 400 }
      );
    }
    
    // Obter informações dos itens antes de excluí-los para atualizar o estoque depois
    const items = await StockItem.find({ _id: { $in: ids } });
    
    // Agrupar itens por produto e variante para atualizar o estoque depois
    const stockUpdates = new Map();
    
    items.forEach(item => {
      const key = `${item.product.toString()}-${item.variant}`;
      if (!stockUpdates.has(key)) {
        stockUpdates.set(key, {
          productId: item.product,
          variantId: item.variant,
          count: 0
        });
      }
      if (!item.isUsed) {
        stockUpdates.get(key).count += 1;
      }
    });
    
    // Remover itens do estoque
    const result = await StockItem.deleteMany({ _id: { $in: ids } });
    
    // Atualizar contagem de estoque nas variantes dos produtos
    for (const [, update] of stockUpdates) {
      const { productId, variantId } = update;
      
      // Contar itens não usados restantes
      const stockCount = await StockItem.countDocuments({
        product: productId,
        variant: variantId,
        isUsed: false
      });
      
      // Atualizar o estoque da variante
      await Product.updateOne(
        { _id: productId, 'variants._id': variantId },
        { $set: { 'variants.$.stock': stockCount } }
      );
    }
    
    return NextResponse.json({
      message: 'Itens removidos do estoque com sucesso',
      deleted: result.deletedCount
    });
  } catch (error) {
    console.error('Erro ao remover itens do estoque:', error);
    return NextResponse.json(
      { message: 'Erro ao remover itens do estoque' },
      { status: 500 }
    );
  }
} 