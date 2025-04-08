import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';

// GET /api/auth/check - Verificar status de autenticação atual
export async function GET(request: NextRequest) {
  try {
    // Usar a função checkAuth para verificar a autenticação
    const authResult = await checkAuth(request);
    
    // Se autenticado, retornar dados do usuário
    if (authResult.isAuthenticated && authResult.user) {
      return NextResponse.json({
        authenticated: true,
        user: authResult.user
      });
    } 
    
    // Se não autenticado, retornar status falso (mas não erro)
    return NextResponse.json({
      authenticated: false,
      message: authResult.error || 'Não autenticado'
    });
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    
    // Retornar erro de servidor
    return NextResponse.json(
      { 
        authenticated: false,
        error: 'Erro ao verificar autenticação'
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