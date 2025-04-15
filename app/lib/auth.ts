import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { jwtVerify } from 'jose';
import User from '@/app/lib/models/user';
import connectDB from '@/app/lib/db/mongodb';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import redisService, { isTokenRevoked as isTokenRevokedRedis, revokeToken as revokeTokenRedis } from './redis';

// Segredo usado para assinar os tokens JWT
// Obter do ambiente, sem fallback inseguro
const JWT_SECRET = process.env.JWT_SECRET;

// Verificar se temos JWT_SECRET
if (!JWT_SECRET) {
  console.error('ERRO CRÍTICO: JWT_SECRET não está definido nas variáveis de ambiente!');
}

// Mapa para armazenar tokens revogados em memória (em produção, usar Redis)
const revokedTokens = new Map<string, number>();

// Interface para os dados do usuário autenticado
export interface AuthUser {
  _id: string;
  id?: string; // Adicionando campo id para compatibilidade
  username: string;
  email: string;
  name?: string;
  role: 'admin' | 'user' | 'developer';
  profileImage?: string;
  memberNumber?: number;
  createdAt?: Date;
  cpf?: string;
  address?: string;
  phone?: string;
}

// Resultado da verificação de autenticação
export interface AuthResult {
  isAuthenticated: boolean;
  user: AuthUser | null;
  error?: string;
}

// Nome do cookie de autenticação
const AUTH_TOKEN_NAME = 'auth_token';
const LEGACY_TOKEN_NAME = 'fantasystore_auth';
const AUTH_EXPIRY = 60 * 60 * 24 * 7; // 7 dias em segundos

// Função para verificar se um token está na lista de revogados
// Agora usa Redis se disponível, com fallback para Map em memória
async function isTokenRevoked(token: string): Promise<boolean> {
  // Em produção, usar Redis
  if (process.env.NODE_ENV === 'production') {
    return isTokenRevokedRedis(token);
  }
  
  // Em desenvolvimento, usar Map em memória como fallback
  const tokenId = token.substring(0, 10);
  return revokedTokens.has(tokenId);
}

