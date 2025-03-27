import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';

export async function GET() {
  // Não permitir em produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { message: 'Esta operação não é permitida em ambiente de produção' },
      { status: 403 }
    );
  }

  try {
    // Conectar ao MongoDB
    const mongoose = await connectDB();
    
    // Lista das coleções que queremos limpar
    const collections = ['users', 'products', 'orders', 'categories', 'coupons'];
    
    // Limpar cada coleção
    for (const collection of collections) {
      try {
        await mongoose.connection.db.collection(collection).deleteMany({});
        console.log(`Coleção ${collection} foi limpa`);
      } catch (err) {
        console.log(`Erro ao limpar coleção ${collection}:`, err);
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Banco de dados limpo com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao limpar banco de dados:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro desconhecido',
      message: 'Falha ao limpar banco de dados'
    }, { status: 500 });
  }
} 