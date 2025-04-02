import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import connectDB from '@/app/lib/db/mongodb';
import Cart from '@/app/lib/models/cart';
import { Types } from 'mongoose';

// GET - Obter o carrinho do usuário
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    const userId = authResult.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }

    try {
      // Buscar carrinho do usuário
      const userCart = await Cart.findOne({ userId });

      if (!userCart) {
        // Se não existir carrinho, retornar um vazio
        return NextResponse.json({ items: [] });
      }

      return NextResponse.json(userCart);
    } catch (dbError) {
      console.error('Erro no banco de dados ao buscar carrinho:', dbError);
      return NextResponse.json(
        { error: 'Erro ao acessar banco de dados' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao recuperar carrinho do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar carrinho' },
      { status: 500 }
    );
  }
}

// POST - Adicionar/Atualizar carrinho
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    const userId = authResult.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }

    let cartData;
    try {
      cartData = await req.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Formato JSON inválido' },
        { status: 400 }
      );
    }

    if (!cartData || !Array.isArray(cartData.items)) {
      return NextResponse.json(
        { error: 'Dados do carrinho inválidos' },
        { status: 400 }
      );
    }

    // Sanitizar e validar itens do carrinho
    const sanitizedItems = cartData.items
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        productId: item.productId || '',
        productName: item.productName || '',
        productImage: item.productImage || '',
        variantId: item.variantId || '',
        variantName: item.variantName || '',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        stock: item.stock !== undefined ? Number(item.stock) : null,
        hasVariants: Boolean(item.hasVariants)
      }))
      .filter(item => item.productId && item.variantId);

    try {
      // Procurar carrinho existente ou criar um novo
      let userCart = await Cart.findOne({ userId });

      if (userCart) {
        // Atualizar carrinho existente
        userCart.items = sanitizedItems;
        userCart.lastUpdated = new Date();
        await userCart.save();
      } else {
        // Criar novo carrinho
        userCart = await Cart.create({
          userId,
          items: sanitizedItems,
          lastUpdated: new Date()
        });
      }

      return NextResponse.json(userCart);
    } catch (dbError) {
      console.error('Erro no banco de dados ao salvar carrinho:', dbError);
      return NextResponse.json(
        { error: 'Erro ao salvar no banco de dados', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao salvar carrinho do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar carrinho' },
      { status: 500 }
    );
  }
}

// PUT - Adicionar item ao carrinho
export async function PUT(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    const userId = authResult.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }

    let reqData;
    try {
      reqData = await req.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Formato JSON inválido' },
        { status: 400 }
      );
    }

    const { item } = reqData;
    if (!item || !item.productId || !item.variantId) {
      return NextResponse.json(
        { error: 'Dados do item inválidos' },
        { status: 400 }
      );
    }

    try {
      // Certificar-se que os IDs são válidos
      const productId = Types.ObjectId.isValid(item.productId) ? 
        new Types.ObjectId(item.productId) : item.productId;
      // Não converter variantId para ObjectId, aceitar como está
      const variantId = item.variantId;

      // Encontrar ou criar carrinho
      let userCart = await Cart.findOne({ userId });
      if (!userCart) {
        userCart = new Cart({ userId, items: [] });
      }

      // Verificar se o item já existe no carrinho
      const existingItemIndex = userCart.items.findIndex(
        i => i.productId.toString() === item.productId.toString() && 
             i.variantId.toString() === item.variantId.toString()
      );

      if (existingItemIndex >= 0) {
        // Atualizar item existente
        userCart.items[existingItemIndex].quantity += Number(item.quantity) || 1;
        userCart.items[existingItemIndex].updatedAt = new Date();
      } else {
        // Adicionar novo item
        userCart.items.push({
          ...item,
          productId,
          variantId,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          updatedAt: new Date()
        });
      }

      userCart.lastUpdated = new Date();
      await userCart.save();

      return NextResponse.json(userCart);
    } catch (dbError) {
      console.error('Erro no banco de dados ao adicionar item:', dbError);
      return NextResponse.json(
        { error: 'Erro ao adicionar item no banco de dados', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao adicionar item ao carrinho:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar item ao carrinho' },
      { status: 500 }
    );
  }
}

// DELETE - Remover item do carrinho ou limpar carrinho
export async function DELETE(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    const userId = authResult.user?.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'ID de usuário inválido' }, { status: 400 });
    }
    
    // Verificar parâmetros da URL para saber a ação
    const url = new URL(req.url);
    const clearCart = url.searchParams.get('clearCart');
    const itemId = url.searchParams.get('itemId');
    
    try {
      // Encontrar carrinho do usuário
      const userCart = await Cart.findOne({ userId });
      
      if (!userCart) {
        return NextResponse.json({ message: 'Carrinho não encontrado' });
      }
      
      if (clearCart === 'true') {
        // Limpar o carrinho
        userCart.items = [];
        userCart.lastUpdated = new Date();
        await userCart.save();
        return NextResponse.json({ message: 'Carrinho limpo com sucesso' });
      } else if (itemId) {
        // Remover item específico
        userCart.items = userCart.items.filter(
          item => item._id.toString() !== itemId
        );
        userCart.lastUpdated = new Date();
        await userCart.save();
        return NextResponse.json({ message: 'Item removido com sucesso' });
      } else {
        return NextResponse.json(
          { error: 'Operação não especificada' },
          { status: 400 }
        );
      }
    } catch (dbError) {
      console.error('Erro no banco de dados ao modificar carrinho:', dbError);
      return NextResponse.json(
        { error: 'Erro ao modificar carrinho no banco de dados', details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao remover item do carrinho:', error);
    return NextResponse.json(
      { error: 'Erro ao modificar carrinho' },
      { status: 500 }
    );
  }
} 