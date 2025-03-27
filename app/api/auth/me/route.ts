import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';

// Segredo usado para verificar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

export async function GET(req: NextRequest) {
  try {
    // Obter o token diretamente do cookie da request
    const token = req.cookies.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }
    
    // Verificar e decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role?: string };

    if (!decoded || !decoded.id) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('Enviando dados do usuário:', {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      name: user.name || '',
      role: user.role,
      createdAt: user.createdAt,
      // Outros campos
    });
    
    // Retornar dados do usuário
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name || '',
        role: user.role,
        profileImage: user.profileImage || '',
        memberNumber: user.memberNumber,
        createdAt: user.createdAt,
        cpf: user.cpf || '',
        address: user.address || '',
        phone: user.phone || ''
      }
    });
  } catch (error: any) {
    console.error('Erro ao obter dados do usuário:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao obter dados do usuário' },
      { status: 500 }
    );
  }
} 