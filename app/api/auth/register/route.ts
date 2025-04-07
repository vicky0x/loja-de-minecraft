import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import connectDBModule from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

// Funções de validação
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidUsername(username: string): boolean {
  // Apenas letras, números, _ e -, entre 3-20 caracteres
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

function isValidPassword(password: string): boolean {
  // Mínimo 6 caracteres, pelo menos 1 letra e 1 número
  if (password.length < 6) return false;
  return /[A-Za-z]/.test(password) && /[0-9]/.test(password);
}

// Lista de palavras bloqueadas para usernames
const blockedWords = [
  // Políticos e figuras controversas
  'lula', 'bolsonaro', 'trump', 'biden', 'hitler', 'mussolini', 'stalin', 'lenin',
  // Palavrões e ofensas (português e inglês)
  'puta', 'caralho', 'foda', 'buceta', 'viado', 'corno', 'porra', 'merda', 
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'pussy', 'whore',
  // Termos relacionados a golpes
  'admin', 'moderador', 'staff', 'suporte', 'support', 'scam', 'hacker', 
  'golpe', 'fake', 'roubo', 'virus', 'hack', 'free', 'gratis'
];

function isBlockedUsername(username: string): boolean {
  return blockedWords.some(word => 
    username.toLowerCase().includes(word.toLowerCase())
  );
}

export async function POST(request: NextRequest) {
  try {
    const jsonData = await request.json();
    const { username, email, password } = jsonData;

    // Validações dos campos
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'O formato do e-mail é inválido' },
        { status: 400 }
      );
    }

    // Validar username
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { message: 'Nome de usuário inválido. Use apenas letras, números, _ e - (3-20 caracteres)' },
        { status: 400 }
      );
    }

    // Verificar palavras bloqueadas
    if (isBlockedUsername(username)) {
      return NextResponse.json(
        { message: 'Este nome de usuário não é permitido' },
        { status: 400 }
      );
    }

    // Validar senha
    if (!isValidPassword(password)) {
      return NextResponse.json(
        { message: 'A senha deve ter pelo menos 6 caracteres, incluindo letras e números' },
        { status: 400 }
      );
    }

    // Usar a função de conexão apropriada
    if (connectDB) {
      await connectDB();
    } else if (connectDBModule) {
      await connectDBModule();
    } else {
      throw new Error('Função de conexão com o MongoDB não encontrada');
    }

    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'Este e-mail já está em uso' },
        { status: 400 }
      );
    }

    // Verificar se o username já está em uso
    const existingUsername = await User.findOne({ username });
    
    if (existingUsername) {
      return NextResponse.json(
        { message: 'Este nome de usuário já está em uso' },
        { status: 400 }
      );
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Dados do usuário para criação
    const userData = {
      username,
      email,
      password: hashedPassword,
      role: 'user'
    };

    // Criar novo usuário
    const user = await User.create(userData);

    // Retornar dados do usuário (sem a senha)
    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
} 