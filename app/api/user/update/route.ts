import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import { checkAuth } from '@/app/lib/auth';
import User from '@/app/lib/models/user';

export async function PUT(req: NextRequest) {
  console.log('Recebida requisição para atualizar perfil');
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    console.log('Resultado da autenticação:', authResult.isAuthenticated);
    
    if (!authResult.isAuthenticated) {
      console.log('Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const userId = authResult.user.id;
    console.log('ID do usuário autenticado:', userId);
    
    // Obter os dados a serem atualizados
    const data = await req.json();
    console.log('Dados recebidos para atualização:', data);
    
    // Campos permitidos para atualização
    const allowedFields = ['name', 'email', 'password', 'cpf', 'phone', 'address'];
    
    // Filtrando apenas os campos permitidos
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      if (allowedFields.includes(key) && data[key]) {
        updateData[key] = data[key];
      }
    });
    
    console.log('Dados filtrados para atualização:', updateData);
    
    // Verificar se há campos para atualizar
    if (Object.keys(updateData).length === 0) {
      console.log('Nenhum campo válido para atualização');
      return NextResponse.json(
        { error: 'Nenhum campo válido para atualização' },
        { status: 400 }
      );
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Se estiver atualizando o email, verificar se já existe
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email,
        _id: { $ne: userId } // Excluir o próprio usuário da busca
      });
      
      if (existingUser) {
        return NextResponse.json(
          { error: 'Este email já está em uso' },
          { status: 400 }
        );
      }
    }
    
    // Atualizar usuário
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      console.log('Usuário não encontrado no banco de dados');
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }
    
    console.log('Usuário atualizado com sucesso:', updatedUser._id);
    return NextResponse.json({
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    }, { status: 200 });
  } catch (error: any) {
    // Verificar se é um erro de validação do Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      console.error('Erro de validação:', errors);
      return NextResponse.json(
        { error: 'Erro de validação', details: errors },
        { status: 400 }
      );
    }
    
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil' },
      { status: 500 }
    );
  }
} 