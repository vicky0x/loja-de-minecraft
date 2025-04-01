import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { jwtVerify } from 'jose';
import User from '@/app/lib/models/user';
import connectDB from '@/app/lib/db/mongodb';
import jwt from 'jsonwebtoken';

// Segredo usado para assinar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

// Interface para os dados do usuário autenticado
export interface AuthUser {
  _id: string;
  id?: string; // Adicionando campo id para compatibilidade
  username: string;
  email: string;
  name?: string;
  role: 'admin' | 'user';
  profileImage?: string;
  memberNumber?: number;
  createdAt?: Date;
  cpf?: string;
  address?: string;
  phone?: string;
}

// Interface para o resultado da autenticação
export interface AuthResult {
  isAuthenticated: boolean;
  user: AuthUser | null;
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
export const checkAuth = async (req: NextRequest): Promise<AuthResult> => {
  try {
    console.log('checkAuth: Verificando autenticação...');
    
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
      console.log('checkAuth: Token não encontrado nos cookies ou headers');
      return { isAuthenticated: false, user: null };
    }
    
    try {
      // Verificar token usando jsonwebtoken
      console.log('checkAuth: Verificando token JWT...');
      const decoded = jwt.verify(authToken, JWT_SECRET) as jwt.JwtPayload;
      
      // Obter ID do usuário do token
      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        console.log('checkAuth: ID de usuário não encontrado no token');
        return { isAuthenticated: false, user: null };
      }
      
      console.log('checkAuth: Token válido para usuário:', userId);
      
      // Conectar ao banco de dados
      await connectDB();
      
      // Buscar usuário pelo ID (sem a senha)
      console.log('checkAuth: Buscando usuário no banco de dados...');
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        console.log('checkAuth: Usuário não encontrado no banco de dados. Token pode estar desatualizado.');
        return { isAuthenticated: false, user: null };
      }
      
      // Log detalhado do usuário encontrado
      console.log('checkAuth: Usuário autenticado:', {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      });
      
      // Converter o documento do Mongoose para um objeto plano para evitar erros de serialização
      const userObj = user.toObject();
      
      return {
        isAuthenticated: true,
        user: {
          _id: userObj._id,
          id: userObj._id.toString(), // Garantir que ambos id e _id estejam disponíveis
          username: userObj.username,
          email: userObj.email,
          name: userObj.name || '',
          role: userObj.role,
          profileImage: userObj.profileImage || '',
          memberNumber: userObj.memberNumber,
          createdAt: userObj.createdAt,
          cpf: userObj.cpf || '',
          address: userObj.address || '',
          phone: userObj.phone || ''
        }
      };
      
    } catch (tokenError) {
      // Token inválido ou expirado
      console.error('checkAuth: Erro ao verificar token:', tokenError);
      return { isAuthenticated: false, user: null };
    }
  } catch (error) {
    console.error('checkAuth: Erro geral na autenticação:', error);
    return { isAuthenticated: false, user: null };
  }
};

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
        userId: userId, // Adicionar userId também para compatibilidade
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

// Função para verificar JWT usando jose (para compatibilidade com Edge Runtime)
export async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.id as string || payload.userId as string,
      role: payload.role as string,
      iat: payload.iat as number,
      exp: payload.exp as number
    };
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
} 