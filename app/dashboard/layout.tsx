'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiUser, FiShoppingCart, FiDownload, FiHelpCircle, FiLogOut, FiMessageSquare, FiMenu, FiX } from 'react-icons/fi';
import { useAuth, logout } from '@/app/lib/auth/session';
import { fetchAssignments } from '@/app/lib/store';

// Definir a função fetchAssignments globalmente no layout para prevenir erros em qualquer página do dashboard
const defineGlobalFunctions = () => {
  if (typeof window !== 'undefined') {
    // @ts-ignore
    window.fetchAssignments = async (page = 1) => {
      return fetchAssignments(page);
    };
  }
};

// Componente de barra lateral simplificado
const DashboardSidebar = () => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      console.log('Dashboard: Iniciando logout...');
      
      // Limpar localStorage manualmente antes de chamar a função de logout
      localStorage.removeItem('user');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('authExpiry');
      localStorage.removeItem('cartItems');
      
      // Limpar cookies manualmente
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "isAuthenticated=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Forçar redirecionamento imediatamente para evitar problemas de estado
      window.location.href = '/auth/login?logout=success';
      
      // Chamar função de logout em segundo plano para garantir que a API seja chamada
      logout().catch(err => console.error('Erro secundário no logout:', err));
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Em caso de erro, tentar redirecionar manualmente
      window.location.href = '/auth/login?error=logout_failed';
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
    { name: 'Meus Produtos', path: '/dashboard/products', icon: <FiDownload size={20} /> },
    { name: 'Suporte', path: '/dashboard/support', icon: <FiHelpCircle size={20} /> },
  ];

  return (
    <aside
      className={`bg-dark-200 fixed md:sticky top-0 md:top-0 left-0 h-screen z-10 w-64 transition-all duration-300 transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 shadow-lg`}
    >
      <div className="flex-1 flex flex-col h-full">
        <div className="flex items-center justify-center h-16 border-b border-dark-400">
          <Link href="/" className="text-xl font-bold text-primary">
            Fantasy Store
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
            onClick={(e) => {
              e.preventDefault();
              handleLogout();
            }}
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
  const [user, setUser] = useState<{ 
    username: string; 
    email: string; 
    role?: string;
    orders?: { count: number } 
  } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Tenta pegar o usuário do localStorage
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        
        // Verifica se precisa buscar as estatísticas
        const parsedUser = JSON.parse(storedUser);
        if (!parsedUser.orders) {
          fetchUserStats(parsedUser);
        }
      }
    } catch (error) {
      console.error('Erro ao ler usuário do localStorage:', error);
    }
  }, []);
  
  // Função para buscar estatísticas do usuário
  const fetchUserStats = async (userData: any) => {
    try {
      const response = await fetch('/api/user/stats');
      
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar o usuário com as estatísticas
        if (data.stats) {
          const updatedUser = {
            ...userData,
            orders: data.stats
          };
          
          // Atualizar o localStorage e o estado
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do usuário:', error);
    }
  };

  const toggleSidebar = () => {
    // Dispara um evento personalizado para que o componente Sidebar possa capturá-lo
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Determinar o tipo de usuário com base nas estatísticas
  const getUserType = () => {
    if (!user) return '';
    if (user.role === 'admin') return 'Administrador';
    return user.orders?.count && user.orders.count > 0 ? 'Cliente' : 'Usuário';
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
            <span className="text-sm text-gray-300 mr-3 hidden sm:block">
              Olá, {user.username} <span className="text-xs text-gray-400">({getUserType()})</span>
            </span>
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
        } else {
          setLocalAuth(false);
        }
      } catch (error) {
        console.error('Erro ao ler autenticação do localStorage:', error);
        setLocalAuth(false);
      }
    };
    
    // Verificar localStorage imediatamente
    checkLocalStorage();
    
    // Adicionar ouvinte para eventos de mudança de autenticação
    const handleAuthChanged = () => {
      console.log('Layout dashboard detectou mudança de autenticação');
      setTimeout(() => {
        // Verificar novamente após evento
        checkLocalStorage();
        
        // Se não estiver mais autenticado, redirecionar
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedAuth !== 'true') {
          console.log('Dashboard layout: usuário deslogado, redirecionando...');
          window.location.href = '/auth/login?logout=success';
        }
      }, 100);
    };
    
    window.addEventListener('auth-state-changed', handleAuthChanged);
    
    // Verificar se o usuário está autenticado após o carregamento do hook useAuth
    if (!loading && !isAuthenticated && !localAuth) {
      console.log('Usuário não autenticado, redirecionando para login');
      
      // Redirecionamento único sem timeout ou lógica adicional para evitar loops
      window.location.href = '/auth/login';
    }
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthChanged);
    };
  }, [loading, isAuthenticated]);

  // Executar definição global assim que o componente montar
  useEffect(() => {
    defineGlobalFunctions();
  }, []);

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
      {/* Conteúdo principal com sidebar, sem header */}
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar />
        
        {/* Área de conteúdo principal */}
        <div className="w-full md:w-[calc(100%-16rem)] transition-all duration-300">
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}