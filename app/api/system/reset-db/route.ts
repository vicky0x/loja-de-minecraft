import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';

// Substituir o Logger por funções simples de log
function logInfo(message: string) {
  console.log(`[api/system/reset-db] INFO: ${message}`);
}

function logError(message: string, error?: any) {
  console.error(`[api/system/reset-db] ERROR: ${message}`, error);
}

export async function GET() {
  // Não permitir em produção, proteção dupla
  if (process.env.NODE_ENV === 'production' || process.env.DISABLE_DEV_ROUTES === 'true') {
    logError('Tentativa de acesso à rota de reset de banco de dados em ambiente de produção');
    return NextResponse.json(
      { message: 'Esta operação não é permitida em ambiente de produção' },
      { status: 403 }
    );
  }

  try {
    // Conectar ao MongoDB
    const mongoose = await connectDB();
    logInfo('Iniciando limpeza de coleções do banco de dados');
    
    // Lista das coleções que queremos limpar
    const collections = ['users', 'products', 'orders', 'categories', 'coupons'];
    
    // Limpar cada coleção
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
        logInfo(`Coleção ${collection} foi limpa com sucesso`);
      } catch (err) {
        logError(`Erro ao limpar coleção ${collection}:`, err);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Banco de dados limpo com sucesso'
    });
  } catch (error: any) {
    logError('Erro ao limpar banco de dados:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido',
      message: 'Falha ao limpar banco de dados'
    }, { status: 500 });
  }
} 