import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de cookies de autenticação para limpar em caso de logout forçado
const AUTH_COOKIES = [
  'auth_token', 'legacy_auth_token', 'isAuthenticated', 'userId', 
  'username', 'userEmail', 'userRole', 'csrf_token',
  'next-auth.session-token', 'next-auth.csrf-token', 'next-auth.callback-url'
];

// Cache para limitar requisições (simulação de rate limiting)
const loginAttempts = new Map<string, { count: number, timestamp: number }>();
const MAX_LOGIN_ATTEMPTS = 5; // Máximo de tentativas em um período
const RATE_LIMIT_WINDOW = 60 * 1000; // Janela de 1 minuto em ms

// Função para obter IP do cliente
function getClientIp(request: NextRequest): string {
  // Tentar vários headers comuns para obter o IP
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0] || '';
  const realIp = request.headers.get('x-real-ip');
  
  // Usar um dos valores encontrados ou default
  return forwardedFor || realIp || '127.0.0.1';
}

// Middleware que processa solicitações (CSP completamente removido)
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Verificar se é uma tentativa de login
  if (request.nextUrl.pathname === '/api/auth/login' && request.method === 'POST') {
    // Obter IP do cliente
    const ip = getClientIp(request);
    
    // Verificar tentativas anteriores
    const now = Date.now();
    const previousAttempts = loginAttempts.get(ip);
    
    // Limpar entradas expiradas periodicamente
    if (Math.random() < 0.1) { // 10% de chance a cada requisição para não sobrecarregar
      for (const [key, value] of loginAttempts.entries()) {
        if (now - value.timestamp > RATE_LIMIT_WINDOW) {
          loginAttempts.delete(key);
        }
      }
    }
    
    if (previousAttempts && now - previousAttempts.timestamp < RATE_LIMIT_WINDOW) {
      // Ainda estamos dentro da janela de tempo
      if (previousAttempts.count >= MAX_LOGIN_ATTEMPTS) {
        // Limite excedido
        return new NextResponse(
          JSON.stringify({ 
            success: false, 
            message: 'Muitas tentativas de login. Tente novamente mais tarde.' 
          }),
          { 
            status: 429, 
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60'
            }
          }
        );
      }
      
      // Incrementar contador
      loginAttempts.set(ip, { 
        count: previousAttempts.count + 1, 
        timestamp: previousAttempts.timestamp 
      });
    } else {
      // Nova janela de tempo ou primeira tentativa
      loginAttempts.set(ip, { count: 1, timestamp: now });
    }
  }
  
  // Tratamento especial para páginas de autenticação (login/logout)
  if (request.nextUrl.pathname === '/auth/login') {
    // Verificar se há um logout em andamento (pelo query param)
    if (request.nextUrl.searchParams.has('t') || 
        request.nextUrl.searchParams.has('logout') || 
        request.nextUrl.searchParams.has('force') ||
        request.nextUrl.searchParams.has('emergency')) {
      
      console.log('Detectado processo de logout em andamento. Configurando headers anti-cache...');
      
      // Impedir cache para garantir estado limpo após logout
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      
      // Se for um logout forçado/emergencial, limpar cookies adicionais
      if (request.nextUrl.searchParams.has('force') || request.nextUrl.searchParams.has('emergency')) {
        console.log('Detectado logout emergencial. Limpando cookies no middleware...');
        
        // Limpar cookies de autenticação nas headers da resposta
        AUTH_COOKIES.forEach(cookieName => {
          response.headers.append('Set-Cookie', 
            `${cookieName}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`);
        });
      }
    }
  }
  
  // Configuração de CORS
  if (request.headers.get('Origin')) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = [
      'http://localhost:3000',
      'https://fantasystore.com.br',
      'https://www.fantasystore.com.br', 
      process.env.NEXT_PUBLIC_API_URL || ''
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.endsWith(allowed.replace(/^https?:\/\//, '')))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Max-Age', '7200');
      
      // Responder diretamente para OPTIONS (preflight requests)
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { 
          status: 204,
          headers: response.headers
        });
      }
    }
  }
  
  // Tratamento especial para rota de logout
  if (request.nextUrl.pathname === '/api/auth/logout') {
    // Aplicar CORS para qualquer origem em requisições de logout
    const origin = request.headers.get('Origin') || '*';
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Responder imediatamente para OPTIONS em logout
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: response.headers
      });
    }
  }
  
  return response;
}

// Configurar matcher para aplicar em todas as rotas exceto alguns caminhos estáticos
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.gif$).*)',
  ],
}; 