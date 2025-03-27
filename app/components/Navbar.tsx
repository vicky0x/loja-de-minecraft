'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiSettings, FiPackage } from 'react-icons/fi';

// Interface para o usuário
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  profileImage?: string;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Efeito para verificar scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Efeito para fechar o dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Efeito para verificar o estado de autenticação do usuário
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        console.log('Verificando autenticação...');
        setLoadingUser(true);
        const response = await fetch('/api/auth/me');
        
        if (response.ok) {
          const data = await response.json();
          console.log('Usuário autenticado:', data.user);
          setUser(data.user);
        } else {
          console.log('Usuário não autenticado');
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    }

    checkAuthStatus();
  }, []);

  // Fechar dropdown quando mudar de página
  useEffect(() => {
    setIsDropdownOpen(false);
    setIsMenuOpen(false);
  }, [pathname]);

  // Função para lidar com logout
  const handleLogout = async () => {
    try {
      console.log('Fazendo logout...');
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        console.log('Logout bem-sucedido');
        setUser(null);
        router.push('/');
        // Forçar recarregamento da página para limpar completamente o estado
        window.location.href = '/';
      } else {
        console.error('Falha ao fazer logout');
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Função para pesquisar
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-dark-200/95 backdrop-blur-sm py-2 shadow-md' : 'bg-dark-200 py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="text-primary font-bold text-xl md:text-2xl">Fantasy Cheats</span>
          </Link>

          {/* Barra de pesquisa - versão desktop */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex mx-4 flex-1 max-w-md relative"
          >
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full bg-dark-300 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch size={16} />
            </div>
          </form>

          {/* Botões e menu do usuário - versão desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {loadingUser ? (
              // Mostrar indicador de carregamento
              <div className="w-8 h-8 rounded-full border-2 border-t-primary border-r-primary border-b-primary border-l-transparent animate-spin"></div>
            ) : user ? (
              <>
                {/* Botão de carrinho */}
                <Link 
                  href="/cart" 
                  className="text-white hover:text-primary transition-colors relative"
                >
                  <FiShoppingCart size={22} />
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    0
                  </span>
                </Link>

                {/* Perfil do usuário com dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    className="flex items-center space-x-2 focus:outline-none"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="bg-dark-300 w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex items-center justify-center">
                      {user.profileImage ? (
                        <Image 
                          src={user.profileImage} 
                          alt={user.username} 
                          width={40} 
                          height={40} 
                          className="object-cover"
                        />
                      ) : (
                        <FiUser size={20} className="text-white" />
                      )}
                    </div>
                    <span className="text-white">{user.username}</span>
                  </button>

                  {/* Dropdown menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-dark-300 rounded-md shadow-lg py-1 z-50">
                      {user.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className="flex items-center px-4 py-2 text-sm text-white hover:bg-dark-200"
                        >
                          <FiSettings size={16} className="mr-2" />
                          Painel Admin
                        </Link>
                      )}
                      <Link 
                        href="/dashboard" 
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-dark-200"
                      >
                        <FiSettings size={16} className="mr-2" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/dashboard/products" 
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-dark-200"
                      >
                        <FiPackage size={16} className="mr-2" />
                        Meus Produtos
                      </Link>
                      <Link 
                        href="/cart" 
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-dark-200"
                      >
                        <FiShoppingCart size={16} className="mr-2" />
                        Carrinho
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-dark-200 w-full text-left"
                      >
                        <FiLogOut size={16} className="mr-2" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Botões para usuários não logados
              <div className="flex space-x-2">
                <Link href="/auth/login" className="btn btn-outline text-sm">
                  Login
                </Link>
                <Link href="/auth/register" className="btn btn-primary text-sm">
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Botão de Menu Mobile */}
          <div className="flex md:hidden items-center space-x-4">
            {/* Botão de carrinho para mobile */}
            {user && (
              <Link 
                href="/cart" 
                className="text-white hover:text-primary transition-colors relative mr-2"
              >
                <FiShoppingCart size={22} />
                <span className="absolute -top-2 -right-2 bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  0
                </span>
              </Link>
            )}
            
            {/* Botão de busca para mobile */}
            <button
              className="text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile */}
      <div 
        className={`md:hidden bg-dark-300 ${
          isMenuOpen ? 'max-h-96 py-4' : 'max-h-0 py-0'
        } overflow-hidden transition-all duration-300`}
      >
        <div className="container mx-auto px-4 flex flex-col space-y-4">
          {/* Barra de pesquisa para mobile */}
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full bg-dark-400 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch size={16} />
            </div>
          </form>

          {user ? (
            // Menu para usuários logados
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2 py-2">
                <div className="bg-dark-400 w-10 h-10 rounded-full overflow-hidden border-2 border-primary flex items-center justify-center">
                  {user.profileImage ? (
                    <Image 
                      src={user.profileImage} 
                      alt={user.username} 
                      width={40} 
                      height={40} 
                      className="object-cover"
                    />
                  ) : (
                    <FiUser size={20} className="text-white" />
                  )}
                </div>
                <span className="text-white font-medium">{user.username}</span>
              </div>
              
              {user.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className="flex items-center py-2 text-white hover:text-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiSettings size={18} className="mr-2" />
                  Painel Admin
                </Link>
              )}
              
              <Link 
                href="/dashboard" 
                className="flex items-center py-2 text-white hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiSettings size={18} className="mr-2" />
                Dashboard
              </Link>
              <Link 
                href="/dashboard/products" 
                className="flex items-center py-2 text-white hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiPackage size={18} className="mr-2" />
                Meus Produtos
              </Link>
              <Link 
                href="/cart" 
                className="flex items-center py-2 text-white hover:text-primary"
                onClick={() => setIsMenuOpen(false)}
              >
                <FiShoppingCart size={18} className="mr-2" />
                Carrinho
              </Link>
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center py-2 text-white hover:text-primary w-full text-left"
              >
                <FiLogOut size={18} className="mr-2" />
                Sair
              </button>
            </div>
          ) : (
            // Botões para usuários não logados
            <div className="flex flex-col space-y-2 pt-2">
              <Link 
                href="/auth/login" 
                className="btn btn-outline text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                href="/auth/register" 
                className="btn btn-primary text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                Cadastrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 