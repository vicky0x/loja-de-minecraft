import { NextRequest, NextResponse } from 'next/server';
import { createPixPayment } from '@/app/lib/mercadopago';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:PAYMENT:MP INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:PAYMENT:MP ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:PAYMENT:MP WARN] ${message}`, ...args)
};

// Função para limpar CPF (remover pontos, traços e espaços)
function cleanCpf(cpf: string): string {
  if (!cpf) return '';
  return cpf.replace(/[^\d]/g, '');
}

// Processar pagamento PIX via Mercado Pago
export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    
    // Verificar se os dados obrigatórios estão presentes
    if (!data.order_id || !data.transaction_amount) {
      return NextResponse.json(
        { error: 'Dados de pagamento inválidos. ID do pedido e valor são obrigatórios.' },
        { status: 400 }
      );
    }
    
    // Buscar o pedido no banco de dados
    const connection = mongoose.connection;
    if (!connection || !connection.db) {
      throw new Error('Falha na conexão com o banco de dados');
    }
    
    const db = connection.db;
    const ordersCollection = db.collection('orders');
    const order = await ordersCollection.findOne({ _id: new mongoose.Types.ObjectId(data.order_id) });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }
    
    logger.info(`Processando pagamento para o pedido ${data.order_id}`);
    
    // Obter o ID do usuário do cabeçalho ou do token
    const userId = request.headers.get('x-user-id') || data.userId || order.userId || 'anonymous';
    
    // Obter e limpar o CPF se houver
    const cpf = cleanCpf(data.cpf || order.customer?.cpf || '19119119100');
    
    // Validar o CPF (formato básico, 11 dígitos)
    let finalCPF = cpf;
    if (cpf.length !== 11) {
      logger.warn(`CPF inválido fornecido para o pedido ${data.order_id}: ${cpf}`);
      // Usar CPF padrão de teste quando inválido
      finalCPF = '19119119100';
      logger.info(`Usando CPF de teste: ${finalCPF}`);
    }
    
    // Lista de CPFs de teste válidos do Mercado Pago
    const validTestCPFs = ['19119119100', '12345678909', '01234567890'];
    
    // Se estiver em ambiente de desenvolvimento, sempre usar CPF de teste
    if (process.env.NODE_ENV === 'development') {
      finalCPF = validTestCPFs[0];
      logger.info(`Ambiente de desenvolvimento: usando CPF de teste ${finalCPF}`);
    }
    
    // Preparar os dados para o Mercado Pago
    const paymentData = {
      transaction_amount: parseFloat(data.transaction_amount || order.totalAmount),
      description: `Pedido #${data.order_id}`,
      payment_method_id: 'pix',
      payer: {
        email: order.customer?.email || data.email || 'cliente@example.com',
        identification: {
          type: 'CPF',
          number: finalCPF // Usar o CPF validado
        },
        first_name: order.customer?.firstName || data.first_name || 'Cliente',
        last_name: order.customer?.lastName || data.last_name || 'Fantasy',
      },
      metadata: {
        order_id: data.order_id,
        userId: userId
      }
    };
    
    // Criar pagamento no Mercado Pago
    logger.info('Enviando solicitação para o Mercado Pago');
    const paymentResponse = await createPixPayment(paymentData);
    
    logger.info(`Pagamento criado com sucesso: ${paymentResponse.id}`);
    
    // Atualizar o pedido com as informações do pagamento
    await ordersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(data.order_id) },
      { 
        $set: {
          'metadata.paymentId': paymentResponse.id,
          'metadata.paymentCreatedAt': new Date(),
          'metadata.paymentQrCode': paymentResponse.qrCode,
          'metadata.paymentQrCodeBase64': paymentResponse.qrCodeBase64,
          'metadata.paymentTicketUrl': paymentResponse.ticketUrl,
          'metadata.paymentCopyPaste': paymentResponse.copyPaste,
          'metadata.paymentExpirationDate': paymentResponse.expirationDate,
          'updatedAt': new Date()
        }
      }
    );
    
    // Retornar os dados para renderização do QR code
    return NextResponse.json({
      success: true,
      payment: {
        id: paymentResponse.id,
        status: paymentResponse.status,
        qrCode: paymentResponse.qrCode,
        qrCodeBase64: paymentResponse.qrCodeBase64,
        ticketUrl: paymentResponse.ticketUrl,
        copyPaste: paymentResponse.copyPaste,
        expirationDate: paymentResponse.expirationDate
      }
    });
    
  } catch (error) {
    logger.error('Erro ao processar pagamento:', error);
    
    return NextResponse.json(
      { error: 'Erro ao processar o pagamento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Função para obter o status de um pagamento
export async function GET(request: NextRequest) {
  try {
    // Obter o ID do pagamento da URL
    const url = new URL(request.url);
    const paymentId = url.searchParams.get('payment_id');
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento não fornecido' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar o pedido com este ID de pagamento
    const connection = mongoose.connection;
    if (!connection || !connection.db) {
      throw new Error('Falha na conexão com o banco de dados');
    }
    
    const db = connection.db;
    const ordersCollection = db.collection('orders');
    const order = await ordersCollection.findOne({ 'metadata.paymentId': paymentId });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Pedido não encontrado para este pagamento' },
        { status: 404 }
      );
    }
    
    // Retornar o status atual do pagamento conforme registrado no pedido
    return NextResponse.json({
      success: true,
      orderId: order._id.toString(),
      paymentId: paymentId,
      paymentStatus: order.paymentStatus || 'pending',
      orderStatus: order.orderStatus || 'pending'
    });
    
  } catch (error) {
    logger.error('Erro ao consultar status do pagamento:', error);
    
    return NextResponse.json(
      { error: 'Erro ao consultar status do pagamento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 