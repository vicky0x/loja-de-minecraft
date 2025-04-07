import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import bcrypt from 'bcryptjs';
import { createToken } from '@/app/lib/auth';

// Variáveis para cookies
const AUTH_TOKEN_NAME = 'auth_token';
const AUTH_EXPIRY = 60 * 60 * 24 * 7; // 7 dias em segundos

// Validar formato de email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função de login
export async function POST(request: NextRequest) {
  try {
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
    await connectDB();
    
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
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: invalidMessage },
        { status: 401 }
      );
    }
    
    // Converter o ID do usuário para string para garantir formato correto
    const userIdStr = user._id.toString();
    
    try {
      const token = await createToken(userIdStr);
      
      if (!token) {
        throw new Error('Falha ao gerar token de autenticação');
      }
      
      // Dados do usuário para retornar na resposta (sem dados sensíveis)
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
      
      // Criar resposta com cookies seguros
      // Configurando o cookie principal como httpOnly para segurança
      const cookieValue = `${AUTH_TOKEN_NAME}=${token}; Path=/; HttpOnly; Max-Age=${AUTH_EXPIRY}; SameSite=Strict`;
      const cookieOptions = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      
      const response = NextResponse.json(
        { 
          success: true, 
          user: userData,
          token: token // Incluir token diretamente na resposta JSON
        },
        { 
          status: 200,
          headers: {
            'Set-Cookie': cookieValue + cookieOptions
          }
        }
      );
      
      // Definir cookies adicionais para o cliente (não httpOnly para poder ser lido pelo JS)
      // Não incluir dados sensíveis nestes cookies
      const clientCookies = [
        `isAuthenticated=true; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Strict${cookieOptions}`,
        `userId=${userIdStr}; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Strict${cookieOptions}`,
        `userRole=${user.role}; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Strict${cookieOptions}`
      ];
      
      // Adicionar cookies ao cabeçalho da resposta
      const existingCookies = response.headers.getSetCookie();
      response.headers.set('Set-Cookie', [...existingCookies, ...clientCookies]);
      
      return response;
    } catch (tokenError) {
      console.error('Erro ao gerar token:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Erro no processo de autenticação' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 