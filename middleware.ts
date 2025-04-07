import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

// Middleware que adiciona cabeçalhos de segurança para todas as solicitações
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
  
  // Adicionar cabeçalhos de segurança para todas as requisições
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Configuração avançada de Content-Security-Policy para todos os ambientes
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'", 
    "style-src 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://*.mercadopago.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];
  
  // Em desenvolvimento, permitir unsafe-inline e unsafe-eval para facilitar o debug
  if (process.env.NODE_ENV === 'development') {
    cspDirectives[1] += " 'unsafe-inline' 'unsafe-eval'"; // script-src
    cspDirectives[2] += " 'unsafe-inline'"; // style-src
  }
  
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '));
  
  // Configuração de CORS
  if (request.headers.get('Origin')) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = [
      'http://localhost:3000',
      'https://fantasystore.com.br',
      process.env.NEXT_PUBLIC_API_URL || ''
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      
      // Responder diretamente para OPTIONS (preflight requests)
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, { 
          status: 204,
          headers: response.headers
        });
      }
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