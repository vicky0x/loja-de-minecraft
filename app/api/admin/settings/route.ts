import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { checkAuth } from '@/lib/auth';

// Listar configurações
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const { user, error } = await checkAuth(req);

    if (error || !user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectDB();

    // Buscar as configurações do sistema
    const settings = await Setting.findOne({}) || {};

    // Retornar apenas os campos necessários
    return NextResponse.json({
      mercadoPagoToken: settings.mercadoPagoToken || null,
    });
  } catch (error) {
    console.error('Erro ao buscar configurações:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar configurações' },
      { status: 500 }
    );
  }
}

// Atualizar configurações
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const { user, error } = await checkAuth(req);

    if (error || !user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    await connectDB();

    const data = await req.json();
    const updateData: any = {};

    // Atualizar apenas os campos fornecidos
    if (data.mercadoPagoToken !== undefined) {
      updateData.mercadoPagoToken = data.mercadoPagoToken;
    }

    // Se não houver dados para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'Nenhum dado fornecido para atualização' },
        { status: 400 }
      );
    }

    // Atualizar configurações (upsert: true - criar se não existir)
    await Setting.findOneAndUpdate(
      {}, // filtro vazio para encontrar o primeiro documento
      { $set: updateData },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      message: 'Configurações atualizadas com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar configurações' },
      { status: 500 }
    );
  }
} 