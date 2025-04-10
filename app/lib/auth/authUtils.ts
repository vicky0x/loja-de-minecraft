import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import User from '@/app/lib/models/user';
import connectDB from '@/app/lib/db/mongodb';

// Segredo usado para assinar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente');
  throw new Error('JWT_SECRET não configurado');
}

interface AuthUser {
  _id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'developer';
}

// Interface para objeto de sessão
export interface Session {
  user?: {
    _id: string;
    username: string;
    email: string;
    role: string;
  };
}

/**
 * Função para verificar a autenticação do usuário a partir do cookie de sessão
 * @returns Promise<Session> Sessão do usuário autenticado ou objeto vazio
 */
export async function auth(): Promise<Session> {
  try {
    // Obter os cookies de forma assíncrona
    const cookieStore = cookies();
    const authToken = cookieStore.get('auth_token');
    const token = authToken?.value;

    if (!token) {
      return {};
    }

    // Verificar e decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

    if (!decoded || !decoded.id) {
      return {};
    }

    // Conectar ao banco de dados
    await connectDB();

    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return {};
    }

    // Retornar a sessão com os dados do usuário
    return {
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return {};
  }
}

/**
 * Função para criar token JWT
 * @param userId ID do usuário
 * @returns string Token JWT
 */
export async function createToken(userId: string): Promise<string> {
  try {
    console.log('---- CREATE TOKEN ----');
    console.log('User ID recebido:', userId);
    console.log('JWT_SECRET disponível:', !!JWT_SECRET);
    console.log('Tamanho do JWT_SECRET:', JWT_SECRET.length);
    
    // Conectar ao banco de dados para obter a role do usuário
    console.log('Conectando ao banco de dados');
    await connectDB();
    
    // Buscar o usuário no banco de dados
    console.log('Buscando usuário com ID:', userId);
    const user = await User.findById(userId).select('role');
    
    if (!user) {
      console.error('Usuário não encontrado para ID:', userId);
      throw new Error('Usuário não encontrado');
    }
    
    console.log('Usuário encontrado com role:', user.role);
    
    // Criar payload do token
    const payload = { 
      id: userId,
      role: user.role
    };
    
    console.log('Payload do token:', payload);
    
    // Criar o token com o ID e o papel do usuário
    console.log('Criando token JWT...');
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    // Verificar se o token foi criado corretamente
    console.log('Token criado com sucesso, tamanho:', token.length);
    
    // Decodificar token para debug (sem verificar)
    const decoded = jwt.decode(token);
    console.log('Token decodificado para verificação:', decoded);
    
    return token;
  } catch (error) {
    console.error('Erro ao criar token JWT:', error);
    throw error; // Repassar o erro para ser tratado pelo chamador
  }
}

/**
 * Função para verificar se o usuário tem permissão de administrador
 * @param session Objeto de sessão
 * @returns boolean Verdadeiro se o usuário é admin
 */
export function isAdmin(session: Session): boolean {
  return !!session.user && session.user.role === 'admin';
} 