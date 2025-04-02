'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Componente que intercepta a navegação para verificar redirecionamentos pendentes.
 * Usado principalmente para corrigir o fluxo de redirecionamento após login.
 */
export default function NavigationInterceptor() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Interceptar navegação para verificar redirecionamentos pendentes
  useEffect(() => {
    // Não executar no servidor
    if (typeof window === 'undefined') return;
    
    const checkPendingRedirects = () => {
      try {
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        const loginInProgress = localStorage.getItem('login_in_progress');
        
        // Se estiver na dashboard mas tiver um redirecionamento pendente
        if (pathname === '/dashboard' && redirectPath && !loginInProgress) {
          console.log('[NAVIGATION] Detectada navegação para dashboard com redirecionamento pendente:', redirectPath);
          
          // Limpar redirecionamento e navegar para a página correta
          localStorage.removeItem('redirectAfterLogin');
          console.log('[NAVIGATION] Redirecionando para:', redirectPath);
          
          // Atrasar um pouco para evitar conflitos com outras navegações
          setTimeout(() => {
            router.push(redirectPath);
          }, 100);
        }
      } catch (error) {
        console.error('[NAVIGATION] Erro ao verificar redirecionamentos pendentes:', error);
      }
    };
    
    // Verificar quando a rota mudar
    checkPendingRedirects();
    
    // Adicionar verificação também quando o usuário volta para a página
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkPendingRedirects();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pathname, router]);

  // Este componente não renderiza nada visualmente
  return null;
} 