import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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

// Verificar se já estamos na página de login
const isLoginPage = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return path === '/auth/login' || path.startsWith('/auth/login/');
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
        console.warn('Loop de redirecionamento detectado! Interrompendo...', lastURLs);
        
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
          console.error('Erro ao limpar dados durante detecção de loop:', e);
        }
        
        return true;
      }
    }
  }
  
  return false;
};

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [user, setUser] = useState<User | null>(null);
  const [errorAuth, setErrorAuth] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Verificar se há um loop de redirecionamento detectado ou se estamos sendo forçados a ir para a página de login
    try {
      const loopDetected = localStorage.getItem('loop_detected') === 'true';
      const forceLoginPage = localStorage.getItem('force_login_page') === 'true';
      const loopTime = parseInt(localStorage.getItem('loop_detected_time') || '0');
      const currentTime = Date.now();
      
      // Se estamos sendo forçados a ir para a página de login, mas não estamos na página de login
      if (forceLoginPage && !isLoginPage()) {
        console.warn('Forçando redirecionamento para página de login após detecção de loop');
        router.push('/auth/login?reset=1');
        return;
      }
      
      // Se um loop foi detectado nos últimos 30 segundos, evitar qualquer verificação
      if (loopDetected && (currentTime - loopTime < 30000)) {
        console.warn('Recuperando de um loop de redirecionamento. Aguardando...');
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
          console.error('Erro ao analisar dados do usuário:', e);
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
        console.error('Erro ao verificar localStorage:', error);
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
      console.error('Erro ao verificar autenticação:', error);
      setErrorAuth('Erro ao verificar autenticação');
      setIsAuthenticated(false);
      setUser(null);
      return { isAuthenticated: false, user: null };
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // Função segura para redirecionar
  const safeRedirect = (url: string) => {
    const now = Date.now();
    
    // Verificar se estamos em um loop de redirecionamento
    if (detectRedirectLoop()) {
      console.warn('Loop de redirecionamento detectado ao tentar redirecionar. Cancelando redirecionamento.');
      return;
    }
    
    // Se estamos na página de destino, não redirecionar
    if ((url === '/auth/login' && isLoginPage()) || 
        (url === '/dashboard' && isDashboardPage())) {
      return;
    }
    
    // Verificar se podemos redirecionar
    if (!isRedirecting && 
        (now - lastRedirectTime > REDIRECT_COOLDOWN)) {
      
      // Atualizar variáveis de controle
      isRedirecting = true;
      lastRedirectTime = now;
      
      console.log(`Redirecionando para ${url}`);
      
      // Redirecionar após breve atraso
      setTimeout(() => {
        router.push(url);
        
        // Liberar a flag após o redirecionamento
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }, 200);
    } else {
      console.log(`Redirecionamento para ${url} bloqueado (cooldown ou já redirecionando)`);
    }
  };

  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoadingAuth(true);
      
      // Mesmo se a requisição falhar, limpar localStorage
      try {
        const token = localStorage.getItem('auth_token');
        
        if (token) {
          const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (!response.ok) {
            console.warn('Erro ao fazer logout no servidor, mas dados locais foram limpos');
          }
        }
      } catch (error) {
        console.error('Erro ao fazer logout no servidor:', error);
      }
      
      // Limpar localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('cartItems');
      
      // Remover flags de redirecionamento
      localStorage.removeItem('auth_redirect_triggered');
      localStorage.removeItem('login_redirect_attempts');
      localStorage.removeItem('dashboard_redirect_attempts');
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorAuth(data.message || 'Erro ao fazer login');
        return { 
          success: false, 
          message: data.message || 'Erro ao fazer login'
        };
      }
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
        setUser(data.user);
        
        return { 
          success: true, 
          message: 'Login realizado com sucesso',
          user: data.user
        };
      } else {
        setErrorAuth('Erro ao processar autenticação');
        return { 
          success: false, 
          message: 'Erro ao processar autenticação'
        };
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      setErrorAuth('Erro ao fazer login');
      return { success: false, message: 'Erro ao fazer login' };
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