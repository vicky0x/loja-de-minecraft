import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Category from '@/app/lib/models/category';
import Product from '@/app/lib/models/product';
import mongoose from 'mongoose';

// GET /api/categories/slug/[slug] - Buscar uma categoria pelo slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await connectDB();
    
    // Garantir que params seja await corretamente no Next.js 14
    const resolvedParams = await Promise.resolve(params);
    const slug = resolvedParams.slug;
    
    if (!slug) {
      return NextResponse.json(
        { message: 'Slug de categoria é obrigatório' },
        { status: 400 }
      );
    }
    
    // Buscar a categoria pelo slug
    const category = await Category.findOne({ slug }).select('-__v').lean();
    
    if (!category) {
      return NextResponse.json(
        { message: 'Categoria não encontrada' },
        { status: 404 }
      );
    }
    
    // Buscar produtos desta categoria
    const products = await Product.find({ category: category._id })
      .select('-__v')
      .lean();
    
    return NextResponse.json({ 
      category,
      products
    });
  } catch (error: any) {
    console.error('Erro ao buscar categoria por slug:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao buscar categoria' },
      { status: 500 }
    );
  }
} 