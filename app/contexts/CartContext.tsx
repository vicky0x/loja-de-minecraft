'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import toast from 'react-hot-toast';

// Interface para o item no carrinho
interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  stock?: number;
  hasStockIssue?: boolean;
  hasVariants?: boolean; // Indica se o produto tem variantes
}

// Interface para o contexto do carrinho
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  getCartTotal: () => number;
}

// Criar o contexto
const CartContext = createContext<CartContextType | undefined>(undefined);

// Hook personalizado para usar o contexto do carrinho
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Componente provedor do contexto do carrinho
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado para armazenar os itens do carrinho
  const [items, setItems] = useState<CartItem[]>([]);
  // Ref para controlar se o componente está montado
  const isMounted = useRef(false);
  
  // Carregar itens do localStorage quando o componente é montado
  useEffect(() => {
    isMounted.current = true;
    
    try {
      const savedItems = localStorage.getItem('cart');
      if (savedItems && isMounted.current) {
        const parsedItems = JSON.parse(savedItems);
        if (Array.isArray(parsedItems)) {
          setItems(parsedItems);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho do localStorage:', error);
    }
    
    // Função para atualizar o carrinho quando o armazenamento muda em outra aba
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue && isMounted.current) {
        try {
          const parsedItems = JSON.parse(e.newValue);
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
          }
        } catch (error) {
          console.error('Erro ao processar alteração de carrinho:', error);
        }
      }
    };
    
    // Adicionar listener para mudanças no storage (para sincronização entre abas)
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      isMounted.current = false;
    };
  }, []);
  
  // Salvar itens no localStorage quando os itens mudam
  useEffect(() => {
    if (!isMounted.current) return;
    
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Erro ao salvar carrinho no localStorage:', error);
    }
  }, [items]);
  
  // Função para adicionar um item ao carrinho
  const addItem = (item: CartItem) => {
    setItems(prevItems => {
      // Verificar se o item já existe no carrinho (baseado no variantId)
      const existingItemIndex = prevItems.findIndex(i => i.variantId === item.variantId);
      
      // Verificar se o item tem estoque disponível
      if (item.stock !== undefined && item.stock <= 0) {
        toast.error('Este produto está fora de estoque', {
          icon: '⚠️',
        });
        return prevItems;
      }
      
      // Se o item existir, atualizar a quantidade
      if (existingItemIndex !== -1) {
        // Criar uma cópia do array para não mutar o estado diretamente
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        
        // Verificar se tem estoque suficiente
        const newQuantity = existingItem.quantity + item.quantity;
        
        // Se o estoque for definido, não permitir quantidade maior que o estoque
        if (existingItem.stock !== undefined && newQuantity > existingItem.stock) {
          // Atualizar para o estoque máximo disponível
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: existingItem.stock,
            hasStockIssue: true
          };
          
          // Notificar o usuário com toast
          toast.error(`Quantidade limitada ao estoque disponível: ${existingItem.stock}`, {
            icon: '⚠️',
            style: {
              borderLeft: '4px solid #FF5A5A',
            },
          });
        } else {
          // Atualizar a quantidade normalmente
          updatedItems[existingItemIndex] = {
            ...existingItem,
            quantity: newQuantity,
            hasStockIssue: false
          };
          
          // Notificar o usuário que adicionou mais itens
          toast.success(`Quantidade atualizada: ${newQuantity} ${existingItem.productName}`, {
            icon: '🛒',
            style: {
              borderLeft: '4px solid #6c63ff',
            },
          });
        }
        
        return updatedItems;
      } else {
        // Se o item não existir, adicionar ao carrinho
        return [...prevItems, { ...item, hasStockIssue: false }];
      }
    });
  };
  
  // Função para remover um item do carrinho
  const removeItem = (variantId: string) => {
    setItems(prevItems => prevItems.filter(item => item.variantId !== variantId));
  };
  
  // Função para atualizar a quantidade de um item
  const updateQuantity = (variantId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      // Se a quantidade for menor que 1, remover o item
      removeItem(variantId);
      return;
    }
    
    setItems(prevItems => {
      // Encontrar o item no carrinho
      const existingItemIndex = prevItems.findIndex(item => item.variantId === variantId);
      
      if (existingItemIndex === -1) {
        // Se o item não existir, não fazer nada
        return prevItems;
      }
      
      // Verificar limitações de estoque
      const item = prevItems[existingItemIndex];
      const safeQuantity = item.stock !== undefined ? Math.min(newQuantity, item.stock) : newQuantity;
      
      // Criar uma cópia do array para não mutar o estado diretamente
      const updatedItems = [...prevItems];
      updatedItems[existingItemIndex] = {
        ...item,
        quantity: safeQuantity
      };
      
      return updatedItems;
    });
  };
  
  // Função para limpar o carrinho
  const clearCart = () => {
    setItems([]);
  };
  
  // Função para obter o número total de itens no carrinho
  const getCartItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };
  
  // Função para obter o valor total do carrinho
  const getCartTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  // Valor a ser fornecido pelo contexto
  const contextValue: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}; 