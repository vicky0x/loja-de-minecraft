'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from 'react-error-boundary';

// Componentes de fallback simplificados
const AuthWrapperFallback = ({ children }: { children: React.ReactNode }) => {
  return <div className="min-h-screen bg-dark-100">{children}</div>;
    };

const DashboardLayoutFallback = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-dark-100">
      <div className="fixed top-0 left-0 right-0 h-16 bg-dark-200 z-30"></div>
      <div className="flex pt-16">
        <div className="hidden md:block md:w-16 lg:w-56"></div>
        <div className="w-full px-4 sm:px-6 md:pl-24 lg:pl-[280px]">
          <main className="p-2 sm:p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

// Carregamento dinâmico dos componentes com tratamento de erros e fallbacks
const AuthWrapper = dynamic(
  () => import('@/app/components/dashboard/AuthWrapper').catch(err => {
    console.error('Erro ao carregar AuthWrapper:', err);
    return ({ children }: { children: React.ReactNode }) => (
      <AuthWrapperFallback>{children}</AuthWrapperFallback>
    );
  }),
  { 
    ssr: false,
    loading: ({ children }) => <AuthWrapperFallback>{children}</AuthWrapperFallback>
  }
);

const DashboardLayoutWrapper = dynamic(
  () => import('@/app/components/dashboard/DashboardLayout').catch(err => {
    console.error('Erro ao carregar DashboardLayout:', err);
    return ({ children }: { children: React.ReactNode }) => (
      <DashboardLayoutFallback>{children}</DashboardLayoutFallback>
    );
  }),
  { 
    ssr: false,
    loading: ({ children }) => <DashboardLayoutFallback>{children}</DashboardLayoutFallback>
  }
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  // Tratamento de erro global para evitar falhas de renderização
  const [hasError, setHasError] = React.useState(false);
  const [errorCount, setErrorCount] = React.useState(0);
  const [showErrorUI, setShowErrorUI] = React.useState(false);
  
  // Resetar UI de erro após alguns segundos se não ocorrerem novos erros
  React.useEffect(() => {
    if (hasError) {
      // Se houver poucos erros, não mostrar o card de erro
      if (errorCount < 3) {
        setShowErrorUI(false);
      } else {
        setShowErrorUI(true);
        
        // Resetar UI de erro após 5 segundos
        const timeout = setTimeout(() => {
          setShowErrorUI(false);
          setErrorCount(0);
        }, 5000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [hasError, errorCount]);

  // Componente para tratamento de erros
  React.useEffect(() => {
    // Função para capturar erros globais
    const handleError = (event: ErrorEvent) => {
      // Ignorar erros específicos que não devem mostrar o card
      if (event.error && 
          (event.error.toString().includes('[object Event]') || 
           event.error.toString().includes('unhandled rejection'))) {
        console.warn('Erro não crítico interceptado:', event.error);
        event.preventDefault();
        return;
      }
      
      console.error('Dashboard error interceptado:', event.error);
      setErrorCount(prev => prev + 1);
      setHasError(true);
      
      // Prevenir o erro padrão
      event.preventDefault();
    };

    // Função para capturar promessas rejeitadas não tratadas
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Verificar se é o erro de [object Event]
      const reason = event.reason;
      if (reason === '[object Event]' || 
         (typeof reason === 'object' && reason instanceof Event) ||
         String(reason).includes('[object Event]')) {
        console.warn('Erro de evento interceptado, tratando silenciosamente');
        event.preventDefault();
        return; // Não define hasError como true para este tipo de erro
      }
      
      // Verificar se é um erro de navegação
      if (String(reason).includes('navigation') || 
          String(reason).includes('cancelou') ||
          String(reason).includes('aborted')) {
        console.warn('Erro de navegação interceptado, tratando silenciosamente');
        event.preventDefault();
        return; // Não define hasError para erros de navegação
      }
      
      console.error('Promessa não tratada interceptada:', reason);
      // Evitar que o erro seja exibido no console
      event.preventDefault();
      
      // Incrementar contador de erros
      setErrorCount(prev => prev + 1);
      setHasError(true);
    };

    // Registrar handlers
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Limpar listeners ao desmontar
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Função para lidar com erros do ErrorBoundary
  const handleError = (error: Error, info: { componentStack: string }) => {
    console.error("Erro capturado no ErrorBoundary do Dashboard:", error);
    console.error("Componente stack:", info.componentStack);
    setErrorCount(prev => prev + 1);
  };

  // Fallback para o ErrorBoundary
  const ErrorFallback = () => (
    <div className="min-h-screen bg-dark-100 flex items-center justify-center p-4">
      <div className="bg-dark-300/50 backdrop-blur-sm p-6 rounded-xl border border-dark-400 max-w-md w-full relative">
        <button 
          onClick={() => {
            setShowErrorUI(false);
            setErrorCount(0);
            window.location.reload();
          }}
          className="absolute top-2 right-2 text-gray-400 hover:text-white"
          aria-label="Fechar mensagem de erro">
          ✕
        </button>
        
        <h2 className="text-xl font-bold text-white mb-4">Erro no componente</h2>
        <p className="text-gray-300 mb-6">Um componente da página falhou ao carregar. Você pode tentar recarregar a página ou continuar navegando.</p>
        <div className="flex space-x-4">
          <button 
            onClick={() => window.location.reload()} 
            className="flex-1 bg-dark-400 hover:bg-dark-500 text-white py-2 px-4 rounded transition-colors">
            Recarregar
          </button>
          <button 
            onClick={() => {
              setShowErrorUI(false);
              setErrorCount(0);
              // Tentar navegar para a página inicial do dashboard
              window.location.href = '/dashboard';
            }} 
            className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded transition-colors">
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  // Se ocorreu um erro e devemos mostrar a UI de erro, mostrar mensagem de erro
  // mas com um botão para dispensar o erro e continuar usando o site
  if (showErrorUI) {
    return (
      <div className="min-h-screen bg-dark-100 flex flex-col items-center justify-center p-4">
        <div className="bg-dark-300/50 backdrop-blur-sm p-6 rounded-xl border border-dark-400 max-w-md w-full relative">
          <button 
            onClick={() => {
              setShowErrorUI(false);
              setErrorCount(0);
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            aria-label="Fechar mensagem de erro">
            ✕
          </button>
          
          <h2 className="text-xl font-bold text-white mb-4">Erro</h2>
          <p className="text-gray-300 mb-6">Ocorreu um erro. Você pode recarregar a página ou continuar navegando.</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => window.location.reload()} 
              className="flex-1 bg-dark-400 hover:bg-dark-500 text-white py-2 px-4 rounded transition-colors">
              Recarregar
            </button>
            <button 
              onClick={() => {
                setShowErrorUI(false);
                setErrorCount(0);
              }} 
              className="flex-1 bg-primary hover:bg-primary-dark text-white py-2 px-4 rounded transition-colors">
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Retornar layout normal mesmo se houver erro, mas não estiver mostrando UI de erro
  return (
    <Suspense fallback={<AuthWrapperFallback><DashboardLayoutFallback>{children}</DashboardLayoutFallback></AuthWrapperFallback>}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
        <AuthWrapper>
          <DashboardLayoutWrapper>
            {children}
          </DashboardLayoutWrapper>
        </AuthWrapper>
      </ErrorBoundary>
    </Suspense>
  );
}