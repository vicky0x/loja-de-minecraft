'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Definição de tipos
export interface CartItem {
  productId: string;
  productName: string;
  image: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
}

// Criação do contexto
const CartContext = createContext(undefined as CartContextType | undefined);

// Provider do carrinho
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState([] as CartItem[]);

  // Carregar itens do localStorage ao iniciar
  useEffect(() => {
    const storedItems = localStorage.getItem('cartItems');
    if (storedItems) {
      try {
        setItems(JSON.parse(storedItems));
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
        localStorage.removeItem('cartItems');
      }
    }
  }, []);

  // Salvar itens no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(items));
  }, [items]);

  // Adicionar item ao carrinho (ou atualizar se já existir)
  const addToCart = (item: CartItem) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(
        i => i.productId === item.productId && i.variantId === item.variantId
      );
      
      if (existingItemIndex >= 0) {
        // Item já existe, atualizar quantidade
        const newItems = [...currentItems];
        newItems[existingItemIndex].quantity += item.quantity;
        return newItems;
      } else {
        // Item novo, adicionar ao carrinho
        return [...currentItems, item];
      }
    });
  };

  // Remover item do carrinho
  const removeFromCart = (productId: string, variantId: string) => {
    setItems(currentItems => 
      currentItems.filter(item => 
        !(item.productId === productId && item.variantId === variantId)
      )
    );
  };

  // Atualizar quantidade de um item
  const updateQuantity = (productId: string, variantId: string, quantity: number) => {
    setItems(currentItems => {
      return currentItems.map(item => {
        if (item.productId === productId && item.variantId === variantId) {
          return { ...item, quantity: Math.max(1, quantity) };
        }
        return item;
      });
    });
  };

  // Limpar o carrinho
  const clearCart = () => {
    setItems([]);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

// Hook para usar o carrinho
export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  
  return { 
    cart: context,
    addToCart: context.addToCart,
    removeFromCart: context.removeFromCart,
    updateQuantity: context.updateQuantity,
    clearCart: context.clearCart
  };
} 