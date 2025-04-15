import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import connectDBModule from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import mongoose from 'mongoose';

// Cache para limitar tentativas de registro (rate limiting básico)
const registerAttempts = new Map<string, { count: number, timestamp: number }>();
const MAX_ATTEMPTS = 3; // Menos tentativas para registro do que login
const LOCKOUT_TIME = 30 * 60 * 1000; // 30 minutos em milissegundos

// Função para validar email
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para validar username
function isValidUsername(username: string): boolean {
  // Permitir apenas letras, números, underscore e hífen
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

// Função para verificar se username está bloqueado
function isBlockedUsername(username: string): boolean {
  const blockedUsernames = [
    'admin', 'administrator', 'suporte', 'support', 'moderator', 'mod',
    'sistema', 'system', 'staff', 'owner', 'dono', 'master', 'root'
  ];
  return blockedUsernames.includes(username.toLowerCase());
}

// Função para implementar rate limiting básico
function checkRateLimit(ip: string): { allowed: boolean, message?: string } {
  const now = Date.now();
  const userAttempts = registerAttempts.get(ip);
  
  // Limpar entradas antigas do cache a cada 500 solicitações
  if (registerAttempts.size > 500) {
    const keysToDelete: string[] = [];
    registerAttempts.forEach((data, key) => {
      if (now - data.timestamp > LOCKOUT_TIME) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => registerAttempts.delete(key));
  }

  // Se o usuário não tem tentativas anteriores, permitir
  if (!userAttempts) {
    registerAttempts.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }

  // Se o bloqueio já expirou, resetar contador
  if (now - userAttempts.timestamp > LOCKOUT_TIME) {
    registerAttempts.set(ip, { count: 1, timestamp: now });
    return { allowed: true };
  }

  // Se excedeu o limite de tentativas
  if (userAttempts.count >= MAX_ATTEMPTS) {
    const remainingTime = Math.ceil((LOCKOUT_TIME - (now - userAttempts.timestamp)) / 60000);
    return { 
      allowed: false, 
      message: `Muitas tentativas de registro. Tente novamente em ${remainingTime} minutos.` 
    };
  }

  // Incrementar contagem de tentativas
  registerAttempts.set(ip, { 
    count: userAttempts.count + 1, 
    timestamp: userAttempts.timestamp 
  });
  return { allowed: true };
}

// Função POST para criar novo usuário
export async function POST(request: NextRequest) {
  try {
    // Obter IP para rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') || 
              'unknown';
    
    // Verificar rate limiting
    const rateLimitCheck = checkRateLimit(ip);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: rateLimitCheck.message },
        { status: 429 }
      );
    }
    
    // Extrair dados do corpo da requisição
    const body = await request.json();
    const { username, email, password } = body;
    
    // Validar dados obrigatórios
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Validar formato de email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Formato de e-mail inválido' },
        { status: 400 }
      );
    }
    
    // Validar formato de username
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { message: 'Nome de usuário deve ter entre 3 e 20 caracteres e conter apenas letras, números, underscore e hífen' },
        { status: 400 }
      );
    }
    
    // Verificar se username está na lista de bloqueados
    if (isBlockedUsername(username)) {
      return NextResponse.json(
        { message: 'Este nome de usuário não está disponível' },
        { status: 400 }
      );
    }
    
    // Validar tamanho da senha
    if (password.length < 6) {
      return NextResponse.json(
        { message: 'A senha deve ter no mínimo 6 caracteres' },
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

    // Dados do usuário para criação
    const userData = {
      username,
      email,
      password, // O hook pre-save do modelo User fará o hash internamente
      role: 'user'
    };

    // Criar novo usuário usando o método padrão do Mongoose
    const user = await User.create(userData);

    // Resetar contador de tentativas após sucesso
    registerAttempts.delete(ip);

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
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
} 