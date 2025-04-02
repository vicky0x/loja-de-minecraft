import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { encode, decode } from 'next/dist/compiled/base64url';

// Rotas que requerem autenticação
const PROTECTED_ROUTES = ['/dashboard', '/admin'];

// Rotas de autenticação
const AUTH_ROUTES = ['/auth/login', '/auth/register', '/auth/forgot-password'];

// Segredo usado para assinar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

// Nome do cookie de autenticação
const AUTH_TOKEN_NAME = 'auth_token';
const LEGACY_TOKEN_NAME = 'fantasy_cheats_auth';

// Função para verificar JWT com jose (compatível com Edge Runtime)
async function verifyJWT(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Decodificar o token
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.id as string,
      role: payload.role as string,
      iat: payload.iat as number,
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('Erro ao verificar token JWT com jose:', error);
    return null;
  }
}

// Middleware que verifica autenticação
export async function middleware(req: NextRequest) {
  try {
    console.log('Middleware executando para:', req.nextUrl.pathname);
    console.log('---- MIDDLEWARE CHECK ----');
    console.log('URL solicitada:', req.nextUrl.pathname);
    
    // Log dos cookies disponíveis
    const cookieHeader = req.headers.get('cookie') || '';
    console.log('Cookies disponíveis:', cookieHeader.replace(/;/g, ', '));
    
    // 1. Verificar token em várias fontes
    let token = null;
    
    // Verificar no cookie auth_token
    token = req.cookies.get(AUTH_TOKEN_NAME)?.value;
    
    // Verificar no cookie legado
    if (!token) {
      token = req.cookies.get(LEGACY_TOKEN_NAME)?.value;
    }
    
    // Tentar extrair do header de cookie diretamente
    if (!token) {
      const authTokenMatch = cookieHeader.match(new RegExp(`${AUTH_TOKEN_NAME}=([^;]+)`));
      if (authTokenMatch && authTokenMatch[1]) {
        token = authTokenMatch[1];
      } else {
        const legacyTokenMatch = cookieHeader.match(new RegExp(`${LEGACY_TOKEN_NAME}=([^;]+)`));
        if (legacyTokenMatch && legacyTokenMatch[1]) {
          token = legacyTokenMatch[1];
        }
      }
    }
    
    console.log('Token encontrado:', token ? 'Sim' : 'Não');
    
    let isAuthenticated = false;
    let isAdmin = false;
    let decodedToken = null;
    
    if (token) {
      try {
        console.log('Decodificando token...');
        // Usar jose em vez de jsonwebtoken (para compatibilidade com Edge Runtime)
        decodedToken = await verifyJWT(token);
        
        if (decodedToken) {
          console.log('Token decodificado:', decodedToken);
          console.log('Informações do token - ID:', decodedToken.id, 'Role:', decodedToken.role);
          
          isAuthenticated = true;
          isAdmin = decodedToken.role === 'admin';
        }
      } catch (error) {
        console.error('Erro ao verificar token JWT:', error);
      }
    }
    
    console.log('Estado de autenticação:');
    console.log('- Autenticado:', isAuthenticated);
    console.log('- Admin:', isAdmin);
    
    // 2. Gerenciar acesso com base na rota e estado de autenticação
    
    // Se a rota for protegida e o usuário não estiver autenticado
    if (PROTECTED_ROUTES.some(route => req.nextUrl.pathname.startsWith(route)) && !isAuthenticated) {
      console.log('Tentativa de acesso a uma rota protegida sem autenticação');
      
      // Criar URL de redirecionamento para página de login
      const redirectUrl = new URL('/auth/login', req.url);
      redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
      
      console.log('Redirecionando para:', redirectUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }
    
    // Se tentar acessar a área de admin sem ser admin
    if (req.nextUrl.pathname.startsWith('/admin') && (!isAuthenticated || !isAdmin)) {
      console.log('Tentativa de acesso à área administrativa sem permissão adequada');
      
      if (!isAuthenticated) {
        const redirectUrl = new URL('/auth/login', req.url);
        redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
        console.log('Redirecionando para:', redirectUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      } else {
        console.log('Redirecionando para dashboard (usuário autenticado mas não é admin)');
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
    
    // Se estiver tentando acessar o dashboard
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      console.log('Tentativa de acesso à área de dashboard');
      if (isAuthenticated) {
        console.log('Acesso permitido à área de dashboard');
      }
    }
    
    // Se estiver autenticado e tentando acessar as páginas de login/registro
    if (AUTH_ROUTES.includes(req.nextUrl.pathname) && isAuthenticated) {
      console.log('Usuário autenticado tentando acessar página de login/registro');
      
      // Verificar se há um parâmetro de logout na URL
      const url = new URL(req.url);
      const hasLogoutParam = url.searchParams.has('logout');
      
      if (hasLogoutParam) {
        console.log('Parâmetro de logout detectado, permitindo acesso à página de login');
        return NextResponse.next();
      }
      
      // Redirecionar para o dashboard se já estiver autenticado
      console.log('Redirecionando para o dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
    
    console.log('Middleware concluído, permitindo acesso');
    return NextResponse.next();
  } catch (error) {
    console.error('Erro no middleware:', error);
    return NextResponse.next();
  }
}

// Configurar rotas para o middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/api/admin/:path*'
  ],
}; 