// Função para adicionar um token à lista de revogados
// Agora usa Redis se disponível, com fallback para Map em memória
export async function revokeToken(token: string, expiryInSeconds: number = AUTH_EXPIRY): Promise<void> {
  // Em produção, usar Redis
  if (process.env.NODE_ENV === 'production') {
    await revokeTokenRedis(token, expiryInSeconds);
    return;
  }
  
  // Em desenvolvimento, usar Map em memória como fallback
  const tokenId = token.substring(0, 10);
  const expiryTime = Date.now() + (expiryInSeconds * 1000);
  revokedTokens.set(tokenId, expiryTime);
  
  // Limpar tokens expirados se o map ficar muito grande
  if (revokedTokens.size > 10000) {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    revokedTokens.forEach((expiry, key) => {
      if (now > expiry) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => revokedTokens.delete(key));
  }
}

/**
 * Verifica a autenticação do usuário a partir de uma solicitação
 * @param request Objeto de requisição Next.js
 * @returns Promise com os dados do usuário ou null se não autenticado
 */
export const checkAuth = async (req: NextRequest): Promise<AuthResult> => {
  try {
    // Obter token do cookie
    const cookies = req.cookies;
    let authToken = cookies.get(AUTH_TOKEN_NAME)?.value;
    
    // Tentar obter de outras fontes se não encontrar no cookie principal
    if (!authToken) {
      authToken = cookies.get(LEGACY_TOKEN_NAME)?.value;
      
      if (!authToken) {
        // Verificar nos headers
        const authHeader = req.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          authToken = authHeader.substring(7);
        }
        
        // Verificar em cookies extraídos manualmente
        if (!authToken) {
          const cookieHeader = req.headers.get('cookie') || '';
          const authTokenMatch = cookieHeader.match(new RegExp(`${AUTH_TOKEN_NAME}=([^;]+)`));
          if (authTokenMatch && authTokenMatch[1]) {
            authToken = authTokenMatch[1];
          } else {
            const legacyTokenMatch = cookieHeader.match(new RegExp(`${LEGACY_TOKEN_NAME}=([^;]+)`));
            if (legacyTokenMatch && legacyTokenMatch[1]) {
              authToken = legacyTokenMatch[1];
            }
          }
        }
      }
    }
    
    if (!authToken) {
      return { isAuthenticated: false, user: null, error: 'Token não encontrado' };
    }
    
    // Verificar se o token está na lista de revogados
    if (await isTokenRevoked(authToken)) {
      return { isAuthenticated: false, user: null, error: 'Token revogado' };
    }
    
    if (!JWT_SECRET) {
      console.error('Erro de autenticação: JWT_SECRET não definido');
      return { isAuthenticated: false, user: null, error: 'Configuração de segurança incompleta' };
    }
    
    try {
      // Verificar token usando jsonwebtoken
      let decoded;
      let userId;
      
      try {
        // Primeiro, tentar verificar com jsonwebtoken
        decoded = jwt.verify(authToken, JWT_SECRET, {
          algorithms: ['HS256'], // Especificar algoritmos permitidos
          maxAge: AUTH_EXPIRY + '7d' // Confirmar que não está expirado
        }) as jwt.JwtPayload;
        
        userId = decoded.id || decoded.userId;
      } catch (jwtError) {
        // Verificar o tipo específico de erro
        if (jwtError instanceof jwt.TokenExpiredError) {
          return { isAuthenticated: false, user: null, error: 'Token expirado' };
        }
        
        if (jwtError instanceof jwt.JsonWebTokenError) {
          console.error('Erro de validação JWT:', jwtError.message);
          return { isAuthenticated: false, user: null, error: 'Token inválido' };
        }
        
        // Tentar verificar usando jose como fallback
        try {
          const joseResult = await verifyToken(authToken);
          if (joseResult) {
            decoded = joseResult;
            userId = joseResult.id;
          } else {
            throw new Error('Falha na verificação do token com jose');
          }
        } catch (joseError) {
          // Se estamos em desenvolvimento e temos um token, tentar decodificar sem verificar
          if (process.env.NODE_ENV === 'development') {
            try {
              const decodedWithoutVerify = jwt.decode(authToken) as jwt.JwtPayload;
              if (decodedWithoutVerify && (decodedWithoutVerify.id || decodedWithoutVerify.userId)) {
                decoded = decodedWithoutVerify;
                userId = decodedWithoutVerify.id || decodedWithoutVerify.userId;
                console.warn('Aviso: Token verificado em modo de desenvolvimento sem validar assinatura');
              } else {
                throw new Error('Token inválido mesmo após decodificação sem verificação');
              }
            } catch (decodeError) {
              throw jwtError; // Propagar o erro original
            }
          } else {
            throw jwtError; // Propagar o erro original em produção
          }
        }
      }
      
      if (!userId) {
        return { isAuthenticated: false, user: null, error: 'Token não contém identificador de usuário' };
      }
      
      // Garantir que o userId seja uma string válida
      let userIdStr: string;
      try {
        userIdStr = userId.toString();
      } catch (idError) {
        return { isAuthenticated: false, user: null, error: 'ID de usuário inválido' };
      }
      
      // Conectar ao banco de dados e buscar usuário
      await connectDB();
      
      const user = await User.findById(userIdStr).select('-password');
      
      if (!user) {
        return { isAuthenticated: false, user: null, error: 'Usuário não encontrado' };
      }
      
      // Converter o usuário para um formato padronizado
      const authUser: AuthUser = {
        _id: user._id.toString(),
        id: user._id.toString(), // Adicionar 'id' para compatibilidade
        username: user.username,
        email: user.email,
        name: user.name || '',
        role: user.role,
        profileImage: user.profileImage || '',
        memberNumber: user.memberNumber,
        createdAt: user.createdAt,
        cpf: user.cpf || '',
        address: user.address || '',
        phone: user.phone || ''
      };
      
      return { isAuthenticated: true, user: authUser };
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { isAuthenticated: false, user: null, error: 'Erro na validação do token' };
    }
  } catch (error) {
    console.error('Erro geral na verificação de autenticação:', error);
    return { isAuthenticated: false, user: null, error: 'Erro ao processar autenticação' };
  }
};

/**
 * Cria um token JWT para o usuário
 * @param userId ID do usuário
 * @returns Promise com o token gerado
 */
