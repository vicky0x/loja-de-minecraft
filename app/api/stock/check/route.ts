import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import StockItem from '@/app/lib/models/stock';
import Product from '@/app/lib/models/product';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// GET /api/stock/check - Verificar disponibilidade de estoque
export async function GET(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter parâmetros de consulta
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');
    const quantityStr = searchParams.get('quantity');
    
    // Validar parâmetros
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: 'ID de produto inválido' }, { status: 400 });
    }
    
    if (!variantId) {
      return NextResponse.json({ error: 'ID de variante inválido' }, { status: 400 });
    }
    
    const quantity = quantityStr ? parseInt(quantityStr) : 1;
    
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json({ error: 'Quantidade inválida' }, { status: 400 });
    }
    
    console.log(`Verificando disponibilidade de estoque: produto=${productId}, variante=${variantId}, quantidade=${quantity}`);
    
    // Verificar se o produto existe
    const product = await Product.findById(productId);
    
    if (!product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    
    // Verificar se a variante existe
    const variant = product.variants.find((v: any) => v._id.toString() === variantId);
    
    if (!variant) {
      return NextResponse.json({ error: 'Variante não encontrada' }, { status: 404 });
    }
    
    // Verificar disponibilidade no estoque
    const availableStock = await StockItem.countDocuments({
      product: new mongoose.Types.ObjectId(productId),
      variant: variantId,
      isUsed: false
    });
    
    console.log(`Estoque disponível: ${availableStock}, solicitado: ${quantity}`);
    
    if (availableStock < quantity) {
      return NextResponse.json({ 
        error: `Estoque insuficiente para ${product.name} - ${variant.name}`,
        available: availableStock,
        requested: quantity
      }, { status: 400 });
    }
    
    // Estoque disponível
    return NextResponse.json({
      available: availableStock,
      requested: quantity,
      isAvailable: true
    });
    
  } catch (error) {
    console.error('Erro ao verificar estoque:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar disponibilidade de estoque' },
      { status: 500 }
    );
  }
} 