import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import StockItem from '@/app/lib/models/stock';
import Product from '@/app/lib/models/product';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// POST /api/stock/bulk - Importação em massa de itens de estoque
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const user = await checkAuth(request);
    
    if (!user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso proibido' }, { status: 403 });
    }
    
    await connectDB();
    
    // Processar o multipart form data
    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const variantId = formData.get('variantId') as string;
    const file = formData.get('file') as File;
    
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
    
    if (!file) {
      return NextResponse.json(
        { message: 'É necessário fornecer um arquivo' },
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
    
    // Ler o conteúdo do arquivo
    const text = await file.text();
    
    // Dividir o texto em linhas e filtrar linhas vazias
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
      return NextResponse.json(
        { message: 'O arquivo não contém códigos válidos' },
        { status: 400 }
      );
    }
    
    // Preparar itens para inserção
    const stockItems = lines.map(line => ({
      product: productId,
      variant: variantId,
      code: line.trim(),
      isUsed: false,
    }));
    
    // Estatísticas da importação
    let addedCount = 0;
    let duplicateCount = 0;
    
    // Inserir itens em lotes para melhor performance e lidar com possíveis duplicatas
    const batchSize = 100;
    for (let i = 0; i < stockItems.length; i += batchSize) {
      const batch = stockItems.slice(i, i + batchSize);
      
      try {
        const result = await StockItem.insertMany(batch, { ordered: false });
        addedCount += result.length;
      } catch (error) {
        // Se houver erro de duplicação, continue com os itens não duplicados
        if (error.code === 11000) {
          // Contar os documentos que foram inseridos com sucesso
          if (error.insertedDocs) {
            addedCount += error.insertedDocs.length;
          }
          
          // Estimar o número de duplicatas
          duplicateCount += batch.length - (error.insertedDocs ? error.insertedDocs.length : 0);
        } else {
          throw error; // Relançar outros erros
        }
      }
    }
    
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
      message: 'Importação concluída com sucesso',
      total: lines.length,
      added: addedCount,
      duplicates: duplicateCount,
      current_stock: stockCount
    });
  } catch (error) {
    console.error('Erro ao importar estoque:', error);
    return NextResponse.json(
      { message: 'Erro ao processar o arquivo de estoque' },
      { status: 500 }
    );
  }
} 