import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import connectDBModule from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';

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

function isValidUsername(username: string): boolean {
  // Apenas letras, números, _ e -, entre 3-20 caracteres
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
  return usernameRegex.test(username);
}

export async function GET(request: NextRequest) {
  try {
    // Obter username da query
    const url = new URL(request.url);
    const username = url.searchParams.get('username');
    
    if (!username) {
      return NextResponse.json(
        { message: 'Username não fornecido', available: false },
        { status: 400 }
      );
    }
    
    // Verificar formato do username
    if (!isValidUsername(username)) {
      return NextResponse.json(
        { message: 'Nome de usuário inválido. Use apenas letras, números, _ e - (3-20 caracteres)', available: false },
        { status: 200 }
      );
    }
    
    // Verificar palavras bloqueadas
    if (isBlockedUsername(username)) {
      return NextResponse.json(
        { message: 'Este nome de usuário não é permitido', available: false },
        { status: 200 }
      );
    }
    
    // Conectar ao banco de dados
    if (connectDB) {
      await connectDB();
    } else if (connectDBModule) {
      await connectDBModule();
    } else {
      throw new Error('Função de conexão com o MongoDB não encontrada');
    }
    
    // Verificar se o username já está em uso
    const existingUser = await User.findOne({ username });
    
    return NextResponse.json({
      available: !existingUser,
      message: existingUser ? 'Este nome de usuário já está em uso' : 'Nome de usuário disponível'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erro ao verificar username:', error);
    return NextResponse.json(
      { message: 'Erro ao verificar disponibilidade do username', available: false },
      { status: 500 }
    );
  }
} 