import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import Product from '@/app/lib/models/product';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '@/app/lib/models/user';
import Category from '@/app/lib/models/category';

// JWT Secret para autenticação
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('ERRO: JWT_SECRET não está definido nas variáveis de ambiente');
  throw new Error('JWT_SECRET não configurado');
}

// GET /api/products - Listar todos os produtos com opções de filtro e ordenação
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Parâmetros de consulta
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'createdAt';
    const dir = searchParams.get('dir') || 'desc';
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const featured = searchParams.get('featured');
    
    // Construir filtro
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
      ];
    }
    
    if (category) {
      // Verificar se é um ObjectId válido, caso contrário, tratar como slug
      try {
        if (mongoose.Types.ObjectId.isValid(category)) {
          filter.category = new mongoose.Types.ObjectId(category);
        } else {
          // Buscar categoria pelo slug
          const categoryDoc = await Category.findOne({ slug: category.toLowerCase() }).exec();
          
          if (categoryDoc) {
            filter.category = categoryDoc._id;
          } else {
            // Se não encontrar pelo slug, tentar pelo nome (case insensitive)
            const categoryByName = await Category.findOne({ 
              name: { $regex: new RegExp(category, 'i') } 
            }).exec();
            
            if (categoryByName) {
              filter.category = categoryByName._id;
            } else {
              // Fallback: se não encontrar correspondência exata, buscar produtos que tenham
              // a categoria no nome ou descrição
              filter.$or = filter.$or || [];
              filter.$or.push(
                { name: { $regex: category, $options: 'i' } },
                { description: { $regex: category, $options: 'i' } }
              );
            }
          }
        }
      } catch (err) {
        console.error('Erro ao processar filtro de categoria:', err);
        // Em caso de erro, manter o comportamento original
        if (mongoose.Types.ObjectId.isValid(category)) {
          filter.category = new mongoose.Types.ObjectId(category);
        }
      }
    }
    
    if (featured !== null && featured !== undefined) {
      filter.featured = featured === 'true';
    }
    
    // Ordenação
    const sortOptions: any = {};
    sortOptions[sort] = dir === 'asc' ? 1 : -1;
    
    // Paginação
    const skip = (page - 1) * limit;
    
    // Consulta ao banco de dados
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .select('-__v')
      .lean();
    
    // Contar o total de documentos para paginação
    const total = await Product.countDocuments(filter);
    
    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Erro ao listar produtos:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao listar produtos' },
      { status: 500 }
    );
  }
}

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

// POST /api/products - Criar um novo produto (apenas admin)
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação e permissões diretamente
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
    
    // Parse dos dados JSON
    const body = await request.json();
    
    // Extrair dados do produto
    const { 
      name, 
      description, 
      short_description: shortDescription,
      category: categoryId,
      is_featured: featured,
      variants,
      images,
      requirements: reqData,
      price,
      stock,
      status
    } = body;
    
    // Processar os requisitos adequadamente
    let requirements: string[] = [];
    
    // Verificar se reqData existe e processá-lo corretamente
    if (reqData) {
      // Se for uma string de JSON, tentar fazer parse
      if (typeof reqData === 'string') {
        try {
          const parsedReqs = JSON.parse(reqData);
          
          // Se for um objeto, extrair valores em formato de string
          if (typeof parsedReqs === 'object' && !Array.isArray(parsedReqs)) {
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
            
            // Extrair valores do objeto como strings formatadas, usando nome em português
            Object.entries(parsedReqs).forEach(([key, value]) => {
              if (value && typeof value === 'string' && value.trim()) {
                const labelKey = keyMapping[key] || key;
                requirements.push(`${labelKey}: ${value}`);
              }
            });
          } 
          // Se for um array de objetos, transformar em array de strings
          else if (Array.isArray(parsedReqs)) {
            parsedReqs.forEach(req => {
              if (typeof req === 'object') {
                Object.entries(req).forEach(([key, value]) => {
                  if (value && typeof value === 'string' && value.trim()) {
                    requirements.push(`${key}: ${value}`);
                  }
                });
              } else if (typeof req === 'string' && req.trim()) {
                requirements.push(req);
              }
            });
          }
        } catch (e) {
          // Se falhar no parse, usar como string direta
          if (reqData.trim()) {
            requirements.push(reqData);
          }
        }
      } 
      // Se for array, usar diretamente
      else if (Array.isArray(reqData)) {
        requirements = reqData.filter(req => typeof req === 'string' && req.trim());
      }
    }
    
    // Validações
    if (!name || !description) {
      return NextResponse.json(
        { message: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      );
    }
    
    // Verificar se tem variantes ou preço direto
    const hasVariants = variants && variants.length > 0;
    const hasDirectPrice = price !== undefined;
    
    if (!hasVariants && !hasDirectPrice) {
      return NextResponse.json(
        { message: 'É necessário informar variantes ou um preço diretamente' },
        { status: 400 }
      );
    }
    
    if (!images || images.length === 0) {
      return NextResponse.json(
        { message: 'Pelo menos uma imagem é obrigatória' },
        { status: 400 }
      );
    }
    
    // Gerar slug a partir do nome
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Verificar se o slug já existe
    const existingProduct = await Product.findOne({ slug });
    
    if (existingProduct) {
      return NextResponse.json(
        { message: 'Já existe um produto com este nome/slug' },
        { status: 400 }
      );
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
      // Se não tiver categoria, usar null
      category = null;
    }
    
    // Criar novo produto
    const newProduct = new Product({
      name: slug,
      slug,
      description,
      shortDescription,
      category: categoryId ? new mongoose.Types.ObjectId(categoryId) : null,
      images,
      variants: hasVariants ? variants : [],
      requirements,
      featured: featured === 'true' || featured === true,
      price: hasDirectPrice ? price : undefined,
      stock: hasDirectPrice ? (stock !== undefined ? Number(stock) : null) : undefined,
      status
    });
    
    await newProduct.save();
    
    return NextResponse.json({
      message: 'Produto criado com sucesso',
      product: newProduct,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    
    return NextResponse.json(
      { message: error.message || 'Falha ao criar produto' },
      { status: 500 }
    );
  }
} 