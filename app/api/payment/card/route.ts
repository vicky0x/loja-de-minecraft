import { NextRequest, NextResponse } from 'next/server';
import { createCardCheckout } from '@/app/lib/mercadopago';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[API:PAYMENT:CARD INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[API:PAYMENT:CARD ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[API:PAYMENT:CARD WARN] ${message}`, ...args)
};

// Função para limpar CPF (remover pontos, traços e espaços)
function cleanCpf(cpf: string): string {
  if (!cpf) return '';
  return cpf.replace(/[^\d]/g, '');
}

// POST /api/payment/card - Cria um pagamento via Cartão (Checkout Transparente Mercado Pago)
export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter dados do corpo da requisição
    const data = await request.json();
    const { order_id, transaction_amount, email, cpf, first_name, last_name, reference_id } = data;
    
    logger.info(`Criando pagamento com cartão para o pedido ${order_id}, valor: R$ ${transaction_amount}`);
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
    
    // Validação adicional do CPF
    if (!cpf) {
      logger.error('CPF não fornecido');
      return NextResponse.json(
        { error: 'CPF é obrigatório' },
        { status: 400 }
      );
    }
    
    // Limpar CPF (remover pontos, traços e espaços)
    const cleanCPF = cleanCpf(cpf);
    
    // Validar formato do CPF
    if (cleanCPF.length !== 11) {
      logger.error(`CPF inválido, não tem 11 dígitos: ${cleanCPF.length} dígitos`);
      return NextResponse.json(
        { error: 'CPF inválido. Deve conter 11 dígitos.' },
        { status: 400 }
      );
    }
    
    // Verificar se tem padrões inválidos (todos os dígitos iguais)
    if (/^(\d)\1{10}$/.test(cleanCPF)) {
      logger.error('CPF inválido: todos os dígitos são iguais');
      return NextResponse.json(
        { error: 'CPF inválido. O CPF não pode ter todos os dígitos iguais.' },
        { status: 400 }
      );
    }
    
    // Em ambiente de desenvolvimento, substituir por um CPF válido de teste
    const isDevelopment = process.env.NODE_ENV === 'development';
    const validTestCPFs = ['19119119100', '12345678909', '01234567890'];
    const cpfToUse = isDevelopment ? validTestCPFs[0] : cleanCPF;
    
    if (isDevelopment && cleanCPF !== cpfToUse) {
      logger.warn(`Ambiente de desenvolvimento: substituindo CPF ${cleanCPF} por CPF de teste ${cpfToUse}`);
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
    
    // Obter o valor total após o desconto do cupom (se houver)
    let finalAmount = Number(transaction_amount);
    
    // Verificar se há desconto aplicado no pedido
    if (order.discountAmount && order.discountAmount > 0) {
      logger.info(`Pedido ${order_id} tem desconto de R$${order.discountAmount}`);
      
      // Usar o valor do pedido após o desconto
      finalAmount = order.totalAmount || (finalAmount - order.discountAmount);
      
      logger.info(`Valor ajustado após desconto: R$${finalAmount}`);
    } else {
      logger.info(`Pedido ${order_id} não tem descontos aplicados`);
    }
    
    // Preparar dados para o Mercado Pago
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    
    // Garantir que a URL tem protocolo (http ou https)
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Garantir que não termina com barra
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    const reference = reference_id || `order_${order_id}`;
    
    // Preparar dados do pagador
    const payerData = {
      email,
      first_name: first_name || 'Cliente',
      last_name: last_name || 'Sem sobrenome',
      identification: {
        type: 'CPF',
        number: cpfToUse
      }
    };
    
    // Objeto com campos explicitamente nomeados
    const paymentData = {
      transaction_amount: Number(finalAmount),
      description: `Pedido #${order_id}`,
      external_reference: reference,
      payer: payerData
    };
    
    // Criar checkout para cartão
    const cardCheckout = await createCardCheckout(paymentData);
    logger.info(`Checkout para cartão criado com sucesso: ID ${cardCheckout.id}, URL: ${cardCheckout.processUrl}`);
    
    // Atualizar o pedido com as informações do pagamento
    const updateResult = await ordersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(order_id) },
      { 
        $set: {
          'paymentInfo.method': 'credit_card',
          'paymentInfo.status': 'pending',
          'paymentInfo.preferenceId': cardCheckout.id,
          'paymentInfo.checkoutUrl': cardCheckout.processUrl,
          'metadata.preferenceId': cardCheckout.id,
          'metadata.paymentCreatedAt': new Date(),
          'metadata.externalReference': reference,
          updatedAt: new Date()
        }
      }
    );
    
    logger.info(`Pedido ${order_id} atualizado com informações de pagamento: ${JSON.stringify(updateResult)}`);
    
    // Retornar os dados necessários para redirecionar para o checkout
    return NextResponse.json({
      success: true,
      preferenceId: cardCheckout.id,
      status: 'pending',
      checkoutUrl: cardCheckout.processUrl,
      externalReference: cardCheckout.externalReference
    });
    
  } catch (error) {
    logger.error('Erro ao criar checkout para cartão no Mercado Pago:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro ao processar pagamento com cartão', 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 