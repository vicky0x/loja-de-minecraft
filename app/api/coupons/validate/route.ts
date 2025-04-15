import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';

// Logger para as operações relacionadas a validação de cupons
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:VALIDATE_COUPON INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:VALIDATE_COUPON ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:VALIDATE_COUPON WARN] ${message}`, ...args)
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

// POST /api/coupons/validate - Validar um cupom para uso no carrinho
export async function POST(request: NextRequest) {
  try {
    logger.info('Iniciando validação de cupom para o carrinho');
    
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
    if (!data.code) {
      logger.warn('Código de cupom não fornecido');
      return NextResponse.json({
        success: false,
        message: 'Código de cupom é obrigatório'
      }, { status: 400 });
    }
    
    if (!data.cartTotal || isNaN(Number(data.cartTotal))) {
      logger.warn('Valor total do carrinho não fornecido ou inválido');
      return NextResponse.json({
        success: false,
        message: 'Valor total do carrinho é obrigatório e deve ser um número'
      }, { status: 400 });
    }
    
    const cartTotal = Number(data.cartTotal);
    const couponCode = data.code.trim().toUpperCase();
    const cartItems = data.items || []; // Itens do carrinho (opcional)
    
    // Carregar o modelo de Cupom
    const Coupon = await getCouponModel();
    
    // Buscar o cupom pelo código
    const coupon = await Coupon.findOne({ 
      code: couponCode,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });
    
    // Verificar se o cupom existe
    if (!coupon) {
      logger.warn(`Cupom não encontrado ou inativo: ${couponCode}`);
      return NextResponse.json({
        success: false,
        message: 'Cupom inválido ou expirado'
      }, { status: 404 });
    }
    
    // Verificar restrição de produtos
    let eligibleCartTotal = cartTotal;
    if (coupon.products && coupon.products.length > 0 && cartItems.length > 0) {
      // Verificar se pelo menos um produto do carrinho está na lista de produtos permitidos
      const allowedProductIds = coupon.products.map(p => p.toString());
      
      // Filtrar os items que são elegíveis para o cupom
      const eligibleItems = cartItems.filter(item => 
        allowedProductIds.includes(item.productId)
      );
      
      if (eligibleItems.length === 0) {
        logger.warn(`Cupom ${couponCode} não é válido para os produtos do carrinho`);
        return NextResponse.json({
          success: false,
          message: 'Este cupom não é válido para os produtos do seu carrinho'
        }, { status: 400 });
      }
      
      // Recalcular o total apenas com produtos elegíveis
      if (data.itemsPrices && data.itemsPrices.length > 0) {
        eligibleCartTotal = data.itemsPrices
          .filter((item, index) => allowedProductIds.includes(cartItems[index].productId))
          .reduce((sum, price) => sum + price, 0);
      }
    }
    
    // Verificar se o cupom atingiu o limite de usos
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      logger.warn(`Cupom ${couponCode} atingiu limite de usos: ${coupon.usedCount}/${coupon.maxUses}`);
      return NextResponse.json({
        success: false,
        message: 'Este cupom atingiu o limite máximo de usos'
      }, { status: 400 });
    }
    
    // Verificar valor mínimo para uso do cupom
    if (coupon.minAmount > 0 && eligibleCartTotal < coupon.minAmount) {
      logger.warn(`Valor mínimo para cupom ${couponCode} não atingido: ${eligibleCartTotal} < ${coupon.minAmount}`);
      return NextResponse.json({
        success: false,
        message: `Valor mínimo para este cupom é R$ ${coupon.minAmount.toFixed(2)}`
      }, { status: 400 });
    }
    
    // Calcular o valor do desconto
    let discountValue = 0;
    
    if (coupon.discountType === 'percentage') {
      discountValue = (eligibleCartTotal * coupon.discount) / 100;
    } else { // fixed
      discountValue = coupon.discount;
    }
    
    // Verificar se há um valor máximo de desconto
    if (coupon.maxAmount > 0 && discountValue > coupon.maxAmount) {
      discountValue = coupon.maxAmount;
    }
    
    // Garantir que o desconto não seja maior que o valor dos produtos elegíveis
    if (discountValue > eligibleCartTotal) {
      discountValue = eligibleCartTotal;
    }
    
    // Retornar os dados do cupom e o valor do desconto
    return NextResponse.json({
      success: true,
      coupon: {
        id: coupon._id.toString(),
        code: coupon.code,
        discount: coupon.discount,
        discountType: coupon.discountType,
        discountValue: discountValue.toFixed(2)
      },
      message: 'Cupom aplicado com sucesso'
    });
    
  } catch (error) {
    logger.error('Erro ao validar cupom:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Erro ao processar cupom', 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 