import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/product';
import Category from '@/app/lib/models/category';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '@/app/lib/models/user';

// Segredo usado para verificar os tokens JWT
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

// Função para verificar autenticação
async function checkAuth(request: NextRequest) {
  // Obter o token diretamente do cookie da request
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }
  
  try {
    // Verificar e decodificar o token JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string, role?: string };

    if (!decoded || !decoded.id) {
      return null;
    }

    // Conectar ao banco de dados
    await connectDB();

    // Buscar o usuário no banco de dados
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return null;
  }
}

// GET /api/products/[id] - Buscar um produto pelo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Aguardar os parâmetros antes de usá-los - correção do erro
    const { id } = await params;
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    // Importar a categoria novamente para garantir que o esquema esteja registrado
    const Category = mongoose.models.Category || 
                     mongoose.model('Category', require('@/app/lib/models/category').default.schema);
    
    // Buscar o produto
    const product = await Product.findById(id)
      .select('-__v')
      .populate('category', 'name slug')
      .lean();
    
    if (!product) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Erro ao buscar produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao buscar produto' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Atualizar um produto (apenas admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação e permissões
    const user = await checkAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso proibido' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Aguardar os parâmetros antes de usá-los - correção do erro
    const { id } = await params;
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    // Buscar o produto para verificar se existe
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Parse do FormData
    const formData = await request.formData();
    
    // Extrair dados do produto
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const shortDescription = formData.get('shortDescription') as string;
    const categoryId = formData.get('category') as string;
    const featured = formData.get('featured') === 'true';
    const status = formData.get('status') as string;
    
    // Verificar se o status é válido
    if (status && !['indetectavel', 'detectavel', 'manutencao', 'beta'].includes(status)) {
      return NextResponse.json(
        { message: 'Status inválido' },
        { status: 400 }
      );
    }
    
    // Extrair variantes
    const variantsJson = formData.get('variants') as string;
    let variants = [];
    
    try {
      variants = JSON.parse(variantsJson || '[]');
    } catch (e) {
      console.error('Erro ao analisar variantes:', e);
      return NextResponse.json(
        { message: 'Formato de variantes inválido' },
        { status: 400 }
      );
    }
    
    // Validações
    if (!name || !description) {
      return NextResponse.json(
        { message: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }
    
    if (!variants || variants.length === 0) {
      return NextResponse.json(
        { message: 'Pelo menos uma variante é obrigatória' },
        { status: 400 }
      );
    }
    
    // Extrair requisitos
    const requirements: string[] = [];
    
    // Mapeamento de chaves em inglês para português
    const keyMapping: Record<string, string> = {
      'operating_system': 'Sistema Operacional',
      'processor': 'Processador',
      'memory': 'Memória',
      'graphics': 'Placa de Vídeo',
      'storage': 'Armazenamento',
      'additional_notes': 'Notas Adicionais',
      'sistema_operacional': 'Sistema Operacional',
      'processador': 'Processador',
      'memoria': 'Memória',
      'placa_grafica': 'Placa de Vídeo',
      'armazenamento': 'Armazenamento',
      'notas_adicionais': 'Notas Adicionais'
    };
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('requirements[') && value) {
        // Extrair o nome do campo original do formato requirements[campo]
        const matches = key.match(/requirements\[(.*?)\]/);
        if (matches && matches[1]) {
          const fieldName = matches[1];
          const label = keyMapping[fieldName] || fieldName;
          requirements.push(`${label}: ${value}`);
        } else {
          requirements.push(value as string);
        }
      }
    }
    
    // Se o nome foi alterado, gerar novo slug e verificar duplicação
    let slug = product.slug;
    
    if (name !== product.name) {
      slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Verificar se o novo slug já existe em outro produto
      const existingProduct = await Product.findOne({ 
        slug, 
        _id: { $ne: id } 
      });
      
      if (existingProduct) {
        return NextResponse.json(
          { message: 'Já existe um produto com este nome/slug' },
          { status: 400 }
        );
      }
    }
    
    // Verificar se a categoria é válida
    let category;
    if (categoryId) {
      // Verificar se é um ID válido
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        console.log('ID de categoria inválido:', categoryId);
        return NextResponse.json(
          { message: 'ID de categoria inválido' },
          { status: 400 }
        );
      }
      category = new mongoose.Types.ObjectId(categoryId);
    } else {
      // Se não tiver categoria, usar null ou manter a atual
      category = product.category;
    }
    
    // Processar imagens mantidas e novas
    const keepImages = formData.getAll('keepImages[]').map(img => img.toString());
    const newImages: string[] = [...keepImages];
    
    // Adicionar novas imagens enviadas via upload
    let imageIndex = 0;
    
    while (formData.get(`image-${imageIndex}`) !== null) {
      const file = formData.get(`image-${imageIndex}`) as File;
      
      if (file && file.type.startsWith('image/')) {
        // Em uma aplicação real, você faria upload para um serviço de armazenamento
        // como AWS S3, Cloudinary, etc. Aqui, estamos simulando um caminho de imagem.
        
        // Criar um nome de arquivo único baseado no timestamp + nome original
        const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const imagePath = `/uploads/products/${fileName}`;
        
        // Em um servidor real, salvaríamos o arquivo aqui.
        // Para este exemplo, apenas adicionamos o caminho ao array
        newImages.push(imagePath);
      }
      
      imageIndex++;
    }
    
    // Adicionar URLs de imagem
    const imageUrls = formData.getAll('imageUrls') as string[];
    if (imageUrls && imageUrls.length > 0) {
      newImages.push(...imageUrls.filter(url => url.trim() !== ''));
    }
    
    if (newImages.length === 0) {
      return NextResponse.json(
        { message: 'Pelo menos uma imagem é obrigatória' },
        { status: 400 }
      );
    }
    
    // Atualizar o produto
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        name,
        slug,
        description,
        shortDescription,
        images: newImages,
        category,
        variants,
        featured,
        requirements,
        status,
      },
      { new: true }
    );
    
    return NextResponse.json({
      message: 'Produto atualizado com sucesso',
      product: updatedProduct,
    });
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao atualizar produto' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Excluir um produto (apenas admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação e permissões
    const user = await checkAuth(request);
    
    if (!user) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'Acesso proibido' },
        { status: 403 }
      );
    }
    
    await connectDB();
    
    // Aguardar os parâmetros antes de usá-los - correção do erro
    const { id } = await params;
    
    // Verificar se o ID é válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'ID de produto inválido' },
        { status: 400 }
      );
    }
    
    // Buscar o produto para verificar se existe
    const product = await Product.findById(id);
    
    if (!product) {
      return NextResponse.json(
        { message: 'Produto não encontrado' },
        { status: 404 }
      );
    }
    
    // Na vida real, aqui você também removeria as imagens do armazenamento
    // e possivelmente verificaria se o produto está em algum pedido
    
    // Excluir o produto
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({
      message: 'Produto excluído com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao excluir produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao excluir produto' },
      { status: 500 }
    );
  }
} 