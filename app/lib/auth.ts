import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT } from 'jose';
import { jwtVerify } from 'jose';
import User from '@/app/lib/models/user';
import connectDB from '@/app/lib/db/mongodb';
import jwt from 'jsonwebtoken';

// Segredo usado para assinar os tokens JWT
// Garantir que o segredo seja consistente mesmo se não estiver definido no ambiente
const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'fantasy_cheats_jwt_secret_7a23e6';

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
      let decoded;
      let userId;
      
      try {
        // Primeiro, tentar verificar com jsonwebtoken
        decoded = jwt.verify(authToken, JWT_SECRET) as jwt.JwtPayload;
        userId = decoded.id || decoded.userId;
      } catch (jwtError) {
        console.log('checkAuth: Falha na verificação com jsonwebtoken, tentando com jose:', jwtError.message);
        
        // Tentar verificar usando jose como fallback
        try {
          const joseResult = await verifyToken(authToken);
          if (joseResult) {
            decoded = joseResult;
            userId = joseResult.id;
            console.log('checkAuth: Verificação com jose bem-sucedida');
          } else {
            throw new Error('Falha na verificação do token com jose');
          }
        } catch (joseError) {
          console.error('checkAuth: Também falhou com jose:', joseError);
          
          // Se estamos em desenvolvimento e temos um token, tentar decodificar sem verificar
          if (process.env.NODE_ENV === 'development') {
            try {
              console.log('checkAuth: Ambiente de desenvolvimento, tentando decodificar token sem verificar...');
              const decodedWithoutVerify = jwt.decode(authToken) as jwt.JwtPayload;
              if (decodedWithoutVerify && (decodedWithoutVerify.id || decodedWithoutVerify.userId)) {
                console.log('checkAuth: Decodificação sem verificação bem-sucedida para desenvolvimento');
                decoded = decodedWithoutVerify;
                userId = decodedWithoutVerify.id || decodedWithoutVerify.userId;
              } else {
                throw new Error('Token inválido mesmo após decodificação sem verificação');
              }
            } catch (decodeError) {
              console.error('checkAuth: Falha na decodificação sem verificação:', decodeError);
              throw jwtError; // Propagar o erro original
            }
          } else {
            throw jwtError; // Propagar o erro original em produção
          }
        }
      }
      
      if (!userId) {
        console.log('checkAuth: ID de usuário não encontrado no token');
        return { isAuthenticated: false, user: null };
      }
      
      // Garantir que o userId seja uma string válida
      let userIdStr: string;
      
      try {
        // Verificar se o userId é um objeto (como um buffer)
        if (typeof userId === 'object' && userId !== null) {
          console.log('checkAuth: userId é um objeto, convertendo para string hexadecimal...');
          
          // Se o userId for um objeto Buffer (como nos tokens antigos)
          if (userId.buffer || userId.data || userId.type === 'Buffer') {
            // Obter o Buffer de forma apropriada
            const buffer = userId.buffer || userId.data || userId;
            
            // Converter o buffer para string hexadecimal
            userIdStr = Object.values(buffer)
              .map(byte => (byte as number).toString(16).padStart(2, '0'))
              .join('');
            
            console.log(`checkAuth: userId convertido para formato hex: ${userIdStr}`);
          } else {
            // Para outros tipos de objetos, usar a forma padrão de string
            userIdStr = userId.toString();
          }
        } else {
          // Se não for um objeto, converter diretamente para string
          userIdStr = String(userId);
        }
        
        // Verificar se é um ObjectId válido
        if (!/^[0-9a-fA-F]{24}$/.test(userIdStr)) {
          console.error(`checkAuth: ID inválido após conversão: ${userIdStr}`);
          return { isAuthenticated: false, user: null };
        }
        
      } catch (conversionError) {
        console.error('checkAuth: Erro ao converter userId:', conversionError);
        console.error('checkAuth: userId original:', userId);
        return { isAuthenticated: false, user: null };
      }
      
      console.log('checkAuth: Token válido para usuário:', userIdStr);
      
      // Conectar ao banco de dados
      await connectDB();
      
      // Buscar usuário pelo ID (sem a senha)
      console.log('checkAuth: Buscando usuário no banco de dados...');
      const user = await User.findById(userIdStr).select('-password');
      
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
    
    // Garantir que o userId seja uma string válida
    const userIdStr = userId.toString();
    
    console.log(`Criando token para usuário ID: ${userIdStr}`);
    
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
    
    console.log(`Payload do token: ${JSON.stringify(payload)}`);
    
    // Tentar criar token com jose (compatível com Edge Runtime)
    try {
      // Criar token JWT com jose
      const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d') // Validade de 7 dias
        .sign(secret);
      
      console.log('Token criado com sucesso usando jose');
      return token;
    } catch (joseError) {
      console.error('Erro ao criar token com jose, tentando com jsonwebtoken:', joseError);
      
      // Fallback: tentar criar com jsonwebtoken
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      console.log('Token criado com sucesso usando jsonwebtoken');
      return token;
    }
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
      console.error('Erro na verificação com jose, tentando jsonwebtoken:', joseError);
      
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
        console.error('Erro na verificação com jsonwebtoken também:', jwtError);
        throw jwtError;
      }
    }
  } catch (error) {
    console.error('Erro ao verificar token JWT:', error);
    return null;
  }
} 