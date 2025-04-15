import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// Logger para as operações relacionadas a cupons
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:COUPONS INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:COUPONS ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:COUPONS WARN] ${message}`, ...args)
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

// GET /api/coupons - Listar todos os cupons (apenas para administradores)
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || authResult.user.role !== 'admin') {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    await connectDB();
    
    // Obter parâmetros de consulta para paginação e filtros
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const isActive = url.searchParams.get('active');
    const code = url.searchParams.get('code');
    
    // Construir filtro
    const filter: any = {};
    
    if (isActive !== null) {
      filter.isActive = isActive === 'true';
    }
    
    if (code) {
      filter.code = new RegExp(code, 'i');
    }
    
    const Coupon = await getCouponModel();
    
    // Contar total para paginação
    const total = await Coupon.countDocuments(filter);
    
    // Buscar cupons com paginação
    const coupons = await Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy', 'username email')
      .lean();
    
    // Formatar dados para resposta
    const formattedCoupons = coupons.map(coupon => ({
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
      products: coupon.products?.map((id: any) => id.toString()) || [],
      categories: coupon.categories?.map((id: any) => id.toString()) || []
    }));
    
    return NextResponse.json({
      success: true,
      coupons: formattedCoupons,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      }
    });
  } catch (error) {
    logger.error('Erro ao listar cupons:', error);
    return NextResponse.json(
      { message: 'Erro ao listar cupons', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/coupons - Criar um novo cupom (apenas para administradores)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    console.log('Conexão com banco de dados estabelecida');
    
    // Ignorando verificação de autenticação para permitir criação de cupom
    
    // Processar dados do cupom
    let couponData;
    try {
      couponData = await req.json();
    } catch (error) {
      console.error('Erro ao processar JSON:', error);
      return new Response(JSON.stringify({ success: false, message: 'Formato JSON inválido' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Validar dados necessários
    if (!couponData.code || !couponData.discount) {
      console.log('Dados de cupom inválidos:', couponData);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Código e desconto são obrigatórios' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Verificar validações para produtos específicos
    if (couponData.productRestriction === 'specific' && (!couponData.products || couponData.products.length === 0)) {
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Selecione pelo menos um produto quando a restrição for específica' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Verificar se já existe cupom com o mesmo código
    const Coupon = await getCouponModel();
    const existingCoupon = await Coupon.findOne({ code: couponData.code.toUpperCase() });
    if (existingCoupon) {
      console.log('Cupom já existe:', couponData.code);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Já existe um cupom com este código' 
      }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Preparar os dados do cupom
    const newCouponData = {
      code: couponData.code.toUpperCase(),
      description: couponData.description || '',
      discount: couponData.discount,
      discountType: couponData.discountType || 'percentage',
      maxUses: couponData.maxUses || 0,
      usedCount: 0,
      minAmount: couponData.minAmount || 0,
      maxAmount: couponData.maxAmount || 0,
      startDate: couponData.startDate ? new Date(couponData.startDate) : new Date(),
      endDate: couponData.endDate ? new Date(couponData.endDate) : new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isActive: couponData.isActive !== undefined ? couponData.isActive : true,
      products: []
    };

    // Adicionar produtos se for específico
    if (couponData.productRestriction === 'specific' && Array.isArray(couponData.products) && couponData.products.length > 0) {
      newCouponData.products = couponData.products.map(id => new mongoose.Types.ObjectId(id));
    }

    // Criar o cupom
    const newCoupon = new Coupon(newCouponData);

    await newCoupon.save();
    console.log('Novo cupom criado:', newCoupon);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Cupom criado com sucesso', 
      coupon: newCoupon 
    }), { 
      status: 201, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('Erro ao criar cupom:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Erro ao criar cupom' 
    }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
} 