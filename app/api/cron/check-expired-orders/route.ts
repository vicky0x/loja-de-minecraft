import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Order from '@/app/lib/models/order';
import User from '@/app/lib/models/user';
import { checkAuth } from '@/app/lib/auth';

/**
 * API route para verificar e atualizar pedidos expirados
 * Esta rota é chamada por um cron job periódico
 * 
 * Para configurar um cron job no seu servidor, você pode usar:
 * 1. cPanel: Cron Jobs
 * 2. Linux: crontab -e
 * 3. Windows: Task Scheduler
 * 
 * Exemplo de configuração:
 * # Executar a cada 10 minutos
 * 10 * * * * curl -s https://seusite.com/api/cron/check-expired-orders > /dev/null
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação ou chave de API (opcional)
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CRON_API_KEY;
    
    // Se a chave de API estiver configurada, exigir autenticação
    if (apiKey && (!authHeader || authHeader !== `Bearer ${apiKey}`)) {
      const reqUrl = new URL(request.url);
      const queryApiKey = reqUrl.searchParams.get('key');
      
      // Permitir autenticação por query param também
      if (!queryApiKey || queryApiKey !== apiKey) {
        console.log('Acesso não autorizado à rota de cron');
        return NextResponse.json(
          { error: 'Não autorizado' },
          { status: 401 }
        );
      }
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter a data atual
    const now = new Date();
    
    // Buscar pedidos pendentes com pagamento expirado (30 minutos sem confirmação)
    // Isso poderia ser configurável com base nas configurações da loja
    const expirationTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutos atrás
    
    const expiredOrders = await Order.find({
      status: 'pending',
      createdAt: { $lt: expirationTime }
    });
    
    console.log(`Encontrados ${expiredOrders.length} pedidos expirados`);
    
    // Atualizar status para 'expired'
    const updatePromises = expiredOrders.map(async (order) => {
      order.status = 'expired';
      order.statusHistory.push({
        status: 'expired',
        date: now,
        description: 'Pedido expirado automaticamente'
      });
      
      await order.save();
      return order._id;
    });
    
    const updatedOrderIds = await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: `${updatedOrderIds.length} pedidos foram marcados como expirados`,
      updatedOrders: updatedOrderIds
    });
    
  } catch (error) {
    console.error('Erro ao verificar pedidos expirados:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pedidos expirados' },
      { status: 500 }
    );
  }
} 