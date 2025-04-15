'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useAuth } from '@/app/lib/auth/session';

// Variável para controlar redirecionamentos simultâneos
let isRedirecting = false;

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [localAuth, setLocalAuth] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Verificar autenticação no localStorage se cookies não funcionarem
    const checkLocalStorage = () => {
      try {
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user');
        
        if (storedAuth === 'true' && storedUser) {
          setLocalAuth(true);
          console.log('Autenticação via localStorage encontrada:', JSON.parse(storedUser).email || 'usuário');
        }
      } catch (error) {
        console.error('Erro ao ler autenticação do localStorage:', error);
      }
    };
  
    // Verificar localStorage imediatamente
    checkLocalStorage();
    setIsMounted(true);
    
    // Verificar permissões apenas quando não estiver mais carregando
    if (!loading) {
      console.log('Estado de autenticação dashboard:', { 
        isAuthenticated, 
        localAuth, 
        user: user ? user.username || user.email : 'nenhum'
      });
      
      const hasValidAuth = isAuthenticated || localAuth;
      
      // Se não estiver autenticado, redirecionar para login
      if (!hasValidAuth && !isRedirecting) {
        console.log('Usuário não autenticado, redirecionando para login');
        
        // Controle para evitar múltiplos redirecionamentos
        try {
          // Verificar se já foi feito um redirecionamento recente
          const lastRedirectTime = parseInt(localStorage.getItem('last_redirect_time') || '0');
          const now = Date.now();
          
          // Se passou menos de 3 segundos desde o último redirecionamento, aguardar
          if (now - lastRedirectTime < 3000) {
            console.log('Redirecionamento recente detectado, aguardando...');
            return;
          }
          
          // Marcar redirecionamento atual
          isRedirecting = true;
          localStorage.setItem('last_redirect_time', now.toString());
        } catch (e) {
          // Continuar mesmo com erro no localStorage
          console.warn('Erro ao verificar tempo de redirecionamento:', e);
        }
        
        // Verificar se já estamos na página de login para evitar loop
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/auth/login') && 
            !window.location.pathname.includes('/auth/register')) {
          
          // Usar um timeout para dar tempo ao React de terminar seu ciclo atual
          setTimeout(() => {
            try {
              // Salvar a URL atual para redirecionamento após login
              try {
                if (!window.location.pathname.includes('/auth/')) {
                  localStorage.setItem('redirectAfterLogin', window.location.pathname);
                }
              } catch (e) {
                console.warn('Erro ao salvar redirecionamento:', e);
              }
              
              // Usar navegação direta do navegador para evitar problemas com o router
              window.location.href = '/auth/login?redirect=dashboard';
            } catch (error) {
              console.error('Erro durante redirecionamento para login:', error);
              // Tentar abordagem alternativa em caso de erro
              try {
                router.push('/auth/login');
              } catch (routerError) {
                console.error('Falha completa no redirecionamento:', routerError);
              }
            } finally {
              // Garantir que a flag seja resetada após alguns segundos
              setTimeout(() => {
                isRedirecting = false;
              }, 3000);
            }
          }, 100);
        } else {
          // Se já estamos na página de login, não redirecionar
          isRedirecting = false;
        }
      }
    }
  }, [loading, isAuthenticated, user, router]);

  // Verificar se o componente ainda está carregando
  if (loading && !localAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-100">
        <LoadingSpinner size="lg" />
        <p className="ml-2 text-gray-400">Verificando autenticação...</p>
      </div>
    );
  }

  // Se não estiver montado, mostrar um indicador de carregamento simples
  if (!isMounted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-dark-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Se tiver autenticação válida, mostrar o conteúdo
  const hasValidAuth = isAuthenticated || localAuth;
  
  if (hasValidAuth) {
    return <>{children}</>;
  }

  // Estado de carregamento enquanto decide se redireciona
  return (
    <div className="flex h-screen w-full items-center justify-center bg-dark-100">
      <LoadingSpinner size="lg" />
      <p className="ml-2 text-gray-400">Redirecionando...</p>
    </div>
  );
} 