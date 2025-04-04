'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../../lib/auth/session';
import { FiLogOut } from 'react-icons/fi';

const Header = () => {
  const pathname = usePathname();
  
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
      '/admin/config': 'Configurações',
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
  
  const toggleSidebar = () => {
    // Dispara um evento personalizado para que o componente Sidebar possa capturá-lo
    const event = new CustomEvent('toggle-sidebar');
    window.dispatchEvent(event);
  };
  
  return (
    <header className="bg-dark-300 border-b border-dark-400 fixed top-0 left-0 right-0 z-20">
      <div className="px-4 py-3 flex justify-between items-center">
        {/* Botão do menu mobile */}
        <button
          onClick={toggleSidebar}
          className="text-white md:hidden p-2"
          aria-label="Menu"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Título da página atual */}
        <h1 className="text-xl font-semibold text-white">
          {getPageTitle(pathname)}
        </h1>

        {/* Perfil e ações */}
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/profile" 
            className="p-2 text-gray-300 hover:text-white transition-colors"
            title="Meu Perfil"
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </Link>
          
          <button 
            onClick={(e) => {
              e.preventDefault();
              console.log('Header: Iniciando logout...');
              logout();
            }}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <FiLogOut className="text-lg" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 