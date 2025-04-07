import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { jwtVerify } from 'jose';
import User from '@/app/lib/models/user';
import connectDB from '@/app/lib/db/mongodb';
import jwt from 'jsonwebtoken';

// Segredo usado para assinar os tokens JWT
// Obter do ambiente, com fallback para erro em produção e valor padrão em desenvolvimento
const JWT_SECRET = process.env.JWT_SECRET || 
  (process.env.NODE_ENV === 'production' 
    ? undefined 
    : 'fantasystore_dev_jwt_secret_insecure');

// Verificar se temos JWT_SECRET em produção
if (process.env.NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('ERRO CRÍTICO: JWT_SECRET não está definido no ambiente de produção!');
}

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

// Resultado da verificação de autenticação
export interface AuthResult {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

// Nome do cookie de autenticação
const AUTH_TOKEN_NAME = 'auth_token';
const LEGACY_TOKEN_NAME = 'fantasystore_auth';
const AUTH_EXPIRY = 60 * 60 * 24 * 7; // 7 dias em segundos

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
      return { isAuthenticated: false, user: null };
    }
    
    if (!JWT_SECRET) {
      console.error('Erro de autenticação: JWT_SECRET não definido');
      return { isAuthenticated: false, user: null };
    }
    
    try {
      // Verificar token usando jsonwebtoken
      let decoded;
      let userId;
      
      try {
        // Primeiro, tentar verificar com jsonwebtoken
        decoded = jwt.verify(authToken, JWT_SECRET) as jwt.JwtPayload;
        userId = decoded.id || decoded.userId;
      } catch (jwtError) {
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
        return { isAuthenticated: false, user: null };
      }
      
      // Garantir que o userId seja uma string válida
      let userIdStr: string;
      
      try {
        userIdStr = userId.toString();
      } catch (error) {
        console.error('Erro ao converter userId para string:', error);
        return { isAuthenticated: false, user: null };
      }
      
      // Buscar informações do usuário
      await connectDB();
      const user = await User.findById(userIdStr);
      
      if (!user) {
        console.error(`Usuário com ID ${userIdStr} não encontrado no banco de dados`);
        return { isAuthenticated: false, user: null };
      }
      
      // Converter campos para formato adequado
      const authUser: AuthUser = {
        _id: user._id.toString(),
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role as 'admin' | 'user',
        name: user.name,
        profileImage: user.profileImage,
        memberNumber: user.memberNumber,
        createdAt: user.createdAt,
        cpf: user.cpf,
        address: user.address,
        phone: user.phone
      };
      
      return { isAuthenticated: true, user: authUser };
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      return { isAuthenticated: false, user: null };
    }
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
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
    
    // Criar payload com todas as informações necessárias
    const payload = { 
      id: userIdStr,
      userId: userIdStr, // Adicionar userId também para compatibilidade
      username: user.username,
      email: user.email,
      role: user.role 
    };
    
    // Tentar criar token com jose (compatível com Edge Runtime)
    try {
      // Criar token JWT com jose
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Validade de 7 dias
        .sign(secret);
      
      return token;
    } catch (joseError) {
      console.warn('Erro ao criar token com jose, tentando com jsonwebtoken:', joseError);
      // Fallback: tentar criar com jsonwebtoken
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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
    
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    try {
      // Tentar verificar com jose
      const { payload } = await jwtVerify(token, secret);
      
      return {
        id: payload.id as string || payload.userId as string,
        role: payload.role as string,
        username: payload.username as string,
        email: payload.email as string,
        iat: payload.iat as number,
        exp: payload.exp as number
      };
    } catch (joseError) {
      // Fallback para jsonwebtoken
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
        
        return {
          id: decoded.id as string || decoded.userId as string,
          role: decoded.role as string,
          username: decoded.username as string,
          email: decoded.email as string,
          iat: decoded.iat as number,
          exp: decoded.exp as number
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