import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Função compartilhada para logout
async function logoutHandler() {
  try {
    // Criar resposta que removerá o cookie
    const response = NextResponse.json(
      { success: true, message: 'Logout realizado com sucesso' },
      { status: 200 }
    );

    // Remover todos os cookies de autenticação
    response.cookies.delete('auth_token');
    response.cookies.delete('isAuthenticated');
    response.cookies.delete('userId');
    response.cookies.delete('username');
    response.cookies.delete('userEmail');
    response.cookies.delete('userRole');
    response.cookies.delete('user_id');
    response.cookies.delete('user_role');
    response.cookies.delete('session_id');
    response.cookies.delete('refresh_token');
    
    // Limpar também com o cookieStore para garantir
    const cookieStore = cookies();
    await cookieStore.delete('auth_token');
    await cookieStore.delete('isAuthenticated');
    await cookieStore.delete('userId');
    await cookieStore.delete('username');
    await cookieStore.delete('userEmail');
    await cookieStore.delete('userRole');
    await cookieStore.delete('user_id');
    await cookieStore.delete('user_role');
    await cookieStore.delete('session_id');
    await cookieStore.delete('refresh_token');
    
    // Definir cabeçalhos para evitar cache e permitir CORS
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');

    return response;
  } catch (error) {
    console.error('Erro ao realizar logout:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao realizar logout' },
      { status: 500 }
    );
  }
}

// Método POST para logout
export async function POST() {
  return logoutHandler();
}

// Método DELETE para logout (alternativo para alguns clientes)
export async function DELETE() {
  return logoutHandler();
}

// Método OPTIONS para suportar CORS preflight
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}