export async function createToken(userId: string) {
  try {
    if (!JWT_SECRET) {
      throw new Error('JWT_SECRET não está definido no ambiente');
    }
    
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Garantir que o userId seja uma string válida
    const userIdStr = userId.toString();
    
    // Buscar informações do usuário para incluir no token
    await connectDB();
    const user = await User.findById(userIdStr);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Gerar JTI único para este token (para revogação)
    const tokenId = uuidv4();
    
    // Criar payload com todas as informações necessárias
    const payload = { 
      id: userIdStr,
      userId: userIdStr, // Adicionar userId também para compatibilidade
      username: user.username,
      email: user.email,
      role: user.role,
      jti: tokenId // Adicionar identificador único para o token
    };
    
    // Tentar criar token com jose (compatível com Edge Runtime)
    try {
      // Criar token JWT com jose
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Validade de 7 dias
        .setJti(tokenId) // Adicionar id único ao token para revogação
        .sign(secret);
      
      return token;
    } catch (joseError) {
      console.warn('Erro ao criar token com jose, tentando com jsonwebtoken:', joseError);
      // Fallback: tentar criar com jsonwebtoken
      const token = jwt.sign(
        payload, 
        JWT_SECRET, 
        { 
          expiresIn: '7d',
          algorithm: 'HS256',
          jwtid: tokenId
        }
      );
      return token;
    }
  } catch (error) {
    console.error('Erro ao criar token:', error);
    throw error;
  }
}

/**
 * Define cookies de autenticação
 * @param token Token JWT gerado
 */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_EXPIRY,
    path: '/',
    sameSite: 'strict', // Mudando para strict para melhor segurança CSRF
  });
}

/**
 * Remove cookies de autenticação
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_NAME);
  cookieStore.delete(LEGACY_TOKEN_NAME);
}

// Função para verificar JWT usando jose (para compatibilidade com Edge Runtime)
export async function verifyToken(token: string) {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET não está definido no ambiente');
      return null;
    }
    
    // Verificar se o token está na lista de revogados
    if (await isTokenRevoked(token)) {
      console.log('Token revogado encontrado na verificação');
      return null;
    }
    
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    try {
      // Tentar verificar com jose
      const { payload } = await jwtVerify(token, secret, {
        algorithms: ['HS256'] // Apenas aceitar HS256
      });
      
      return {
        id: payload.id as string || payload.userId as string,
        role: payload.role as string,
        username: payload.username as string,
        email: payload.email as string,
        iat: payload.iat as number,
        exp: payload.exp as number,
        jti: payload.jti as string
      };
    } catch (joseError) {
      // Fallback para jsonwebtoken
      try {
        const decoded = jwt.verify(token, JWT_SECRET, {
          algorithms: ['HS256'] // Especificar algoritmos permitidos
        }) as jwt.JwtPayload;
        
        return {
          id: decoded.id as string || decoded.userId as string,
          role: decoded.role as string,
          username: decoded.username as string,
          email: decoded.email as string,
          iat: decoded.iat as number,
          exp: decoded.exp as number,
          jti: decoded.jti as string
        };
      } catch (jwtError) {
        throw jwtError;
      }
    }
  } catch (error) {
    return null;
  }
}

/**
 * Verifica se um usuário é administrador
 * @param user Objeto do usuário
 * @returns Boolean indicando se é admin ou não
 */
export function isAdmin(user: AuthUser | null) {
  if (!user) return false;
  return user.role === 'admin';
}

/**
 * Verifica se um usuário é desenvolvedor
 * @param user Objeto do usuário
 * @returns Boolean indicando se é developer ou não
 */
export function isDeveloper(user: AuthUser | null) {
  if (!user) return false;
  return user.role === 'developer';
}

// Limpeza periódica de tokens revogados
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    let count = 0;
    
    const keysToDelete: string[] = [];
    revokedTokens.forEach((expiry, key) => {
      if (now > expiry) {
        keysToDelete.push(key);
        count++;
      }
    });
    
    keysToDelete.forEach(key => revokedTokens.delete(key));
    
    if (count > 0 && process.env.NODE_ENV === 'development') {
      console.log(`[Auth] Removidos ${count} tokens expirados da lista de revogados`);
    }
  }, 60 * 60 * 1000); // Executar a cada hora
} 