import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';

export async function POST(request: NextRequest) {
  try {
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter dados do corpo da requisição
    const { username, email, password } = await request.json();
    
    // Validar dados
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { message: 'Este email já está em uso' },
          { status: 400 }
        );
      }
      
      if (existingUser.username === username) {
        return NextResponse.json(
          { message: 'Este nome de usuário já está em uso' },
          { status: 400 }
        );
      }
    }
    
    // Criar novo usuário
    const user = new User({
      username,
      email,
      password,
      role: 'user', // Papel padrão é usuário comum
    });
    
    // Salvar usuário no banco de dados
    await user.save();
    
    // Retornar resposta de sucesso
    return NextResponse.json(
      {
        message: 'Usuário registrado com sucesso',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Erro no registro:', error);
    
    // Erro de validação do Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      
      return NextResponse.json(
        { message: messages.join(', ') },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
} 