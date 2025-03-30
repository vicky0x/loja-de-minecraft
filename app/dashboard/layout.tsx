'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiUser, FiShoppingCart, FiDownload, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/app/lib/auth/session';

// Componente de barra lateral simplificado
const DashboardSidebar = () => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Fechar sidebar automaticamente em telas pequenas
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Listener para evento customizado do Header
  useEffect(() => {
    const handleToggleEvent = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };
    
    window.addEventListener('toggle-sidebar', handleToggleEvent);
    
    return () => {
      window.removeEventListener('toggle-sidebar', handleToggleEvent);
    };
  }, [isSidebarOpen]);

  const menuItems = [
    { name: 'Início', path: '/dashboard', icon: <FiHome className="h-5 w-5" /> },
    { name: 'Meu Perfil', path: '/dashboard/profile', icon: <FiUser className="h-5 w-5" /> },
    { name: 'Meus Pedidos', path: '/dashboard/orders', icon: <FiShoppingCart className="h-5 w-5" /> },
    { name: 'Downloads', path: '/dashboard/downloads', icon: <FiDownload className="h-5 w-5" /> },
    { name: 'Suporte', path: '/dashboard/support', icon: <FiHelpCircle className="h-5 w-5" /> },
  ];

  return (
    <aside
      className={`bg-dark-300 fixed md:sticky top-16 md:top-0 left-0 h-[calc(100vh-4rem)] z-10 w-64 transition-all duration-300 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center justify-center h-16">
          <Link href="/" className="text-xl font-bold text-primary">
            Fantasy Cheats
          </Link>
        </div>
        <div className="mt-5 flex-1 px-2 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center px-4 py-3 text-sm rounded-md ${
                pathname === item.path
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-dark-400 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
      <div className="p-4 border-t border-dark-400">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white rounded-md"
        >
          <FiLogOut className="h-5 w-5 mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

// Componente de cabeçalho simplificado
const DashboardHeader = () => {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Tenta pegar o usuário do localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erro ao ler usuário do localStorage:', error);
    }
  }, []);

  const toggleSidebar = () => {
    // Dispara um evento personalizado para que o componente Sidebar possa capturá-lo
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
  };

  return (
    <header className="bg-dark-200 shadow-md fixed top-0 left-0 right-0 h-16 z-50">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          {/* Botão mobile menu */}
          <button
            onClick={toggleSidebar}
            className="md:hidden text-white p-2 mr-3"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        </div>
        {user && (
          <div className="flex items-center">
            <span className="text-sm text-gray-300 mr-2">Olá, {user.username}</span>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [localAuth, setLocalAuth] = useState(false);
  
  useEffect(() => {
    // Verificar autenticação no localStorage se cookies não funcionarem
    const checkLocalStorage = () => {
      try {
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user');
        
        if (storedAuth === 'true' && storedUser) {
          setLocalAuth(true);
          const userData = JSON.parse(storedUser);
          console.log('Autenticação via localStorage:', userData.username);
        }
      } catch (error) {
        console.error('Erro ao ler autenticação do localStorage:', error);
      }
    };
    
    // Verificar localStorage imediatamente
    checkLocalStorage();
    
    // Verificar se o usuário está autenticado após o carregamento do hook useAuth
    if (!loading && !isAuthenticated && !localAuth) {
      console.log('Usuário não autenticado, redirecionando para login');
      
      // Redirecionamento único sem timeout ou lógica adicional para evitar loops
      window.location.href = '/auth/login';
    }
  }, [loading, isAuthenticated]);

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

  // Mostrar layout quando estiver autenticado (pelo hook ou localStorage)
  return (
    <div className="min-h-screen bg-dark-100">
      {/* Header fixo no topo */}
      <DashboardHeader />
      
      {/* Conteúdo principal com sidebar */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Área de conteúdo principal */}
        <div className="w-full md:w-[calc(100%-16rem)] md:ml-64">
          <main className="p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}