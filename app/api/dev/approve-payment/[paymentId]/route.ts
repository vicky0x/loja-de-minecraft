import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/app/lib/db/mongodb';
import { MongoClient } from 'mongodb';

// Substituir o Logger por funções simples de log
function logInfo(message: string) {
  console.log(`[api/dev/approve-payment] INFO: ${message}`);
}

function logError(message: string, error?: any) {
  console.error(`[api/dev/approve-payment] ERROR: ${message}`, error);
}

type RouteParams = {
  params: {
    paymentId: string;
  };
};

export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    // Em produção, desabilitar esta rota completamente
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'Esta rota não está disponível em produção' },
        { status: 404 }
      );
    }

    // Conectar ao banco de dados
    const connection = await connectToDatabase();
    // Obter um cliente MongoDB para acessar as coleções
    const client = connection.connection.getClient() as MongoClient;
    const db = client.db();
    
    // Obter o ID do pagamento
    const paymentId = context.params.paymentId;
    
    if (!paymentId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }
  
    const ordersCollection = db.collection('orders');
    
    // Encontrar o pedido com este ID de pagamento
    const order = await ordersCollection.findOne({
      'metadata.paymentId': paymentId
    });
    
    if (!order) {
      return NextResponse.json(
        { error: 'Nenhum pedido encontrado com este ID de pagamento' },
        { status: 404 }
      );
    }
    
    // Verificar se o pedido já foi pago
    if (order.paymentStatus === 'paid') {
      return NextResponse.json({
        success: false,
        message: 'Este pagamento já foi aprovado anteriormente'
      });
    }
    
    logInfo(`Simulando aprovação do pagamento ${paymentId} para pedido ${order._id}`);
    
    // Atualizar o status do pagamento no pedido (mas não atribuir produtos)
    // A atribuição será feita pelo endpoint check-status
    await ordersCollection.updateOne(
      { _id: order._id },
      { 
        $set: { 
          'metadata.paymentSimulated': true,
          'metadata.paymentSimulatedAt': new Date(),
          'updatedAt': new Date()
        } 
      }
    );
    
    // Responder com sucesso
    return NextResponse.json({
      success: true,
      message: 'Pagamento simulado como aprovado com sucesso',
      orderId: order._id.toString()
    });
    
  } catch (error) {
    logError('Erro ao simular aprovação de pagamento:', error);
    
    return NextResponse.json(
      { error: 'Erro ao simular aprovação de pagamento', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 