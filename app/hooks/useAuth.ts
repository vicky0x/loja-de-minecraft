import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Define interfaces para tipos
export interface User {
  id?: string;
  _id?: string;
  username: string;
  email: string;
  name?: string;
  role: string;
  profileImage?: string;
  memberNumber?: number;
  createdAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
}

// Controle global para evitar verificações simultâneas
let isCheckingAuth = false;
let isRedirecting = false;
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 5000; // 5 segundos entre redirecionamentos

// Variáveis para controle de loop de redirecionamento
let lastURLs: string[] = [];
let lastURLTime = 0;
const URL_HISTORY_SIZE = 10;
const LOOP_DETECTION_TIME = 10000; // 10 segundos para detectar loop

// Verificar se estamos em uma página pública que não requer autenticação
const isPublicPage = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return (
      path === '/auth/login' || 
      path.startsWith('/auth/login/') ||
      path === '/auth/register' || 
      path.startsWith('/auth/register/') ||
      path === '/' || 
      path.startsWith('/products/') ||
      path.startsWith('/search') ||
      path === '/about' ||
      path === '/contact'
    );
  }
  return false;
};

// Verificar se já estamos na página de login
const isLoginPage = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return path === '/auth/login' || path.startsWith('/auth/login/');
  }
  return false;
};

// Verificar se estamos na página de registro
const isRegisterPage = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return path === '/auth/register' || path.startsWith('/auth/register/');
  }
  return false;
};

// Verificar se estamos na página do dashboard
const isDashboardPage = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return path === '/dashboard' || path.startsWith('/dashboard/');
  }
  return false;
};

// Função para detectar loops de redirecionamento
const detectRedirectLoop = () => {
  if (typeof window === 'undefined') return false;
  
  const currentURL = window.location.pathname;
  const currentTime = Date.now();
  
  // Se passaram mais de 10 segundos desde a última verificação, resetar o histórico
  if (currentTime - lastURLTime > LOOP_DETECTION_TIME) {
    lastURLs = [];
  }
  
  // Atualizar o timestamp da última verificação
  lastURLTime = currentTime;
  
  // Adicionar a URL atual ao histórico
  lastURLs.push(currentURL);
  
  // Manter apenas as últimas URLs
  if (lastURLs.length > URL_HISTORY_SIZE) {
    lastURLs = lastURLs.slice(-URL_HISTORY_SIZE);
  }
  
  // Se estamos alternando continuamente entre páginas, isso é um loop
  if (lastURLs.length >= 4) {
    // Verificar o padrão (dashboard <-> login)
    for (let i = 0; i < lastURLs.length - 3; i++) {
      const pattern1 = 
        lastURLs[i].includes('/dashboard') && 
        lastURLs[i+1].includes('/auth/login') && 
        lastURLs[i+2].includes('/dashboard') && 
        lastURLs[i+3].includes('/auth/login');
        
      const pattern2 = 
        lastURLs[i].includes('/auth/login') && 
        lastURLs[i+1].includes('/dashboard') && 
        lastURLs[i+2].includes('/auth/login') && 
        lastURLs[i+3].includes('/dashboard');
      
      if (pattern1 || pattern2) {
        // Loop de redirecionamento detectado
        
        try {
          // Limpar TODOS os dados relacionados à autenticação e redirecionamento
          localStorage.clear(); // Remover tudo para garantir
          
          // Definir novos flags para indicar o loop e prevenir novos redirecionamentos
          localStorage.setItem('loop_detected', 'true');
          localStorage.setItem('loop_detected_time', currentTime.toString());
          localStorage.setItem('force_login_page', 'true');
          
          // Remover todos os cookies (mais radical)
          if (document.cookie) {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
              const cookie = cookies[i];
              const eqPos = cookie.indexOf('=');
              const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
              document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
            }
          }
          
          // Forçar atualização da página após breve pausa
          setTimeout(() => {
            window.location.href = '/auth/login?reset=1';
          }, 200);
          
        } catch (e) {
          // Erro silencioso
        }
        
        return true;
      }
    }
  }
  
  return false;
};

