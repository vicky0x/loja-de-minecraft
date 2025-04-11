'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiLogOut, FiMenu, FiUser, FiChevronDown, FiHome, FiShoppingBag, FiDownload, FiPackage, FiHelpCircle } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

const Header = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Mapeamento para obter o título da página atual
  const getPageTitle = (path: string) => {
    const routes = {
      '/admin': 'Dashboard',
      '/admin/profile': 'Meu Perfil',
      '/admin/products': 'Produtos',
      '/admin/products/new': 'Novo Produto',
      '/admin/assign-products': 'Atribuir Produtos',
      '/admin/users': 'Usuários',
      '/admin/orders': 'Pedidos',
      '/admin/coupons': 'Cupons',
      '/admin/coupons/new': 'Novo Cupom',
      '/admin/categories': 'Categorias',
    };
    
    // Verifica rotas específicas primeiro
    if (path in routes) {
      return routes[path as keyof typeof routes];
    }
    
    // Verifica rotas dinâmicas
    if (path.match(/\/admin\/products\/\w+\/edit/)) {
      return 'Editar Produto';
    }
    
    if (path.match(/\/admin\/products\/\w+\/stock/)) {
      return 'Estoque do Produto';
    }
    
    if (path.match(/\/admin\/orders\/\w+/)) {
      return 'Detalhes do Pedido';
    }
    
    if (path.match(/\/admin\/users\/\w+/)) {
      return 'Detalhes do Usuário';
    }
    
    if (path.match(/\/admin\/categories\/\w+\/edit/)) {
      return 'Editar Categoria';
    }
    
    if (path.match(/\/admin\/categories\/new/)) {
      return 'Nova Categoria';
    }
    
    // Título padrão se não encontrar uma correspondência
    return 'Administração';
  };
  
  // Verificar se componente está montado no cliente
  useEffect(() => {
    setIsMounted(true);
    
    // Fechar menu ao clicar fora
    const handleClickOutside = (event: MouseEvent) => {
      const userMenuButton = document.getElementById('admin-menu-button');
      const userMenu = document.getElementById('admin-menu');
      
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
  
  const toggleSidebar = () => {
    // Dispara um evento personalizado para que o componente Sidebar possa capturá-lo
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
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
      <header className="bg-dark-300 border-b border-dark-400 fixed top-0 left-0 right-0 z-20">
        <div className="px-4 py-3 flex justify-between items-center h-16">
          <div className="animate-pulse bg-dark-400 h-8 w-40 rounded"></div>
        </div>
      </header>
    );
  }
  
  return (
    <header className="bg-dark-300 border-b border-dark-400 fixed top-0 left-0 right-0 z-20">
      <div className="px-4 py-3 flex justify-between items-center h-16">
        {/* Botão do menu mobile e título */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-white md:hidden p-2"
            aria-label="Menu"
          >
            <FiMenu size={24} />
          </button>
          <Link href="/admin" className="flex items-center">
            <span className="text-xl font-bold text-white">FantasyStore</span>
          </Link>
        </div>

        {/* Menu de usuário */}
        <div className="flex items-center">
          <div className="relative">
            <button
              id="admin-menu-button"
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
                          <span class="text-white text-lg font-semibold">${user.username?.charAt(0).toUpperCase() || 'A'}</span>
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
              <span className="hidden md:block">{user?.username || 'Admin'}</span>
              <FiChevronDown className="ml-1" />
            </button>

            {/* Dropdown de usuário */}
            {showUserMenu && (
              <div
                id="admin-menu"
                className="absolute right-0 mt-2 w-56 bg-dark-400 rounded-lg shadow-lg py-1 z-50"
              >
                {/* Informações do usuário */}
                <div className="px-4 py-2 border-b border-dark-500">
                  <p className="text-xs text-gray-400">Logado como Admin</p>
                  <p className="text-white font-medium truncate">{user?.email || 'admin@example.com'}</p>
                </div>

                {/* Links para navegação rápida */}
                <Link
                  href="/admin"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-500 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiHome className="mr-2" size={16} />
                  Painel Admin
                </Link>
                <Link
                  href="/admin/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-500 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiUser className="mr-2" size={16} />
                  Meu Perfil
                </Link>
                <Link
                  href="/admin/orders"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-500 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiShoppingBag className="mr-2" size={16} />
                  Pedidos
                </Link>
                <Link
                  href="/admin/products"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-500 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiPackage className="mr-2" size={16} />
                  Produtos
                </Link>

                {/* Links de navegação para outras áreas */}
                <div className="border-t border-dark-500 my-1"></div>
                <Link
                  href="/dashboard"
                  className="flex items-center px-4 py-2 text-sm text-primary hover:bg-dark-500 hover:text-primary-light"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiHome className="mr-2" size={16} />
                  Dashboard Normal
                </Link>
                <Link
                  href="/"
                  className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-dark-500 hover:text-white"
                  onClick={() => setShowUserMenu(false)}
                >
                  <FiHome className="mr-2" size={16} />
                  Voltar ao Site
                </Link>

                {/* Logout */}
                <div className="border-t border-dark-500 my-1"></div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-dark-500 hover:text-red-300"
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