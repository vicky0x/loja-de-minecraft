import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Interface para os dados do usuário autenticado
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
}

// Nome dos cookies de autenticação
const AUTH_COOKIE_NAME = 'fantasy_cheats_auth';
const AUTH_EXPIRY = 60 * 60 * 24 * 7; // 7 dias em segundos

// Função para definir cookies de autenticação
export function setAuthCookies(user: AuthUser) {
  const cookieStore = cookies();
  
  // Criar cookie com dados do usuário
  cookieStore.set(AUTH_COOKIE_NAME, JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: AUTH_EXPIRY,
    path: '/',
    sameSite: 'lax',
  });
}

// Função para remover cookies de autenticação
export function removeAuthCookies() {
  const cookieStore = cookies();
  
  // Remover cookie de autenticação
  cookieStore.delete(AUTH_COOKIE_NAME);
}

// Função para obter usuário autenticado a partir dos cookies
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = cookies();
  const authCookie = await cookieStore.get(AUTH_COOKIE_NAME);
  
  if (!authCookie || !authCookie.value) {
    return null;
  }
  
  try {
    const decodedToken = jwt.verify(authCookie.value, JWT_SECRET) as JwtPayload;
    
    return {
      id: decodedToken.userId,
      username: decodedToken.username,
      email: decodedToken.email,
      name: decodedToken.name || '',
      role: decodedToken.role,
      createdAt: decodedToken.createdAt,
    };
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
}

// Função para verificar autenticação em middlewares ou rotas de API
export function isAuthenticated(request: NextRequest): boolean {
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  
  if (!cookieValue) {
    return false;
  }
  
  try {
    const user = JSON.parse(cookieValue) as AuthUser;
    return Boolean(user && user.id);
  } catch (error) {
    return false;
  }
}

// Função para verificar se o usuário é admin
export function isAdmin(request: NextRequest): boolean {
  const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  
  if (!cookieValue) {
    return false;
  }
  
  try {
    const user = JSON.parse(cookieValue) as AuthUser;
    return user.role === 'admin';
  } catch (error) {
    return false;
  }
}

// Função para obter o role do usuário da requisição
export function getUserRoleFromRequest(request: NextRequest): string | null {
  try {
    const cookieValue = request.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!cookieValue) return null;
    
    const user = JSON.parse(cookieValue) as AuthUser;
    return user.role || null;
  } catch (error) {
    return null;
  }
} 