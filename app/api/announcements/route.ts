import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/app/lib/mongodb';
import Announcement from '@/app/models/Announcement';
import User from '@/app/lib/models/user';

// GET - Obter todos os anúncios
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Obter anúncios ordenados por data de criação (mais recentes primeiro)
    const announcements = await Announcement.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    // Buscar as imagens atualizadas dos autores
    const authorIds = [...new Set(announcements.map(a => a.authorId))];
    const authors = await User.find({ _id: { $in: authorIds } })
      .select('_id profileImage')
      .lean();
    
    // Criar um mapa de ID do autor para a imagem de perfil
    const authorImagesMap = {};
    authors.forEach(author => {
      if (author._id && author.profileImage) {
        authorImagesMap[author._id.toString()] = author.profileImage;
      }
    });
    
    // Atualizar as imagens dos autores nos anúncios
    const updatedAnnouncements = announcements.map(announcement => {
      const authorId = announcement.authorId?.toString();
      if (authorId && authorImagesMap[authorId]) {
        return {
          ...announcement,
          authorImage: authorImagesMap[authorId]
        };
      }
      return announcement;
    });
    
    return NextResponse.json({ announcements: updatedAnnouncements }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar anúncios' },
      { status: 500 }
    );
  }
}

// POST - Criar um novo anúncio (apenas para admins)
export async function POST(req: NextRequest) {
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
    
    // Debug: Verificar os dados recebidos
    console.log('Dados recebidos na API POST:', {
      title: data.title,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl
    });
    
    // Validar dados
    if (!data.title || !data.content) {
      return NextResponse.json(
        { message: 'Título e conteúdo são obrigatórios' },
        { status: 400 }
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
    
    // Criar o anúncio
    const announcement = await Announcement.create({
      title: data.title,
      content: data.content.replace(/\n\n+/g, '\n\n'), // Normalizar quebras de linha múltiplas
      authorId: userData.id,
      authorName: userData.name || userData.username,
      authorRole: userData.role,
      authorImage: userImage,
      imageUrl: data.imageUrl,
      videoUrl: data.videoUrl,
    });
    
    return NextResponse.json(
      { message: 'Anúncio criado com sucesso', announcement },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar anúncio:', error);
    return NextResponse.json(
      { message: 'Erro ao criar anúncio' },
      { status: 500 }
    );
  }
}
