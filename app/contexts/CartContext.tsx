'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { toastUtils } from '@/app/utils/toast';
import { useAuth } from './AuthContext';
import { useRouter } from 'next/navigation';

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
  _id?: string; // ID do MongoDB para itens persistentes
}

// Interface para o contexto do carrinho
interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string, productId?: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  getCartTotal: () => number;
  isLoading: boolean;
}

// Valor inicial do contexto
const defaultCartContext: CartContextType = {
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  getCartItemCount: () => 0,
  getCartTotal: () => 0,
  isLoading: false
};

// Criação do contexto com valor padrão
const CartContext = createContext<CartContextType>(defaultCartContext);

// Hook personalizado para facilitar o acesso ao contexto
export const useCart = () => {
  const context = useContext(CartContext);
  return context;
};

// Componente provedor do contexto do carrinho
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Estado para armazenar os itens do carrinho
  const [items, setItems] = useState<CartItem[]>([]);
  // Ref para controlar se o componente está montado
  const isMounted = useRef(false);
  // Estado para indicar carregamento
  const [isLoading, setIsLoading] = useState(false);
  
  // Obter contexto de autenticação
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  
  // Função para buscar carrinho do servidor
  const fetchCartFromServer = async () => {
    if (!isAuthenticated || !user?.id) return;
    
    // Verificar novamente o token antes de fazer a requisição
    const hasToken = typeof window !== 'undefined' && window.localStorage.getItem('auth_token');
    if (!hasToken) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/cart');
      
      if (!response.ok) {
        // Tratar erro 401 (não autorizado) - não tente novamente
        if (response.status === 401) {
          console.warn('Usuário não autenticado para buscar carrinho');
          // Limpar tokens inválidos
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('auth_token');
            window.localStorage.removeItem('isAuthenticated');
          }
          return;
        }
        
        throw new Error(`Erro ao buscar carrinho: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && Array.isArray(data.items)) {
        if (isMounted.current) {
          setItems(data.items);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar carrinho do servidor:', error);
      // Não mostrar toast para não incomodar o usuário
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };
  
  // Função para salvar carrinho no servidor
  const saveCartToServer = async (cartItems: CartItem[]) => {
    if (!isAuthenticated || !user?.id) return;
    
    // Verificar novamente o token antes de fazer a requisição
    const hasToken = typeof window !== 'undefined' && window.localStorage.getItem('auth_token');
    if (!hasToken) return;
    
    try {
      setIsLoading(true);
      
      // Converter itens para o formato aceito pela API
      const itemsToSave = cartItems.map(item => ({
        ...item,
        // Garantir que todos os campos necessários estejam presentes
        productId: item.productId || '',
        productName: item.productName || '',
        productImage: item.productImage || '',
        variantId: item.variantId || '',
        variantName: item.variantName || '',
        price: item.price || 0,
        quantity: item.quantity || 1,
        stock: item.stock || null,
        hasVariants: item.hasVariants || false
      }));
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: itemsToSave }),
      });
      
      if (!response.ok) {
        // Tratar erro 401 (não autorizado) - não tente novamente
        if (response.status === 401) {
          console.warn('Usuário não autenticado para salvar carrinho');
          // Limpar tokens inválidos
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('auth_token');
            window.localStorage.removeItem('isAuthenticated');
          }
          return;
        }
        
        try {
          const errorData = await response.json();
          console.error('Erro na resposta do servidor:', errorData);
          throw new Error(`Erro ao salvar carrinho: ${response.status} - ${errorData.error || 'Erro desconhecido'}`);
        } catch (jsonError) {
          throw new Error(`Erro ao salvar carrinho: ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar carrinho no servidor:', error);
      // Não mostrar toast para não incomodar o usuário
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };
  
  // Carregar itens iniciais
  useEffect(() => {
    isMounted.current = true;
    
    const loadCart = async () => {
      try {
        if (isAuthenticated && user?.id) {
          // Se autenticado, buscar do servidor
          await fetchCartFromServer();
        } else {
          // Se não autenticado, usar localStorage
          try {
            if (typeof window !== 'undefined') {
              try {
                const savedItems = window.localStorage.getItem('cart');
                if (savedItems && isMounted.current) {
                  try {
                    const parsedItems = JSON.parse(savedItems);
                    if (Array.isArray(parsedItems)) {
                      setItems(parsedItems);
                    } else {
                      console.warn('Dados do carrinho no localStorage não são um array válido');
                      window.localStorage.removeItem('cart');
                    }
                  } catch (parseError) {
                    console.error('Erro ao analisar JSON do carrinho:', parseError);
                    // Limpar o localStorage se o JSON estiver corrompido
                    window.localStorage.removeItem('cart');
                  }
                }
              } catch (storageAccessError) {
                console.error('Erro ao acessar localStorage:', storageAccessError);
              }
            }
          } catch (storageError) {
            console.error('Erro ao carregar carrinho do localStorage:', storageError);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar carrinho:', error);
      }
    };
    
    loadCart();
    
    // Função para atualizar o carrinho quando o armazenamento muda em outra aba
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cart' && e.newValue && isMounted.current && !isAuthenticated) {
        try {
          const parsedItems = JSON.parse(e.newValue);
          if (Array.isArray(parsedItems)) {
            setItems(parsedItems);
          } else {
            console.warn('Dados recebidos do evento storage não são um array válido');
          }
        } catch (error) {
          console.error('Erro ao processar alteração de carrinho:', error);
        }
      }
    };
    
    // Adicionar listener para mudanças no storage (para sincronização entre abas)
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
      }
      isMounted.current = false;
    };
  }, [isAuthenticated, user?.id]);
  
  // Quando o status de autenticação muda, atualizar o carrinho
  useEffect(() => {
    if (!isMounted.current) return;
    
    try {
      if (isAuthenticated) {
        // Quando o usuário faz login, buscar carrinho do servidor
        fetchCartFromServer();
      } else {
        // Quando o usuário faz logout, manter apenas o localStorage
        try {
          if (typeof window !== 'undefined') {
            try {
              const savedItems = window.localStorage.getItem('cart');
              if (savedItems) {
                try {
                  const parsedItems = JSON.parse(savedItems);
                  if (Array.isArray(parsedItems)) {
                    setItems(parsedItems);
                  } else {
                    console.warn('Dados do carrinho no localStorage não são um array válido');
                    // Limpar valores inválidos
                    window.localStorage.removeItem('cart');
                    setItems([]);
                  }
                } catch (parseError) {
                  console.error('Erro ao analisar JSON do carrinho após logout:', parseError);
                  // Limpar localStorage se o JSON estiver corrompido
                  window.localStorage.removeItem('cart');
                  setItems([]);
                }
              } else {
                // Se não tiver dados no localStorage, garantir que o carrinho esteja vazio
                setItems([]);
              }
            } catch (storageAccessError) {
              console.error('Erro ao acessar localStorage após logout:', storageAccessError);
              // Em caso de erro de acesso, garantir que o estado do carrinho esteja vazio
              setItems([]);
            }
          }
        } catch (error) {
          console.error('Erro ao carregar carrinho do localStorage após logout:', error);
          setItems([]);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar carrinho após mudança de autenticação:', error);
      // Garantir que o carrinho fique em um estado seguro
      setItems([]);
    }
  }, [isAuthenticated]);
  
  // Salvar itens quando os itens são atualizados
  useEffect(() => {
    if (!isMounted.current) return;
    
    try {
      // Sempre salvar no localStorage como backup
      if (typeof window !== 'undefined') {
        try {
          const itemsToStore = Array.isArray(items) ? items : [];
          const serializedItems = JSON.stringify(itemsToStore);
          window.localStorage.setItem('cart', serializedItems);
        } catch (storageError) {
          console.error('Erro ao salvar carrinho no localStorage:', storageError);
          // Tentar limpar o localStorage para resolver possíveis problemas
          try {
            window.localStorage.removeItem('cart');
          } catch (e) {
            // Ignorar erro se não conseguir limpar
          }
        }
      }
      
      // Se estiver autenticado, também salvar no servidor
      if (isAuthenticated && user?.id) {
        // Usar timeout para evitar muitas requisições em alterações rápidas
        const timeoutId = setTimeout(() => {
          saveCartToServer(items);
        }, 500);
        
        return () => clearTimeout(timeoutId);
      }
    } catch (error) {
      console.error('Erro ao salvar carrinho:', error);
    }
  }, [items, isAuthenticated, user?.id]);
  
  // Função segura para mostrar toast sem causar erros
  const safeToast = (message: string, type: 'success' | 'error', options = {}) => {
    try {
      if (type === 'success') {
        toastUtils.success(message, options);
      } else {
        toastUtils.error(message, options);
      }
    } catch (error) {
      console.error('Erro ao mostrar toast:', error);
    }
  };
  
  // Função para adicionar um item ao carrinho
  const addItem = (item: CartItem) => {
    if (!item) return;
    
    try {
      // Verificar login se necessário
      if (!isAuthenticated) {
        console.log('Tentativa de adicionar item ao carrinho sem autenticação');
        
        // Verificar novamente a autenticação do localStorage
        const storedAuth = typeof window !== 'undefined' && localStorage.getItem('isAuthenticated') === 'true';
        
        if (!storedAuth) {
          console.warn('Usuário não autenticado tentando adicionar item ao carrinho');
          return;
        } else {
          // Se estiver autenticado no localStorage mas não no estado, tentar atualizar o estado
          // Continuar com a adição do item mesmo assim
          console.log('Usuário autenticado no localStorage, continuando com a adição');
        }
      }
      
      // Validar o item antes de processar
      if (!item.variantId || !item.productId) {
        console.error('Item inválido tentando ser adicionado ao carrinho', item);
        return;
      }
      
      setItems(prevItems => {
        try {
          // Clonar o array anterior para evitar mutações
          const prevItemsCopy = Array.isArray(prevItems) ? [...prevItems] : [];
          
          // Verificar se o item já existe no carrinho (baseado no productId E variantId)
          const existingItemIndex = prevItemsCopy.findIndex(i => 
            i && i.variantId === item.variantId && i.productId === item.productId
          );
          
          // Verificar se o item tem estoque disponível
          if (item.stock !== undefined && item.stock <= 0) {
            safeToast('Este produto está fora de estoque', 'error', {
              icon: '⚠️',
            });
            return prevItemsCopy;
          }
          
          if (existingItemIndex !== -1) {
            // Item já existe no carrinho, vamos atualizar
            const existingItem = prevItemsCopy[existingItemIndex];
            const newQuantity = existingItem.quantity + item.quantity;
            
            // Verificar se a nova quantidade excede o estoque
            if (existingItem.stock !== undefined && newQuantity > existingItem.stock) {
              safeToast(`Quantidade limitada ao estoque disponível (${existingItem.stock})`, 'error', {
                icon: '⚠️',
              });
              
              // Atualizar para o máximo disponível
              prevItemsCopy[existingItemIndex] = {
                ...existingItem,
                quantity: existingItem.stock,
                hasStockIssue: true,
              };
            } else {
              // Atualizar quantidade normalmente
              prevItemsCopy[existingItemIndex] = {
                ...existingItem,
                quantity: newQuantity,
                hasStockIssue: false,
              };
              
              safeToast(`${item.productName} (${item.quantity}x) adicionado ao carrinho`, 'success');
            }
          } else {
            // Novo item
            prevItemsCopy.push({
              ...item,
              hasStockIssue: false,
            });
            
            safeToast(`${item.productName} adicionado ao carrinho`, 'success');
          }
          
          return prevItemsCopy;
        } catch (innerError) {
          console.error('Erro ao processar adição de item:', innerError);
          return prevItems; // Retornar os itens anteriores em caso de erro
        }
      });
    } catch (outerError) {
      console.error('Erro externo ao adicionar item:', outerError);
    }
  };
  
  // Função para remover um item do carrinho
  const removeItem = (variantId: string, productId?: string) => {
    if (!variantId) {
      console.error('Tentativa de remover item sem ID de variante');
      return;
    }
    
    try {
      console.log(`Contexto: Tentando remover item com variantId: "${variantId}" ${productId ? `e productId: "${productId}"` : ''}`);
      
      // Verificar quais itens estão no carrinho antes da remoção
      const itemsAntes = Array.isArray(items) ? [...items] : [];
      console.log('Contexto: Itens antes da remoção:', 
        itemsAntes.map(item => ({
          variantId: item.variantId,
          productId: item.productId,
          nome: item.productName
        }))
      );
      
      // Atualizar o estado com uma nova lista de itens, excluindo apenas o item específico
      setItems(prevItems => {
        // Garantir que prevItems é um array
        if (!Array.isArray(prevItems)) return [];
        
        // Verificar se temos um productId para filtragem mais precisa
        if (productId) {
          // Usar combinação de productId e variantId para identificar o item exato
          const indexItemParaRemover = prevItems.findIndex(item => 
            item && item.variantId === variantId && item.productId === productId
          );
          
          if (indexItemParaRemover === -1) {
            console.log(`Contexto: Item com variantId "${variantId}" e productId "${productId}" não encontrado`);
            return prevItems;
          }
          
          // Criar uma nova lista removendo apenas o item no índice encontrado
          const novaLista = [
            ...prevItems.slice(0, indexItemParaRemover),
            ...prevItems.slice(indexItemParaRemover + 1)
          ];
          
          console.log(`Contexto: Total de itens após remoção: ${novaLista.length} (antes: ${prevItems.length})`);
          return novaLista;
        } else {
          // Método anterior (menos preciso) - usado apenas quando não há productId
          // Criar uma nova lista excluindo o item com o variantId específico
          const novaListaDeItens = prevItems.filter(item => {
            // Garantir que o item existe e tem um variantId
            if (!item || !item.variantId) return false;
            
            // Comparar o variantId do item com o variantId que queremos remover
            const manterItem = item.variantId !== variantId;
            
            console.log(`Contexto: Item ${item.productName} (${item.variantId}): ${manterItem ? 'manter' : 'remover'}`);
            
            // Retornar true para manter o item, false para removê-lo
            return manterItem;
          });
          
          console.log(`Contexto: Total de itens após remoção: ${novaListaDeItens.length} (antes: ${prevItems.length})`);
          return novaListaDeItens;
        }
      });
    } catch (error) {
      console.error('Erro ao remover item do carrinho:', error);
    }
  };
  
  // Função para atualizar a quantidade de um item
  const updateQuantity = (variantId: string, newQuantity: number) => {
    if (!variantId) return;
    
    try {
      if (newQuantity < 1) {
        // Se a quantidade for menor que 1, remover o item
        removeItem(variantId);
        return;
      }
      
      setItems(prevItems => {
        try {
          // Verificar se prevItems é um array
          if (!Array.isArray(prevItems)) return [];
          
          // Clonar o array anterior para evitar mutações
          const prevItemsCopy = [...prevItems];
          
          // Encontrar o item no carrinho
          const existingItemIndex = prevItemsCopy.findIndex(item => item && item.variantId === variantId);
          
          if (existingItemIndex === -1) {
            // Se o item não existir, não fazer nada
            return prevItemsCopy;
          }
          
          // Verificar limitações de estoque
          const item = prevItemsCopy[existingItemIndex];
          const safeQuantity = item.stock !== undefined ? Math.min(newQuantity, item.stock) : newQuantity;
          
          prevItemsCopy[existingItemIndex] = {
            ...item,
            quantity: safeQuantity
          };
          
          return prevItemsCopy;
        } catch (innerError) {
          console.error('Erro ao processar atualização de quantidade:', innerError);
          return prevItems; // Retornar os itens anteriores em caso de erro
        }
      });
    } catch (outerError) {
      console.error('Erro externo ao atualizar quantidade:', outerError);
    }
  };
  
  // Função para limpar o carrinho
  const clearCart = () => {
    try {
      setItems([]);
      
      // Se estiver autenticado, também limpar no servidor
      if (isAuthenticated && user?.id) {
        fetch('/api/cart?clearCart=true', { method: 'DELETE' })
          .catch(error => console.error('Erro ao limpar carrinho no servidor:', error));
      }
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
    }
  };
  
  // Função para obter o número total de itens no carrinho
  const getCartItemCount = () => {
    try {
      if (!Array.isArray(items)) return 0;
      return items.reduce((total, item) => {
        if (!item) return total;
        return total + (item.quantity || 0);
      }, 0);
    } catch (error) {
      console.error('Erro ao calcular quantidade de itens:', error);
      return 0;
    }
  };
  
  // Função para obter o valor total do carrinho
  const getCartTotal = () => {
    try {
      if (!Array.isArray(items)) return 0;
      return items.reduce((total, item) => {
        if (!item) return total;
        return total + ((item.price || 0) * (item.quantity || 0));
      }, 0);
    } catch (error) {
      console.error('Erro ao calcular total do carrinho:', error);
      return 0;
    }
  };
  
  // Valor a ser fornecido pelo contexto
  const contextValue: CartContextType = {
    items: Array.isArray(items) ? items : [],
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getCartItemCount,
    getCartTotal,
    isLoading
  };
  
  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}; 