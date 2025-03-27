'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { FiHome, FiUser, FiShoppingCart, FiDownload, FiHelpCircle, FiLogOut } from 'react-icons/fi';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Se não estiver autenticado, redireciona para o login
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    }

    checkAuthStatus();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/auth/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Início', path: '/dashboard', icon: <FiHome className="h-5 w-5" /> },
    { name: 'Meu Perfil', path: '/dashboard/profile', icon: <FiUser className="h-5 w-5" /> },
    { name: 'Meus Pedidos', path: '/dashboard/orders', icon: <FiShoppingCart className="h-5 w-5" /> },
    { name: 'Downloads', path: '/dashboard/downloads', icon: <FiDownload className="h-5 w-5" /> },
    { name: 'Suporte', path: '/dashboard/support', icon: <FiHelpCircle className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-dark-100">
      {/* Sidebar para desktop */}
      <aside
        className={`bg-dark-300 fixed inset-y-0 left-0 z-50 transition-all duration-300 transform ${
          isSidebarOpen || window.innerWidth >= 768 ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 w-64 min-h-screen flex flex-col`}
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

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-dark-200 shadow-md">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
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
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-dark-100">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 