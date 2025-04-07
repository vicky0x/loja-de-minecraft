'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Interface para o usuário
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  profileImage?: string;
}

// Interface para o contexto de autenticação
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUserData: () => Promise<void>;
  forceRefreshUserData: () => Promise<void>;
  setUser: (user: User | null) => void;
  pendingProfileImage: string | null;
  updateProfileImage: (imageUrl: string) => void;
  logout: () => Promise<void>;
}

// Criação do contexto com valores padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  refreshUserData: async () => {},
  forceRefreshUserData: async () => {},
  setUser: () => {},
  pendingProfileImage: null,
  updateProfileImage: () => {},
  logout: async () => {},
});

// Hook personalizado para usar o contexto
export const useAuth = () => useContext(AuthContext);

// Método adicional para manter a sincronização com outras fontes
const syncWithLocalStorage = (userData: User | null) => {
  if (typeof window === 'undefined') return userData;
  
  if (userData) {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        // Combinar dados do localStorage com os dados atuais para obter informações mais completas
        const parsedUser = JSON.parse(storedUser);
        const mergedUser = { ...parsedUser, ...userData };
        
        // Atualizar no estado se forem diferentes
        if (JSON.stringify(mergedUser) !== JSON.stringify(userData)) {
          return mergedUser;
        }
      }
    } catch (error) {
      console.error('Erro ao ler localStorage para sincronização:', error);
    }
  }
  return userData;
};

// Função utilitária para garantir que as URLs de perfil sejam absolutas
const ensureAbsoluteProfileImageUrl = (userData: User | null): User | null => {
  if (!userData || !userData.profileImage) return userData;
  
  // Se a URL já for absoluta, retorna como está
  if (userData.profileImage.startsWith('http')) return userData;
  
  // Caso contrário, converte para absoluta
  try {
    if (typeof window === 'undefined') return userData;
    const origin = window.location.origin;
    return {
      ...userData,
      profileImage: `${origin}${userData.profileImage}`
    };
  } catch (error) {
    console.error('Erro ao processar URL da imagem de perfil:', error);
    return userData;
  }
};

