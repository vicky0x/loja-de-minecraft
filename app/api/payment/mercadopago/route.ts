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

// POST /api/payment/mercadopago - Cria um pagamento via Mercado Pago
export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    const { order_id, transaction_amount, email, cpf, first_name, last_name, reference_id } = data;
    
    logger.info(`Criando pagamento para o pedido ${order_id}, valor: R$ ${transaction_amount}`);
    logger.info(`Detalhes do usuário: ${first_name} ${last_name}, ${email}, CPF: ${cpf ? '✓' : '✗'}`);
    
    // Validar dados obrigatórios
    if (!order_id || !mongoose.Types.ObjectId.isValid(order_id)) {
      logger.error(`ID de pedido inválido: ${order_id}`);
      return NextResponse.json(
        { error: 'ID de pedido inválido' },
        { status: 400 }
      );
    }
    
    if (!transaction_amount || isNaN(Number(transaction_amount)) || Number(transaction_amount) <= 0) {
      logger.error(`Valor da transação inválido: ${transaction_amount}`);
      return NextResponse.json(
        { error: 'Valor da transação inválido' },
        { status: 400 }
      );
    }
    
    if (!email || !email.includes('@')) {
      logger.error(`Email inválido: ${email}`);
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }
    
    // Buscar o pedido para confirmar se existe e obter mais detalhes se necessário
    const ordersCollection = mongoose.connection.db.collection('orders');
    const order = await ordersCollection.findOne({ _id: new mongoose.Types.ObjectId(order_id) });
    
    if (!order) {
      logger.error(`Pedido ${order_id} não encontrado no banco de dados`);
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      );
    }
    
    // Se o pedido já tiver um pagamento aprovado, retornar erro
    if (order.paymentStatus === 'paid' || 
        (order.paymentInfo && order.paymentInfo.status === 'paid')) {
      logger.warn(`Pedido ${order_id} já possui um pagamento aprovado`);
      return NextResponse.json(
        { error: 'Este pedido já possui um pagamento aprovado' },
        { status: 400 }
      );
    }
    
    // Log para diagnóstico
    logger.info(`Itens do pedido: ${JSON.stringify(order.orderItems || order.items || [])}`);
    
    // Preparar dados para o Mercado Pago - usando notação de objeto literal para evitar erros de ortografia
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    
    // Garantir que a URL tem protocolo (http ou https) - Mercado Pago exige URL completa
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Garantir que não termina com barra
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    const reference = reference_id || `order_${order_id}`;
    let notificationUrl = `${baseUrl}/api/payment/webhook`;
    
    // Validar se a URL está em formato válido 
    try {
      new URL(notificationUrl);
      logger.info(`URL de notificação validada: ${notificationUrl}`);
    } catch (e) {
      logger.error(`URL inválida: ${notificationUrl}. Usando URL padrão.`);
      // URL de fallback em caso de erro
      notificationUrl = 'https://hooks.webhook.site/your_test_id';
    }
    
    // Objeto com campos explicitamente nomeados para evitar erros de ortografia
    const paymentData = {
      transaction_amount: Number(transaction_amount),
      description: `Pedido #${order_id}`,
      payment_method_id: 'pix',
      external_reference: reference,
      notification_url: notificationUrl,
      payer: {
        email: email,
        first_name: first_name || 'Cliente',
        last_name: last_name || 'Sem sobrenome',
        identification: {
          type: 'CPF',
          number: cpf
        }
      }
    };
    
    // Verificar a URL de notificação - para diagnóstico
    logger.info(`URL de notificação configurada: ${paymentData.notification_url}`);

    // Importar a função de criação de pagamento
    const { createPixPayment } = await import('@/app/lib/mercadopago');
    
    // Criar pagamento PIX
    const pixPayment = await createPixPayment(paymentData);
    logger.info(`Pagamento criado com sucesso: ID ${pixPayment.id}, status ${pixPayment.status}`);
    
    // Atualizar o pedido com as informações do pagamento
    const updateResult = await ordersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(order_id) },
      { 
        $set: {
          'paymentInfo.method': 'pix',
          'paymentInfo.status': pixPayment.status,
          'paymentInfo.transactionId': pixPayment.id,
          'paymentInfo.pixQrCode': pixPayment.qrCode,
          'paymentInfo.pixQrCodeBase64': pixPayment.qrCodeBase64,
          'paymentInfo.pixCopyPaste': pixPayment.copyPaste,
          'paymentInfo.expirationDate': pixPayment.expirationDate,
          'metadata.paymentId': pixPayment.id,
          'metadata.paymentCreatedAt': new Date(),
          'metadata.externalReference': reference,
          updatedAt: new Date()
        }
      }
    );
    
    logger.info(`Pedido ${order_id} atualizado com informações de pagamento: ${JSON.stringify(updateResult)}`);
    
    // Verificar se o pedido contém produtos sem variantes
    try {
      const orderItems = order.orderItems || order.items || [];
      if (orderItems.length > 0) {
        const { default: Product } = await import('@/app/lib/models/product');
        
        for (const item of orderItems) {
          const productId = item.productId || (item.product && (typeof item.product === 'string' ? item.product : item.product.toString()));
          
          if (productId) {
            const product = await Product.findById(productId);
            if (product) {
              const hasVariants = product.variants && product.variants.length > 0;
              if (!hasVariants) {
                logger.info(`Pedido ${order_id} contém produto sem variantes: ${product.name} (${productId})`);
              }
            }
          }
        }
      }
    } catch (error) {
      logger.warn('Erro ao verificar produtos sem variantes:', error);
    }
    
    // Retornar os dados necessários para exibir o QR code e o código PIX
    return NextResponse.json({
      success: true,
      paymentId: pixPayment.id,
      status: pixPayment.status,
      qrCodeUrl: pixPayment.qrCode,
      qrCodeBase64: pixPayment.qrCodeBase64,
      pixCopiaECola: pixPayment.copyPaste,
      expiresAt: pixPayment.expirationDate
    });
    
  } catch (error) {
    logger.error('Erro ao criar pagamento no Mercado Pago:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar pagamento', 
        details: error instanceof Error ? error.message : String(error)
      },
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