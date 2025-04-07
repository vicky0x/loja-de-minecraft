import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';

// Endpoint para verificar se o usuário está autenticado
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação do usuário
    const { isAuthenticated, user, error } = await checkAuth(request);
    
    // Se não estiver autenticado, retornar erro 401
    if (!isAuthenticated || !user) {
      return NextResponse.json(
        { 
          authenticated: false, 
          message: error || 'Não autenticado',
          code: error ? error : 'auth_required' 
        },
        { status: 401 }
      );
    }
    
    // Retornar sucesso com dados do usuário
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        name: user.name || '',
        role: user.role,
        profileImage: user.profileImage || '',
        memberNumber: user.memberNumber || 0,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    
    // Retornar erro 500 em caso de falha no servidor
    return NextResponse.json(
      { 
        authenticated: false, 
        message: 'Erro interno ao verificar autenticação'
      },
      { status: 500 }
    );
  }
}

// HEAD para verificações leves sem retornar o corpo
export async function HEAD(request: NextRequest) {
  try {
    const { isAuthenticated } = await checkAuth(request);
    
    if (!isAuthenticated) {
      return new NextResponse(null, { status: 401 });
    }
    
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
} 