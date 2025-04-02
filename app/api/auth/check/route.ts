import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET(request: NextRequest) {
  console.log('[API:AUTH:CHECK] Verificando autenticação');
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      console.log('[API:AUTH:CHECK] Token não encontrado');
      return NextResponse.json({ 
        isAuthenticated: false,
        authenticated: false 
      }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    
    try {
      const { payload } = await jwtVerify(token, secret);
      console.log('[API:AUTH:CHECK] Token válido, usuário autenticado');
      
      return NextResponse.json({
        isAuthenticated: true,
        authenticated: true,
        user: {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role
        },
      });
    } catch (jwtError) {
      console.error('[API:AUTH:CHECK] Erro ao verificar JWT:', jwtError);
      return NextResponse.json({ 
        isAuthenticated: false,
        authenticated: false,
        error: 'Token inválido'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('[API:AUTH:CHECK] Erro ao verificar autenticação:', error);
    return NextResponse.json({ 
      isAuthenticated: false, 
      authenticated: false,
      error: 'Erro ao verificar autenticação'
    }, { status: 401 });
  }
} 