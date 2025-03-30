import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Announcement from '@/app/models/Announcement';
import User from '@/app/lib/models/user';

// GET - Obter um anúncio específico
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const announcement = await Announcement.findById(params.id).lean();
    
    if (!announcement) {
      return NextResponse.json(
        { message: 'Anúncio não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ announcement }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar anúncio:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar anúncio' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar um anúncio (apenas para admins)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Verificar autenticação e permissões
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do usuário do localStorage no cliente e enviar no header
    const userData = JSON.parse(authHeader);
    
    // Verificar se o usuário é admin
    if (userData.role !== 'admin') {
      return NextResponse.json(
        { message: 'Permissão negada' },
        { status: 403 }
      );
    }
    
    const data = await req.json();
    
    // Validar dados
    if (!data.title || !data.content) {
      return NextResponse.json(
        { message: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se o anúncio existe
    const existingAnnouncement = await Announcement.findById(params.id);
    
    if (!existingAnnouncement) {
      return NextResponse.json(
        { message: 'Anúncio não encontrado' },
        { status: 404 }
      );
    }
    
    // Buscar informações adicionais do usuário no banco de dados
    let userImage = '';
    try {
      const userDb = await User.findById(userData.id);
      if (userDb && userDb.profileImage) {
        userImage = userDb.profileImage;
      }
    } catch (err) {
      console.error('Erro ao buscar imagem do usuário:', err);
    }
    
    // Atualizar o anúncio
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      params.id,
      {
        title: data.title,
        content: data.content,
        authorImage: userImage || existingAnnouncement.authorImage,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        updatedAt: new Date(),
      },
      { new: true }
    );
    
    return NextResponse.json(
      { message: 'Anúncio atualizado com sucesso', announcement: updatedAnnouncement },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao atualizar anúncio:', error);
    return NextResponse.json(
      { message: 'Erro ao atualizar anúncio' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir um anúncio (apenas para admins)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    // Verificar autenticação e permissões
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Obter dados do usuário do localStorage no cliente e enviar no header
    const userData = JSON.parse(authHeader);
    
    // Verificar se o usuário é admin
    if (userData.role !== 'admin') {
      return NextResponse.json(
        { message: 'Permissão negada' },
        { status: 403 }
      );
    }
    
    // Buscar e excluir o anúncio
    const announcement = await Announcement.findByIdAndDelete(params.id);
    
    if (!announcement) {
      return NextResponse.json(
        { message: 'Anúncio não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { message: 'Anúncio excluído com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir anúncio:', error);
    return NextResponse.json(
      { message: 'Erro ao excluir anúncio' },
      { status: 500 }
    );
  }
}
