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
      // Se uma variante específica for solicitada
      filter.variant = variantId;
    } else if (productId) {
      // Se apenas o produto for especificado (sem variante), verificar se é um produto sem variantes
      const product = await Product.findById(productId);
      if (product && (!product.variants || product.variants.length === 0)) {
        // Para produtos sem variantes, buscar onde variant é null
        filter.variant = null;
      }
    }
    
    if (isUsed !== null) {
      filter.isUsed = isUsed === 'true';
    }
    
    console.log('Filtro de consulta:', filter);
    
    // Consultar itens de estoque com paginação
    const items = await StockItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('product', 'name slug')
      .populate('assignedTo', 'username email');
    
    console.log(`Encontrados ${items.length} itens de estoque`);
    
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
    console.log('Iniciando processamento da requisição POST para adicionar estoque');
    const authResult = await checkAuth(request);
    
    console.log('Resultado da autenticação:', JSON.stringify(authResult, null, 2));
    
    if (!authResult.isAuthenticated || !authResult.user) {
      console.log('Usuário não autenticado ou indefinido');
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const user = authResult.user;
    console.log('Usuário autenticado:', user._id, 'Role:', user.role);
    
    if (user.role !== 'admin') {
      console.log('Usuário não é admin:', user.role);
      return NextResponse.json({ message: 'Acesso proibido' }, { status: 403 });
    }
    
    await connectDB();
    console.log('Conectado ao banco de dados');
    
    // Extrair dados da requisição
    const requestData = await request.json();
    console.log('Dados da requisição:', JSON.stringify(requestData, null, 2));
    const { productId, variantId, items } = requestData;
    
    // Validar dados
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      console.log('ID de produto inválido:', productId);
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.log('Lista de itens inválida:', items);
      return NextResponse.json(
        { message: 'É necessário fornecer pelo menos um item de estoque' },
        { status: 400 }
      );
    }
    
    // Verificar se o produto existe
    const product = await Product.findById(productId);
    
    if (!product) {
      console.log('Produto não encontrado:', productId);
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('Produto encontrado:', product.name);
    
    // Verificar se o produto tem variantes
    const hasVariants = product.variants && product.variants.length > 0;
    
    // Se o produto tiver variantes, a variante deve ser especificada
    if (hasVariants) {
      if (!variantId) {
        console.log('ID de variante não fornecido para produto com variantes');
        return NextResponse.json(
          { message: 'ID de variante é obrigatório para produtos com variantes' },
          { status: 400 }
        );
      }
      
      // Verificar se a variante existe
      const variantExists = product.variants.some((v) => v._id.toString() === variantId);
      
      if (!variantExists) {
        console.log('Variante não encontrada no produto:', variantId);
        return NextResponse.json(
          { message: 'Variante não encontrada' },
          { status: 404 }
        );
      }
      
      console.log('Variante encontrada, preparando itens para inserção');
    } else {
      console.log('Produto sem variantes, processando estoque direto');
    }
    
    // Preparar itens para inserção
    const stockItems = items.map((code: string) => ({
      product: productId,
      variant: hasVariants ? variantId : null, // Variante pode ser null para produtos sem variantes
      code: code.trim(),
      isUsed: false,
    }));
    
    console.log(`Tentando inserir ${stockItems.length} itens no estoque`);
    
    // Inserir itens no estoque
    let result;
    try {
      result = await StockItem.insertMany(stockItems, { ordered: false });
      console.log(`Inseridos com sucesso: ${result.length} itens`);
    } catch (insertError: any) {
      // Verificar erros de duplicação e continuar inserindo itens não duplicados
      if (insertError.code === 11000) {
        console.log('Detectados itens duplicados durante a inserção');
        result = insertError.insertedDocs || []; // Retorna documentos que foram inseridos com sucesso
        console.log(`Inseridos parcialmente: ${result.length} itens`);
      } else {
        console.error('Erro não esperado durante a inserção:', insertError);
        throw insertError; // Relança outros erros
      }
    }
    
    if (hasVariants) {
      // Atualizar contagem de estoque na variante do produto
      const stockCount = await StockItem.countDocuments({
        product: productId,
        variant: variantId,
        isUsed: false
      });
      
      console.log(`Contagem atual de estoque para a variante: ${stockCount}`);
      
      // Obter a variante específica para verificar o tipo de entrega
      const productVariant = product.variants.find((v: any) => v._id.toString() === variantId);
      
      // Verificar se a variante tem entrega manual e preservar essa configuração
      if (productVariant && productVariant.deliveryType === 'manual') {
        console.log('Variante com entrega manual: preservando configuração e estoque infinito');
        
        // Para variantes com entrega manual, apenas atualizamos o estoque interno
        // sem alterar o tipo de entrega e mantendo o estoque como "infinito" (99999)
        return NextResponse.json({
          message: 'Itens adicionados ao estoque com sucesso (entrega manual preservada)',
          added: result.length,
          current_stock: 99999
        });
      }
      
      // Atualizar o estoque da variante (apenas para variantes com entrega automática)
      await Product.updateOne(
        { _id: productId, 'variants._id': variantId },
        { $set: { 'variants.$.stock': stockCount } }
      );
      
      console.log('Estoque da variante atualizado com sucesso');
      
      return NextResponse.json({
        message: 'Itens adicionados ao estoque com sucesso',
        added: result.length,
        current_stock: stockCount
      });
    } else {
      // Atualizar contagem de estoque diretamente no produto
      const stockCount = await StockItem.countDocuments({
        product: productId,
        variant: null,
        isUsed: false
      });
      
      console.log(`Contagem atual de estoque para o produto: ${stockCount}`);
      
      // Verificar se o produto tem entrega manual e preservar essa configuração
      if (product.deliveryType === 'manual') {
        console.log('Produto com entrega manual: preservando configuração e estoque infinito');
        
        // Para produtos com entrega manual, apenas atualizamos o estoque interno
        // sem alterar o tipo de entrega e mantendo o estoque como "infinito" (99999)
        return NextResponse.json({
          message: 'Itens adicionados ao estoque com sucesso (entrega manual preservada)',
          added: result.length,
          current_stock: 99999
        });
      }
      
      // Atualizar o estoque do produto (apenas para produtos com entrega automática)
      await Product.updateOne(
        { _id: productId },
        { $set: { stock: stockCount } }
      );
      
      console.log('Estoque do produto atualizado com sucesso');
      
      return NextResponse.json({
        message: 'Itens adicionados ao estoque com sucesso',
        added: result.length,
        current_stock: stockCount
      });
    }
  } catch (error: any) {
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
    const directProductUpdates = new Map();
    
    items.forEach(item => {
      if (item.variant) {
        // Para produtos com variantes
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
      } else {
        // Para produtos sem variantes
        const productId = item.product.toString();
        if (!directProductUpdates.has(productId)) {
          directProductUpdates.set(productId, {
            productId: item.product,
            count: 0
          });
        }
        if (!item.isUsed) {
          directProductUpdates.get(productId).count += 1;
        }
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
    
    // Atualizar contagem de estoque diretamente nos produtos sem variantes
    for (const [, update] of directProductUpdates) {
      const { productId } = update;
      
      // Contar itens não usados restantes
      const stockCount = await StockItem.countDocuments({
        product: productId,
        variant: null,
        isUsed: false
      });
      
      // Se não houver estoque, definir como null para evitar o problema de "1 unidade fantasma"
      const stockValue = stockCount > 0 ? stockCount : null;
      
      // Atualizar o estoque do produto
      await Product.updateOne(
        { _id: productId },
        { $set: { stock: stockValue } }
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