'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiSettings, FiPackage } from 'react-icons/fi';
import { useCart } from '@/app/contexts/CartContext';
import { IoWifi } from 'react-icons/io5';

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
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();

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

  // Initialize online users with a random number between 80-120
  useEffect(() => {
    const baseUsers = Math.floor(Math.random() * 40) + 80;
    setOnlineUsers(baseUsers);
    
    // Function to randomly increase or decrease online users
    const updateOnlineUsers = () => {
      setOnlineUsers((prev: number) => {
        // 60% chance to increase, 40% chance to decrease
        const shouldIncrease = Math.random() > 0.4;
        // Change by 1-3 users at a time
        const changeAmount = Math.floor(Math.random() * 3) + 1;
        
        let newCount = shouldIncrease ? prev + changeAmount : prev - changeAmount;
        
        // Keep within realistic bounds (70-150)
        if (newCount < 70) newCount = 70;
        if (newCount > 150) newCount = 150;
        
        return newCount;
      });
    };
    
    // Update every 3-8 seconds
    const interval = setInterval(() => {
      updateOnlineUsers();
    }, Math.floor(Math.random() * 5000) + 3000);
    
    return () => clearInterval(interval);
  }, []);

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
        isScrolled ? 'bg-dark-200/90 backdrop-blur-md py-2 shadow-lg' : 'bg-dark-200/80 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Store Name */}
          <Link href="/" className="flex items-center group" style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
            <div>
              <span className="text-white font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-light to-primary group-hover:from-white group-hover:to-primary-light transition-all duration-500">
                Fantasy<span className="text-white group-hover:text-primary-light transition-colors duration-500">Cheats</span>
              </span>
            </div>
          </Link>
          
          {/* Online Users Indicator */}
          <div className="hidden md:flex items-center text-gray-300 bg-dark-300/60 px-2 py-1 rounded-full ml-3">
            <IoWifi className="text-green-400 mr-1 animate-pulse" />
            <span className="text-xs font-medium">{onlineUsers} ONLINE</span>
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-6 mx-4">
            <Link href="/" className={`text-sm font-medium transition-colors duration-300 ${pathname === '/' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
              Início
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/products" className={`text-sm font-medium transition-colors duration-300 ${pathname === '/products' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
              Produtos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/games" className={`text-sm font-medium transition-colors duration-300 ${pathname.startsWith('/games') ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
              Jogos
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link href="/faq" className={`text-sm font-medium transition-colors duration-300 ${pathname === '/faq' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
              FAQ
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
            </Link>
          </nav>

          {/* Barra de pesquisa - versão desktop */}
          <form 
            onSubmit={handleSearch}
            className="hidden md:flex mx-4 flex-1 max-w-md relative"
          >
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full bg-dark-300/70 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-dark-400 hover:border-primary/30 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch size={16} />
            </div>
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary/20 hover:bg-primary/40 text-primary rounded-full p-1 transition-all duration-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {/* Botões e menu do usuário - versão desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {loadingUser ? (
              // Mostrar indicador de carregamento
              <div className="w-8 h-8 rounded-full border-2 border-t-primary border-r-primary border-b-primary border-l-transparent animate-spin"></div>
            ) : user ? (
              <>
                {/* Botão de carrinho - Enhanced */}
                <Link 
                  href="/cart" 
                  className="text-white hover:text-primary transition-colors relative p-2 group"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                >
                  <div className="relative">
                    <FiShoppingCart size={22} className="group-hover:scale-110 transition-transform duration-300" />
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-glow group-hover:shadow-lg transition-all duration-300">
                      {String(cart.getCartItemCount())}
                    </span>
                  </div>
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
                </Link>

                {/* Perfil do usuário com dropdown - Enhanced */}
                <div className="relative" ref={dropdownRef}>
                  <button 
                    className="flex items-center space-x-2 focus:outline-none group"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 group-hover:border-primary transition-all duration-300 shadow-md">
                      {user.profileImage ? (
                        <Image 
                          src={user.profileImage} 
                          alt={user.username} 
                          width={40} 
                          height={40} 
                          className="object-cover w-full h-full"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center">
                          <FiUser size={20} className="text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white text-sm font-medium group-hover:text-primary transition-colors duration-300">{user.username}</span>
                      <span className="text-xs text-gray-400">{user.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown menu - Enhanced */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-dark-200/95 backdrop-blur-md rounded-xl shadow-xl py-2 z-50 border border-dark-300 overflow-hidden">
                      <div className="px-4 py-2 border-b border-dark-300/50">
                        <p className="text-xs text-gray-400">Logado como</p>
                        <p className="text-white font-medium">{user.email}</p>
                      </div>
                      
                      {user.role === 'admin' && (
                        <Link 
                          href="/admin" 
                          className="flex items-center px-4 py-2 text-sm text-white hover:bg-primary/10 hover:text-primary transition-all duration-300"
                          style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                        >
                          <FiSettings size={16} className="mr-2" />
                          Painel Admin
                        </Link>
                      )}
                      <Link 
                        href="/dashboard" 
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                      >
                        <FiSettings size={16} className="mr-2" />
                        Dashboard
                      </Link>
                      <Link 
                        href="/dashboard/products" 
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                      >
                        <FiPackage size={16} className="mr-2" />
                        Meus Produtos
                      </Link>
                      <Link 
                        href="/cart" 
                        className="flex items-center px-4 py-2 text-sm text-white hover:bg-primary/10 hover:text-primary transition-all duration-300"
                        style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                      >
                        <FiShoppingCart size={16} className="mr-2" />
                        Carrinho
                      </Link>
                      <div className="border-t border-dark-300/50 mt-1 pt-1">
                        <button 
                          onClick={handleLogout}
                          className="flex items-center px-4 py-2 text-sm text-white hover:text-red-400 w-full text-left transition-all duration-300"
                        >
                          <FiLogOut size={16} className="mr-2" />
                          Sair
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Botões para usuários não logados - Enhanced
              <div className="flex space-x-3">
                <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-white hover:text-primary border border-dark-300 hover:border-primary/50 rounded-lg transition-all duration-300" style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                  Login
                </Link>
                <Link href="/auth/register" className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary rounded-lg transition-all duration-300 shadow-md hover:shadow-primary/20" style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Botão de Menu Mobile - Enhanced */}
          <div className="flex md:hidden items-center space-x-4">
            {/* Botão de carrinho para mobile - Enhanced */}
            {user && (
              <Link 
                href="/cart" 
                className="text-white hover:text-primary transition-colors relative mr-2 p-2"
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <div className="relative">
                  <FiShoppingCart size={22} />
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-glow">
                    {String(cart.getCartItemCount())}
                  </span>
                </div>
              </Link>
            )}
            
            {/* Botão de busca para mobile - Enhanced */}
            <button
              className="text-white p-2 rounded-lg hover:bg-dark-300/50 transition-colors duration-300"
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

      {/* Menu Mobile - Enhanced */}
      <div 
        className={`md:hidden bg-dark-200/95 backdrop-blur-md ${
          isMenuOpen ? 'max-h-screen overflow-y-auto py-4 shadow-lg' : 'max-h-0 py-0'
        } overflow-hidden transition-all duration-500`}
      >
        <div className="container mx-auto px-4 flex flex-col space-y-4 pb-6">
          {/* Navigation Links - Mobile */}
          <nav className="flex flex-col space-y-2 border-b border-dark-300/50 pb-3">
            <Link 
              href="/" 
              className={`py-2 text-sm font-medium ${pathname === '/' ? 'text-primary' : 'text-gray-300'}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              Início
            </Link>
            <Link 
              href="/products" 
              className={`py-2 text-sm font-medium ${pathname === '/products' ? 'text-primary' : 'text-gray-300'}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              Produtos
            </Link>
            <Link 
              href="/games" 
              className={`py-2 text-sm font-medium ${pathname.startsWith('/games') ? 'text-primary' : 'text-gray-300'}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              Jogos
            </Link>
            <Link 
              href="/faq" 
              className={`py-2 text-sm font-medium ${pathname === '/faq' ? 'text-primary' : 'text-gray-300'}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              FAQ
            </Link>
          </nav>
          
          {/* Barra de pesquisa para mobile - Enhanced */}
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full bg-dark-300/70 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-dark-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch size={16} />
            </div>
            <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary/20 hover:bg-primary/40 text-primary rounded-full p-1 transition-all duration-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {user ? (
            // Menu para usuários logados - Enhanced
            <div className="flex flex-col space-y-2 pt-2 border-t border-dark-300/50">
              <div className="flex items-center space-x-3 py-2">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 shadow-md">
                  {user.profileImage ? (
                    <Image 
                      src={user.profileImage} 
                      alt={user.username} 
                      width={40} 
                      height={40} 
                      className="object-cover w-full h-full"
                      style={{ objectFit: 'cover', objectPosition: 'center' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center">
                      <FiUser size={20} className="text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-medium">{user.username}</span>
                  <span className="text-xs text-gray-400">{user.email}</span>
                </div>
              </div>
              
              {user.role === 'admin' && (
                <Link 
                  href="/admin" 
                  className="flex items-center py-2 text-white hover:text-primary transition-colors duration-300"
                  onClick={() => setIsMenuOpen(false)}
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                >
                  <FiSettings size={18} className="mr-2" />
                  Painel Admin
                </Link>
              )}
              
              <Link 
                href="/dashboard" 
                className="flex items-center py-2 text-white hover:text-primary transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <FiSettings size={18} className="mr-2" />
                Dashboard
              </Link>
              <Link 
                href="/dashboard/products" 
                className="flex items-center py-2 text-white hover:text-primary transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <FiPackage size={18} className="mr-2" />
                Meus Produtos
              </Link>
              <Link 
                href="/cart" 
                className="flex items-center py-2 text-white hover:text-primary transition-colors duration-300"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <FiShoppingCart size={18} className="mr-2" />
                Carrinho
              </Link>
              <button 
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
                className="flex items-center py-2 text-white hover:text-red-400 transition-colors duration-300 w-full text-left border-t border-dark-300/50 mt-2 pt-3"
              >
                <FiLogOut size={18} className="mr-2" />
                Sair
              </button>
            </div>
          ) : (
            // Botões para usuários não logados - Enhanced
            <div className="flex flex-col space-y-3 pt-2 border-t border-dark-300/50">
              <Link 
                href="/auth/login" 
                className="py-2.5 text-sm font-medium text-white hover:text-primary border border-dark-300 hover:border-primary/50 rounded-lg transition-all duration-300 text-center"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                Login
              </Link>
              <Link 
                href="/auth/register" 
                className="py-2.5 text-sm font-medium text-white bg-gradient-to-r from-primary to-primary-dark hover:from-primary-light hover:to-primary rounded-lg transition-all duration-300 text-center shadow-md"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
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