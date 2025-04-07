import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import bcrypt from 'bcrypt';
import { createToken } from '@/app/lib/auth';
import { v4 as uuidv4 } from 'uuid';

// Variáveis para cookies
const AUTH_TOKEN_NAME = 'auth_token';
const AUTH_EXPIRY = 60 * 60 * 24 * 7; // 7 dias em segundos
const CSRF_TOKEN_NAME = 'csrf_token';

// Cache para limitar tentativas de login (rate limiting básico)
const loginAttempts = new Map<string, { count: number, timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutos em milissegundos

// Lista negra de tokens revogados
const revokedTokens = new Map<string, number>();

// Validar formato de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para implementar rate limiting básico
function checkRateLimit(ip: string): { allowed: boolean, message?: string } {
  const now = Date.now();
  const userAttempts = loginAttempts.get(ip);
  
  // Limpar entradas antigas do cache a cada 1000 solicitações
  if (loginAttempts.size > 1000) {
    const keysToDelete: string[] = [];
    loginAttempts.forEach((data, key) => {
      if (now - data.timestamp > LOCKOUT_TIME) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => loginAttempts.delete(key));
  }

  // Se o usuário não tem tentativas anteriores, permitir
  if (!userAttempts) {
    loginAttempts.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }

  // Se o bloqueio já expirou, resetar contador
  if (now - userAttempts.timestamp > LOCKOUT_TIME) {
    loginAttempts.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }

  // Se excedeu o limite de tentativas
  if (userAttempts.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_TIME - (now - userAttempts.timestamp)) / 60000);
    return { 
      allowed: false, 
      message: `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.` 
    };
  }

  // Incrementar contagem de tentativas
  loginAttempts.set(ip, { 
    count: userAttempts.count + 1, 
    timestamp: userAttempts.timestamp 
  });
  return { allowed: true };
}

// Função de limpeza periódica para tokens revogados (executar a cada hora em produção)
function cleanupRevokedTokens() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  revokedTokens.forEach((expiry, key) => {
    if (now > expiry) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => revokedTokens.delete(key));
}

// Executar limpeza a cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRevokedTokens, 60 * 60 * 1000);
}

// Função de login
export async function POST(request: NextRequest) {
  try {
    // Obter IP para rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    // Verificar rate limiting
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: rateLimitCheck.message },
        { status: 429 }
      );
    }
    
    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { email, password } = body;
    
    // Validações básicas
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, message: 'Formato de e-mail inválido' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    try {
      await connectDB();
    } catch (dbError) {
      return NextResponse.json(
        { success: false, message: 'Erro ao acessar o banco de dados' },
        { status: 500 }
      );
    }
    
    // Buscar usuário pelo email
    const user = await User.findOne({ email }).select('+password');
    
    // Mesma mensagem genérica para usuário não encontrado ou senha incorreta
    // para não dar dicas a potenciais atacantes
    const invalidMessage = 'E-mail ou senha inválidos';
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: invalidMessage },
        { status: 401 }
      );
    }
    
    // Verificar senha
    let isValidPassword = false;
    try {
      // Usar o método comparePassword do modelo
      if (typeof user.comparePassword === 'function') {
        isValidPassword = await user.comparePassword(password);
      } else {
        // Fallback para comparação direta com bcrypt
        isValidPassword = await bcrypt.compare(password, user.password);
      }
    } catch (passwordError) {
      isValidPassword = false;
    }
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: invalidMessage },
        { status: 401 }
      );
    }
    
    // Converter o ID do usuário para string
    const userIdStr = user._id.toString();
    
    try {
      // Gerar token JWT
      const token = await createToken(userIdStr);
      
      if (!token) {
        throw new Error('Falha ao gerar token de autenticação');
      }
      
      // Gerar token CSRF
      const csrfToken = uuidv4();
      
      // Dados do usuário para retornar (sem dados sensíveis)
      const userData = {
        id: userIdStr,
        _id: userIdStr,
        username: user.username,
        email: user.email,
        name: user.name || '',
        role: user.role,
        profileImage: user.profileImage || '',
        memberNumber: user.memberNumber,
        createdAt: user.createdAt
      };
      
      // Configurar opções de cookies baseadas no ambiente
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = {
        secure: isProduction, // Apenas HTTPS em produção
        httpOnly: true,       // Não acessível por JavaScript
        path: '/',            // Válido em todo o site
        sameSite: 'lax' as const, // Proteção contra CSRF
        maxAge: AUTH_EXPIRY   // 7 dias
      };
      
      // Criar resposta
      const response = NextResponse.json(
        { 
          success: true, 
          user: userData,
          token: token,
          csrfToken: csrfToken // Enviar CSRF token para o cliente
        },
        { status: 200 }
      );
      
      // Configurar cookies de autenticação (httpOnly para segurança)
      response.cookies.set(AUTH_TOKEN_NAME, token, cookieOptions);
      
      // Cookie de CSRF token (não httpOnly, pois precisa ser acessível pelo JS)
      response.cookies.set(CSRF_TOKEN_NAME, csrfToken, {
        ...cookieOptions,
        httpOnly: false // Precisa ser acessível pelo JavaScript
      });
      
      // Cookies não-httpOnly para o cliente (interfaces visuais)
      const clientCookieOptions = {
        secure: isProduction,
        httpOnly: false,
        path: '/',
        sameSite: 'lax' as const,
        maxAge: AUTH_EXPIRY
      };
      
      response.cookies.set('isAuthenticated', 'true', clientCookieOptions);
      response.cookies.set('userId', userIdStr, clientCookieOptions);
      response.cookies.set('userRole', user.role, clientCookieOptions);
      
      // Se chegou aqui, resetar contador de tentativas
      loginAttempts.delete(ip);
      
      return response;
    } catch (tokenError) {
      return NextResponse.json(
        { success: false, message: 'Erro no processo de autenticação' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 