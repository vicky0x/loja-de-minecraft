import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import User from '@/app/lib/models/user';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { SignJWT } from 'jose';

export async function POST(request: NextRequest) {
  try {
    // Verificar se a requisição é multipart/form-data
    const contentType = request.headers.get('content-type') || '';
    
    let username, email, password;
    
    if (contentType.includes('multipart/form-data')) {
      // Processar como FormData
      const formData = await request.formData();
      username = formData.get('username') as string;
      email = formData.get('email') as string;
      password = formData.get('password') as string;
      
      // Verificar se há imagem de perfil (não implementado neste exemplo)
      const profileImage = formData.get('profileImage') as File | null;
      // TODO: Implementar upload da imagem de perfil se necessário
    } else {
      // Tentar processar como JSON para compatibilidade
      try {
        const jsonData = await request.json();
        username = jsonData.username;
        email = jsonData.email;
        password = jsonData.password;
      } catch (jsonError) {
        console.error('Erro ao processar dados JSON:', jsonError);
        return NextResponse.json(
          { message: 'Formato de dados inválido' },
          { status: 400 }
        );
      }
    }

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    await connectDB();

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

    // Criar novo usuário
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Gerar token JWT
    const token = await new SignJWT({
      id: user._id,
      username: user.username,
      email: user.email,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key'));

    // Definir o cookie de autenticação
    cookies().set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
    });

    // Retornar dados do usuário (sem a senha)
    return NextResponse.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao criar conta:', error);
    return NextResponse.json(
      { message: 'Erro ao criar conta' },
      { status: 500 }
    );
  }
} 