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
    
    // Garantir que o diretório existe
    await ensureDirectoryExists();
    
    // Salvar os IDs no arquivo JSON
    await fs.writeFile(featuredProductsFilePath, JSON.stringify(featuredProducts));
    
    return NextResponse.json({
      success: true,
      message: 'Produtos em destaque atualizados com sucesso',
      featuredProducts
    });
  } catch (error) {
    console.error('Erro ao atualizar produtos em destaque:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar produtos em destaque' },
      { status: 500 }
    );
  }
} 