import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import User from '@/app/lib/models/user';

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se é administrador
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }
    
    // Obter parâmetros da URL
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const sort = url.searchParams.get('sort') || 'createdAt';
    const direction = url.searchParams.get('dir') || 'desc';
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Construir query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && ['admin', 'user', 'developer'].includes(role)) {
      query.role = role;
    }
    
    // Contar total de usuários para paginação
    const total = await User.countDocuments(query);
    
    // Buscar usuários paginados
    const users = await User.find(query)
      .select('-password')
      .sort({ [sort]: direction === 'asc' ? 1 : -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    return NextResponse.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se é administrador
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso restrito a administradores' }, { status: 403 });
    }
    
    // Obter dados
    const data = await req.json();
    const { userId, role } = data;
    
    // Verificar se role é válido (admin, user ou developer)
    if (!userId || !role || !['admin', 'user', 'developer'].includes(role)) {
      console.log(`Papel inválido: "${role}". Valores permitidos: admin, user, developer`);
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Tentar encontrar o usuário para mostrar informações de debug
    const existingUser = await User.findById(userId).select('role');
    if (existingUser) {
      console.log(`Usuário encontrado. Papel atual: "${existingUser.role}". Novo papel: "${role}"`);
    } else {
      console.log(`Usuário com ID ${userId} não encontrado`);
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { role: role }, // Usando o valor exato passado pelo cliente
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    console.log(`Usuário ${userId} atualizado com sucesso. Novo papel: "${updatedUser.role}"`);
    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar usuário' },
      { status: 500 }
    );
  }
} 