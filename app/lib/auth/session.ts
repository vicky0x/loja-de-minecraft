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
  const [session, setSession] = useState<AuthSession>({
    isAuthenticated: false,
  });
  const [loading, setLoading] = useState(true);

  // Verificar sessão ao montar o componente
  useEffect(() => {
    async function checkSession() {
      try {
        console.log("Verificando sessão do usuário...");
        console.log("Cookies disponíveis:", document.cookie);
        
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

        const userData = await response.json();
        console.log("Dados do usuário recebidos:", userData);
        
        if (!userData || !userData.id) {
          console.log("Dados do usuário inválidos");
          setSession({ isAuthenticated: false });
          setLoading(false);
          return;
        }
        
        console.log("Usuário autenticado:", userData.username, "role:", userData.role);
        
        setSession({
          isAuthenticated: true,
          userId: userData.id,
          role: userData.role,
          username: userData.username,
          email: userData.email,
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
      
      console.log('Resposta da API de logout:', response.status);
    } catch (apiError) {
      // Se a requisição para a API falhar, apenas logar o erro mas continuar o processo local
      console.error('Erro ao fazer requisição para API de logout:', apiError);
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