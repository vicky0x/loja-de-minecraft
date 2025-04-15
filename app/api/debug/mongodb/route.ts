import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/app/lib/db/mongodb';

/**
 * Rota para diagnóstico da conexão com o MongoDB
 * Esta rota é SOMENTE para desenvolvimento e testes, não deve ser usada em produção
 */
export async function GET(request: NextRequest) {
  // Verificar se estamos em ambiente de produção
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Esta rota de diagnóstico não está disponível em produção' },
      { status: 403 }
    );
  }

  // Informações para diagnóstico
  const diagnosticInfo: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    mongooseVersion: mongoose.version,
    mongoUri: process.env.MONGODB_URI 
      ? `${process.env.MONGODB_URI.split('@')[0].split('//')[0]}//***:***@${process.env.MONGODB_URI.split('@')[1]}` 
      : 'Não definido',
    connection: {
      status: 'Not tested yet',
      readyState: null,
      error: null
    },
    serverInfo: null,
    collections: [],
    pingSuccess: false,
    pingTime: null
  };

  try {
    const startTime = Date.now();
    
    // Tentar conectar ao MongoDB
    await connectDB();
    
    const endTime = Date.now();
    diagnosticInfo.connection.pingTime = endTime - startTime;
    
    // Verificar estado da conexão
    diagnosticInfo.connection.readyState = mongoose.connection.readyState;
    diagnosticInfo.connection.status = getConnectionStatusText(mongoose.connection.readyState);
    
    // Tentar obter informações do servidor
    try {
      if (mongoose.connection.readyState === 1) {
        // Conexão está estabelecida
        diagnosticInfo.serverInfo = {
          version: await mongoose.connection.db.admin().serverInfo(),
          stats: await mongoose.connection.db.stats()
        };
        
        // Listar coleções
        const collections = await mongoose.connection.db.listCollections().toArray();
        diagnosticInfo.collections = collections.map(c => c.name);
        
        // Fazer ping no servidor para testar latência
        const pingStart = Date.now();
        await mongoose.connection.db.admin().ping();
        diagnosticInfo.pingSuccess = true;
        diagnosticInfo.pingTime = Date.now() - pingStart;
      }
    } catch (serverInfoError: any) {
      diagnosticInfo.serverError = {
        message: serverInfoError.message,
        code: serverInfoError.code
      };
    }
    
    return NextResponse.json(diagnosticInfo);
  } catch (error: any) {
    // Capturar detalhes do erro de conexão
    diagnosticInfo.connection.status = 'Error';
    diagnosticInfo.connection.error = {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : null
    };
    
    return NextResponse.json(diagnosticInfo, { status: 500 });
  }
}

/**
 * Converter o código de estado da conexão para texto
 */
function getConnectionStatusText(readyState: number): string {
  switch (readyState) {
    case 0: return 'Desconectado';
    case 1: return 'Conectado';
    case 2: return 'Conectando';
    case 3: return 'Desconectando';
    case 99: return 'Não inicializado';
    default: return 'Estado desconhecido';
  }
} 