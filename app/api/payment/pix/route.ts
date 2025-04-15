import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { createPixPayment } from '@/app/lib/mercadopago';
import { getOrderById, updateOrder } from '@/app/lib/orders';
import logger from '@/app/lib/logger';

/**
 * Endpoint para gerar um pagamento PIX para um pedido
 */
export async function POST(request: NextRequest) {
  logger.info('API: Recebida requisição para gerar pagamento PIX');
  
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
    
    // Construir dados para o pagamento
    const paymentData = {
      transaction_amount: order.total,
      description: `Pedido #${orderId}`,
      payment_method_id: 'pix',
      payer: {
        email: order.customerEmail || order.email,
        first_name: order.firstName || order.customerName?.split(' ')[0] || 'Cliente',
        last_name: order.lastName || order.customerName?.split(' ').slice(1).join(' ') || 'Não Informado',
        identification: {
          type: 'CPF',
          number: order.customerCpf || order.cpf || '00000000000'
        }
      },
      external_reference: orderId
    };
    
    // Gerar pagamento PIX usando biblioteca do Mercado Pago
    const payment = await createPixPayment(paymentData);
    
    if (!payment || !payment.id) {
      logger.error('Falha ao gerar pagamento PIX', payment);
      return NextResponse.json({ 
        success: false, 
        message: 'Falha ao gerar pagamento PIX' 
      }, { status: 500 });
    }
    
    // Atualizar o pedido com o ID do pagamento
    await updateOrder(orderId, { 
      paymentId: payment.id.toString(),
      paymentMethod: 'pix',
      paymentStatus: payment.status,
      paymentDetails: {
        pixCode: payment.point_of_interaction?.transaction_data?.qr_code,
        qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
        qrCodeUrl: payment.point_of_interaction?.transaction_data?.qr_code_url,
        expirationDate: payment.date_of_expiration
      }
    });
    
    logger.info(`Pagamento PIX gerado com sucesso para o pedido ${orderId}. ID do pagamento: ${payment.id}`);
    
    // Retornar dados do pagamento
    return NextResponse.json({
      success: true,
      message: 'Pagamento PIX gerado com sucesso',
      payment: {
        id: payment.id,
        status: payment.status,
        date_created: payment.date_created,
        date_of_expiration: payment.date_of_expiration,
        transaction_amount: payment.transaction_amount,
        point_of_interaction: payment.point_of_interaction,
        external_reference: orderId
      }
    });
    
  } catch (error: any) {
    logger.error('Erro ao gerar pagamento PIX:', error);
    
    return NextResponse.json({ 
      success: false, 
      message: error.message || 'Erro ao gerar pagamento PIX' 
    }, { status: 500 });
  }
} 