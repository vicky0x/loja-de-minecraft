'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUser, FiShoppingCart, FiDownload, FiHelpCircle, FiLogOut, FiMessageSquare, FiPackage } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

// Definir os itens do menu fora do componente para evitar recriação
const menuItems = [
  { name: 'Início', path: '/dashboard', icon: <FiHome size={20} /> },
  { name: 'Anúncios', path: '/dashboard/announcements', icon: <FiMessageSquare size={20} /> },
  { name: 'Meu Perfil', path: '/dashboard/profile', icon: <FiUser size={20} /> },
  { name: 'Meus Pedidos', path: '/dashboard/orders', icon: <FiShoppingCart size={20} /> },
  { name: 'Meus Produtos', path: '/dashboard/products', icon: <FiPackage size={20} /> },
  { name: 'Suporte', path: '/dashboard/support', icon: <FiHelpCircle size={20} /> },
];

const Sidebar = () => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { logout } = useAuth();

  // Simplificar a lógica de inicialização
  useEffect(() => {
    // Marcar como montado
    setMounted(true);
    
    // Configurar sidebar com base no tamanho da tela
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        // Desktop - sidebar aberta e expandida
        setIsSidebarOpen(true);
        setIsCollapsed(false);
      } else if (window.innerWidth >= 768) {
        // Tablet/desktop pequeno - sidebar aberta e colapsada
        setIsSidebarOpen(true);
        setIsCollapsed(true);
      } else {
        // Mobile - sidebar fechada
        setIsSidebarOpen(false);
        setIsCollapsed(false);
      }
    };

    // Executar imediatamente e adicionar listener
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
    }

    // Listener para evento customizado do Header
    const handleToggleEvent = () => {
      setIsSidebarOpen(prev => !prev);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('toggle-sidebar', handleToggleEvent);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('toggle-sidebar', handleToggleEvent);
      }
    };
  }, []);

  // Função simplificada para alternar o estado colapsado
  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  // Função de logout simplificada
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

  // Se não estiver montado, retornar um espaçador básico para evitar layout shift
  if (!mounted) {
    return <div className="hidden md:block md:w-16 lg:w-56" />;
  }

  return (
    <>
      {/* Overlay para fechar o menu em dispositivos móveis */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar principal */}
      <aside
        className={`fixed left-0 bottom-0 z-10 transition-all duration-300 shadow-lg 
          bg-dark-200 border-r border-dark-300
          overflow-y-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-16' : 'w-56'} md:translate-x-0`}
        style={{ top: "64px" }}
      >
        <div className="flex flex-col h-full">
          {/* Botão de colapso */}
          <div className="sticky top-0 flex justify-end pt-3 px-3 md:block hidden bg-dark-200 z-10">
            <button 
              onClick={toggleCollapse}
              className="p-2 rounded-md bg-dark-300 text-gray-400 hover:text-white hover:bg-dark-400 transition-colors"
              title={isCollapsed ? "Expandir menu" : "Recolher menu"}
              aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
            >
              {isCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Menu de navegação */}
          <nav className="py-4 px-2">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`flex items-center rounded-md transition-colors ${
                      pathname === item.path
                        ? 'bg-primary text-white'
                        : 'text-gray-300 hover:bg-dark-300 hover:text-white'
                    } ${isCollapsed ? 'justify-center py-3' : 'px-3 py-3'}`}
                    title={isCollapsed ? item.name : ''}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                      }
                    }}
                  >
                    <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>{item.icon}</span>
                    {!isCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Botão de logout */}
          <div className="sticky bottom-0 p-3 border-t border-dark-400 bg-dark-200">
            <button
              onClick={handleLogout}
              className={`flex items-center rounded-md transition-colors text-gray-300 hover:bg-dark-300 hover:text-white ${
                isCollapsed ? 'justify-center w-full py-3' : 'px-3 py-3 w-full'
              }`}
              title={isCollapsed ? 'Sair' : ''}
            >
              <span className={`text-lg ${isCollapsed ? '' : 'mr-3'}`}>
                <FiLogOut size={20} />
              </span>
              {!isCollapsed && <span className="text-sm font-medium">Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar; 