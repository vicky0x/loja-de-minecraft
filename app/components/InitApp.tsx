'use client';

import { useEffect, useState } from 'react';
import { fetchAssignments as storeAssignments } from '@/app/lib/store';

// Declaração do tipo para as funções globais
declare global {
  interface Window {
    fetchAssignments: (page?: number) => Promise<void>;
  }
}

/**
 * Componente responsável por inicializar serviços globais do aplicativo
 * como conexões com Redis, listeners, etc. Deve ser adicionado no layout principal.
 */
export default function InitApp() {
  const [initialized, setInitialized] = useState(false);

  // Inicializar funções globais na window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Definir fetchAssignments no objeto window
      window.fetchAssignments = async (page = 1) => {
        return storeAssignments(page);
      };

      console.log('InitApp: funções globais definidas');
    }
  }, []);

  useEffect(() => {
    async function initializeServices() {
      try {
        // Verificar se estamos em produção
        const isProduction = process.env.NODE_ENV === 'production';
        
        // Redis é inicializado automaticamente nas API routes
        // Não tentamos inicializar no lado do cliente
        
        // Registrar eventos globais se necessário
        // ...
        
        setInitialized(true);
      } catch (error) {
        // Erro silencioso
      }
    }

    if (!initialized) {
      initializeServices();
    }
    
    // Cleanup ao desmontar
    return () => {
      // Limpar conexões ou listeners se necessário
    };
  }, [initialized]);

  // Configurar manipuladores globais de erros
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Manipulador para erros não capturados
    const handleError = (event: ErrorEvent) => {
      // Verificar se é um erro que podemos ignorar silenciosamente
      if (event.error && 
         (String(event.error).includes('[object Event]') || 
          String(event.error).includes('navigation') ||
          String(event.error).includes('abort'))) {
        event.preventDefault();
        return;
      }
      
      console.error('Erro global interceptado:', event.error);
      // Prevenir que o erro seja exibido no console do browser
      event.preventDefault();
    };

    // Manipulador para promessas não tratadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Verificar se é o erro de [object Event]
      const reason = event.reason;
      const reasonStr = String(reason);
      
      // Lista de padrões de erro que devem ser tratados silenciosamente
      const silentErrorPatterns = [
        '[object Event]',
        'navigation',
        'abort',
        'cancel',
        'redirect',
        'loading chunk',
        'Failed to fetch',
        'NetworkError',
        'timeout',
        'ECONNREFUSED',
        'Aborted',
        'Navigation interrupted'
      ];
      
      // Verificar se o erro corresponde a algum padrão que deve ser tratado silenciosamente
      const isSilentError = silentErrorPatterns.some(pattern => 
        reasonStr.includes(pattern) || 
        (reason instanceof Event) ||
        (reason instanceof DOMException && reason.name === 'AbortError')
      );
      
      if (isSilentError) {
        console.warn('Erro não crítico interceptado silenciosamente');
        event.preventDefault();
        return;
      }
      
      // Para outros erros, registrar mas não interromper o uso
      console.error('Promessa não tratada:', reason);
      event.preventDefault();
    };

    // Registrar manipuladores
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Limpar manipuladores na desmontagem
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Componente não renderiza nada visível, apenas inicializa serviços
  return null;
} 