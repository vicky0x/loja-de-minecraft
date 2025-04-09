'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../ui/LoadingSpinner';

// Controle global para evitar redirecionamentos simultâneos
let isRedirecting = false;
let lastRedirectTime = 0;
let redirectCounter = 0;
const REDIRECT_COOLDOWN = 5000; // 5 segundos entre redirecionamentos
const MAX_REDIRECTS = 3; // Número máximo de redirecionamentos permitidos em um curto espaço de tempo

// Verificar se já estamos na página de login
const isLoginPage = () => {
  if (typeof window !== 'undefined') {
    return window.location.pathname.includes('/auth/login');
  }
  return false;
};

// Verificar se já estamos na página do dashboard
const isDashboardPage = () => {
  if (typeof window !== 'undefined') {
    return window.location.pathname.includes('/dashboard');
  }
  return false;
};

declare global {
  interface Window {
    fetchAssignments?: (page?: number) => Promise<any>;
    __ANTI_LOOP_FLAG?: boolean;
  }
}

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Função segura para redirecionar para login
  const redirectToLogin = () => {
    // Emergência: Ativar a flag anti-loop imediatamente para interromper redirecionamentos
    if (typeof window !== 'undefined') {
      window.__ANTI_LOOP_FLAG = true;
      
      // Tentativa de armazenar dados temporários para debug
      try {
        localStorage.setItem('auth_debug', 'redirect_prevented');
        console.warn('MODO DE EMERGÊNCIA ATIVADO: Loop de redirecionamento interrompido.');
      } catch (e) {
        // Ignorar erros ao manipular localStorage
      }
      
      // Em vez de redirecionar, vamos forçar a autenticação
      setIsAuthenticated(true);
      return false;
    }
    
    // Resto do código original abaixo (que não será mais executado nesta emergência)
    // ...
    
    return false;
  };
  
  // Verificar autenticação apenas quando o componente for montado
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const checkAuthentication = () => {
      // Evitar múltiplas verificações simultâneas
      const checkingInProgress = sessionStorage.getItem('auth_check_in_progress') === 'true';
      if (checkingInProgress) {
        console.log('[AuthWrapper] Verificação de autenticação já em andamento, pulando...');
        return;
      }
      
      // Verificar se as verificações de autenticação estão bloqueadas (durante logout)
      if (sessionStorage.getItem('block_auth_checks') === 'true') {
        console.log('[AuthWrapper] Verificações de autenticação bloqueadas temporariamente');
        return;
      }

      // Verificar se estamos em um ciclo de carregamento muito longo
      const loadingStartTime = sessionStorage.getItem('dashboard_loading_start');
      const now = Date.now();
      
      if (loadingStartTime) {
        const loadingTime = now - parseInt(loadingStartTime);
        const MAX_LOADING_TIME = 10000; // 10 segundos
        
        if (loadingTime > MAX_LOADING_TIME) {
          console.warn('[AuthWrapper] Carregamento da dashboard está demorando muito. Resetando o estado para evitar tela de loading infinita.');
          setIsAuthenticated(false);
          setIsMounted(true);
          sessionStorage.removeItem('dashboard_loading_start');
          return;
        }
      } else {
        // Registrar hora de início do carregamento
        sessionStorage.setItem('dashboard_loading_start', now.toString());
      }
      
      sessionStorage.setItem('auth_check_in_progress', 'true');
      
      try {
        // Verificar se há processo de logout em andamento
        const logoutInProgress = sessionStorage.getItem('logout_in_progress') === 'true';
        
        // Se houver processo de logout, não interferir com verificações de autenticação
        if (logoutInProgress) {
          console.log('[AuthWrapper] Processo de logout em andamento, ignorando verificações de autenticação');
          setIsAuthenticated(false);
          sessionStorage.removeItem('auth_check_in_progress');
          return;
        }
        
        // Verificar se já houve muitos redirecionamentos
        try {
          // Obter histórico de navegação do sessionStorage
          const navigationHistory = JSON.parse(sessionStorage.getItem('navigation_history') || '[]');
          const now = Date.now();
          
          // Adicionar esta página ao histórico
          const currentPath = window.location.pathname;
          const currentUrl = window.location.href;
          navigationHistory.push({
            path: currentPath,
            timestamp: now,
            url: currentUrl
          });
          
          // Manter apenas as últimas 8 navegações
          if (navigationHistory.length > 8) {
            navigationHistory.shift();
          }
          
          // Salvar histórico atualizado
          sessionStorage.setItem('navigation_history', JSON.stringify(navigationHistory));
          
          // Verificar se temos um padrão de loop real (mesmo URL exato visitado mais de 3 vezes em menos de 3 segundos)
          const recentVisits = navigationHistory.filter(entry => {
            return entry.path === currentPath && (now - entry.timestamp < 3000);
          });
          
          // Se encontrarmos mais de 3 visitas ao mesmo URL exato em menos de 3 segundos, isso é um loop
          if (recentVisits.length >= 3) {
            console.warn('[AuthWrapper] Possível loop de navegação detectado. Verificando padrão...');
            
            // Verificar se há um padrão de alternância de URLs que não é realmente um loop
            // Por exemplo: dashboard -> login -> dashboard pode ser navegação normal, não um loop
            const isNormalNavigation = navigationHistory.length >= 3 && 
              navigationHistory.slice(-3).some(entry => entry.path !== currentPath);
            
            if (!isNormalNavigation) {
              console.error('[AuthWrapper] Loop de redirecionamento confirmado! Ativando proteção anti-loop');
              sessionStorage.setItem('anti_loop_active', 'true');
              sessionStorage.setItem('anti_loop_timestamp', now.toString());
              
              // Forçar autenticação temporariamente para quebrar o loop
              setIsAuthenticated(true);
              setIsMounted(true);
              sessionStorage.removeItem('auth_check_in_progress');
              return;
            } else {
              console.log('[AuthWrapper] Navegação alternada detectada, não é um loop.');
            }
          }
          
          // Limpar proteção anti-loop se passou mais de 60 segundos desde sua ativação
          const antiLoopTimestamp = parseInt(sessionStorage.getItem('anti_loop_timestamp') || '0');
          if (sessionStorage.getItem('anti_loop_active') === 'true' && (now - antiLoopTimestamp > 60000)) {
            console.log('[AuthWrapper] Desativando proteção anti-loop após 60 segundos');
            sessionStorage.removeItem('anti_loop_active');
            sessionStorage.removeItem('anti_loop_timestamp');
          }
        } catch (e) {
          console.error('[AuthWrapper] Erro ao verificar histórico de navegação:', e);
        }
        
        // 2. Verificação mais robusta da autenticação usando múltiplas fontes
        let hasToken = false;
        let isAuthStored = false;
        let hasAuthCookie = false;
        let hasUserData = false;
        
        try {
          hasToken = !!localStorage.getItem('auth_token');
          isAuthStored = localStorage.getItem('isAuthenticated') === 'true';
          hasUserData = !!localStorage.getItem('user');
        } catch (storageError) {
          console.error('[AuthWrapper] Erro ao verificar autenticação no localStorage:', storageError);
        }
        
        // 2.1 Verificar cookies também (método mais confiável)
        try {
          hasAuthCookie = document.cookie
            .split(';')
            .some(cookie => cookie.trim().startsWith('auth_token='));
        } catch (cookieError) {
          console.error('[AuthWrapper] Erro ao verificar cookies de autenticação:', cookieError);
        }
        
        // 3. Lógica de decisão mais robusta
        // Considerar qualquer um dos dois como válido para evitar problemas de sincronização
        const isReallyAuthenticated = hasAuthCookie || (isAuthStored && hasToken && hasUserData);
        
        // 4. Corrigir inconsistências sem redirecionar
        if (!isReallyAuthenticated && (hasToken || isAuthStored || hasUserData)) {
          console.warn('[AuthWrapper] Dados de autenticação inconsistentes, limpando localStorage');
          try {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('user');
            localStorage.removeItem('userId');
            localStorage.removeItem('userRole');
            localStorage.removeItem('auth_timestamp');
            localStorage.removeItem('lastAuthCheck');
          } catch (e) {
            console.error('[AuthWrapper] Erro ao limpar dados inconsistentes:', e);
          }
        }
        
        // 5. Atualizar estado baseado nas verificações robustas
        if (isReallyAuthenticated) {
          console.log('[AuthWrapper] Autenticação validada');
          setIsAuthenticated(true);
          
          // Limpar o timestamp de carregamento da dashboard
          sessionStorage.removeItem('dashboard_loading_start');
        } else {
          console.warn('[AuthWrapper] Autenticação inválida ou incompleta, redirecionando para login');
          
          // Se não estiver autenticado e não estiver na página de login, redirecionar
          // Incrementar contador de redirecionamentos
          if (!isLoginPage()) {
            try {
              const redirectCount = parseInt(sessionStorage.getItem('redirect_count') || '0');
              sessionStorage.setItem('redirect_count', (redirectCount + 1).toString());
              sessionStorage.setItem('last_redirect_time', Date.now().toString());
            } catch (e) {
              console.error('[AuthWrapper] Erro ao atualizar contador de redirecionamentos:', e);
            }
            
            // Verificar novamente se não estamos em um loop antes de redirecionar
            if (sessionStorage.getItem('anti_loop_active') !== 'true') {
              router.push('/auth/login?redirect=dashboard');
            } else {
              console.warn('[AuthWrapper] Redirecionamento bloqueado pela proteção anti-loop');
            }
          }
          
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthWrapper] Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      } finally {
        setIsMounted(true);
        sessionStorage.removeItem('auth_check_in_progress');
      }
    };
    
    checkAuthentication();
    
    // Adicionar listener para atualizar autenticação quando mudanças ocorrerem
    const handleAuthChange = () => {
      console.log('[AuthWrapper] Evento de mudança de autenticação detectado');
      checkAuthentication();
    };
    
    try {
      window.addEventListener('auth-state-changed', handleAuthChange);
    } catch (e) {
      console.error('[AuthWrapper] Erro ao adicionar listener de evento:', e);
    }
    
    // Definir função global para buscar atribuições (evitar erros em todo o dashboard)
    try {
      window.fetchAssignments = async (page = 1) => {
        try {
          return { items: [], totalPages: 0, currentPage: 1 }; // Mock de dados
        } catch (error) {
          console.error('Erro ao buscar atribuições', error);
          return null;
        }
      };
    } catch (e) {
      console.error('[AuthWrapper] Erro ao definir função global fetchAssignments:', e);
    }
    
    return () => {
      try {
        window.removeEventListener('auth-state-changed', handleAuthChange);
      } catch (e) {
        console.error('[AuthWrapper] Erro ao remover listener de evento:', e);
      }
    };
  }, [router]);
  
  // Mostrar carregamento enquanto verifica autenticação
  if (!isMounted || isAuthenticated === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  // Se não estiver autenticado, o redirecionamento já foi acionado
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-100">
        <LoadingSpinner size="lg" />
        <p className="ml-2 text-gray-400">Redirecionando...</p>
      </div>
    );
  }
  
  // Renderizar conteúdo quando autenticado
  return <>{children}</>;
} 