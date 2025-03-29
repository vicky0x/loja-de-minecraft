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

// Função para fazer logout
export async function logout() {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    
    // Limpar cookies localmente
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "isAuthenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    // Recarregar a página para limpar o estado
    window.location.href = '/auth/login';
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
  }
} 