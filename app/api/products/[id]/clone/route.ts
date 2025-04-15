import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/product';
import mongoose from 'mongoose';
import { checkAuth } from '@/app/lib/auth';
import { formatProductName } from '@/app/utils/formatters';

export async function POST(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter ID do produto a ser clonado
    const id = params?.id;
    
    // Verificar autenticação
    const auth = await checkAuth(request);
    
    if (!auth || !auth.isAuthenticated || !auth.user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    const user = auth.user;
    
    // Verificar se é administrador
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso proibido' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    // Buscar o produto original
    const originalProduct = await Product.findById(id);
    
    if (!originalProduct) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Criar objeto para o novo produto
    const newProductData: any = {
      name: `${formatProductName(originalProduct.name)} (Cópia)`,
      slug: `${originalProduct.slug}-copia-${Date.now().toString().slice(-4)}`,
      description: originalProduct.description,
      shortDescription: originalProduct.shortDescription,
      category: originalProduct.category,
      featured: originalProduct.featured,
      status: originalProduct.status,
      requirements: originalProduct.requirements,
      variants: originalProduct.variants,
      images: [], // Não copiar imagens
      // Limpar valores de estoque
      price: originalProduct.price,
      stock: 0,
      originalPrice: originalProduct.originalPrice,
      discountPercentage: originalProduct.discountPercentage
    };
    
    // Se tem variantes, copiar as variantes mas zerar o estoque
    if (originalProduct.variants && originalProduct.variants.length > 0) {
      newProductData.variants = originalProduct.variants.map(variant => ({
        ...variant.toObject(),
        stock: 0 // Zerar estoque de cada variante
      }));
    }
    
    // Criar o novo produto
    const newProduct = new Product(newProductData);
    await newProduct.save();
    
    console.log(`Produto clonado: ${originalProduct._id} -> ${newProduct._id}`);
    
    return NextResponse.json({ 
      message: 'Produto clonado com sucesso',
      newProductId: newProduct._id
    });
    
  } catch (error) {
    console.error('Erro ao clonar produto:', error);
    return NextResponse.json(
      { message: 'Erro ao clonar produto', error: (error as Error).message },
      { status: 500 }
    );
  }
} 