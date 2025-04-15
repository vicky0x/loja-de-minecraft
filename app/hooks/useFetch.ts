'use client';

import { useState, useEffect, useCallback } from 'react';

interface UseFetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  redirectOnUnauthorized?: boolean;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  statusCode: number | null;
}

// Evitar múltiplos redirecionamentos simultâneos
let isRedirecting = false;
let lastRedirectTime = 0;
const REDIRECT_COOLDOWN = 5000; // 5 segundos entre redirecionamentos

// Verificar se já estamos na página de login
const isLoginPage = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return path === '/auth/login' || path.startsWith('/auth/login/');
  }
  return false;
};

// Verificar se já estamos na página de dashboard
const isDashboardPage = () => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    return path === '/dashboard' || path.startsWith('/dashboard/');
  }
  return false;
};

/**
 * Hook personalizado para fazer requisições fetch com suporte a retry e timeout
 */
export function useFetch<T = any>(
  url: string,
  options: UseFetchOptions = {},
  immediate: boolean = true
) {
  const {
    timeout = 8000,
    retries = 2,
    retryDelay = 1000,
    redirectOnUnauthorized = true,
    ...fetchOptions
  } = options;

  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: immediate,
    error: null,
    statusCode: null,
  });

  // Verificar autenticação e redirecionar se necessário
  const handleUnauthorized = useCallback(() => {
    const now = Date.now();
    
    // Verificar se podemos redirecionar
    if (redirectOnUnauthorized && 
        !isRedirecting && 
        (now - lastRedirectTime > REDIRECT_COOLDOWN) && 
        !isLoginPage()) {
      
      console.log('Sessão expirada. Redirecionando para login...');
      
      // Atualizar variáveis de controle
      isRedirecting = true;
      lastRedirectTime = now;
      
      // Remover tokens inválidos
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('isAuthenticated');
        
        // Adicionar flag para evitar loop de redirecionamento
        localStorage.setItem('auth_redirect_triggered', 'true');
      } catch (e) {
        // Ignorar erros ao manipular localStorage
      }
      
      // Só redireciona se não estiver numa página específica
      // e não tiver sofrido redirecionamento recente
      if (!isLoginPage() && localStorage.getItem('auth_redirect_triggered') !== 'multiple') {
        // Controle de múltiplos redirecionamentos
        localStorage.setItem('auth_redirect_triggered', 'multiple');
        
        // Redirecionar para login após breve atraso
        setTimeout(() => {
          if (typeof window !== 'undefined' && !isLoginPage()) {
            window.location.href = '/auth/login';
          }
          
          // Liberar a flag após o redirecionamento
          setTimeout(() => {
            isRedirecting = false;
            // Reseta o controle após alguns segundos
            setTimeout(() => {
              localStorage.setItem('auth_redirect_triggered', 'false');
            }, 5000);
          }, 1000);
        }, 500);
      } else {
        // Se já está redirecionando, apenas libera a flag
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
    }
  }, [redirectOnUnauthorized]);

  // Função para fazer o fetch com retry
  const fetchWithRetry = useCallback(
    async (retryCount = 0): Promise<{ data: T | null; statusCode: number | null }> => {
      try {
        // Não iniciar requisição se já estiver redirecionando
        if (isRedirecting) {
          return { data: null, statusCode: null };
        }
        
        // Configurar timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        // Tratar erros de autenticação (401)
        if (response.status === 401) {
          handleUnauthorized();
          return { data: null, statusCode: 401 };
        }

        // Verificar status HTTP
        if (!response.ok) {
          // Se for erro 5xx e ainda temos retries disponíveis, tentar novamente
          if (response.status >= 500 && retryCount < retries) {
            console.warn(`Erro ${response.status}, tentando novamente (${retryCount + 1}/${retries})...`);
            
            // Esperar antes de tentar novamente
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            
            return fetchWithRetry(retryCount + 1);
          }

          // Se for erro 4xx ou acabaram os retries, retornar erro
          const errorText = await response.text().catch(() => 'Erro desconhecido');
          const error = new Error(`Erro HTTP ${response.status}: ${errorText}`);
          throw error;
        }

        // Tentar processar o JSON
        const text = await response.text();
        
        if (!text || text.trim() === '') {
          return { data: null, statusCode: response.status };
        }
        
        try {
          const data = JSON.parse(text) as T;
          return { data, statusCode: response.status };
        } catch (jsonError) {
          throw new Error(`Erro ao processar JSON: ${(jsonError as Error).message}`);
        }
      } catch (error) {
        // Se for timeout e ainda temos retries disponíveis, tentar novamente
        if (
          error instanceof DOMException && 
          error.name === 'AbortError' && 
          retryCount < retries
        ) {
          console.warn(`Timeout, tentando novamente (${retryCount + 1}/${retries})...`);
          
          // Esperar antes de tentar novamente
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          return fetchWithRetry(retryCount + 1);
        }

        throw error;
      }
    },
    [url, fetchOptions, timeout, retries, retryDelay, handleUnauthorized]
  );

  // Função para executar o fetch
  const execute = useCallback(async () => {
    // Não iniciar novas requisições se já estiver redirecionando
    if (isRedirecting) {
      return { data: null, statusCode: null };
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const { data, statusCode } = await fetchWithRetry();
      
      // Se for 401, o redirecionamento já foi tratado
      if (statusCode === 401) {
        setState(prev => ({ ...prev, loading: false }));
        return { data: null, statusCode };
      }
      
      setState({ data, loading: false, error: null, statusCode });
      return { data, statusCode };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, loading: false, error: errorObj, statusCode: null });
      return { data: null, error: errorObj, statusCode: null };
    }
  }, [fetchWithRetry]);

  // Executar fetch imediatamente se immediate=true
  useEffect(() => {
    // Não executar a fetch se estamos na página de login ou redirecionando
    if (immediate && !isRedirecting && !isLoginPage()) {
      // Verificar se temos redirecionamento recente
      const recentRedirect = localStorage.getItem('auth_redirect_triggered');
      if (recentRedirect === 'multiple') {
        return; // Evita novas requisições durante redirecionamentos
      }
      
      // Verificar se já existe token de autenticação
      try {
        const hasToken = localStorage.getItem('auth_token');
        const isAuthStored = localStorage.getItem('isAuthenticated');
        
        // Só fazer a requisição se houver token
        if (hasToken && isAuthStored === 'true') {
          execute();
        } else if (redirectOnUnauthorized && !isLoginPage()) {
          // Se não houver token e a URL não for a de login, redirecionar
          handleUnauthorized();
        }
      } catch (e) {
        // Ignorar erros ao acessar localStorage
      }
    }
  }, [execute, immediate, redirectOnUnauthorized, handleUnauthorized]);

  return { ...state, execute, setData: (data: T) => setState(prev => ({ ...prev, data })) };
} 