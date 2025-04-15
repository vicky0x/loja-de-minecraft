'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/app/components/admin/Sidebar';
import Header from '@/app/components/admin/Header';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/lib/auth/session';
import Image from 'next/image';

// Componente de Layout do Admin
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [localAuth, setLocalAuth] = useState(false);
  const [localAdmin, setLocalAdmin] = useState(false);
  
  useEffect(() => {
    // Verificar autenticação no localStorage se cookies não funcionarem
    const checkLocalStorage = () => {
      try {
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user');
        
        if (storedAuth === 'true' && storedUser) {
          const userData = JSON.parse(storedUser);
          setLocalAuth(true);
          setLocalAdmin(userData.role === 'admin');
          console.log('Autenticação via localStorage:', userData.username, userData.role);
        }
      } catch (error) {
        console.error('Erro ao ler autenticação do localStorage:', error);
      }
    };
  
    // Verificar localStorage imediatamente
    checkLocalStorage();
    
    // Verificar permissões apenas quando não estiver mais carregando
    if (!loading) {
      console.log('Estado de autenticação admin:', { isAuthenticated, isAdmin, localAuth, localAdmin });
      
      const hasValidAuth = isAuthenticated || localAuth;
      const hasAdminRole = isAdmin || localAdmin;
      
      // Se não estiver autenticado, redirecionar para login
      if (!hasValidAuth) {
        console.log('Usuário não autenticado, redirecionando para login');
        // Usando window.location para evitar loops de redirecionamento
        window.location.href = '/auth/login';
      }
      // Se estiver autenticado mas não for admin
      else if (hasValidAuth && !hasAdminRole) {
        console.log('Usuário não é admin, redirecionando para dashboard');
        window.location.href = '/dashboard';
      }
    }
  }, [loading, isAuthenticated, isAdmin]);

  // Verificar se o componente ainda está carregando
  if (loading && !localAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-100">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se tiver permissões de admin (pelo hook ou localStorage), mostrar o layout
  const hasAdminPermission = (isAuthenticated && isAdmin) || (localAuth && localAdmin);
  
  if (hasAdminPermission) {
    return (
      <div className="flex min-h-screen bg-dark-100 text-white">
        <Sidebar />
        <div className="flex-1 transition-all duration-300 md:pl-16 lg:pl-56">
          <Header />
          <main className="p-4 md:p-6 pt-20 px-4 sm:px-6 md:pl-6 max-w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Estado de carregamento enquanto decide se redireciona
  return (
    <div className="flex min-h-screen bg-dark-100 text-white items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-dark-200 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/assets/img/logo-fullbody.png"
              alt="Logo"
              width={80}
              height={80}
              className="animate-pulse"
            />
          </div>
          <h2 className="text-2xl font-bold">Carregando painel administrativo...</h2>
          <p className="mt-2 text-gray-400">Verificando suas credenciais</p>
        </div>
      </div>
    </div>
  );
} 