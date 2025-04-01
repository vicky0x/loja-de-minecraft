import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// Logger para as operações relacionadas a uso de cupons
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:USE_COUPON INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:USE_COUPON ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:USE_COUPON WARN] ${message}`, ...args)
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

// POST /api/coupons/use - Registrar o uso de um cupom
export async function POST(request: NextRequest) {
  try {
    logger.info('Iniciando registro de uso de cupom');
    
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    // Não é necessário ser admin para registrar o uso de um cupom, mas o usuário deve estar autenticado
    if (!authResult.isAuthenticated) {
      logger.warn('Tentativa de registrar uso de cupom sem autenticação');
      return NextResponse.json({ 
        success: false,
        message: 'Você não está autenticado', 
        code: 'AUTH_REQUIRED' 
      }, { status: 401 });
    }
    
    // Conectar ao banco de dados
    await connectDB();
    logger.info('Conexão com o banco de dados estabelecida');
    
    // Extrair dados do request
    let data;
    try {
      data = await request.json();
    } catch (err) {
      logger.error('Erro ao analisar JSON da requisição:', err);
      return NextResponse.json({ 
        success: false,
        message: 'Formato de dados inválido',
        code: 'INVALID_JSON' 
      }, { status: 400 });
    }
    
    // Validar parâmetros necessários
    if (!data.couponId && !data.couponCode) {
      logger.warn('ID ou código do cupom não fornecido');
      return NextResponse.json({
        success: false,
        message: 'ID ou código do cupom é obrigatório'
      }, { status: 400 });
    }
    
    if (!data.orderId) {
      logger.warn('ID do pedido não fornecido');
      return NextResponse.json({
        success: false,
        message: 'ID do pedido é obrigatório'
      }, { status: 400 });
    }
    
    // Carregar o modelo de Cupom
    const Coupon = await getCouponModel();
    
    // Buscar o cupom pelo ID ou código
    let query = {};
    if (data.couponId) {
      try {
        query = { _id: new mongoose.Types.ObjectId(data.couponId) };
      } catch (error) {
        logger.error('ID de cupom inválido:', data.couponId);
        return NextResponse.json({
          success: false,
          message: 'ID de cupom inválido'
        }, { status: 400 });
      }
    } else {
      query = { code: data.couponCode.trim().toUpperCase() };
    }
    
    // Atualizar o contador de uso do cupom
    const updatedCoupon = await Coupon.findOneAndUpdate(
      query,
      { $inc: { usedCount: 1 } },
      { new: true }
    );
    
    if (!updatedCoupon) {
      logger.warn('Cupom não encontrado para atualização:', query);
      return NextResponse.json({
        success: false,
        message: 'Cupom não encontrado'
      }, { status: 404 });
    }
    
    logger.info(`Cupom ${updatedCoupon.code} utilizado no pedido ${data.orderId}. Novo contador: ${updatedCoupon.usedCount}`);
    
    return NextResponse.json({
      success: true,
      coupon: {
        id: updatedCoupon._id.toString(),
        code: updatedCoupon.code,
        usedCount: updatedCoupon.usedCount
      },
      message: 'Uso de cupom registrado com sucesso'
    });
    
  } catch (error) {
    logger.error('Erro ao registrar uso de cupom:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao registrar uso de cupom', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 