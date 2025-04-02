import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/lib/mongodb';
import StockItem from '@/app/lib/models/stock';
import Product from '@/app/lib/models/product';
import User from '@/app/lib/models/user';
import { checkAuth } from '@/app/lib/auth';
import mongoose from 'mongoose';

// GET /api/admin/assignments - Obter histórico de atribuições de produtos
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissões
    console.log('Verificando autenticação para histórico de atribuições');
    const authResult = await checkAuth(request);
    
    if (!authResult.isAuthenticated || !authResult.user) {
      console.log('Usuário não autenticado');
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }
    
    const user = authResult.user;
    
    // Verificar se é admin
    if (user.role !== 'admin') {
      console.log('Acesso negado: usuário não é admin');
      return NextResponse.json({ message: 'Acesso proibido' }, { status: 403 });
    }
    
    console.log('Usuário autenticado como admin:', user._id);
    await connectDB();
    
    // Obter parâmetros da URL
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20'); // Padrão: 20 registros
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;
    
    console.log(`Buscando atribuições com limit=${limit}, page=${page}, skip=${skip}`);
    
    // Buscar itens atribuídos (que tenham assignedTo e assignedAt)
    const assignments = await StockItem.find({
      isUsed: true,
      assignedTo: { $exists: true, $ne: null },
      assignedAt: { $exists: true, $ne: null }
    })
    .sort({ assignedAt: -1 }) // Mais recentes primeiro
    .skip(skip)
    .limit(limit)
    .populate('product', 'name slug')
    .populate('assignedTo', 'username email name')
    .lean();
    
    console.log(`Encontradas ${assignments.length} atribuições`);
    
    // Total para paginação
    const total = await StockItem.countDocuments({
      isUsed: true,
      assignedTo: { $exists: true, $ne: null },
      assignedAt: { $exists: true, $ne: null }
    });
    
    // Coletar todos os IDs de administradores que atribuíram produtos
    const adminIds = assignments
      .filter(a => a.metadata?.assignedBy && typeof a.metadata.assignedBy === 'string' && mongoose.Types.ObjectId.isValid(a.metadata.assignedBy))
      .map(a => a.metadata.assignedBy);
    
    // Buscar informações dos administradores
    const admins = adminIds.length > 0 
      ? await User.find({ _id: { $in: adminIds } })
          .select('_id username email')
          .lean()
      : [];
    
    // Criar um mapa de ID para objeto de admin
    const adminMap = admins.reduce((map, admin) => {
      map[admin._id.toString()] = admin;
      return map;
    }, {});
    
    // Buscar informações das variantes dos produtos
    // Como as variantes são armazenadas dentro do documento do produto,
    // precisamos buscar os produtos completos
    const productIds = [...new Set(assignments
      .filter(item => item.product && item.product._id) // Filtrar itens sem produto
      .map(item => item.product._id))];
    
    // Verificar se há IDs de produtos para buscar
    const products = productIds.length > 0 
      ? await Product.find({ _id: { $in: productIds } }).lean()
      : [];
    
    // Mapeamento de ID de produto para o documento completo
    const productMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});
    
    // Formatar os resultados para incluir detalhes da variante e do admin que atribuiu
    const formattedAssignments = assignments.map(assignment => {
      // Verificações de segurança para evitar erros
      if (!assignment) {
        console.warn('Encontrada uma atribuição inválida/nula na lista');
        return null; // Será filtrado depois
      }

      // Verificar se o produto existe
      const hasProduct = assignment.product && assignment.product._id;
      const productId = hasProduct ? assignment.product._id.toString() : null;
      const productDoc = productId ? productMap[productId] : null;
      
      // Verificar se a variante existe de forma segura
      let variant = null;
      try {
        if (productDoc?.variants && Array.isArray(productDoc.variants) && assignment.variant) {
          variant = productDoc.variants.find(v => 
            v && v._id && v._id.toString() === assignment.variant
          );
        }
      } catch (error) {
        console.warn('Erro ao processar variante:', error);
      }

      // Determinar o administrador que fez a atribuição com verificações de segurança
      let assignedBy = { username: 'Sistema' };
      
      try {
        if (assignment.metadata?.assignedBy) {
          if (typeof assignment.metadata.assignedBy === 'string') {
            // É um ID de administrador, buscar no mapa
            const adminId = assignment.metadata.assignedBy;
            if (adminId && adminMap[adminId]) {
              const admin = adminMap[adminId];
              if (admin) {
                assignedBy = {
                  _id: admin._id,
                  username: admin.username || 'Desconhecido',
                  email: admin.email || ''
                };
              }
            }
          } else if (typeof assignment.metadata.assignedBy === 'object' && assignment.metadata.assignedBy !== null) {
            // Já é um objeto preenchido
            const adminObj = assignment.metadata.assignedBy;
            assignedBy = {
              _id: adminObj._id,
              username: adminObj.username || 'Desconhecido',
              email: adminObj.email || ''
            };
          }
        }
      } catch (error) {
        console.warn('Erro ao processar administrador:', error);
      }
      
      return {
        _id: assignment._id || 'id-desconhecido',
        code: assignment.code || 'sem-codigo',
        assignedAt: assignment.assignedAt || new Date().toISOString(),
        product: hasProduct ? {
          _id: assignment.product._id,
          name: assignment.product.name || 'Sem nome',
          slug: assignment.product.slug || ''
        } : {
          _id: 'produto-removido',
          name: 'Produto removido',
          slug: ''
        },
        variant: variant ? {
          _id: variant._id,
          name: variant.name || 'Sem nome',
          price: variant.price || 0
        } : { 
          name: assignment.variant ? 'Variante não encontrada' : 'Padrão'
        },
        user: assignment.assignedTo ? {
          _id: assignment.assignedTo._id || 'usuario-desconhecido',
          username: assignment.assignedTo.username || 'Usuário desconhecido',
          email: assignment.assignedTo.email || '',
          name: assignment.assignedTo.name || ''
        } : null,
        assignedBy: assignedBy,
        metadata: assignment.metadata || {}
      };
    });
    
    // Filtrar resultados nulos
    const filteredAssignments = formattedAssignments.filter(a => a !== null);
    
    return NextResponse.json({
      assignments: filteredAssignments,
      pagination: {
        total: Math.max(total, filteredAssignments.length), // Garantir que total não seja menor que o número de itens
        page,
        limit,
        pages: Math.ceil(total / limit) || 1 // Garantir pelo menos 1 página
      }
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de atribuições:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar histórico de atribuições' },
      { status: 500 }
    );
  }
} 