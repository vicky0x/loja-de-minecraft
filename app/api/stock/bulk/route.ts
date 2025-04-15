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
    console.log('Iniciando verificação de autenticação para importação em massa');
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
    
    // Processar o multipart form data
    const formData = await request.formData();
    const productId = formData.get('productId') as string;
    const variantId = formData.get('variantId') as string;
    const file = formData.get('file') as File;
    
    console.log('Dados do form recebidos:', { productId, variantId, file: file ? 'Arquivo presente' : 'Arquivo ausente' });
    
    // Validar dados
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
      console.log('ID de produto inválido:', productId);
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    if (!file) {
      console.log('Arquivo não fornecido');
      return NextResponse.json(
        { message: 'É necessário fornecer um arquivo' },
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
      
      console.log('Variante encontrada, lendo conteúdo do arquivo');
    } else {
      console.log('Produto sem variantes, processando estoque direto');
    }
    
    // Ler o conteúdo do arquivo
    const text = await file.text();
    
    // Dividir o texto em linhas e filtrar linhas vazias
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    
    console.log(`Arquivo contém ${lines.length} linhas de código`);
    
    if (lines.length === 0) {
      console.log('Arquivo vazio ou sem códigos válidos');
      return NextResponse.json(
        { message: 'O arquivo não contém códigos válidos' },
        { status: 400 }
      );
    }
    
    // Preparar itens para inserção
    const stockItems = lines.map(line => ({
      product: productId,
      variant: hasVariants ? variantId : null, // Variante pode ser null para produtos sem variantes
      code: line.trim(),
      isUsed: false,
    }));
    
    // Estatísticas da importação
    let addedCount = 0;
    let duplicateCount = 0;
    
    // Inserir itens em lotes para melhor performance e lidar com possíveis duplicatas
    const batchSize = 100;
    console.log(`Processando ${stockItems.length} itens em lotes de ${batchSize}`);
    
    for (let i = 0; i < stockItems.length; i += batchSize) {
      const batch = stockItems.slice(i, i + batchSize);
      console.log(`Processando lote ${Math.floor(i/batchSize) + 1} com ${batch.length} itens`);
      
      try {
        const result = await StockItem.insertMany(batch, { ordered: false });
        addedCount += result.length;
        console.log(`Lote ${Math.floor(i/batchSize) + 1}: ${result.length} itens adicionados com sucesso`);
      } catch (error) {
        // Se houver erro de duplicação, continue com os itens não duplicados
        if (error.code === 11000) {
          // Contar os documentos que foram inseridos com sucesso
          if (error.insertedDocs) {
            addedCount += error.insertedDocs.length;
            console.log(`Lote ${Math.floor(i/batchSize) + 1}: ${error.insertedDocs.length} itens adicionados (com duplicatas)`);
          }
          
          // Estimar o número de duplicatas
          duplicateCount += batch.length - (error.insertedDocs ? error.insertedDocs.length : 0);
          console.log(`Lote ${Math.floor(i/batchSize) + 1}: aproximadamente ${duplicateCount} duplicatas encontradas`);
        } else {
          console.error(`Erro inesperado no lote ${Math.floor(i/batchSize) + 1}:`, error);
          throw error; // Relançar outros erros
        }
      }
    }
    
    if (hasVariants) {
      // Atualizar contagem de estoque na variante do produto
      const stockCount = await StockItem.countDocuments({
        product: productId,
        variant: variantId,
        isUsed: false
      });
      
      console.log(`Contagem final de estoque para a variante: ${stockCount}`);
      
      // Atualizar o estoque da variante
      await Product.updateOne(
        { _id: productId, 'variants._id': variantId },
        { $set: { 'variants.$.stock': stockCount } }
      );
      
      console.log('Estoque da variante atualizado com sucesso');
      
      return NextResponse.json({
        message: 'Importação concluída com sucesso',
        total: lines.length,
        added: addedCount,
        duplicates: duplicateCount,
        current_stock: stockCount
      });
    } else {
      // Atualizar contagem de estoque diretamente no produto
      const stockCount = await StockItem.countDocuments({
        product: productId,
        variant: null,
        isUsed: false
      });
      
      console.log(`Contagem final de estoque para o produto: ${stockCount}`);
      
      // Atualizar o estoque do produto
      await Product.updateOne(
        { _id: productId },
        { $set: { stock: stockCount } }
      );
      
      console.log('Estoque do produto atualizado com sucesso');
      
      return NextResponse.json({
        message: 'Importação concluída com sucesso',
        total: lines.length,
        added: addedCount,
        duplicates: duplicateCount,
        current_stock: stockCount
      });
    }
  } catch (error) {
    console.error('Erro ao importar estoque:', error);
    return NextResponse.json(
      { message: 'Erro ao processar o arquivo de estoque' },
      { status: 500 }
    );
  }
} 