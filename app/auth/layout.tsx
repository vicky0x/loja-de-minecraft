'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica autenticação no localStorage
    const checkLocalAuth = () => {
      try {
        // Verificar se um processo de logout está em andamento
        const logoutInProgress = sessionStorage.getItem('logout_in_progress') === 'true';
        if (logoutInProgress) {
          console.log('Processo de logout em andamento, ignorando verificação de autenticação');
          setIsLoading(false);
          return false;
        }
        
        // Verificar parâmetros na URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasLogoutParam = urlParams.has('logout');
        
        if (hasLogoutParam) {
          console.log('Parâmetro de logout encontrado na URL, ignorando verificação de autenticação');
          setIsLoading(false);
          return false;
        }
        
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user');
        
        if (storedAuth === 'true' && storedUser) {
          console.log('Usuário já está autenticado, redirecionando para o dashboard');
          setIsAuthenticated(true);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        return false;
      }
    };
    
    // Verificar se há um cookie de autenticação
    const checkCookieAuth = () => {
      const authCookieExists = document.cookie
        .split(';')
        .some(cookie => cookie.trim().startsWith('auth_token='));
      
      return authCookieExists;
    };

    // Verificar autenticação através da API
    const checkApiAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
          },
        });

        return response.ok;
      } catch (error) {
        console.error('Erro ao verificar autenticação na API:', error);
        return false;
      }
    };

    const checkAuth = async () => {
      setIsLoading(true);
      
      // Verificar se um processo de logout está em andamento
      try {
        const logoutInProgress = sessionStorage.getItem('logout_in_progress') === 'true';
        if (logoutInProgress) {
          console.log('Processo de logout em andamento, ignorando verificação de autenticação');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Verificar parâmetros na URL
        const urlParams = new URLSearchParams(window.location.search);
        const hasLogoutParam = urlParams.has('logout');
        
        if (hasLogoutParam) {
          console.log('Parâmetro de logout encontrado na URL, ignorando verificação de autenticação');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Erro ao verificar status de logout:', error);
      }
      
      // Primeiro verifica no localStorage para resposta imediata
      const localAuth = checkLocalAuth();
      if (localAuth) {
        router.push('/dashboard');
        return;
      }
      
      // Verifica no cookie para resposta rápida
      const cookieAuth = checkCookieAuth();
      if (cookieAuth) {
        setIsAuthenticated(true);
        router.push('/dashboard');
        return;
      }
      
      // Se nenhum dos métodos rápidos detectou autenticação, verifica na API
      const apiAuth = await checkApiAuth();
      if (apiAuth) {
        setIsAuthenticated(true);
        router.push('/dashboard');
        return;
      }
      
      // Se chegou aqui, não está autenticado
      setIsAuthenticated(false);
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Se estiver carregando, mostra um indicador de carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, renderiza as páginas de autenticação
  return (
    <>{children}</>
  );
} 