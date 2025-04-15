import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Caminho para o arquivo JSON que armazenará os IDs dos produtos em destaque
const featuredProductsFilePath = path.join(process.cwd(), 'data', 'featuredProducts.json');

// Garantir que o diretório existe
async function ensureDirectoryExists() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error('Erro ao criar diretório:', error);
  }
}

// GET /api/featuredProducts/validate - Validar e limpar produtos inválidos
export async function GET(request: NextRequest) {
  try {
    // Checar API key para segurança (opcional)
    const apiKey = request.nextUrl.searchParams.get('key');
    const cronApiKey = process.env.CRON_API_KEY || 'chave-secreta';
    
    if (apiKey !== cronApiKey) {
      return NextResponse.json(
        { success: false, message: 'Acesso não autorizado' },
        { status: 401 }
      );
    }
    
    // Ler o arquivo de produtos em destaque
    let featuredIds: string[] = [];
    try {
      const data = await fs.readFile(featuredProductsFilePath, 'utf-8');
      featuredIds = JSON.parse(data);
    } catch (error) {
      // Se o arquivo não existir, criar um arquivo vazio
      await ensureDirectoryExists();
      await fs.writeFile(featuredProductsFilePath, JSON.stringify([]));
    }
    
    if (featuredIds.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhum produto em destaque para validar' });
    }
    
    // Verificar a existência de cada produto
    const validatedProducts: string[] = [];
    const invalidProducts: string[] = [];
    
    // Verificar cada ID para garantir que o produto existe
    for (const id of featuredIds) {
      try {
        // Pulamos IDs vazios ou não-strings
        if (!id || typeof id !== 'string' || id.trim() === '') {
          invalidProducts.push(id || 'id-invalido');
          continue;
        }
        
        // Verificar se o produto existe na API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/products/${id}`);
        
        if (response.ok) {
          // Produto existe, adicionar à lista de validados
          validatedProducts.push(id);
        } else {
          // Produto não existe, adicionar à lista de inválidos
          invalidProducts.push(id);
          console.warn(`Produto não encontrado (ID: ${id}). Removido dos destaques.`);
        }
      } catch (error) {
        console.error(`Erro ao validar produto ${id}:`, error);
        invalidProducts.push(id);
      }
    }
    
    // Se não houver produtos inválidos, nada a fazer
    if (invalidProducts.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Todos os produtos em destaque são válidos',
        featuredProducts: featuredIds
      });
    }
    
    // Salvar apenas os IDs validados no arquivo JSON
    await fs.writeFile(featuredProductsFilePath, JSON.stringify(validatedProducts));
    
    return NextResponse.json({
      success: true,
      message: `Produtos em destaque validados. ${invalidProducts.length} produtos inválidos foram removidos.`,
      featuredProducts: validatedProducts,
      invalidProducts: invalidProducts,
      removedCount: invalidProducts.length
    });
    
  } catch (error) {
    console.error('Erro ao validar produtos em destaque:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao validar produtos em destaque' },
      { status: 500 }
    );
  }
} 