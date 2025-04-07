import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Logger from '@/app/lib/logger';

const logger = new Logger('api/system/reset-db');

export async function GET() {
  // Não permitir em produção, proteção dupla
  if (process.env.NODE_ENV === 'production' || process.env.DISABLE_DEV_ROUTES === 'true') {
    logger.error('Tentativa de acesso à rota de reset de banco de dados em ambiente de produção');
    return NextResponse.json(
      { message: 'Esta operação não é permitida em ambiente de produção' },
      { status: 403 }
    );
  }

  try {
    // Conectar ao MongoDB
    const mongoose = await connectDB();
    logger.info('Iniciando limpeza de coleções do banco de dados');
    
    // Lista das coleções que queremos limpar
    const collections = ['users', 'products', 'orders', 'categories', 'coupons'];
    
    // Limpar cada coleção
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
        logger.info(`Coleção ${collection} foi limpa com sucesso`);
      } catch (err) {
        logger.error(`Erro ao limpar coleção ${collection}:`, err);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Banco de dados limpo com sucesso'
    });
  } catch (error: any) {
    logger.error('Erro ao limpar banco de dados:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido',
      message: 'Falha ao limpar banco de dados'
    }, { status: 500 });
  }
} 