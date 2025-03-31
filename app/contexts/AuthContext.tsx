'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

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
});

// Hook personalizado para usar o contexto
export const useAuth = () => useContext(AuthContext);

// Método adicional para manter a sincronização com outras fontes
const syncWithLocalStorage = (userData: User | null) => {
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

// Provedor do contexto que envolve a aplicação
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingProfileImage, setPendingProfileImage] = useState<string | null>(null);
  
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
    
    // Salvar a imagem pendente para uso em animações
    setPendingProfileImage(imageUrl);
    
    // Atualizar o usuário atual se ele existir
    if (user) {
      // Criar uma cópia do usuário com a nova imagem
      const updatedUser = { ...user, profileImage: imageUrl };
      
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
      // Verificar se uma atualização é realmente necessária
      const currentTime = Date.now();
      const cacheAge = currentTime - userCacheRef.current.timestamp;
      const maxCacheAge = 5 * 60 * 1000; // 5 minutos em milissegundos
      
      // Se o cache for recente e não forçamos atualização, usar o cache
      if (!force && cacheAge < maxCacheAge && userCacheRef.current.data) {
        console.log('Usando dados em cache, última atualização há', Math.round(cacheAge/1000), 'segundos');
        return;
      }
      
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
      
      // Verificar se os dados são realmente diferentes dos atuais
      const newUserHash = calculateUserHash(data.user);
      if (newUserHash === userCacheRef.current.hash) {
        console.log('Dados do usuário não mudaram, mantendo estado atual');
        setLoading(false);
        userCacheRef.current.timestamp = currentTime; // Atualizar timestamp do cache
        return;
      }
      
      console.log('Dados do usuário atualizados, aplicando mudanças');
      
      if (data.user) {
        // Sincronizar com localStorage para obter dados mais completos
        const syncedUser = syncWithLocalStorage(data.user);
        setUser(syncedUser);
        
        // Atualizar cache
        userCacheRef.current = {
          data: syncedUser,
          timestamp: currentTime,
          hash: newUserHash
        };
        
        // Atualizar timestamp de atualização completa
        lastFullUpdateRef.current = currentTime;
        
        // Atualizar localStorage para manter sincronizado
        try {
          localStorage.setItem('user', JSON.stringify(syncedUser));
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
    // Primeiro, tenta recuperar do localStorage para resposta imediata
    try {
      const storedUser = localStorage.getItem('user');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (storedUser && isAuthenticated === 'true') {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Inicializar o cache com dados do localStorage
        userCacheRef.current = {
          data: parsedUser,
          timestamp: Date.now() - 60000, // Considerar cache de 1 minuto atrás para garantir atualização
          hash: calculateUserHash(parsedUser)
        };
      }
    } catch (error) {
      console.error('Erro ao ler localStorage:', error);
    }
    
    // Em seguida, busca dados atualizados da API, mas apenas se necessário
    refreshUserData();
    
    // Adicionar evento para atualizar o estado após login ou alterações
    const handleAuthChanged = () => {
      // Forçar atualização em caso de evento explícito
      refreshUserData(true);
    };
    
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
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

  const contextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    refreshUserData: () => refreshUserData(false), // Versão sem força por padrão
    forceRefreshUserData: () => refreshUserData(true), // Versão com força explícita 
    setUser,
    pendingProfileImage,
    updateProfileImage
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}; 