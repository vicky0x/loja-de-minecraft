import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import bcrypt from 'bcryptjs';
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
        { success: false, message: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    console.log('Conectando ao banco de dados');
    await connectDB();
    
    // Buscar usuário pelo email
    const user = await User.findOne({ email }).select('+password');
    console.log(`Usuário encontrado: ${user ? 'Sim' : 'Não'}`);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }
    
    // Verificar senha
    console.log('Verificando senha');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log(`Senha válida: ${isValidPassword ? 'Sim' : 'Não'}`);
    
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: 'E-mail ou senha inválidos' },
        { status: 401 }
      );
    }
    
    // Converter o ID do usuário para string para garantir formato correto
    const userIdStr = user._id.toString();
    
    // Gerar token JWT usando a função corrigida
    console.log(`Gerando token JWT para usuário ID: ${userIdStr}`);
    console.log(`Role do usuário: ${user.role}`);
    
    try {
      const token = await createToken(userIdStr);
      console.log(`Token gerado: ${token ? 'Sim (tamanho: ' + token.length + ')' : 'Não'}`);
      
      if (!token) {
        throw new Error('Falha ao gerar token de autenticação');
      }
      
      // Dados do usuário para retornar na resposta
      console.log('Criando resposta com dados do usuário');
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
      
      // Criar resposta com cookies
      console.log(`Definindo cookie ${AUTH_TOKEN_NAME} com maxAge: ${AUTH_EXPIRY}`);
      
      // Usar formato primitivo para melhor compatibilidade
      const cookieValue = `${AUTH_TOKEN_NAME}=${token}; Path=/; HttpOnly; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`;
      
      const response = NextResponse.json(
        { 
          success: true, 
          user: userData,
          token: token
        },
        { 
          status: 200,
          headers: {
            'Set-Cookie': cookieValue
          }
        }
      );
      
      // Definir cookies adicionais para o cliente
      const clientCookies = [
        `isAuthenticated=true; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`,
        `userId=${userIdStr}; Path=/; Max-Age=${AUTH_EXPIRY}; SameSite=Lax`,
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
    } catch (tokenError) {
      console.error('Erro ao gerar token:', tokenError);
      return NextResponse.json(
        { success: false, message: 'Erro ao gerar credenciais de autenticação' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    return NextResponse.json(
      { success: false, message: 'Erro ao processar login' },
      { status: 500 }
    );
  }
} 