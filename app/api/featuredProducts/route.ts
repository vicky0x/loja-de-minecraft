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

// GET /api/featuredProducts - Obter os IDs dos produtos em destaque
export async function GET() {
  try {
    // Verificar se o arquivo existe, se não, retornar um array vazio
    try {
      const data = await fs.readFile(featuredProductsFilePath, 'utf-8');
      const featuredProducts = JSON.parse(data);
      
      return NextResponse.json({ 
        success: true, 
        featuredProducts 
      });
    } catch (error) {
      // Se o arquivo não existir, criar um arquivo vazio
      await ensureDirectoryExists();
      await fs.writeFile(featuredProductsFilePath, JSON.stringify([]));
      
      return NextResponse.json({ 
        success: true, 
        featuredProducts: [] 
      });
    }
  } catch (error) {
    console.error('Erro ao obter produtos em destaque:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao obter produtos em destaque' },
      { status: 500 }
    );
  }
}

// POST /api/featuredProducts - Atualizar os IDs dos produtos em destaque
export async function POST(request: NextRequest) {
  try {
    // Na versão simplificada, não fazemos verificação de autenticação
    // Em produção, você deve implementar um sistema de autenticação adequado
    
    // Obter os novos IDs dos produtos em destaque
    const { featuredProducts } = await request.json();
    
    // Validar se featuredProducts é um array
    if (!Array.isArray(featuredProducts)) {
      return NextResponse.json(
        { success: false, message: 'Formato inválido. Esperado um array de IDs.' },
        { status: 400 }
      );
    }
    
    // Verificar a existência de cada produto antes de salvar
    const validatedProducts = [];
    const invalidProducts = [];
    
    // Verificar cada ID para garantir que o produto existe
    for (const id of featuredProducts) {
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
          console.warn(`Produto não encontrado (ID: ${id}). Não será incluído nos destaques.`);
        }
      } catch (error) {
        console.error(`Erro ao validar produto ${id}:`, error);
        invalidProducts.push(id);
      }
    }
    
    // Garantir que o diretório existe
    await ensureDirectoryExists();
    
    // Salvar apenas os IDs validados no arquivo JSON
    await fs.writeFile(featuredProductsFilePath, JSON.stringify(validatedProducts));
    
    return NextResponse.json({
      success: true,
      message: invalidProducts.length > 0 
        ? `Produtos em destaque atualizados com sucesso. ${invalidProducts.length} produtos inválidos foram removidos.`
        : 'Produtos em destaque atualizados com sucesso',
      featuredProducts: validatedProducts,
      invalidProducts: invalidProducts
    });
  } catch (error) {
    console.error('Erro ao atualizar produtos em destaque:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar produtos em destaque' },
      { status: 500 }
    );
  }
} 