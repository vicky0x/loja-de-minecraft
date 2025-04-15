import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Obter o token da query
    const token = request.nextUrl.searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { valid: false, message: 'Token não fornecido' },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Importar o modelo de usuário
    const User = (await import('@/app/lib/models/user')).default;
    
    // Buscar o usuário pelo token e verificar se não expirou
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() } // Token ainda válido
    });
    
    if (!user) {
      return NextResponse.json({
        valid: false,
        message: 'Token inválido ou expirado'
      });
    }
    
    return NextResponse.json({
      valid: true,
      message: 'Token válido'
    });
    
  } catch (error) {
    console.error('Erro ao verificar token de redefinição:', error);
    return NextResponse.json(
      { valid: false, message: 'Erro ao verificar token' },
      { status: 500 }
    );
  }
} 