'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { FiMenu, FiX, FiUser, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

// Nome das páginas por rota - definido fora do componente
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/profile': 'Meu Perfil',
  '/dashboard/orders': 'Meus Pedidos',
  '/dashboard/products': 'Meus Produtos',
  '/dashboard/announcements': 'Anúncios',
  '/dashboard/support': 'Suporte',
};

const Header: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Determinar o título da página com base na rota atual
  const pageTitle = PAGE_TITLES[pathname] || 'Dashboard';

  // Verificar se componente está montado no cliente
  useEffect(() => {
    setIsMounted(true);
    
    // Fechar menu ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      const userMenuButton = document.getElementById('user-menu-button');
      const userMenu = document.getElementById('user-menu');
      
      if (userMenuButton && userMenu && 
          !userMenuButton.contains(event.target as Node) && 
          !userMenu.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    
    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    };
  }, []);

  // Toggle para menu mobile
  const toggleSidebar = () => {
    if (typeof window !== 'undefined') {
      const event = new Event('toggle-sidebar');
      window.dispatchEvent(event);
    }
  };

  // Se não estiver montado ainda, exibir um placeholder do header
  if (!isMounted) {
    return (
      <header className="fixed top-0 left-0 right-0 h-16 bg-dark-200 z-30 shadow-md px-4 flex items-center">
        <div className="animate-pulse bg-dark-300 h-8 w-40 rounded"></div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-dark-200 z-30 shadow-md">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo e Toggle de Menu Mobile */}
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 md:hidden text-gray-400 hover:text-white"
            aria-label="Toggle menu"
          >
            <FiMenu size={24} />
          </button>
          
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold">Fantasy</span>
          </Link>
        </div>

        {/* Título da página (visível apenas em desktop) */}
        <div className="hidden lg:block text-xl font-bold">{pageTitle}</div>

        {/* Menu de usuário */}
        <div className="flex items-center">
          <div className="relative">
            <button
              id="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center text-gray-300 hover:text-white"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
            >
              {user?.profileImage ? (
                <div className="w-10 h-10 rounded-full overflow-hidden mr-2">
                  <Image
                    src={user.profileImage}
                    alt="Perfil"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mr-2">
                  <FiUser size={20} className="text-primary" />
                </div>
              )}
              <span className="hidden md:block">{user?.username || 'Usuário'}</span>
              <FiChevronDown className="ml-1" />
            </button>

            {/* Dropdown de usuário */}
            {showUserMenu && (
              <div
                id="user-menu"
                className="absolute right-0 mt-2 w-48 bg-dark-300 rounded-lg shadow-lg py-1 z-50"
              >
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  Meu Perfil
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  Meus Pedidos
                </Link>
                <div className="border-t border-dark-400 my-1"></div>
                <button
                  onClick={() => {
                    try {
                      localStorage.clear();
                      window.location.href = "/auth/login";
                    } catch (error) {
                      console.error('Erro ao fazer logout:', error);
                      window.location.href = "/auth/login";
                    }
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-400"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 