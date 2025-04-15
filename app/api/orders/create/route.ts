import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';
import Order from '@/app/lib/models/order';
import User from '@/app/lib/models/user';
import Product from '@/app/lib/models/product';
import jwt from 'jsonwebtoken';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:ORDERS:CREATE INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:ORDERS:CREATE ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:ORDERS:CREATE WARN] ${message}`, ...args)
};

// JWT Secret para autenticação
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente');
  throw new Error('JWT_SECRET não configurado');
}

export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Verificar se os dados obrigatórios estão presentes
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { error: 'Dados do pedido inválidos. Os itens são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Validação de usuário através do cookie de autenticação
    const authToken = request.cookies.get('auth_token')?.value;
    let userId = null;

    if (authToken) {
      try {
        // Verificar e decodificar o token
        const decoded = jwt.verify(authToken, JWT_SECRET) as { id: string };
        if (decoded && decoded.id) {
          userId = decoded.id;
          logger.info(`Usuário autenticado: ${userId}`);
        }
      } catch (error) {
        logger.warn('Token de autenticação inválido:', error);
      }
    }

    if (!userId) {
      logger.warn('Tentativa de criar pedido sem autenticação');
      return NextResponse.json(
        { error: 'Usuário não autenticado. É necessário fazer login para criar um pedido.' },
        { status: 401 }
      );
    }
    
    // Verificar se o usuário existe
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }
    
    // Calcular valor total e validar itens
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of data.items) {
      // Verificar se o produto existe
      const product = await Product.findById(item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Produto não encontrado: ${item.name || 'Desconhecido'}` },
          { status: 404 }
        );
      }
      
      // Verificar se o produto tem variantes
      const hasVariants = product.variants && product.variants.length > 0;
      
      if (hasVariants) {
        // Encontrar a variante para produtos com variantes
        const variant = product.variants.find((v: any) => 
          v._id.toString() === item.variantId || v.name === item.variantName
        );
        
        if (!variant) {
          return NextResponse.json(
            { error: `Variante não encontrada para o produto: ${product.name}` },
            { status: 404 }
          );
        }
        
        // Validar e processar a quantidade
        let itemQuantity = 1; // Valor padrão
        
        if (typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) {
          itemQuantity = Math.floor(item.quantity);
        } else if (typeof item.quantity === 'string' && item.quantity.trim() !== '') {
          const parsedQty = parseInt(item.quantity.trim(), 10);
          if (!isNaN(parsedQty) && parsedQty > 0) {
            itemQuantity = parsedQty;
          }
        }
        
        logger.info(`Produto: ${product.name}, Variante: ${variant.name}, Quantidade: ${itemQuantity}`);
        
        // Adicionar item ao pedido com variante
        const orderItem = {
          product: new mongoose.Types.ObjectId(product._id),
          variant: variant._id.toString(),
          price: item.price || variant.price,
          name: `${product.name} - ${variant.name}`,
          quantity: itemQuantity
        };
        
        orderItems.push(orderItem);
        totalAmount += orderItem.price * itemQuantity;
      } else {
        // Validar e processar a quantidade para produtos sem variantes
        let itemQuantity = 1; // Valor padrão
        
        if (typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) {
          itemQuantity = Math.floor(item.quantity);
        } else if (typeof item.quantity === 'string' && item.quantity.trim() !== '') {
          const parsedQty = parseInt(item.quantity.trim(), 10);
          if (!isNaN(parsedQty) && parsedQty > 0) {
            itemQuantity = parsedQty;
          }
        }
        
        logger.info(`Produto: ${product.name}, Quantidade: ${itemQuantity}`);
        
        // Para produtos sem variantes, usar o preço e nome diretamente do produto
        const orderItem = {
          product: new mongoose.Types.ObjectId(product._id),
          variant: null, // Variante nula para produtos sem variantes
          price: item.price || product.price,
          name: product.name,
          quantity: itemQuantity
        };
        
        orderItems.push(orderItem);
        totalAmount += orderItem.price * itemQuantity;
      }
    }
    
    // Criar o pedido usando o modelo Order
    const orderData = {
      user: new mongoose.Types.ObjectId(userId),
      orderItems: orderItems,
      totalAmount,
      paymentMethod: data.paymentMethod || 'pix',
      paymentInfo: {
        status: 'pending',
        method: data.paymentMethod || 'pix'
      },
      productAssigned: false,
      discountAmount: 0,
      customerData: data.customer || null,
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        createdAt: new Date()
      }
    };
    
    // Processar cupom se estiver presente nos dados
    if (data.coupon && data.coupon.code && data.coupon.discountAmount > 0) {
      try {
        // Carregar o modelo de Cupom
        const Coupon = mongoose.models.Coupon || require('@/app/lib/models/coupon').default;
        
        // Buscar o cupom no banco de dados
        const coupon = await Coupon.findOne({ 
          code: data.coupon.code.trim().toUpperCase(),
          isActive: true,
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() }
        });
        
        if (coupon) {
          // Verificar se o cupom atingiu o limite de usos
          if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
            logger.warn(`Cupom ${data.coupon.code} atingiu limite de usos: ${coupon.usedCount}/${coupon.maxUses}`);
          } else {
            // Verificar se o cupom tem restrição de produtos
            let discountAmount = data.coupon.discountAmount;
            
            if (coupon.products && coupon.products.length > 0) {
              // Cupom com restrição de produtos - aplicar apenas aos produtos elegíveis
              const allowedProductIds = coupon.products.map(id => id.toString());
              
              // Calcular subtotal apenas dos produtos elegíveis
              const eligibleAmount = orderItems
                .filter(item => allowedProductIds.includes(item.product.toString()))
                .reduce((sum, item) => sum + (item.price * item.quantity), 0);
              
              // Recalcular o desconto apenas sobre os produtos elegíveis
              if (coupon.discountType === 'percentage') {
                discountAmount = (eligibleAmount * coupon.discount) / 100;
              } else {
                discountAmount = Math.min(coupon.discount, eligibleAmount);
              }
              
              // Aplicar limite máximo de desconto se existir
              if (coupon.maxAmount > 0 && discountAmount > coupon.maxAmount) {
                discountAmount = coupon.maxAmount;
              }
              
              logger.info(`Cupom ${coupon.code} aplicado apenas a produtos específicos. Valor total elegível: ${eligibleAmount}, desconto: ${discountAmount}`);
            }
            
            // Aplicar o desconto (limitado ao valor total)
            const discountToApply = Math.min(discountAmount, totalAmount);
            
            // Atualizar o pedido com as informações do cupom
            orderData.discountAmount = discountToApply;
            orderData.totalAmount = totalAmount - discountToApply;
            orderData.couponApplied = coupon._id;
            
            logger.info(`Cupom ${coupon.code} aplicado ao pedido com desconto de ${discountToApply}`);
          }
        } else {
          logger.warn(`Tentativa de usar cupom inválido: ${data.coupon.code}`);
        }
      } catch (error) {
        logger.error('Erro ao processar cupom:', error);
        // Não falhar a criação do pedido se o processamento do cupom falhar
      }
    }
    
    const newOrder = new Order(orderData);
    await newOrder.save();
    
    logger.info(`Pedido criado: ${newOrder._id} para o usuário ${userId} (${user.username})`);
    
    return NextResponse.json({ 
      success: true, 
      orderId: newOrder._id.toString(),
      message: 'Pedido criado com sucesso'
    });
    
  } catch (error) {
    logger.error('Erro ao criar pedido:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar o pedido', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 