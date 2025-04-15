import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/product';
import mongoose from 'mongoose';

// GET /api/products/slug/[slug] - Buscar um produto pelo slug
export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    await connectDB();
    
    // Obter o slug do produto com await
    const slugParams = await params;
    const slug = slugParams?.slug;
    
    if (!slug) {
      return NextResponse.json(
        { message: 'Slug de produto não fornecido' },
        { status: 400 }
      );
    }
    
    // Importar a categoria para garantir que o esquema esteja registrado
    const Category = mongoose.models.Category || 
                    mongoose.model('Category', require('@/app/lib/models/category').default.schema);
    
    // Buscar o produto pelo slug
    const product = await Product.findOne({ slug })
      .select('-__v')
      .populate('category', 'name slug')
      .lean();
    
    if (!product) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Erro ao buscar produto por slug:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao buscar produto' },
      { status: 500 }
    );
  }
} 