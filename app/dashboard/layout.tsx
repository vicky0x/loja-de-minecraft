'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

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
  return (
    <Suspense fallback={<AuthWrapperFallback><DashboardLayoutFallback>{children}</DashboardLayoutFallback></AuthWrapperFallback>}>
      <AuthWrapper>
        <DashboardLayoutWrapper>
            {children}
        </DashboardLayoutWrapper>
      </AuthWrapper>
    </Suspense>
  );
}