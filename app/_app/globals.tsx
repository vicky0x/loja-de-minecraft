'use client';

/**
 * Este arquivo define funções e variáveis globais para toda a aplicação
 * Ele é importado no RootLayout para garantir que essas funções estejam 
 * disponíveis em todas as páginas e componentes.
 */

import { useEffect } from 'react';
import { fetchAssignments as storeAssignments } from '@/app/lib/store';

// Declaração do tipo para as funções globais
declare global {
  interface Window {
    fetchAssignments: (page?: number) => Promise<void>;
  }
}

// Componente que será renderizado no layout raiz
export default function GlobalAppInitializer() {
  useEffect(() => {
    // Definir funções globais na janela quando o componente for montado
    if (typeof window !== 'undefined') {
      // Definir fetchAssignments no objeto window
      window.fetchAssignments = async (page = 1) => {
        return storeAssignments(page);
      };

      console.log('GlobalAppInitializer: funções globais definidas');
    }

    // Função de limpeza para o useEffect
    return () => {
      console.log('GlobalAppInitializer: desmontando');
    };
  }, []);

  // Este componente não renderiza nada visível
  return null;
} 