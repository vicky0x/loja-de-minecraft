'use client';

import { useState, useEffect } from 'react';

// Estrutura comum de armazenamento de sessão
export interface AuthSession {
  token?: string;
  userId?: string;
  role?: string;
  isAuthenticated: boolean;
  username?: string;
  email?: string;
}

// Hook para gerenciar a sessão do usuário
export function useSession() {
  const [session, setSession] = useState({
    isAuthenticated: false,
  } as AuthSession);
  const [loading, setLoading] = useState(true);

  // Verificar sessão ao montar o componente
  useEffect(() => {
    async function checkSession() {
      try {
        console.log("Verificando sessão do usuário...");
        
        // Primeiro, tentar verificar no localStorage para resposta rápida
        const localAuthString = localStorage.getItem('isAuthenticated');
        const localUserString = localStorage.getItem('user');
        let localAuth = false;
        let userData = null;
        
        if (localAuthString === 'true' && localUserString) {
          try {
            userData = JSON.parse(localUserString);
            if (userData) {
              localAuth = true;
              console.log("Autenticação encontrada no localStorage:", userData);
            }
          } catch (e) {
            console.error("Erro ao processar dados do usuário do localStorage:", e);
          }
        }
        
        // Se autenticado no localStorage, definir sessão imediatamente
        if (localAuth && userData) {
          setSession({
            isAuthenticated: true,
            userId: userData.uid || userData.id || userData._id,
            role: userData.role || 'user',
            username: userData.username || userData.displayName,
            email: userData.email,
          });
          setLoading(false);
          return;
        }
        
        // Verificar se o cookie de autenticação existe
        const cookiesExist = document.cookie
          .split(';')
          .some(cookie => {
            const trimmed = cookie.trim();
            return trimmed.startsWith('auth_token=');
          });

        if (!cookiesExist) {
          console.log("Nenhum cookie de autenticação encontrado");
          setSession({ isAuthenticated: false });
          setLoading(false);
          return;
        }

        // Buscar dados do usuário da API
        console.log("Fazendo requisição para /api/auth/me...");
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
          },
        });

        console.log("Resposta da API de verificação:", response.status);

        if (!response.ok) {
          console.log("Resposta da API não OK:", response.status);
          setSession({ isAuthenticated: false });
          setLoading(false);
          return;
        }

        const apiUserData = await response.json();
        console.log("Dados do usuário recebidos:", apiUserData);
        
        if (!apiUserData || !apiUserData.id) {
          console.log("Dados do usuário inválidos");
          setSession({ isAuthenticated: false });
          setLoading(false);
          return;
        }
        
        console.log("Usuário autenticado:", apiUserData.username, "role:", apiUserData.role);
        
        // Atualizar localStorage com dados mais recentes para uso futuro
        try {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('user', JSON.stringify(apiUserData));
        } catch (e) {
          console.error("Erro ao salvar dados no localStorage:", e);
        }
        
        setSession({
          isAuthenticated: true,
          userId: apiUserData.id,
          role: apiUserData.role,
          username: apiUserData.username,
          email: apiUserData.email,
        });
      } catch (error) {
        console.error("Erro ao verificar sessão:", error);
        setSession({ isAuthenticated: false });
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  return { session, loading };
}

// Hook simplificado apenas para verificar a autenticação
export function useAuth() {
  const { session, loading } = useSession();
  
  return {
    isAuthenticated: session.isAuthenticated,
    isAdmin: session.role === 'admin',
    loading,
    user: session.isAuthenticated ? {
      id: session.userId,
      role: session.role,
      username: session.username,
      email: session.email,
    } : null,
  };
}

// Variável para controlar o processo de logout
let isLoggingOut = false;

// Função para fazer logout
export async function logout() {
  // Evitar múltiplos logouts simultâneos
  if (isLoggingOut) {
    console.log('Processo de logout já está em andamento...');
    return;
  }
  
  try {
    console.log('Iniciando processo de logout...');
    isLoggingOut = true;
    
    // Cancelar todos os redirecionamentos de autenticação
    // Isso serve como sinalizador para layout/middleware
    sessionStorage.setItem('logout_in_progress', 'true');
    
    // Tentar fazer a requisição para a API de logout
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      console.log('Resposta da API de logout POST:', response.status);
      
      // Se o método POST falhar, tentar DELETE como alternativa
      if (!response.ok) {
        console.log('Tentando método alternativo DELETE para logout');
        try {
          const deleteResponse = await fetch('/api/auth/logout', {
            method: 'DELETE',
            credentials: 'include',
          });
          console.log('Resposta da API de logout DELETE:', deleteResponse.status);
        } catch (deleteError) {
          console.error('Erro ao fazer requisição DELETE para API de logout:', deleteError);
        }
      }
    } catch (apiError) {
      // Se a requisição para a API falhar, tentar o método DELETE
      console.error('Erro ao fazer requisição POST para API de logout:', apiError);
      
      try {
        console.log('Tentando método alternativo DELETE para logout após falha no POST');
        await fetch('/api/auth/logout', {
          method: 'DELETE',
          credentials: 'include',
        });
      } catch (deleteError) {
        console.error('Erro ao fazer requisição DELETE para API de logout:', deleteError);
      }
    }
    
    // Limpar cookies localmente de qualquer forma
    console.log('Limpando cookies do navegador...');
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "isAuthenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Limpar localStorage também
    console.log('Limpando localStorage...');
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authExpiry');
      localStorage.removeItem('cartItems');
    } catch (localStorageError) {
      console.error('Erro ao limpar localStorage:', localStorageError);
    }
    
    // Limpar variáveis de estado
    console.log('Processo de logout bem-sucedido, preparando redirecionamento...');
    
    // Usar window.location com timeout para garantir que tudo seja processado
    setTimeout(() => {
      // Limpar flag de logout em andamento
      isLoggingOut = false;
      sessionStorage.removeItem('logout_in_progress');
      
      // Redirecionar para a página de login com uma flag para evitar redirecionamentos
      window.location.href = '/auth/login?logout=success';
    }, 300);
    
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    isLoggingOut = false;
    sessionStorage.removeItem('logout_in_progress');
    
    // Em caso de erro, tentar redirecionar de qualquer forma
    window.location.href = '/auth/login?error=logout_failed';
  }
} 