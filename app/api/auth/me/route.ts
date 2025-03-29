import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import connectDB from '@/app/lib/db/mongodb';

// Função para recuperar informações do usuário atual
export async function GET(request: NextRequest) {
  try {
    console.log('---- API /auth/me REQUEST ----');
    
    // Log dos cookies disponíveis
    const cookieHeader = request.headers.get('cookie') || '';
    console.log('Cookies na requisição:', cookieHeader.replace(/;/g, ', '));
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Verificar autenticação
    const authResult = await checkAuth(request);
    console.log('Resultado da verificação de autenticação:', 
      authResult.isAuthenticated ? 'Autenticado' : 'Não autenticado',
      authResult.user ? `(${authResult.user.username})` : '');
    
    if (!authResult.isAuthenticated || !authResult.user) {
      console.log('Tentativa de acesso /api/auth/me sem autenticação');
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    
    // Dados do usuário para retornar (removendo dados sensíveis)
    const userData = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      name: user.name || '',
      role: user.role,
      profileImage: user.profileImage || '',
      memberNumber: user.memberNumber,
      cpf: user.cpf || '',
      address: user.address || '',
      phone: user.phone || '',
      createdAt: user.createdAt
    };
    
    console.log('Enviando dados do usuário:', userData);
    
    // Definir cabeçalhos para evitar cache
    const response = NextResponse.json({ user: userData }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
    return response;
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao obter dados do usuário', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 