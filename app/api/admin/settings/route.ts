import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// Definir o esquema se não existir
let Settings;
try {
  Settings = mongoose.model('Settings');
} catch (e) {
  const SettingsSchema = new mongoose.Schema({
    mercadoPagoToken: { type: String, default: '' },
    pixKey: { type: String, default: '' },
    maintenanceMode: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
  });
  
  Settings = mongoose.model('Settings', SettingsSchema);
}

// Função para obter configurações ou criar um documento padrão
async function getOrCreateSettings() {
  try {
    await connectDB();
    
    // Procurar pelas configurações existentes
    let settings = await Settings.findOne({});
    
    // Se não existir, criar um documento padrão
    if (!settings) {
      settings = new Settings({
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await settings.save();
    }
    
    return settings;
  } catch (error) {
    console.error('Erro ao buscar ou criar configurações:', error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    
    if (!authResult.isAuthenticated || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter as configurações
    const settings = await getOrCreateSettings();
    
    // Mascarar tokens sensíveis para segurança
    const mercadoPagoToken = settings.mercadoPagoToken
      ? maskToken(settings.mercadoPagoToken)
      : '';
      
    const pixKey = settings.pixKey
      ? maskToken(settings.pixKey)
      : '';
    
    return NextResponse.json({
      mercadoPagoToken,
      pixKey,
      maintenanceMode: settings.maintenanceMode || false,
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    
    if (!authResult.isAuthenticated || authResult.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Processar o corpo da requisição
    const data = await req.json();
    
    // Validar os dados (implementação básica)
    if (!data) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }
    
    // Obter as configurações atuais
    const settings = await getOrCreateSettings();
    
    // Atualizar apenas os campos fornecidos
    if (data.mercadoPagoToken !== undefined) {
      settings.mercadoPagoToken = data.mercadoPagoToken;
    }
    
    if (data.pixKey !== undefined) {
      settings.pixKey = data.pixKey;
    }
    
    if (data.maintenanceMode !== undefined) {
      settings.maintenanceMode = !!data.maintenanceMode;
    }
    
    // Atualizar a data de modificação
    settings.updatedAt = new Date();
    
    // Salvar as alterações
    await settings.save();
    
    return NextResponse.json({
      message: 'Configurações atualizadas com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
}

// Função auxiliar para mascarar tokens sensíveis
function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 8) return '•'.repeat(token.length);
  
  const visiblePart = 4;
  const start = token.substring(0, visiblePart);
  const end = token.substring(token.length - visiblePart);
  const middle = '•'.repeat(Math.min(token.length - visiblePart * 2, 8));
  
  return `${start}${middle}${end}`;
} 