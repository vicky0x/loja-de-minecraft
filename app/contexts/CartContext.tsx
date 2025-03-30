'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Definição de tipos
export interface CartItem {
  productId: string;
  productName: string;
  productImage: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  stock: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemsCount: () => number;
}

// Criação do contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider do carrinho
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Carregar itens do localStorage ao iniciar
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem('cartItems');
      if (storedItems) {
        try {
          const parsedItems = JSON.parse(storedItems);
          // Verificar se os dados são válidos antes de atualizar o estado
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
          } else {
            console.error('Formato de dados do carrinho inválido');
            localStorage.removeItem('cartItems');
          }
        } catch (error) {
          console.error('Erro ao carregar carrinho:', error);
          localStorage.removeItem('cartItems');
        }
      }
    } catch (storageError) {
      // Lidar com possíveis erros de acesso ao localStorage
      console.error('Erro ao acessar localStorage:', storageError);
    }
  }, []);

  // Salvar itens no localStorage quando mudar
  useEffect(() => {
    try {
      localStorage.setItem('cartItems', JSON.stringify(items));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [items]);

  // Adicionar item ao carrinho (ou atualizar se já existir)
  const addItem = (item: CartItem) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(i => i.variantId === item.variantId);
      
      if (existingItemIndex >= 0) {
        // Item já existe, atualizar quantidade
        const newItems = [...currentItems];
        const newQuantity = newItems[existingItemIndex].quantity + item.quantity;
        
        // Garantir que não exceda o estoque disponível
        newItems[existingItemIndex].quantity = Math.min(newQuantity, item.stock);
        return newItems;
      } else {
        // Item novo, adicionar ao carrinho
        return [...currentItems, item];
      }
    });
  };

  // Remover item do carrinho
  const removeItem = (variantId: string) => {
    setItems(currentItems => currentItems.filter(item => item.variantId !== variantId));
  };

  // Atualizar quantidade de um item
  const updateQuantity = (variantId: string, quantity: number) => {
    setItems(currentItems => {
      return currentItems.map(item => {
        if (item.variantId === variantId) {
          // Garantir que a quantidade não seja menor que 1 ou maior que o estoque
          const newQuantity = Math.max(1, Math.min(quantity, item.stock));
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  // Limpar o carrinho
  const clearCart = () => {
    setItems([]);
  };

  // Calcular o total do carrinho
  const getTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Obter o número total de itens no carrinho
  const getItemsCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      getTotal,
      getItemsCount
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
  
  return context;
} 