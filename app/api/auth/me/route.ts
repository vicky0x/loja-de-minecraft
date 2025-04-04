import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import connectDB from '@/app/lib/db/mongodb';
import { cookies } from 'next/headers';

// Cache em memória para reduzir consultas frequentes (5 minutos de validade)
const userCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Função para recuperar informações do usuário atual
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json(
        { message: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    const user = authResult.user;
    const userId = user._id.toString();
    
    // Verificar cache primeiro
    const now = Date.now();
    const cachedUser = userCache.get(userId);
    if (cachedUser && (now - cachedUser.timestamp) < CACHE_TTL) {
      // Retornar dados do cache se existirem e não estiverem expirados
      return NextResponse.json({ user: cachedUser.data }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }
    
    // Se não estiver em cache, buscar do banco de dados
    await connectDB();
    const User = (await import('@/app/lib/models/user')).default;
    const userFromDB = await User.findById(userId);
    
    if (!userFromDB) {
      return NextResponse.json(
        { message: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    // Dados do usuário para retornar (removendo dados sensíveis)
    const userData = {
      id: userId,
      username: user.username,
      email: user.email,
      name: user.name || '',
      role: user.role,
      profileImage: user.profileImage || '',
      // Garantir que memberNumber e createdAt sejam enviados corretamente
      memberNumber: userFromDB.memberNumber,
      createdAt: userFromDB.createdAt.toISOString(),
      cpf: userFromDB.cpf || '',
      address: userFromDB.address || '',
      phone: userFromDB.phone || '',
    };
    
    // Atualizar cache
    userCache.set(userId, { data: userData, timestamp: now });
    
    // Definir cabeçalhos para evitar cache
    return NextResponse.json({ user: userData }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return NextResponse.json(
      { message: 'Erro ao obter dados do usuário' },
      { status: 500 }
    );
  }
}

// Método para logout (remover a sessão)
export async function DELETE() {
  try {
    // Limpar todos os cookies relevantes
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    cookieStore.delete('isAuthenticated');
    cookieStore.delete('userId');
    cookieStore.delete('username');
    cookieStore.delete('userEmail');
    cookieStore.delete('userRole');
    
    return NextResponse.json({ success: true, message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar logout:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao processar logout' },
      { status: 500 }
    );
  }
} 