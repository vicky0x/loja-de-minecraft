import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
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
const AUTH_EXPIRY = 60 * 60 * 24 * 7; // 7 dias em segundos

/**
 * Verifica a autenticação do usuário a partir de uma solicitação
 * @param request Objeto de requisição Next.js
 * @returns Promise com os dados do usuário ou null se não autenticado
 */
export async function checkAuth(req: NextRequest) {
  try {
    console.log('Iniciando verificação de autenticação');
    
    // Obter token da requisição
    const token = req.cookies.get(AUTH_TOKEN_NAME)?.value;
    
    console.log('Token encontrado:', token ? 'Sim' : 'Não');
    
    if (!token) {
      console.log('Token não encontrado');
      return { isAuthenticated: false, user: null };
    }
    
    // Verificar e decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role?: string };
    
    if (!decoded || !decoded.id) {
      console.log('Token inválido ou sem ID de usuário');
      return { isAuthenticated: false, user: null };
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('Usuário não encontrado no banco de dados');
      return { isAuthenticated: false, user: null };
    }
    
    console.log('Usuário autenticado:', {
      id: user._id.toString(),
      role: user.role
    });
    
    return { 
      isAuthenticated: true, 
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        name: user.name
      }
    };
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error);
    return { isAuthenticated: false, user: null };
  }
}

/**
 * Cria um token JWT para o usuário
 * @param userId ID do usuário
 * @returns Promise com o token gerado
 */
export async function createToken(userId: string): Promise<string> {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar o usuário no banco de dados
    const user = await User.findById(userId).select('role');
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    // Criar payload do token
    const payload = { 
      id: userId,
      role: user.role
    };
    
    // Criar o token com o ID e o papel do usuário
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    return token;
  } catch (error) {
    console.error('Erro ao criar token JWT:', error);
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
export function setAuthCookie(token: string) {
  const cookieStore = cookies();
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
export function removeAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_TOKEN_NAME);
} 