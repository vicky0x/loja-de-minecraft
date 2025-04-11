'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiMenu, FiX, FiUser, FiChevronDown, FiHome, FiShoppingBag, FiDownload, FiPackage, FiSettings, FiHelpCircle, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

// Nome das páginas por rota - definido fora do componente
const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/profile': 'Meu Perfil',
  '/dashboard/orders': 'Meus Pedidos',
  '/dashboard/products': 'Meus Produtos',
  '/dashboard/announcements': 'Anúncios',
  '/dashboard/support': 'Suporte',
  '/admin': 'Painel Admin',
};

const Header: React.FC = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  // Determinar o título da página com base na rota atual
  const pageTitle = PAGE_TITLES[pathname] || 'Dashboard';

  // Verificar se o usuário é admin
  const isAdmin = user?.role === 'admin';

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

  // Função para lidar com logout
  const handleLogout = async () => {
    try {
      // Usar a função de logout do contexto que agora gerencia todo o processo
      await logout();
      
      // Não fazer nada aqui - o redirecionamento é tratado pela função logout() no AuthContext
    } catch (error) {
      console.error('Erro crítico ao fazer logout:', error);
      
      // Em caso de erro severo, tentar forçar o redirecionamento
      window.location.replace('/auth/login?emergency=true&t=' + Date.now());
    }
  };

  // Se não estiver montado ainda, exibir um placeholder do header
  if (!isMounted) {
    return (
      <header className="fixed top-0 left-0 right-0 bg-dark-200 z-30 shadow-md px-4 flex items-center" style={{ height: "64px" }}>
        <div className="animate-pulse bg-dark-300 h-8 w-40 rounded"></div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 bg-dark-200 z-30 shadow-md" style={{ height: "64px" }}>
      <div className="flex items-center justify-between px-4 h-full">
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
            <span className="text-xl font-bold">
              {user ? (
                <>Olá, <span className="text-primary">{user.username}</span></>
              ) : (
                'FantasyStore'
              )}
            </span>
          </Link>
        </div>

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
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 mr-2">
                  <Image
                    src={user.profileImage.startsWith('http') ? user.profileImage : `${window.location.origin}${user.profileImage}`}
                    alt="Perfil"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `<div class="w-full h-full bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center">
                          <span class="text-white text-lg font-semibold">${user.username.charAt(0).toUpperCase()}</span>
                        </div>`;
                      }
                    }}
                    unoptimized={true}
                    priority={true}
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
                className="absolute right-0 mt-2 w-56 bg-dark-300 rounded-lg shadow-lg py-1 z-50"
              >
                {/* Informações do usuário */}
                <div className="px-4 py-2 border-b border-dark-400">
                  <p className="text-xs text-gray-400">Logado como</p>
                  <p className="text-white font-medium truncate">{user?.email || 'Usuário'}</p>
                </div>

                {/* Links comuns para todos os usuários */}
                <Link
                  href="/dashboard"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiHome className="mr-2" size={16} />
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiUser className="mr-2" size={16} />
                  Meu Perfil
                </Link>
                <Link
                  href="/dashboard/orders"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiShoppingBag className="mr-2" size={16} />
                  Meus Pedidos
                </Link>
                <Link
                  href="/dashboard/products"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiPackage className="mr-2" size={16} />
                  Meus Produtos
                </Link>
                <Link
                  href="/dashboard/support"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiHelpCircle className="mr-2" size={16} />
                  Suporte
                </Link>

                {/* Links específicos para admin */}
                {isAdmin && (
                  <>
                    <div className="border-t border-dark-400 my-1"></div>
                    <Link
                      href="/admin"
                      className="flex items-center px-4 py-2 text-sm text-primary hover:bg-dark-400 hover:text-primary-light"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiSettings className="mr-2" size={16} />
                      Painel Admin
                    </Link>
                  </>
                )}

                {/* Links de navegação */}
                <div className="border-t border-dark-400 my-1"></div>
                <Link
                  href="/"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-400 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiHome className="mr-2" size={16} />
                  Voltar à Loja
                </Link>

                {/* Logout */}
                <div className="border-t border-dark-400 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-dark-400"
                >
                  <FiLogOut className="mr-2" size={16} />
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