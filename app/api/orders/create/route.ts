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

// Segredo para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

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
        
        // Adicionar item ao pedido com variante
        const orderItem = {
          product: new mongoose.Types.ObjectId(product._id),
          variant: variant._id.toString(),
          price: item.price || variant.price,
          name: `${product.name} - ${variant.name}`,
          quantity: item.quantity || 1
        };
        
        orderItems.push(orderItem);
        totalAmount += orderItem.price * orderItem.quantity;
      } else {
        // Para produtos sem variantes, usar o preço e nome diretamente do produto
        const orderItem = {
          product: new mongoose.Types.ObjectId(product._id),
          variant: null, // Variante nula para produtos sem variantes
          price: item.price || product.price,
          name: product.name,
          quantity: item.quantity || 1
        };
        
        orderItems.push(orderItem);
        totalAmount += orderItem.price * orderItem.quantity;
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
            // Aplicar o desconto (utilizando o valor enviado ou recalcular com base no cupom)
            const discountToApply = Math.min(data.coupon.discountAmount, totalAmount);
            
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