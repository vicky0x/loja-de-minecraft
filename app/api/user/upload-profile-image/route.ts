import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import connectDB from '@/app/lib/db/mongodb';
import User from '@/app/lib/models/user';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Order from '@/app/lib/models/order';

// Verificar se já existe o modelo de imagem, se não existir, criar
let Image;
try {
  Image = mongoose.model('Image');
} catch (error) {
  // Criar esquema para armazenar imagens
  const imageSchema = new mongoose.Schema({
    filename: String,
    contentType: String,
    data: Buffer,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  });
  
  Image = mongoose.model('Image', imageSchema);
}

// Função para obter estatísticas do usuário
async function getUserStats(userId: string) {
  try {
    // Buscar todos os pedidos do usuário
    const orders = await Order.find({
      user: userId,
      'paymentInfo.status': 'paid' // Apenas pedidos pagos
    });
    
    // Calcular estatísticas
    const count = orders.length;
    let total = 0;
    const productIds = new Set(); // Para contar produtos únicos
    
    for (const order of orders) {
      total += order.totalAmount;
      // Adicionar os IDs de produtos no Set para contagem única
      order.orderItems.forEach(item => productIds.add(item.product.toString()));
    }
    
    return {
      count,
      total,
      products: productIds.size
    };
  } catch (error) {
    console.error("Erro ao calcular estatísticas do usuário:", error);
    return {
      count: 0,
      total: 0,
      products: 0
    };
  }
}

export async function POST(req: NextRequest) {
  console.log('Recebida requisição para upload de imagem de perfil');
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    console.log('Resultado da autenticação:', JSON.stringify({
      isAuthenticated: authResult.isAuthenticated,
      userAvailable: !!authResult.user,
      userId: authResult.user?._id || authResult.user?.id || null
    }, null, 2));
    
    if (!authResult.isAuthenticated) {
      console.log('Usuário não autenticado');
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Usando a propriedade 'id' que agora está garantida pela função checkAuth
    const userId = authResult.user._id || authResult.user.id;
    console.log('ID do usuário autenticado:', userId);
    
    if (!userId) {
      console.error('ID do usuário não encontrado no token de autenticação');
      return NextResponse.json(
        { error: 'Erro na autenticação: ID do usuário indisponível' },
        { status: 401 }
      );
    }
    
    // Processar o upload de arquivo    
    const formData = await req.formData();
    const file = formData.get('profileImage') as File;
    
    if (!file) {
      console.log('Nenhuma imagem encontrada no formulário');
      return NextResponse.json(
        { error: 'Nenhuma imagem fornecida' },
        { status: 400 }
      );
    }
    
    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      console.log('Tipo de arquivo inválido:', file.type);
      return NextResponse.json(
        { error: 'O arquivo deve ser uma imagem' },
        { status: 400 }
      );
    }
    
    // Verificar tamanho (2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.log('Tamanho do arquivo excede o limite:', file.size);
      return NextResponse.json(
        { error: 'A imagem deve ter no máximo 2MB' },
        { status: 400 }
      );
    }
    
    // Ler os bytes da imagem
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Gerar um ID único para a imagem
    const imageId = uuidv4();
    const filename = `${imageId}.${file.type.split('/')[1]}`;
    
    console.log('Conectando ao banco de dados...');
    await connectDB();
    
    // Verificar se o usuário existe no banco de dados
    const userExists = await User.findById(userId);
    if (!userExists) {
      console.error('Usuário não encontrado no banco de dados. ID utilizado:', userId);
      return NextResponse.json(
        { error: 'Usuário não encontrado no banco de dados' },
        { status: 404 }
      );
    }
    
    // Armazenar imagem no MongoDB
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const newImage = new Image({
      filename: filename,
      contentType: file.type,
      data: buffer,
      userId: userObjectId
    });
    
    console.log('Salvando imagem no MongoDB...');
    await newImage.save();
    console.log('Imagem salva com sucesso no MongoDB, ID:', newImage._id);
    
    // Criar URL para acessar a imagem
    const imageUrl = `/api/images/${imageId}`;
    
    // Buscar estatísticas atualizadas do usuário
    console.log('Buscando estatísticas atualizadas do usuário...');
    const userStats = await getUserStats(userId.toString());
    
    // Atualizar o usuário no banco de dados com a nova imagem e estatísticas atualizadas
    console.log('Atualizando usuário com ID:', userId);
    console.log('URL da imagem a ser salva:', imageUrl);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { 
        profileImage: imageUrl,
        orders: userStats
      },
      { new: true }
    );
    
    if (!updatedUser) {
      console.log('Falha ao atualizar usuário. ID utilizado:', userId);
      // Verificar se o ID está em um formato válido
      const validObjectId = mongoose.isValidObjectId(userId);
      console.log('O ID é um ObjectId válido?', validObjectId);
      
      return NextResponse.json(
        { error: 'Erro ao atualizar usuário' },
        { status: 500 }
      );
    }
    
    console.log('Perfil atualizado com sucesso. Usuário:', updatedUser._id);
    
    // Determinar a URL base para gerar URL absoluta
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    const absoluteImageUrl = `${protocol}://${host}${imageUrl}`;
    
    console.log('URL absoluta da imagem:', absoluteImageUrl);
    
    // Criar resposta com cabeçalhos para evitar cache
    const response = NextResponse.json(
      { 
        message: 'Imagem de perfil atualizada com sucesso',
        imageUrl: absoluteImageUrl,  // Retornar URL absoluta em vez de relativa
        relativeUrl: imageUrl,       // Também fornecer URL relativa se o cliente precisar
        userData: {
          profileImage: absoluteImageUrl,
          stats: userStats,
          role: updatedUser.role
        }
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
    
    return response;
  } catch (error) {
    console.error('Erro ao processar upload de imagem:', error);
    return NextResponse.json(
      { error: 'Erro ao processar upload de imagem' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Usando a propriedade 'id' de forma consistente
    const userId = authResult.user.id;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'ID do usuário não encontrado' },
        { status: 401 }
      );
    }
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Obter o usuário para verificar a imagem atual
    const user = await User.findById(userId);
    if (user && user.profileImage) {
      // Extrair o ID da imagem da URL
      const imageId = user.profileImage.split('/').pop();
      
      // Remover a imagem do MongoDB se existir
      if (imageId) {
        await Image.deleteOne({ filename: new RegExp(`^${imageId}`) });
      }
    }
    
    // Remover a referência à imagem de perfil
    await User.findByIdAndUpdate(userId, { profileImage: '' });
    
    return NextResponse.json(
      { message: 'Imagem de perfil removida com sucesso' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao remover imagem de perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao remover imagem de perfil' },
      { status: 500 }
    );
  }
} 