// Provedor do contexto que envolve a aplicação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingProfileImage, setPendingProfileImage] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  
  // Ref para controlar o tempo da última atualização completa dos dados do usuário
  const lastFullUpdateRef = useRef<number>(Date.now());
  // Cache para evitar chamadas repetidas à API sem alterações
  const userCacheRef = useRef<{
    data: User | null;
    timestamp: number;
    hash: string;
  }>({
    data: null,
    timestamp: 0,
    hash: '',
  });

  // Função para calcular hash simplificado dos dados do usuário para verificar alterações
  const calculateUserHash = (userData: User | null): string => {
    if (!userData) return '';
    // Usar apenas os campos mais importantes para o hash
    return `${userData._id}-${userData.username}-${userData.profileImage || ''}-${userData.role}`;
  };

  // Função para atualizar imagem de perfil
  const updateProfileImage = (imageUrl: string) => {
    console.log('AuthContext: Atualizando imagem de perfil para:', imageUrl);
    
    // Evitar atualizações redundantes
    if (user?.profileImage === imageUrl) {
      console.log('Mesma imagem já definida no contexto, ignorando atualização');
      return;
    }
    
    // Garantir que a URL seja absoluta
    const absoluteImageUrl = imageUrl.startsWith('http') 
      ? imageUrl 
      : typeof window !== 'undefined' ? `${window.location.origin}${imageUrl}` : imageUrl;
    
    // Salvar a imagem pendente para uso em animações
    setPendingProfileImage(absoluteImageUrl);
    
    // Atualizar o usuário atual se ele existir
    if (user) {
      // Criar uma cópia do usuário com a nova imagem
      const updatedUser = { ...user, profileImage: absoluteImageUrl };
      
      // Atualizar o hash do usuário para forçar atualização
      const newUserHash = calculateUserHash(updatedUser);
      
      // Verificar se algo mudou realmente
      if (newUserHash === userCacheRef.current.hash) {
        console.log('Hash do usuário não mudou, ignorando atualização');
        return;
      }
      
      // Atualizar cache
      userCacheRef.current = {
        data: updatedUser,
        timestamp: Date.now(),
        hash: newUserHash
      };
      
      // Atualizar o estado do usuário
      setUser(updatedUser);
      
      // Atualizar localStorage para manter sincronizado
      try {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Erro ao salvar imagem atualizada no localStorage:', error);
      }
    }
  };

  // Função para buscar dados do usuário da API
  const refreshUserData = async (force: boolean = false) => {
    try {
      // Adicionar verificação de anti-loop
      if (typeof window !== 'undefined' && window.__ANTI_LOOP_FLAG === true) {
        console.warn('Proteção anti-loop ativada no AuthContext. Bloqueando verificação.');
        return;
      }
      
      // Verificar se uma atualização é realmente necessária
      const currentTime = Date.now();
      const cacheAge = currentTime - userCacheRef.current.timestamp;
      const maxCacheAge = 5 * 60 * 1000; // 5 minutos em milissegundos
      
      // Evitar chamadas muito frequentes - limitar a no máximo uma a cada 3 segundos
      const minUpdateInterval = 3000; // 3 segundos
      if (cacheAge < minUpdateInterval) {
        console.log('Chamada muito frequente, ignorando. Última atualização há', Math.round(cacheAge/1000), 'segundos');
        return;
      }
      
      // Se o cache for recente e não forçamos atualização, usar o cache
      if (!force && cacheAge < maxCacheAge && userCacheRef.current.data) {
        console.log('Usando dados em cache, última atualização há', Math.round(cacheAge/1000), 'segundos');
        return;
      }
      
      // Atualizar o timestamp antes de fazer a chamada para evitar chamadas simultâneas
      userCacheRef.current.timestamp = currentTime;
      
      console.log('Buscando dados atualizados do usuário da API...');
      setLoading(true);

      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
        },
      });

      if (!response.ok) {
        console.log('Erro ao buscar dados do usuário:', response.status);
        setUser(null);
        userCacheRef.current = { data: null, timestamp: currentTime, hash: '' };
        return;
      }

      const data = await response.json();
      
      // Garantir URL absoluta para imagem de perfil
      if (data.user && data.user.profileImage) {
        data.user = ensureAbsoluteProfileImageUrl(data.user);
      }
      
      // Verificar se os dados são realmente diferentes dos atuais
      const newUserHash = calculateUserHash(data.user);
      if (newUserHash === userCacheRef.current.hash) {
        console.log('Dados do usuário não mudaram, mantendo estado atual');
        setLoading(false);
        // Não atualizamos timestamp aqui, pois já foi atualizado no início da função
        return;
      }
      
      console.log('Dados do usuário atualizados, aplicando mudanças');
      
      if (data.user) {
        // Sincronizar com localStorage para obter dados mais completos
        const syncedUser = syncWithLocalStorage(data.user);
        
        // Garantir novamente URL absoluta após sincronização
        const userWithAbsoluteUrl = ensureAbsoluteProfileImageUrl(syncedUser);
        
        setUser(userWithAbsoluteUrl);
        
        // Atualizar cache
        userCacheRef.current = {
          data: userWithAbsoluteUrl,
          timestamp: currentTime,
          hash: newUserHash
        };
        
        // Atualizar timestamp de atualização completa
        lastFullUpdateRef.current = currentTime;
        
        // Atualizar localStorage para manter sincronizado
        try {
          localStorage.setItem('user', JSON.stringify(userWithAbsoluteUrl));
          localStorage.setItem('isAuthenticated', 'true');
        } catch (error) {
          console.error('Erro ao salvar dados no localStorage:', error);
        }
      } else {
        setUser(null);
        userCacheRef.current = { data: null, timestamp: currentTime, hash: '' };
        
        // Limpar localStorage se não houver usuário
        try {
          localStorage.removeItem('user');
          localStorage.removeItem('isAuthenticated');
        } catch (error) {
          console.error('Erro ao remover dados do localStorage:', error);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Verificar autenticação quando o componente é montado
  useEffect(() => {
    // Flag para controlar se a primeira atualização já foi feita
    let didInitialUpdate = false;
    
    // Função para inicialização
    const initAuth = async () => {
      // Primeiro, tenta recuperar do localStorage para resposta imediata
      try {
        const storedUser = localStorage.getItem('user');
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        
        if (storedUser && isAuthenticated === 'true') {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            
            // Inicializar o cache com dados do localStorage
            userCacheRef.current = {
              data: parsedUser,
              timestamp: Date.now() - 60000, // Considerar cache de 1 minuto atrás
              hash: calculateUserHash(parsedUser)
            };
            
            // Atualizar timestamp para evitar chamadas duplicadas
            lastFullUpdateRef.current = Date.now();
            
            console.log('Usuário recuperado do localStorage:', parsedUser.username);
          } catch (error) {
            console.error('Erro ao processar usuário do localStorage:', error);
          }
        } else {
          // Se não encontrar dados no localStorage, definir loading como false
          // para que a interface mostre os botões de login/cadastro
          setLoading(false);
        }
      } catch (error) {
        console.error('Erro ao ler localStorage:', error);
        // Em caso de erro também queremos definir loading como false
        setLoading(false);
      }
      
      // Se já houver um usuário no localStorage, usar ele temporariamente
      // e depois buscar da API em segundo plano com um delay
      if (user) {
        // Definir que já atualizamos pela primeira vez
        didInitialUpdate = true;
        
        // Definir loading como false para mostrar o usuário enquanto atualizamos
        setLoading(false);
        
        // Depois de um breve delay, buscar dados atualizados da API
        setTimeout(() => {
          refreshUserData(false);
        }, 2000);
      } else {
        // Se não houver usuário, buscar dados da API imediatamente
        console.log('Buscando dados iniciais do usuário da API');
        await refreshUserData(false);
        didInitialUpdate = true;
      }
    };
    
    // Adicionar evento para atualizar o estado após login ou alterações
    const handleAuthChanged = () => {
      try {
        // Evitar chamadas muito frequentes
        const currentTime = Date.now();
        const timeSinceLastUpdate = currentTime - lastFullUpdateRef.current;
        const minUpdateInterval = 2000; // 2 segundos
        
        if (timeSinceLastUpdate < minUpdateInterval) {
          console.log('Evento auth-state-changed ignorado - atualização muito recente');
          return;
        }
        
        console.log('Evento auth-state-changed recebido, verificando autenticação...');
        lastFullUpdateRef.current = currentTime;
        
        // Verificar localStorage primeiro para resposta rápida
        try {
          const storedUser = localStorage.getItem('user');
          const isAuthenticated = localStorage.getItem('isAuthenticated');
          
          // Verificar discrepância entre o estado atual e localStorage
          const shouldUpdate = 
            (isAuthenticated === 'true' && !user) || 
            (isAuthenticated !== 'true' && user) ||
            (isAuthenticated === 'true' && storedUser && user && 
             storedUser && JSON.stringify(user) !== storedUser);
          
          if (shouldUpdate) {
            console.log('Discrepância detectada, atualizando estado...');
            
            if (isAuthenticated === 'true' && storedUser) {
              // Atualizar com dados do localStorage
              try {
                const parsedUser = JSON.parse(storedUser);
                if (JSON.stringify(user) !== JSON.stringify(parsedUser)) {
                  // Só atualizar se os dados forem diferentes
                  console.log('Atualizando usuário a partir do localStorage');
                  setUser(parsedUser);
                  
                  // Atualizar cache
                  userCacheRef.current = {
                    data: parsedUser,
                    timestamp: currentTime,
                    hash: calculateUserHash(parsedUser)
                  };
                }
              } catch (error) {
                console.error('Erro ao processar dados do localStorage:', error);
              }
            } else if (isAuthenticated !== 'true' && user) {
              // Limpar o usuário se não estiver mais autenticado
              console.log('Usuário não está mais autenticado, limpando estado');
              setUser(null);
              userCacheRef.current = { data: null, timestamp: currentTime, hash: '' };
            }
          }
          
          // Se houver discrepâncias significativas, atualize da API depois
          if (shouldUpdate) {
            setTimeout(() => refreshUserData(false), 500);
          }
        } catch (error) {
          console.error('Erro ao verificar localStorage no evento auth-state-changed:', error);
        }
      } catch (error) {
        console.error('Erro ao processar evento de autenticação:', error);
      }
    };
    
    // Iniciar o processo de autenticação
    initAuth();
    
    // Configurar o listener de eventos de autenticação
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    // Cleanup ao desmontar
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, []);

  // Listener para mudanças de rota para verificar autenticação
  useEffect(() => {
    const handleRouteChange = () => {
      // Verificar se houve alteração nos cookies que podem indicar mudança na autenticação
      const authCookieExists = document.cookie
        .split(';')
        .some(cookie => cookie.trim().startsWith('auth_token='));
      
      // Se o cookie auth_token existir e não tivermos um usuário, ou vice-versa, atualizar
      if ((authCookieExists && !user) || (!authCookieExists && user)) {
        refreshUserData();
      }
    };

    // Adicionar listener para o evento de navegação
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [user]);

  // Adicionar listener específico para eventos de atualização de imagem de perfil
  useEffect(() => {
    const handleProfileImageUpdate = (event: Event) => {
      // Verificar se é um CustomEvent com dados da imagem
      if (event instanceof CustomEvent && event.detail?.imageUrl) {
        const imageUrl = event.detail.imageUrl;
        
        // Evitar loop de atualização se a imagem for a mesma
        if (user?.profileImage === imageUrl) {
          console.log('Imagem já atualizada, ignorando evento');
          return;
        }
        
        console.log('Evento de atualização de imagem recebido:', imageUrl);
        
        // Atualizar silenciosamente sem disparar novos eventos
        if (user) {
          // Atualizar state e refs diretamente
          const updatedUser = { ...user, profileImage: imageUrl };
          const newHash = calculateUserHash(updatedUser);
          
          // Atualizar cache
          userCacheRef.current = {
            data: updatedUser,
            timestamp: Date.now(),
            hash: newHash
          };
          
          // Atualizar state
          setUser(updatedUser);
          setPendingProfileImage(imageUrl);
          
          // Atualizar localStorage também, mas sem disparar eventos
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              userData.profileImage = imageUrl;
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (error) {
            console.error('Erro ao atualizar localStorage:', error);
          }
        }
      }
    };
    
    // Listener para evento específico de atualização de imagem
    window.addEventListener('profile-image-updated', handleProfileImageUpdate);
    
    return () => {
      window.removeEventListener('profile-image-updated', handleProfileImageUpdate);
    };
  }, [user]);

  // Função para fazer logout
  const logout = useCallback(async () => {
    try {
      console.log("Iniciando processo de logout");
      
      // Remover dados do localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      
      // Chamar a API de logout
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error('Erro na resposta da API de logout:', response.status);
      } else {
        console.log('API de logout respondeu com sucesso');
      }
      
      // Atualizar o estado mesmo se a API falhar
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      
      // Dispatch evento para outros componentes de forma segura
      try {
        const event = new CustomEvent('auth-change', { 
          detail: { isAuthenticated: false, user: null }
        });
        window.dispatchEvent(event);
      } catch (eventError) {
        console.error("Erro ao disparar evento auth-change:", eventError);
        // Continuar mesmo se o evento falhar
      }
      
      // Redirecionar para a página inicial
      router.push('/');
      
      console.log("Processo de logout concluído");
    } catch (error) {
      console.error("Erro durante logout:", error);
      
      // Mesmo com erro, tentar limpar o estado
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      
      // Redirecionar para a página inicial mesmo com erro
      router.push('/');
    }
  }, [router]);

  const contextValue = {
    user,
    loading,
    isAuthenticated,
    refreshUserData: () => refreshUserData(false), // Versão sem força por padrão
    forceRefreshUserData: () => refreshUserData(true), // Versão com força explícita 
    setUser,
    pendingProfileImage,
    updateProfileImage,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 