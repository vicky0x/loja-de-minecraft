'use client';

import { useEffect } from 'react';
import { setupPolyfills } from '../utils/polyfills';

/**
 * Componente que carrega os polyfills necessários para a aplicação
 * Este componente deve ser importado no layout principal da aplicação
 * para garantir que os polyfills sejam carregados antes de qualquer código
 * que dependa deles.
 */
export default function PolyfillLoader() {
  useEffect(() => {
    // Configurar todos os polyfills no carregamento inicial da aplicação
    setupPolyfills();
  }, []);

  // Este componente não renderiza nada, apenas executa o efeito
  return null;
} 