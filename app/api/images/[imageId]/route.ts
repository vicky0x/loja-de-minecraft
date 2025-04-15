import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import mongoose from 'mongoose';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { imageId: string } }
) {
  try {
    // Obter parâmetros com await
    const imageParams = await params;
    console.log('Buscando imagem:', imageParams.imageId);
    
    // Conectar ao banco de dados
    await connectDB();
    
    // Validar ID da imagem
    const imageId = imageParams.imageId;
    
    if (!imageId) {
      return NextResponse.json(
        { error: 'ID da imagem não fornecido' },
        { status: 400 }
      );
    }
    
    // Buscar a imagem pelo ID
    const prefix = `${imageId}.`;
    const image = await Image.findOne({
      filename: { $regex: new RegExp(`^${prefix}`) }
    });
    
    if (!image) {
      console.log('Imagem não encontrada:', imageId);
      return NextResponse.json(
        { error: 'Imagem não encontrada' },
        { status: 404 }
      );
    }
    
    console.log('Imagem encontrada:', image.filename, 'tipo:', image.contentType);
    
    // Criar e enviar a resposta com a imagem
    const response = new NextResponse(image.data);
    
    // Definir cabeçalhos adequados
    response.headers.set('Content-Type', image.contentType);
    response.headers.set('Content-Length', image.data.length.toString());
    response.headers.set('Cache-Control', 'public, max-age=31536000'); // 1 ano
    
    // Adicionar cabeçalhos CORS
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    return response;
  } catch (error) {
    console.error('Erro ao buscar imagem:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar a imagem' },
      { status: 500 }
    );
  }
} 