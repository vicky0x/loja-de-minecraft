'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Componentes estáticos para fallback
const DashboardHeaderFallback = () => {
  return <div className="fixed top-0 left-0 right-0 h-16 bg-dark-200 z-30"></div>;
};

const DashboardSidebarFallback = () => {
  return <div className="hidden md:block md:w-16 lg:w-56"></div>;
};

// Carregamento dinâmico dos componentes só no cliente com retry e error boundary
const DashboardHeader = dynamic(
  () => import('./Header').catch(err => {
    console.error('Erro ao carregar header:', err);
    return () => <DashboardHeaderFallback />;
  }), 
  { 
    ssr: false,
    loading: () => <DashboardHeaderFallback />
  }
);

const DashboardSidebar = dynamic(
  () => import('./Sidebar').catch(err => {
    console.error('Erro ao carregar sidebar:', err);
    return () => <DashboardSidebarFallback />;
  }),
  {
    ssr: false,
    loading: () => <DashboardSidebarFallback />
  }
);

interface DashboardLayoutWrapperProps {
  children: React.ReactNode;
}

const DashboardLayoutWrapper: React.FC<DashboardLayoutWrapperProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Se o componente não estiver montado, exibir um layout simplificado
  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-100 overflow-hidden">
        <DashboardHeaderFallback />
        <div className="flex bg-dark-100" style={{ marginTop: "0" }}>
          <DashboardSidebarFallback />
          <div className="w-full px-4 sm:px-6 md:pl-24 lg:pl-[280px] bg-dark-100 pt-16">
            <main className="pt-0 pb-4 px-2 sm:px-4 md:px-6">
              {/* Placeholder de carregamento para o conteúdo */}
              <div className="animate-pulse bg-dark-200 h-40 rounded-lg"></div>
            </main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 overflow-hidden">
      {/* Cabeçalho unificado para dispositivos móveis */}
      <DashboardHeader />
      
      {/* Conteúdo principal com sidebar */}
      <div className="flex bg-dark-100" style={{ marginTop: "0" }}>
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Área de conteúdo principal */}
        <div className="w-full transition-all duration-300 px-4 sm:px-6 md:pl-24 lg:pl-[280px] bg-dark-100 pt-16">
          <main className="pt-0 pb-4 px-2 sm:px-4 md:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayoutWrapper; 