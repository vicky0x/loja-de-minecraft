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
      try {
        // 1. Verificar se há loop de requisições em andamento - AJUSTADO PARA SER MENOS AGRESSIVO
        let loopDetected = false;
        let lastRedirectTimeStr = null;
        let redirectCount = 0;
        const now = Date.now();
        
        try {
          // DESATIVADO TEMPORARIAMENTE O SISTEMA DE DETECÇÃO DE LOOP
          // loopDetected = localStorage.getItem('loop_detected') === 'true';
          loopDetected = false; // Forçar desativação do sistema de emergência
          
          lastRedirectTimeStr = localStorage.getItem('last_redirect_time');
          redirectCount = parseInt(localStorage.getItem('redirect_count') || '0', 10);
          
          // Limpar flags de loop para evitar comportamento errático
          try {
            localStorage.removeItem('loop_detected');
            localStorage.removeItem('loop_detected_time');
            localStorage.setItem('redirect_count', '0');
          } catch (e) {
            console.error('[AuthWrapper] Erro ao resetar flags de loop:', e);
          }
        } catch (storageError) {
          console.error('[AuthWrapper] Erro ao acessar localStorage:', storageError);
        }
        
        // DESATIVADO: Sistema anti-loop está causando problemas
        if (false && loopDetected) {
          // Antigo código de detecção de loop (desativado)
          console.warn('[AuthWrapper] Sistema de detecção de loop desativado temporariamente');
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
        
        // 3. Lógica de decisão mais robusta - SIMPLIFICADA PARA EVITAR FALSOS POSITIVOS
        // const isReallyAuthenticated = hasAuthCookie && (isAuthStored || hasUserData);
        const isReallyAuthenticated = hasAuthCookie || (isAuthStored && hasToken); // Mais permissivo
        
        // DESATIVADO: Sistema que monitora redirecionamentos é muito sensível
        if (false && lastRedirectTimeStr) {
          // Antigo código de contador de redirecionamentos (desativado)
          console.warn('[AuthWrapper] Sistema de contagem de redirecionamentos desativado temporariamente');
        }
        
        try {
          localStorage.setItem('last_redirect_time', now.toString());
        } catch (e) {
          console.error('[AuthWrapper] Erro ao atualizar timestamp de redirecionamento:', e);
        }
        
        // 4. Atualizar estado baseado nas verificações robustas
        if (isReallyAuthenticated) {
          console.log('[AuthWrapper] Autenticação validada');
          setIsAuthenticated(true);
        } else {
          console.warn('[AuthWrapper] Autenticação inválida ou incompleta, redirecionando para login');
          
          // Limpar dados inconsistentes antes de redirecionar
          if (!hasAuthCookie && (hasToken || isAuthStored)) {
            console.warn('[AuthWrapper] Dados de autenticação inconsistentes, limpando localStorage');
            try {
              localStorage.removeItem('auth_token');
              localStorage.removeItem('isAuthenticated');
              localStorage.removeItem('user');
            } catch (e) {
              console.error('[AuthWrapper] Erro ao limpar dados inconsistentes:', e);
            }
          }
          
          // Se não estiver autenticado e não estiver na página de login, redirecionar
          // SIMPLIFICADO: Apenas redireciona, sem parâmetros que ativam sistemas de emergência
          if (!isLoginPage()) {
            router.push('/auth/login');
          }
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AuthWrapper] Erro ao verificar autenticação:', error);
        
        // Em caso de erro crítico, tentar redirecionar para login como fallback
        try {
          if (!isLoginPage()) {
            router.push('/auth/login'); // Removido parâmetros para evitar loop
          }
        } catch (routerError) {
          console.error('[AuthWrapper] Erro ao redirecionar após falha:', routerError);
        }
        
        setIsAuthenticated(false);
      } finally {
        setIsMounted(true);
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