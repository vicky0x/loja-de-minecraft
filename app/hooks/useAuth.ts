import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Verificar se o estado já está disponível nos cookies do navegador
    const checkLocalCookies = () => {
      if (typeof document !== 'undefined') {
        const cookieIsAuth = document.cookie
          .split('; ')
          .find(row => row.startsWith('isAuthenticated='));
          
        if (cookieIsAuth && cookieIsAuth.split('=')[1] === 'true') {
          setIsAuthenticated(true);
          setIsLoading(false);
          return true;
        }
      }
      return false;
    };

    // Se não encontrar nos cookies, fazer a verificação completa
    if (!checkLocalCookies()) {
      checkAuth();
    }
    
    // Adicionar listener para atualizar o estado quando o usuário retorna após login
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // A página ficou visível novamente, atualizar estado de autenticação
        checkLocalCookies() || checkAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Adicionar listener para eventos de autenticação
    const handleAuthChanged = () => {
      checkLocalCookies() || checkAuth();
    };
    
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, []);

  const checkAuth = async () => {
    try {
      // Verificar se temos o token nos cookies do navegador
      if (typeof document !== 'undefined') {
        const hasAuthToken = document.cookie
          .split('; ')
          .some(row => row.startsWith('auth_token='));
        
        if (hasAuthToken) {
          console.log('[AUTH] Token encontrado nos cookies');
        } else {
          console.log('[AUTH] Token não encontrado nos cookies');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch('/api/auth/check', {
        credentials: 'include', // Importante para enviar cookies
        cache: 'no-store', // Evitar cache
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.log('[AUTH] Resposta da API não ok:', response.status);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('[AUTH] Resposta da verificação de autenticação:', data);
      setIsAuthenticated(data.isAuthenticated);
      
      // Se usuário estiver autenticado, verificar redirecionamento pendente
      if (data.isAuthenticated && typeof window !== 'undefined') {
        try {
          const redirectPath = localStorage.getItem('redirectAfterLogin');
          const loginInProgress = localStorage.getItem('login_in_progress');
          
          if (redirectPath && !loginInProgress) {
            console.log('[AUTH] Redirecionamento pendente encontrado após verificação de autenticação:', redirectPath);
          }
        } catch (error) {
          console.error('[AUTH] Erro ao verificar redirecionamento pendente:', error);
        }
      }
    } catch (error) {
      console.error('[AUTH] Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // Verificar e salvar redirectAfterLogin antes de fazer logout
    let redirectPath = null;
    try {
      if (typeof window !== 'undefined') {
        redirectPath = window.localStorage.getItem('redirectAfterLogin');
        console.log('Valor de redirectAfterLogin antes do logout:', redirectPath);
      }
    } catch (error) {
      console.error('Erro ao acessar localStorage em logout:', error);
    }

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Atualizar estado
        setIsAuthenticated(false);
        
        // Tentar restaurar redirectAfterLogin se existia antes
        if (redirectPath) {
          try {
            if (typeof window !== 'undefined') {
              console.log('Restaurando redirectAfterLogin após logout:', redirectPath);
              window.localStorage.setItem('redirectAfterLogin', redirectPath);
              
              // Verificar se foi restaurado corretamente
              const restored = window.localStorage.getItem('redirectAfterLogin');
              console.log('Valor de redirectAfterLogin após restauração:', restored);
            }
          } catch (error) {
            console.error('Erro ao restaurar redirectAfterLogin:', error);
          }
        }

        // Notificar mudança no estado de autenticação
        console.log('Disparando evento auth-state-changed após logout');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-state-changed'));
        }
        toast.success('Logout realizado com sucesso!');
      } else {
        toast.error('Erro ao fazer logout');
      }
    } catch (error) {
      console.error('Erro durante logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Importante para receber cookies
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        
        // Disparar evento para informar que o estado de autenticação mudou
        console.log('Disparando evento auth-state-changed após login bem-sucedido');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('auth-state-changed'));
        }
        
        toast.success('Login realizado com sucesso');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro durante o login:', error);
      return false;
    }
  };

  const requireAuth = () => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Você precisa estar logado para realizar esta ação');
      router.push('/auth/login');
      return false;
    }
    return true;
  };

  return {
    isAuthenticated,
    isLoading,
    requireAuth,
    login,
    logout,
    checkAuth
  };
} 