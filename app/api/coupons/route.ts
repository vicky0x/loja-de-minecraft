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
export async function POST(request: NextRequest) {
  try {
    logger.info('Iniciando criação de novo cupom');
    
    // Log dos headers para debug
    const headers = Object.fromEntries(request.headers.entries());
    logger.info('Headers da requisição:', {
      contentType: headers['content-type'],
      hasAuth: !!headers['authorization'],
      hasCookie: !!headers['cookie']
    });
    
    // Conectar ao banco de dados primeiro
    await connectDB();
    logger.info('Conexão com o banco de dados estabelecida');
    
    // Verificar autenticação detalhadamente
    const authResult = await checkAuth(request);
    
    logger.info('Resultado da autenticação:', {
      isAuthenticated: authResult.isAuthenticated,
      userId: authResult.user?._id?.toString(),
      userRole: authResult.user?.role
    });
    
    if (!authResult.isAuthenticated) {
      logger.warn('Tentativa de criar cupom sem autenticação');
      return NextResponse.json({ 
        message: 'Você não está autenticado', 
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }
    
    if (!authResult.user || authResult.user.role !== 'admin') {
      logger.warn(`Usuário ${authResult.user?._id} com papel ${authResult.user?.role} tentou criar um cupom`);
      return NextResponse.json({ 
        message: 'Você não tem permissão para criar cupons', 
        code: 'ADMIN_REQUIRED' 
      }, { status: 403 });
    }
    
    // Extrair dados do request
    let data;
    try {
      data = await request.json();
    } catch (err) {
      logger.error('Erro ao analisar JSON da requisição:', err);
      return NextResponse.json({ 
        message: 'Formato de dados inválido', 
        code: 'INVALID_JSON' 
      }, { status: 400 });
    }
    
    logger.info('Dados do cupom recebidos:', data);
    
    // Validar dados básicos
    if (!data.code || !data.discount) {
      logger.warn('Dados inválidos para criação de cupom:', { code: data.code, discount: data.discount });
      return NextResponse.json(
        { message: 'Código e valor de desconto são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se já existe um cupom com o mesmo código
    const Coupon = await getCouponModel();
    const existingCoupon = await Coupon.findOne({ code: data.code.toUpperCase() });
    
    if (existingCoupon) {
      logger.warn(`Tentativa de criar cupom com código já existente: ${data.code.toUpperCase()}`);
      return NextResponse.json(
        { message: 'Já existe um cupom com este código' },
        { status: 400 }
      );
    }
    
    // Criar novo cupom
    const newCoupon = new Coupon({
      ...data,
      code: data.code.toUpperCase(), // Garantir que o código esteja em maiúsculas
      createdBy: authResult.user._id
    });
    
    await newCoupon.save();
    
    logger.info(`Cupom criado com sucesso: ${newCoupon.code} por ${authResult.user._id}`);
    
    return NextResponse.json({
      success: true,
      coupon: {
        ...newCoupon.toObject(),
        _id: newCoupon._id.toString(),
        createdBy: authResult.user._id.toString(),
        createdAt: newCoupon.createdAt.toISOString(),
        updatedAt: newCoupon.updatedAt.toISOString(),
        startDate: newCoupon.startDate.toISOString(),
        endDate: newCoupon.endDate.toISOString()
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erro detalhado na criação de cupom:', error);
    logger.error('Erro ao criar cupom:', error);
    return NextResponse.json(
      { message: 'Erro ao criar cupom', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 