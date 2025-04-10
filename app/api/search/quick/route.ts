import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/product';

// GET /api/search/quick - Pesquisa rápida para o preview da barra de pesquisa
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Parâmetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5'); // Limitar a 5 resultados por padrão
    
    // Se não tiver query, retornar array vazio
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ products: [] });
    }
    
    // Construir filtro de pesquisa
    const filter = {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } },
        { slug: { $regex: query, $options: 'i' } },
      ]
    };
    
    // Consulta otimizada que retorna apenas os campos necessários para preview
    const products = await Product.find(filter)
      .sort({ featured: -1, createdAt: -1 }) // Priorizar produtos em destaque
      .limit(limit)
      .select('name slug images price featured shortDescription')
      .lean();
    
    return NextResponse.json({
      products
    });
  } catch (error: any) {
    console.error('Erro na pesquisa rápida:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao realizar pesquisa rápida', products: [] },
      { status: 500 }
    );
  }
} 