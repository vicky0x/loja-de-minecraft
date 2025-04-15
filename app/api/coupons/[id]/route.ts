import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// Logger para as operações relacionadas a cupons
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:COUPONS:DETAIL INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:COUPONS:DETAIL ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:COUPONS:DETAIL WARN] ${message}`, ...args)
};

// Carregar modelo de Cupom
async function getCouponModel() {
  try {
    // Usar require para garantir que o modelo seja carregado sincronamente
    const Coupon = mongoose.models.Coupon || require('@/app/lib/models/coupon').default;
    return Coupon;
  } catch (error) {
    logger.error('Erro ao carregar modelo de Cupom:', error);
    throw new Error('Erro ao carregar modelo de Cupom');
  }
}

// GET /api/coupons/[id] - Obter detalhes de um cupom específico
export async function GET(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter o ID do cupom
    const id = params?.id;
    
    logger.info(`Buscando detalhes do cupom ${id}`);
    await connectDB();
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`ID de cupom inválido fornecido: ${id}`);
      return NextResponse.json(
        { success: false, message: 'ID de cupom inválido' },
        { status: 400 }
      );
    }
    
    const Coupon = await getCouponModel();
    
    // Buscar cupom
    const coupon = await Coupon.findById(id)
      .populate('createdBy', 'username email')
      .populate('products', 'name slug')
      .populate('categories', 'name slug')
      .lean();
    
    if (!coupon) {
      return NextResponse.json({ message: 'Cupom não encontrado' }, { status: 404 });
    }
    
    // Formatar dados para resposta
    const formattedCoupon = {
      ...coupon,
      _id: coupon._id.toString(),
      createdBy: coupon.createdBy ? {
        _id: coupon.createdBy._id.toString(),
        username: coupon.createdBy.username,
        email: coupon.createdBy.email
      } : null,
      createdAt: coupon.createdAt.toISOString(),
      updatedAt: coupon.updatedAt.toISOString(),
      startDate: coupon.startDate.toISOString(),
      endDate: coupon.endDate.toISOString(),
      products: Array.isArray(coupon.products) ? coupon.products.map((product: any) => ({
        _id: product._id.toString(),
        name: product.name,
        slug: product.slug
      })) : [],
      categories: Array.isArray(coupon.categories) ? coupon.categories.map((category: any) => ({
        _id: category._id.toString(),
        name: category.name,
        slug: category.slug
      })) : []
    };
    
    return NextResponse.json({
      success: true,
      coupon: formattedCoupon
    });
  } catch (error) {
    logger.error(`Erro ao buscar cupom ${id}:`, error);
    return NextResponse.json(
      { message: 'Erro ao buscar cupom', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// PUT /api/coupons/[id] - Atualizar um cupom existente
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter o ID do cupom
    const id = params?.id;
    
    logger.info(`Requisição para atualizar cupom ${id}`);
    
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated) {
      logger.warn('Tentativa não autorizada de atualizar cupom');
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Validar ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID de cupom inválido' }, { status: 400 });
    }
    
    await connectDB();
    
    // Extrair dados do request
    const data = await request.json();
    
    // Validar dados básicos
    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      );
    }
    
    const Coupon = await getCouponModel();
    
    // Verificar se o cupom existe
    const existingCoupon = await Coupon.findById(id);
    
    if (!existingCoupon) {
      return NextResponse.json({ message: 'Cupom não encontrado' }, { status: 404 });
    }
    
    // Se estiver atualizando o código, verificar se já existe outro cupom com o mesmo código
    if (data.code && data.code !== existingCoupon.code) {
      const codeExists = await Coupon.findOne({ 
        code: data.code.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (codeExists) {
        return NextResponse.json(
          { message: 'Já existe outro cupom com este código' },
          { status: 400 }
        );
      }
      
      // Garantir que o código esteja em maiúsculas
      data.code = data.code.toUpperCase();
    }
    
    // Atualizar cupom
    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'username email')
      .lean();
    
    logger.info(`Cupom atualizado: ${updatedCoupon.code} por ${authResult.user._id}`);
    
    // Formatar dados para resposta
    const formattedCoupon = {
      ...updatedCoupon,
      _id: updatedCoupon._id.toString(),
      createdBy: updatedCoupon.createdBy ? {
        _id: updatedCoupon.createdBy._id.toString(),
        username: updatedCoupon.createdBy.username,
        email: updatedCoupon.createdBy.email
      } : null,
      createdAt: updatedCoupon.createdAt.toISOString(),
      updatedAt: updatedCoupon.updatedAt.toISOString(),
      startDate: updatedCoupon.startDate.toISOString(),
      endDate: updatedCoupon.endDate.toISOString(),
      products: updatedCoupon.products?.map((id: any) => id.toString()) || [],
      categories: updatedCoupon.categories?.map((id: any) => id.toString()) || []
    };
    
    return NextResponse.json({
      success: true,
      coupon: formattedCoupon
    });
  } catch (error) {
    logger.error(`Erro ao atualizar cupom ${id}:`, error);
    return NextResponse.json(
      { success: false, message: 'Erro ao atualizar cupom', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE /api/coupons/[id] - Excluir um cupom
export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  try {
    // Obter o ID do cupom
    const id = params?.id;
    
    logger.info(`Requisição para excluir cupom ${id}`);
    
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated) {
      logger.warn('Tentativa não autorizada de excluir cupom');
      return NextResponse.json(
        { success: false, message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Validar ID
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ message: 'ID de cupom inválido' }, { status: 400 });
    }
    
    await connectDB();
    
    const Coupon = await getCouponModel();
    
    // Verificar se o cupom existe
    const coupon = await Coupon.findById(id);
    
    if (!coupon) {
      return NextResponse.json({ message: 'Cupom não encontrado' }, { status: 404 });
    }
    
    // Excluir cupom
    await Coupon.findByIdAndDelete(id);
    
    logger.info(`Cupom excluído: ${coupon.code} por ${authResult.user._id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Cupom excluído com sucesso'
    });
  } catch (error) {
    logger.error(`Erro ao excluir cupom ${id}:`, error);
    return NextResponse.json(
      { success: false, message: 'Erro ao excluir cupom', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 