import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import { createToken } from '@/app/lib/auth';

// Variáveis para cookies
const AUTH_TOKEN_NAME = 'auth_token';
const AUTH_EXPIRY = 60 * 60 * 24 * 7; // 7 dias em segundos

// Função de login
export async function POST(request: NextRequest) {
  try {
    console.log('---- LOGIN REQUEST ----');
    
    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { email, password } = body;
    
    console.log(`Login tentado para email: ${email}`);
    
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios', code: 'MISSING_CREDENTIALS' },
        { status: 400 }
      );
    }
    
    console.log('Conectando ao banco de dados');
    await connectDB();
    
    // Buscar usuário com o email fornecido
    const user = await User.findOne({ email }).select('+password');
    console.log(`Usuário encontrado: ${user ? 'Sim' : 'Não'}`);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }
    
    // Verificar senha
    console.log('Verificando senha');
    const isPasswordValid = await user.comparePassword(password);
    console.log(`Senha válida: ${isPasswordValid ? 'Sim' : 'Não'}`);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' },
        { status: 401 }
      );
    }
    
    // Gerar token JWT
    console.log(`Gerando token JWT para usuário ID: ${user._id}`);
    console.log(`Role do usuário: ${user.role}`);
    const token = await createToken(user._id.toString());
    console.log(`Token gerado: ${token ? 'Sim (tamanho: ' + token.length + ')' : 'Não'}`);
    
    // Dados do usuário para retornar
    console.log('Criando resposta com dados do usuário');
    const userData = {
      id: user._id,
      username: user.username,
      email: user.email,
      name: user.name || '',
      role: user.role,
      profileImage: user.profileImage || '',
      memberNumber: user.memberNumber,
      createdAt: user.createdAt
    };
    
    // Criar resposta com cookie
    console.log(`Definindo cookie ${AUTH_TOKEN_NAME} com maxAge: ${AUTH_EXPIRY}`);
    
    // Usar formato primitivo para melhor compatibilidade
    const cookieValue = `${AUTH_TOKEN_NAME}=${token}; Path=/; HttpOnly; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`;
    
    const response = NextResponse.json(
      { 
        success: true, 
        user: userData 
      },
      { 
        status: 200,
        headers: {
          'Set-Cookie': cookieValue
        }
      }
    );
    
    // Definir cookies adicionais
    const clientCookies = [
      `isAuthenticated=true; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`,
      `userId=${user._id.toString()}; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`,
      `username=${user.username}; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`,
      `userEmail=${user.email}; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`,
      `userRole=${user.role}; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`
    ];
    
    // Adicionar cookies ao cabeçalho da resposta
    const existingCookies = response.headers.getSetCookie();
    response.headers.set('Set-Cookie', [...existingCookies, ...clientCookies]);
    
    console.log('Headers na resposta:', response.headers.get('Set-Cookie'));
    console.log('Login concluído com sucesso para:', user.username);
    
    return response;
  } catch (error) {
    console.error('Erro durante login:', error);
    return NextResponse.json(
      { message: 'Erro ao processar login', code: 'SERVER_ERROR', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 