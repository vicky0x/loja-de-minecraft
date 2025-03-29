import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { jwtVerify } from 'jose';
import User from '@/app/lib/models/user';
import connectDB from '@/app/lib/db/mongodb';

// Segredo usado para assinar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

// Interface para os dados do usuário autenticado
export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

// Nome do cookie de autenticação
const AUTH_TOKEN_NAME = 'auth_token';
const LEGACY_TOKEN_NAME = 'fantasy_cheats_auth';
const AUTH_EXPIRY = 60 * 60 * 24 * 7; // 7 dias em segundos

/**
 * Verifica a autenticação do usuário a partir de uma solicitação
 * @param request Objeto de requisição Next.js
 * @returns Promise com os dados do usuário ou null se não autenticado
 */
export async function checkAuth(req: NextRequest) {
  try {
    console.log('Iniciando verificação de autenticação');
    
    // Obter token de várias fontes possíveis
    let token = req.cookies.get(AUTH_TOKEN_NAME)?.value;
    
    // Verificar no cookie legado
    if (!token) {
      token = req.cookies.get(LEGACY_TOKEN_NAME)?.value;
    }
    
    // Verificar nos headers
    if (!token) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // Verificar em cookies extraídos manualmente
    if (!token) {
      const cookieHeader = req.headers.get('cookie') || '';
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
    
    if (!token) {
      console.log('Token não encontrado');
      return { isAuthenticated: false, user: null };
    }
    
    // Verificar token
    const decodedToken = await verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      console.log('Token inválido ou expirado');
      return { isAuthenticated: false, user: null };
    }
    
    // Buscar usuário no banco de dados
    await connectDB();
    const user = await User.findById(decodedToken.id).select('-password');
    
    if (!user) {
      console.log('Usuário não encontrado no banco de dados');
      return { isAuthenticated: false, user: null };
    }
    
    console.log('Usuário autenticado:', { id: user._id.toString(), role: user.role });
    
    return {
      isAuthenticated: true,
      user,
      token: decodedToken
    };
  } catch (error) {
    console.error('Erro durante a verificação de autenticação:', error);
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Cria um token JWT para o usuário
 * @param userId ID do usuário
 * @returns Promise com o token gerado
 */
export async function createToken(userId: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // Buscar informações do usuário para incluir no token
    await connectDB();
    const user = await User.findById(userId);
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Criar token JWT com jose (compatível com Edge Runtime)
    const token = await new SignJWT({ 
        id: userId,
        role: user.role 
      })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Validade de 7 dias
      .sign(secret);
    
    return token;
  } catch (error) {
    console.error('Erro ao criar token:', error);
    throw error;
  }
}

/**
 * Verifica se o usuário tem perfil de administrador
 * @param user Objeto do usuário autenticado
 * @returns boolean indicando se é admin
 */
export function isAdmin(user: AuthUser | null): boolean {
  return !!user && user.role === 'admin';
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
    sameSite: 'lax',
  });
}

/**
 * Remove cookie de autenticação
 */
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_TOKEN_NAME);
}

// Função para verificar JWT
export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.id as string,
      role: payload.role as string,
      iat: payload.iat as number,
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
} 