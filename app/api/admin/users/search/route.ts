import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import User from '@/app/lib/models/user';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/users/search - Buscar usuários por email ou ID
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    // Verificar se o usuário é admin
    if (authResult.user.role !== 'admin') {
      return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
    }
    
    await connectDB();
    
    // Obter termo de pesquisa da URL
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';
    
    console.log('API recebeu termo de busca:', query);
    
    if (!query) {
      return NextResponse.json({ message: 'Termo de pesquisa é obrigatório' }, { status: 400 });
    }
    
    let filter = {};
    
    // Verificar se é um ObjectId válido
    const isValidObjectId = mongoose.Types.ObjectId.isValid(query);
    console.log('O termo é um ObjectId válido?', isValidObjectId);
    
    if (isValidObjectId) {
      // Se for um ID válido, tentamos buscar diretamente por ele
      try {
        const userById = await User.findById(query).select('_id username email name').lean();
        console.log('Busca por ID resultou em:', userById ? 'Usuário encontrado' : 'Nenhum usuário encontrado');
        
        if (userById) {
          return NextResponse.json({ 
            users: [userById],
            count: 1
          });
        }
        
        // Se não encontrou por ID, continue com a busca por email/username
        console.log('Não encontrou por ID, continuando com busca por email/username');
      } catch (err) {
        console.error('Erro ao buscar por ID:', err);
      }
    }
    
    // Pesquisar por email ou username
    filter = {
      $or: [
        { email: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
        // Adicionar busca por nome também
        { name: { $regex: query, $options: 'i' } }
      ]
    };
    
    console.log('Aplicando filtro de busca:', JSON.stringify(filter));
    
    // Buscar usuários limitando a 10 resultados
    const users = await User.find(filter)
      .select('_id username email name')
      .limit(10)
      .lean();
    
    console.log(`Busca completa. Encontrados ${users.length} usuários.`);
    
    if (users.length === 0 && isValidObjectId) {
      console.log('Nenhum resultado encontrado, tentando buscar diretamente com o ID como string');
      // Tenta uma última busca com o ID como string em vez de ObjectId
      const usersByIdString = await User.find({
        $or: [
          { _id: query },
          { email: query },
          { username: query }
        ]
      })
      .select('_id username email name')
      .limit(10)
      .lean();
      
      console.log(`Busca alternativa encontrou ${usersByIdString.length} usuários`);
      
      if (usersByIdString.length > 0) {
        return NextResponse.json({ 
          users: usersByIdString,
          count: usersByIdString.length
        });
      }
    }
    
    return NextResponse.json({ 
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar usuários' },
      { status: 500 }
    );
  }
} 