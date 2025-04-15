import { NextRequest, NextResponse } from 'next/server';
import { createCardCheckout } from '@/app/lib/mercadopago';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';
import { getOrderById, updateOrder } from '@/app/lib/orders';
import logger from '@/app/lib/logger';

// Função para limpar CPF (remover pontos, traços e espaços)
function cleanCpf(cpf: string): string {
  if (!cpf) return '';
  return cpf.replace(/[^\d]/g, '');
}

/**
 * Endpoint para gerar um checkout para pagamento com cartão
 */
export async function POST(request: NextRequest) {
  logger.info('API: Recebida requisição para gerar checkout para cartão');
  
  try {
    // Extrair dados da requisição
    const data = await request.json();
    const { orderId } = data;
    
    // Validar parâmetros obrigatórios
    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        message: 'ID do pedido é obrigatório' 
      }, { status: 400 });
    }
    
    // Buscar informações do pedido
    const order = await getOrderById(orderId);
    
    if (!order) {
      logger.warn(`Pedido não encontrado: ${orderId}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      }, { status: 404 });
    }
    
    // Verificar se já existe um pagamento para este pedido
    if (order.paymentId && order.paymentStatus === 'paid') {
      logger.warn(`Tentativa de gerar novo pagamento para pedido já pago: ${orderId}`);
      return NextResponse.json({ 
        success: false, 
        message: 'Este pedido já foi pago' 
      }, { status: 400 });
    }
    
    // Obter a URL base da aplicação para callbacks
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.BASE_URL || 
                    `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`;
    
    // Obter itens do pedido
    const orderItems = order.items || [];
    
    // Construir itens para o checkout
    const items = orderItems.map((item: any) => ({
      id: item.productId || item.variantId,
      title: item.productName || item.name || 'Produto',
      description: item.description || '',
      quantity: item.quantity || 1,
      unit_price: item.price || 0,
      currency_id: 'BRL',
      picture_url: item.productImage || ''
    }));
    
    // Configurar dados para o checkout
    const checkoutData = {
      items: items.length > 0 ? items : [
        {
          id: orderId,
          title: `Pedido #${orderId}`,
          description: 'Produtos digitais',
          quantity: 1,
          unit_price: order.total,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: order.firstName || order.customerName?.split(' ')[0] || 'Cliente',
        surname: order.lastName || order.customerName?.split(' ').slice(1).join(' ') || '',
        email: order.customerEmail || order.email,
        identification: {
          type: 'CPF',
          number: order.customerCpf || order.cpf || '00000000000'
        }
      },
      back_urls: {
        success: `${baseUrl}/checkout/success?external_reference=${orderId}`,
        failure: `${baseUrl}/checkout/failure?external_reference=${orderId}`,
        pending: `${baseUrl}/checkout/pending?external_reference=${orderId}`
      },
      auto_return: 'approved',
      statement_descriptor: 'FANTASY STORE',
      external_reference: orderId
    };
    
    // Gerar checkout usando biblioteca do Mercado Pago
    const checkout = await createCardCheckout(checkoutData);
    
    if (!checkout || !checkout.id) {
      logger.error('Falha ao gerar checkout para cartão', checkout);
      return NextResponse.json({ 
        success: false, 
        message: 'Falha ao gerar checkout para cartão' 
      }, { status: 500 });
    }
    
    // Atualizar o pedido com o ID da preferência
    await updateOrder(orderId, { 
      paymentId: checkout.id,
      paymentMethod: 'card',
      paymentStatus: 'pending',
      paymentDetails: {
        preferenceId: checkout.id,
        checkoutUrl: checkout.processUrl
      }
    });
    
    logger.info(`Checkout para cartão gerado com sucesso para o pedido ${orderId}. ID da preferência: ${checkout.id}`);
    
    // Retornar dados do checkout
    return NextResponse.json({
      success: true,
      message: 'Checkout para cartão gerado com sucesso',
      preferenceId: checkout.id,
      checkoutUrl: checkout.processUrl,
      externalReference: checkout.externalReference
    });
    
  } catch (error: any) {
    logger.error('Erro ao gerar checkout para cartão:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Erro ao gerar checkout para cartão' 
    }, { status: 500 });
  }
} 