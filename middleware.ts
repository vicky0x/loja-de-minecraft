import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Segredo usado para verificar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

// Rotas que necessitam de autenticação
const authRoutes = [
  '/dashboard',
  '/admin',
];

// Rotas que necessitam de permissão de administrador
const adminRoutes = [
  '/admin',
];

// Função para obter informações do token JWT
function getTokenInfo(request: NextRequest) {
  try {
    console.log('---- MIDDLEWARE CHECK ----');
    console.log('URL solicitada:', request.nextUrl.pathname);
    
    // Listar todos os cookies disponíveis
    console.log('Cookies disponíveis:', request.cookies.getAll().map(c => c.name).join(', '));
    
    const token = request.cookies.get('auth_token')?.value;
    console.log('Token encontrado:', token ? 'Sim' : 'Não');
    
    if (!token) return null;
    
    // Decodificar token sem verificar assinatura (mais rápido para o middleware)
    // A verificação completa será feita nas API routes
    console.log('Decodificando token...');
    const decoded = jwt.decode(token) as { id: string; role?: string } | null;
    console.log('Token decodificado:', decoded ? JSON.stringify(decoded) : 'Falha na decodificação');
    
    if (!decoded || !decoded.id) return null;
    
    console.log('Informações do token - ID:', decoded.id, 'Role:', decoded.role || 'não especificada');
    return decoded;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  console.log('Middleware executando para:', pathname);
  
  const tokenInfo = getTokenInfo(request);
  const isAuthenticated = !!tokenInfo;
  const isAdmin = tokenInfo?.role === 'admin';
  
  console.log('Estado de autenticação:');
  console.log('- Autenticado:', isAuthenticated);
  console.log('- Admin:', isAdmin);
  
  // Verificar se há um parâmetro de consulta 'force' para forçar o acesso às páginas de login/registro
  const forceAccess = request.nextUrl.searchParams.get('force') === 'true';
  
  // Redirecionar usuários autenticados para evitar login/registro redundante
  // Apenas se não for forçado o acesso (para permitir logout/trocar conta)
  if (isAuthenticated && !forceAccess && (pathname === '/login' || pathname === '/register' || pathname === '/auth/login' || pathname === '/auth/register')) {
    console.log('Usuário autenticado tentando acessar página de login/registro');
    console.log('Redirecionamento desativado para permitir logout e troca de conta');
    // Comentado para permitir acesso às páginas de login mesmo autenticado
    // if (isAdmin) {
    //   console.log('Redirecionando admin para /admin');
    //   return NextResponse.redirect(new URL('/admin', request.url));
    // } else {
    //   console.log('Redirecionando usuário para /dashboard');
    //   return NextResponse.redirect(new URL('/dashboard', request.url));
    // }
  }
  
  // Proteger rotas do painel administrativo (apenas admins)
  if (pathname.startsWith('/admin')) {
    console.log('Tentativa de acesso à área administrativa');
    if (!isAuthenticated) {
      console.log('Acesso negado: usuário não autenticado');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    if (!isAdmin) {
      console.log('Acesso negado: usuário não é admin');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    console.log('Acesso permitido à área administrativa');
  }
  
  // Proteger rotas do dashboard de usuários (qualquer usuário autenticado)
  if (pathname.startsWith('/dashboard')) {
    console.log('Tentativa de acesso à área de dashboard');
    if (!isAuthenticated) {
      console.log('Acesso negado: usuário não autenticado');
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Se o usuário for admin e estiver na dashboard, redirecionar para área admin
    if (isAdmin && pathname === '/dashboard') {
      console.log('Admin acessando dashboard - redirecionando para área admin');
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    
    console.log('Acesso permitido à área de dashboard');
  }
  
  // Redirecionar /user para /dashboard (para compatibilidade)
  if (pathname === '/user' || pathname.startsWith('/user/')) {
    return NextResponse.redirect(new URL(pathname.replace('/user', '/dashboard'), request.url));
  }
  
  console.log('Middleware concluído, permitindo acesso');
  return NextResponse.next();
}

// Configurar quais rotas devem passar pelo middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/register',
    '/auth/login',
    '/auth/register',
    '/user/:path*',
  ],
}; 