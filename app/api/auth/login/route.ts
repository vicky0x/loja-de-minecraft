import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import { createToken } from '@/app/lib/auth/authUtils';

export async function POST(request: NextRequest) {
  try {
    console.log('---- LOGIN REQUEST ----');
    const { email, password } = await request.json();
    console.log('Login tentado para email:', email);

    // Validar campos obrigatórios
    if (!email || !password) {
      console.log('Email ou senha não fornecidos');
      return NextResponse.json(
        { message: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Conectar ao banco de dados
    console.log('Conectando ao banco de dados');
    await connectDB();

    // Buscar usuário pelo email com senha incluída
    console.log('Buscando usuário pelo email:', email);
    const user = await User.findOne({ email }).select('+password');
    console.log('Usuário encontrado:', user ? 'Sim' : 'Não');

    // Verificar se o usuário existe
    if (!user) {
      console.log('Usuário não encontrado');
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar se a senha está correta
    console.log('Verificando senha');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Senha válida:', isPasswordValid ? 'Sim' : 'Não');

    if (!isPasswordValid) {
      console.log('Senha inválida');
      return NextResponse.json(
        { message: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Gerar token JWT - agora é assíncrono
    console.log('Gerando token JWT para usuário ID:', user._id.toString());
    console.log('Role do usuário:', user.role);
    const token = await createToken(user._id.toString());
    console.log('Token gerado:', token ? 'Sim (tamanho: ' + token.length + ')' : 'Não');

    // Criar uma resposta com os dados do usuário
    console.log('Criando resposta com dados do usuário');
    const response = NextResponse.json({
      message: 'Login realizado com sucesso',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        memberNumber: user.memberNumber,
      },
    });
    
    // Definir o cookie diretamente nos cabeçalhos de resposta (evita o uso de cookies())
    const maxAge = 7 * 24 * 60 * 60; // 7 dias em segundos
    console.log('Definindo cookie auth_token com maxAge:', maxAge);
    
    const cookieValue = `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
    console.log('Valor do cookie:', cookieValue.substring(0, 50) + '...');
    
    response.headers.set('Set-Cookie', cookieValue);
    console.log('Headers definidos na resposta');
    
    return response;
  } catch (error: any) {
    console.error('Erro durante o login:', error);
    
    return NextResponse.json(
      { message: error.message || 'Erro durante o login' },
      { status: 500 }
    );
  }
} 