// Função para verificar se o token está próximo da expiração
export function isTokenExpiringSoon(token: string) {
  try {
    // Decodificar o token (sem verificação)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const { exp } = JSON.parse(jsonPayload);
    if (!exp) {
      return false;
    }

    // Se o token expirar em menos de 5 minutos (300 segundos)
    const currentTime = Math.floor(Date.now() / 1000);
    return exp - currentTime < 300;
  } catch (e) {
    return false;
  }
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [errorAuth, setErrorAuth] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se há um loop de redirecionamento detectado ou se estamos sendo forçados a ir para a página de login
    try {
      // Ignorar verificação se estamos em uma página pública como registro
      if (isPublicPage() && !isDashboardPage()) {
        setIsLoadingAuth(false);
        return;
      }
      
      const loopDetected = localStorage.getItem('loop_detected') === 'true';
      const forceLoginPage = localStorage.getItem('force_login_page') === 'true';
      const loopTime = parseInt(localStorage.getItem('loop_detected_time') || '0');
      const currentTime = Date.now();
      
      // Se estamos sendo forçados a ir para a página de login, mas não estamos na página de login
      if (forceLoginPage && !isLoginPage()) {
        router.push('/auth/login?reset=1');
        return;
      }
      
      // Se um loop foi detectado nos últimos 30 segundos, evitar qualquer verificação
      if (loopDetected && (currentTime - loopTime < 30000)) {
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      } else if (loopDetected || forceLoginPage) {
        // Se passou tempo suficiente, limpar o status de loop
        localStorage.removeItem('loop_detected');
        localStorage.removeItem('loop_detected_time');
        localStorage.removeItem('force_login_page');
      }
      
      // Tentativa de obter userId da localStorage ou cookie se disponível
      const userId = localStorage.getItem('userId');
      const userJson = localStorage.getItem('user');
      
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          setUser(userData);
        } catch (e) {
          // Erro silencioso
        }
      }
    } catch (e) {
      // Ignorar erros
    }
    
    // Se já estiver na página de login, não precisamos verificar autenticação
    if (isLoginPage()) {
      setIsLoadingAuth(false);
      return;
    }
    
    // Verificar se o estado já está disponível no localStorage
    const checkLocalStorage = () => {
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('auth_token');
          const isAuthStored = localStorage.getItem('isAuthenticated');
          
          if (token && isAuthStored === 'true') {
            setIsAuthenticated(true);
            setIsLoadingAuth(false);
            return true;
          }
        }
      } catch (error) {
        // Erro silencioso
      }
      return false;
    };

    // Se não encontrar no localStorage, fazer a verificação completa
    if (!checkLocalStorage() && !isCheckingAuth) {
      checkAuth();
    } else {
      setIsLoadingAuth(false);
    }
    
    // Adicionar listener para atualizar o estado quando o usuário retorna após login
    const handleVisibilityChange = () => {
      if (!document.hidden && !isLoginPage() && !isCheckingAuth) {
        // A página ficou visível novamente, atualizar estado de autenticação
        checkLocalStorage() || checkAuth();
      }
    };
    
    // Somente adicionar o listener se não estiver na página de login
    if (!isLoginPage()) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }
    
    // Adicionar listener para eventos de autenticação
    const handleAuthChanged = () => {
      if (!isLoginPage() && !isCheckingAuth) {
        // Verificar imediatamente o localStorage antes de fazer a requisição
        const isLocalStorageAuth = checkLocalStorage();
        
        // Se encontrou autenticação no localStorage, não precisa verificar no servidor
        // Caso contrário, verificar com o servidor
        if (!isLocalStorageAuth) {
          checkAuth();
        }
      }
    };
    
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      // Se estamos em uma página pública, não precisamos verificar
      if (isPublicPage() && !isDashboardPage()) {
        return;
      }
      
      // Evitar verificações simultâneas
      if (isCheckingAuth) {
        return;
      }
      
      isCheckingAuth = true;
      setIsLoadingAuth(true);
      setErrorAuth(null);
      
      // Verificar no localStorage primeiro para evitar chamadas desnecessárias
      const token = localStorage.getItem('auth_token');
      const isAuth = localStorage.getItem('isAuthenticated');
      
      if (!token || isAuth !== 'true') {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoadingAuth(false);
        return { isAuthenticated: false, user: null };
      }
      
      // Se houver um token no localStorage, verifica no servidor
      const response = await fetch('/api/auth/check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        // Se o servidor retornar erro, limpa localStorage e define como não autenticado
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoadingAuth(false);
        
        if (response.status === 401) {
          return { isAuthenticated: false, user: null };
        }
        
        throw new Error('Falha ao verificar autenticação');
      }
      
      const data = await response.json();
      
      if (data.authenticated && data.user) {
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        setUser(data.user);
      } else {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
      
      return { 
        isAuthenticated: data.authenticated, 
        user: data.user || null 
      };
    } catch (error) {
      // Erro silencioso
      setErrorAuth('Erro ao verificar autenticação');
      setIsAuthenticated(false);
      setUser(null);
      return { isAuthenticated: false, user: null };
    } finally {
      setIsLoadingAuth(false);
      isCheckingAuth = false;
    }
  }, []);

  // Função para redirecionar de forma segura
  const safeRedirect = (url: string) => {
    // Não redirecionar para o login se já estamos em uma página pública
    if (isPublicPage() && url.includes('/auth/login')) {
      return;
    }
    
    // Verificar se ainda não estamos no meio de um redirecionamento
    const now = Date.now();
    if (!isRedirecting && (now - lastRedirectTime > REDIRECT_COOLDOWN)) {
      isRedirecting = true;
      lastRedirectTime = now;
      
      // Registrar tentativa de redirecionamento para detectar loops
      localStorage.setItem('redirect_history', JSON.stringify([
        ...(JSON.parse(localStorage.getItem('redirect_history') || '[]')),
        { url, time: now }
      ]));
      
      router.push(url);
      
      // Resetar flag após um timeout
      setTimeout(() => {
        isRedirecting = false;
      }, REDIRECT_COOLDOWN);
    }
  };

  const logout = useCallback(async (): Promise<{ success: boolean, message: string }> => {
    try {
      setIsLoadingAuth(true);
      
      // Obter token CSRF para request seguro
      const csrfToken = localStorage.getItem('csrf_token');
      const authToken = localStorage.getItem('auth_token');
      
      // Tentar fazer logout no servidor
      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken ? `Bearer ${authToken}` : '',
            'X-CSRF-Token': csrfToken || ''
          }
        });
        
        // Se o POST falhar, tentar com método DELETE
        if (!response.ok) {
          console.log('Tentando método alternativo DELETE para logout após falha no POST');
          try {
            await fetch('/api/auth/logout', {
              method: 'DELETE',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authToken ? `Bearer ${authToken}` : '',
                'X-CSRF-Token': csrfToken || ''
              }
            });
          } catch (deleteError) {
            // Continuar com logout local mesmo com erro no servidor
            console.error('Erro ao tentar método DELETE para logout:', deleteError);
          }
        }
        
        // Continuar com logout local mesmo com erro no servidor
      } catch (serverError) {
        // Tentar método alternativo DELETE
        try {
          console.log('Tentando método alternativo DELETE para logout após falha na API');
          await fetch('/api/auth/logout', {
            method: 'DELETE',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authToken ? `Bearer ${authToken}` : '',
              'X-CSRF-Token': csrfToken || ''
            }
          });
        } catch (deleteError) {
          // Continuar com o logout local mesmo com erro no servidor
          console.error('Erro ao tentar método DELETE para logout:', deleteError);
        }
      }
      
      // Limpar todos os dados de autenticação do localStorage
      const keysToRemove = [
        'auth_token', 
        'isAuthenticated', 
        'userId', 
        'userRole', 
        'csrf_token',
        'auth_timestamp',
        'user'
      ];
      
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
      
      // Atualizar estado
      setIsAuthenticated(false);
      setUser(null);
      
      // Disparar evento para outros componentes
      const authEvent = new CustomEvent('auth-state-changed', { 
        detail: { authenticated: false }
      });
      window.dispatchEvent(authEvent);
      
      // Retornar sucesso, mesmo que o servidor tenha falhado (já que o logout local foi concluído)
      return {
        success: true,
        message: 'Logout realizado com sucesso'
      };
    } catch (error) {
      // Tentar limpar os dados mesmo com erro
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('csrf_token');
        
        setIsAuthenticated(false);
        setUser(null);
      } catch (cleanupError) {
        // Erro silencioso
      }
      
      return {
        success: false,
        message: 'Erro ao processar logout, mas dados locais foram limpos'
      };
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      setIsLoadingAuth(true);
      setErrorAuth(null);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include', // Importante para receber e enviar cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMsg = data.message || 'Erro ao fazer login';
        setErrorAuth(errorMsg);
        return { 
          success: false, 
          message: errorMsg
        };
      }
      
      // Verificar se temos todos os dados necessários
      if (!data.token || !data.user || !data.csrfToken) {
        setErrorAuth('Erro no processo de login: resposta incompleta');
        return {
          success: false,
          message: 'Erro no processo de login: resposta incompleta'
        };
      }
      
      // Armazenar token JWT e CSRF token no localStorage
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('csrf_token', data.csrfToken);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userId', data.user.id || data.user._id);
      
      if (data.user.role) {
        localStorage.setItem('userRole', data.user.role);
      }
      
      // Criar e armazenar timestamp de login
      const loginTimestamp = Date.now();
      localStorage.setItem('auth_timestamp', loginTimestamp.toString());
      
      // Atualizar estado de autenticação
      setIsAuthenticated(true);
      setUser(data.user);
      setErrorAuth(null);
      
      // Disparar evento personalizado para outros componentes saberem da mudança de autenticação
      const authEvent = new CustomEvent('auth-state-changed', { 
        detail: { 
          authenticated: true,
          user: data.user
        }
      });
      window.dispatchEvent(authEvent);
      
      // Retornar sucesso
      return {
        success: true,
        user: data.user,
        message: 'Login realizado com sucesso'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido ao fazer login';
      setErrorAuth(errorMsg);
      return {
        success: false,
        message: errorMsg
      };
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  const requireAuth = () => {
    if (!isLoadingAuth && !isAuthenticated) {
      toast.error('Você precisa estar logado para realizar esta ação');
      
      if (!isLoginPage()) {
        safeRedirect('/auth/login');
      }
      
      return false;
    }
    return true;
  };

  return {
    isAuthenticated,
    isLoadingAuth,
    requireAuth,
    login,
    logout,
    checkAuth,
    user,
    errorAuth
  };
} 