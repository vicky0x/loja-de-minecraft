import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';

// Logger simples
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[CRON:CHECK-EXPIRED INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[CRON:CHECK-EXPIRED ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[CRON:CHECK-EXPIRED WARN] ${message}`, ...args)
};

/**
 * Verifica e atualiza pedidos com pagamentos expirados
 * Este endpoint é destinado a ser chamado por um CRON job
 * Exemplo de configuração: */
/* 
 * # Executar a cada 10 minutos
 * */10 * * * * curl -s https://seusite.com/api/cron/check-expired-orders > /dev/null
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar chave API para segurança (opcional)
    const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('key');
    const expectedApiKey = process.env.CRON_API_KEY;
    
    // Se a chave API está configurada no .env, verificar
    if (expectedApiKey && apiKey !== expectedApiKey) {
      logger.warn('Tentativa de acesso não autorizado à API de CRON (chave API inválida)');
      return NextResponse.json({ 
        success: false, 
        error: 'Acesso não autorizado'
      }, { status: 401 });
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar pedidos pendentes
    const connection = mongoose.connection;
    if (!connection || !connection.db) {
      throw new Error('Falha na conexão com o banco de dados');
    }
    
    const db = connection.db;
    const ordersCollection = db.collection('orders');
    
    const now = new Date();
    
    // Encontrar pedidos pendentes com PIX expirado
    const pendingOrders = await ordersCollection.find({
      $or: [
        { paymentStatus: 'pending' },
        { orderStatus: 'pending' },
        { 'paymentInfo.status': 'pending' }
      ],
      'metadata.pixExpiresAt': { 
        $exists: true,
        $lt: now 
      }
    }).toArray();
    
    logger.info(`Encontrados ${pendingOrders.length} pedidos com PIX expirado`);
    
    const updatedOrders = [];
    
    // Atualizar cada pedido expirado
    for (const order of pendingOrders) {
      try {
        // Atualizar o pedido para expirado
        const result = await ordersCollection.updateOne(
          { _id: order._id },
          {
            $set: {
              paymentStatus: 'expired',
              orderStatus: 'canceled',
              'paymentInfo.status': 'expired',
              'metadata.expiredAt': now,
              'metadata.paymentExpired': true,
              updatedAt: now
            },
            $push: {
              statusHistory: {
                status: 'expired',
                changedBy: 'Sistema (CRON)',
                changedAt: now,
                reason: 'PIX expirado'
              }
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          logger.info(`Pedido ${order._id.toString()} marcado como expirado`);
          updatedOrders.push({
            id: order._id.toString(),
            expirationDate: order.metadata?.pixExpiresAt,
            modifiedAt: now
          });
        }
      } catch (error) {
        logger.error(`Erro ao processar pedido ${order._id.toString()}: ${error}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      totalChecked: pendingOrders.length,
      totalUpdated: updatedOrders.length,
      updatedOrders
    });
    
  } catch (error) {
    logger.error('Erro ao processar verificação de pedidos expirados:', error);
    
    return NextResponse.json({
      success: false,
      error: `Erro ao processar verificação: ${error instanceof Error ? error.message : String(error)}`
    }, { status: 500 });
  }
} 