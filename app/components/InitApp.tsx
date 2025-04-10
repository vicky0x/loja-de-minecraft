'use client';

import { useEffect, useState } from 'react';

/**
 * Componente responsável por inicializar serviços globais do aplicativo
 * como conexões com Redis, listeners, etc. Deve ser adicionado no layout principal.
 */
export default function InitApp() {
  const [initialized, setInitialized] = useState(false);

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

  // Componente não renderiza nada visível, apenas inicializa serviços
  return null;
} 