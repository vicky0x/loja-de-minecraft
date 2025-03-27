import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    // Tenta conectar ao MongoDB
    await connectDB();
    
    // Verifica a versão do MongoDB
    const adminDb = mongoose.connection.db.admin();
    const serverInfo = await adminDb.serverInfo();
    
    return NextResponse.json({
      connected: true,
      version: serverInfo.version,
      message: 'Conexão com MongoDB estabelecida com sucesso!'
    });
  } catch (error: any) {
    console.error('Erro ao conectar ao MongoDB:', error);
    
    return NextResponse.json({
      connected: false,
      error: error.message || 'Erro desconhecido',
      message: 'Falha na conexão com MongoDB'
    }, { status: 500 });
  }
} 