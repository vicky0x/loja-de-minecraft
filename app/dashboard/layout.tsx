'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiUser, FiShoppingCart, FiDownload, FiHelpCircle, FiLogOut, FiMessageSquare, FiMenu, FiX } from 'react-icons/fi';
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
    { name: 'Início', path: '/dashboard', icon: <FiHome size={20} /> },
    { name: 'Anúncios', path: '/dashboard/announcements', icon: <FiMessageSquare size={20} /> },
    { name: 'Meu Perfil', path: '/dashboard/profile', icon: <FiUser size={20} /> },
    { name: 'Meus Pedidos', path: '/dashboard/orders', icon: <FiShoppingCart size={20} /> },
    { name: 'Downloads', path: '/dashboard/downloads', icon: <FiDownload size={20} /> },
    { name: 'Suporte', path: '/dashboard/support', icon: <FiHelpCircle size={20} /> },
  ];

  return (
    <aside
      className={`bg-dark-200 fixed md:sticky top-16 md:top-0 left-0 h-[calc(100vh-4rem)] z-10 w-64 transition-all duration-300 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 shadow-lg`}
    >
      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-center h-16 border-b border-dark-400">
          <Link href="/" className="text-xl font-bold text-primary">
            Fantasy Cheats
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
                  pathname === item.path
                    ? 'bg-primary text-white'
                    : 'text-gray-300 hover:bg-dark-300 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-dark-400">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-dark-300 hover:text-white rounded-lg transition-colors"
          >
            <FiLogOut size={20} className="mr-3" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

// Componente de cabeçalho simplificado
const DashboardHeader = () => {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-dark-200 shadow-lg fixed top-0 left-0 right-0 h-16 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-white p-2 rounded-lg hover:bg-dark-300"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <FiX size={24} />
            ) : (
              <FiMenu size={24} />
            )}
          </button>
          <h1 className="text-xl font-bold text-white ml-2 md:ml-0">Dashboard</h1>
        </div>
        {user && (
          <div className="flex items-center">
            <span className="text-sm text-gray-300 mr-3 hidden sm:block">Olá, {user.username}</span>
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-semibold">
              {user.username.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
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
        <div className="w-full md:w-[calc(100%-16rem)] md:ml-64 transition-all duration-300">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}