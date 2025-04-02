import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/app/lib/auth';
import connectDB from '@/app/lib/db/mongodb';
import Cart from '@/app/lib/models/cart';

// PATCH - Atualizar quantidade de um item específico
export async function PATCH(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await checkAuth(req);
    if (!authResult.isAuthenticated) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    await connectDB();
    const userId = authResult.user?.id;
    const { itemId, quantity } = await req.json();

    if (!itemId || typeof quantity !== 'number' || quantity < 1) {
      return NextResponse.json(
        { error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    // Encontrar carrinho do usuário
    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return NextResponse.json(
        { error: 'Carrinho não encontrado' },
        { status: 404 }
      );
    }

    // Encontrar o item no carrinho
    const itemIndex = userCart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Item não encontrado no carrinho' },
        { status: 404 }
      );
    }

    // Atualizar a quantidade
    userCart.items[itemIndex].quantity = quantity;
    userCart.items[itemIndex].updatedAt = new Date();
    userCart.lastUpdated = new Date();
    
    try {
      await userCart.save();
    } catch (saveError) {
      console.error('Erro ao salvar alterações no carrinho:', saveError);
      return NextResponse.json(
        { error: 'Erro ao salvar alterações no carrinho' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Quantidade atualizada com sucesso',
      item: userCart.items[itemIndex]
    });
  } catch (error) {
    console.error('Erro ao atualizar quantidade do item:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar quantidade' },
      { status: 500 }
    );
  }
} 