import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';

export async function GET(request: NextRequest) {
  console.log('[API:AUTH:CHECK] Verificando autenticação');
  
  // Definir um cabeçalho para prevenir cache
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  };
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    // Verificar se temos token nos headers também (para clientes que não usam cookies)
    const authHeader = request.headers.get('Authorization');
    const headerToken = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    // Usar token do cookie ou do header
    const finalToken = token || headerToken;

    if (!finalToken) {
      console.log('[API:AUTH:CHECK] Token não encontrado');
      return NextResponse.json({ 
        isAuthenticated: false,
        authenticated: false 
      }, { status: 401, headers });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
    
    try {
      // Verificar JWT
      const { payload } = await jwtVerify(finalToken, secret);
      console.log('[API:AUTH:CHECK] Token válido, usuário autenticado');
      
      // Verificar se o usuário existe no banco de dados
      await connectDB();
      const userId = payload.id || payload.userId;
      
      if (!userId) {
        console.log('[API:AUTH:CHECK] ID do usuário não encontrado no token');
        return NextResponse.json({ 
          isAuthenticated: false,
          authenticated: false,
          error: 'ID do usuário não encontrado no token'
        }, { status: 401, headers });
      }
      
      try {
        const user = await User.findById(userId).select('_id username email role');
        
        if (!user) {
          console.log('[API:AUTH:CHECK] Usuário não encontrado no banco de dados');
          return NextResponse.json({ 
            isAuthenticated: false,
            authenticated: false,
            error: 'Usuário não encontrado'
          }, { status: 401, headers });
        }
        
        // Usuário encontrado, retornar dados completos
        return NextResponse.json({
          isAuthenticated: true,
          authenticated: true,
          user: {
            id: user._id.toString(),
            username: user.username,
            email: user.email,
            role: user.role
          },
          token: finalToken // Devolver o token para renovação no cliente
        }, { headers });
      } catch (dbError) {
        console.error('[API:AUTH:CHECK] Erro ao consultar banco de dados:', dbError);
        
        // Em caso de erro de banco, confiar no token para não bloquear o usuário
        return NextResponse.json({
          isAuthenticated: true,
          authenticated: true,
          user: {
            id: payload.id || payload.userId,
            username: payload.username,
            email: payload.email,
            role: payload.role
          },
          token: finalToken,
          warning: 'Dados obtidos apenas do token devido a erro de banco'
        }, { headers });
      }
    } catch (jwtError) {
      console.error('[API:AUTH:CHECK] Erro ao verificar JWT:', jwtError);
      return NextResponse.json({ 
        isAuthenticated: false,
        authenticated: false,
        error: 'Token inválido'
      }, { status: 401, headers });
    }
  } catch (error) {
    console.error('[API:AUTH:CHECK] Erro ao verificar autenticação:', error);
    return NextResponse.json({ 
      isAuthenticated: false, 
      authenticated: false,
      error: 'Erro ao verificar autenticação'
    }, { status: 401, headers });
  }
} 