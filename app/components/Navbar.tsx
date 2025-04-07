'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiSettings, FiPackage } from 'react-icons/fi';
import { useCart } from '@/app/contexts/CartContext';
import { IoWifi } from 'react-icons/io5';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Interface para o usuário
interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  profileImage?: string;
  orders?: {
    count: number;
    products?: number;
    total?: number;
  };
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Estado para detectar se estamos em telas grandes quando no dashboard
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  // Usar o contexto de autenticação com os novos métodos
  const { user, loading: loadingUser, refreshUserData, pendingProfileImage, setUser, logout } = useAuthContext();
  const { isAuthenticated } = useAuth();
  
  // Estado para controlar a animação da imagem
  const [imageTransition, setImageTransition] = useState({
    isChanging: false,
    oldImage: '',
    newImage: ''
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const cart = useCart();

  // Verificar se estamos no dashboard
  const isDashboard = pathname?.startsWith('/dashboard') || pathname?.startsWith('/admin');
  
  // Efeito para verificar o tamanho da tela (para o caso de dashboards)
  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint do Tailwind
    };
    
    // Verificar tamanho inicial
    checkScreenSize();
    
    // Adicionar event listener para redimensionamento
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  // Efeito para animar transição da imagem de perfil quando for atualizada
  useEffect(() => {
    // Forçar atualização sempre que a imagem mudar
    if (user?.profileImage) {
      console.log('Imagem de perfil atualizada:', user.profileImage);
      
      // Limpar qualquer animação anterior
      setImageTransition(prev => {
        if (prev.isChanging) {
          return {
            isChanging: false,
            oldImage: user.profileImage,
            newImage: user.profileImage
          };
        }
        return prev;
      });
    }
  }, [user?.profileImage]);

  // Efeito separado para animação quando pendingProfileImage mudar
  useEffect(() => {
    if (pendingProfileImage && user?.profileImage !== pendingProfileImage) {
      // Iniciar transição
      setImageTransition({
        isChanging: true,
        oldImage: user?.profileImage || '',
        newImage: pendingProfileImage
      });
      
      // Finalizar transição após 600ms (tempo da animação)
      const timeout = setTimeout(() => {
        setImageTransition({
          isChanging: false,
          oldImage: pendingProfileImage,
          newImage: pendingProfileImage
        });
      }, 600);
      
      return () => clearTimeout(timeout);
    }
  }, [pendingProfileImage, user?.profileImage]);

  // Efeito para atualizar quando a página é focada com controle de frequência
  const lastUpdateTimeRef = useRef<number>(Date.now());
  
  useEffect(() => {
    const handleFocus = () => {
      const currentTime = Date.now();
      const timeSinceLastUpdate = currentTime - lastUpdateTimeRef.current;
      const minUpdateInterval = 5 * 60 * 1000; // 5 minutos em milissegundos
      
      const returningFromProfilePage = document.referrer.includes('/dashboard/profile');
      
      if (returningFromProfilePage || timeSinceLastUpdate > minUpdateInterval) {
        console.log('Verificando atualizações após foco...');
        refreshUserData();
        lastUpdateTimeRef.current = currentTime;
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshUserData]);

  // Efeito para monitorar eventos de autenticação e imagem de perfil
  useEffect(() => {
    const handleAuthEvent = () => {
      console.log('Evento de autenticação detectado na Navbar, atualizando dados...');
      // Atualizar apenas após delay para evitar loops
      setTimeout(() => {
        // Não forçar atualização para evitar loops (true → false)
        refreshUserData(false);
      }, 100);
    };
    
    const handleProfileImageUpdate = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.imageUrl) {
        const newImageUrl = event.detail.imageUrl;
        console.log('Evento de atualização de imagem recebido:', newImageUrl);
        
        // Evitar atualização se a imagem for a mesma
        if (user && user.profileImage === newImageUrl) {
          console.log('Mesma imagem, ignorando atualização');
          return;
        }
        
        // Atualizar diretamente a imagem na interface
        if (user) {
          // Iniciar transição
          setImageTransition({
            isChanging: true,
            oldImage: user.profileImage || '',
            newImage: newImageUrl
          });
          
          // Atualizar usuário no estado local
          setUser({
            ...user,
            profileImage: newImageUrl
          });
          
          // Finalizar transição após tempo da animação
          setTimeout(() => {
            setImageTransition({
              isChanging: false,
              oldImage: newImageUrl,
              newImage: newImageUrl
            });
          }, 600);
          
          // Atualizar localStorage
          try {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              userData.profileImage = newImageUrl;
              localStorage.setItem('user', JSON.stringify(userData));
            }
          } catch (error) {
            console.error('Erro ao atualizar localStorage:', error);
          }
        }
      }
    };
    
    const handlePageFocus = () => {
      // Adicionamos uma flag no localStorage para controlar atualizações e evitar loops
      try {
        const lastUpdate = localStorage.getItem('lastAuthCheck');
        const currentTime = Date.now();
        
        // Só atualizar se não houver registro ou se passou mais de 5 segundos
        if (!lastUpdate || (currentTime - parseInt(lastUpdate)) > 5000) {
          // Verificar cookies para ver se o estado da autenticação mudou
          const hasAuthCookie = document.cookie.split(';').some(c => c.trim().startsWith('auth_token='));
          const isLocalStorageAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
          
          // Se houver discrepância entre o cookie e o estado atual, atualizar
          if ((hasAuthCookie && !user) || (!hasAuthCookie && user) || 
              (isLocalStorageAuthenticated && !user) || (!isLocalStorageAuthenticated && user)) {
            console.log('Estado de autenticação alterado, atualizando Navbar...');
            // Atualizar timestamp para evitar loops
            localStorage.setItem('lastAuthCheck', currentTime.toString());
            // Não forçar atualização para evitar loops
            refreshUserData(false);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar estado de autenticação:', error);
      }
    };
    
    // Adicionar os event listeners
    window.addEventListener('auth-state-changed', handleAuthEvent);
    window.addEventListener('profile-image-updated', handleProfileImageUpdate);
    window.addEventListener('focus', handlePageFocus);
    window.addEventListener('storage', (e) => {
      if (e.key === 'isAuthenticated' || e.key === 'user') {
        handlePageFocus();
      }
    });
    
    // Verificação inicial - executar uma única vez com delay
    setTimeout(handlePageFocus, 500);
    
    return () => {
      window.removeEventListener('auth-state-changed', handleAuthEvent);
      window.removeEventListener('profile-image-updated', handleProfileImageUpdate);
      window.removeEventListener('focus', handlePageFocus);
      window.removeEventListener('storage', handlePageFocus);
    };
  }, [user, refreshUserData, setUser, setImageTransition]);

  // Buscar estatísticas do usuário quando o componente montar
  useEffect(() => {
    if (user && !user.orders) {
      fetchUserStats();
    }
  }, [user]);

  // Função para buscar estatísticas do usuário
  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats');
      
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar o usuário com as estatísticas
        if (data.stats && user) {
          const updatedUser = {
            ...user,
            orders: data.stats
          };
          
          // Atualizar o localStorage
          try {
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (storageError) {
            console.error('Erro ao salvar estatísticas no localStorage:', storageError);
          }
          
          // Atualizar o contexto
          refreshUserData();
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas do usuário:', error);
    }
  };

  // Função para lidar com logout
  const handleLogout = async () => {
    try {
      console.log('Iniciando processo de logout via Navbar...');
      
      // Fechar o dropdown
      setIsDropdownOpen(false);
      
      // Usar a função de logout do contexto Auth
      await logout();
      
      // Redirecionar para a página inicial e forçar refresh
      toast.success('Logout realizado com sucesso');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Falha ao fazer logout. Tente novamente.');
    }
  };

  // Função para pesquisar
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Se estamos na dashboard, não renderizar a navbar principal
  if (isDashboard) {
    return null;
  }

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
            <div className="flex items-center">
              <Image 
                src="/fantasy_logo.png" 
                alt="Fantasy Store Logo" 
                width={38} 
                height={38} 
                className="mr-2"
                quality={100}
                priority
                style={{ objectFit: 'contain' }}
                unoptimized
              />
              <span className="text-white font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-light to-primary group-hover:from-white group-hover:to-primary-light transition-all duration-500">
                Fantasy<span className="text-white group-hover:text-primary-light transition-colors duration-500">Store</span><span className="text-primary text-2xl md:text-3xl">.</span>
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
              // Mostrar botões de login/cadastro mesmo durante o carregamento
              <div className="flex space-x-3">
                <Link 
                  href="/auth/login" 
                  className="relative overflow-hidden group px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-dark-300 group-hover:bg-dark-400"></span>
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-dark-400 group-hover:bg-transparent group-hover:skew-x-6"></span>
                  <span className="relative z-10">Login</span>
                </Link>
                <Link 
                  href="/auth/register" 
                  className="relative overflow-hidden group px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-primary group-hover:bg-primary-light"></span>
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-primary-dark opacity-70 group-hover:bg-transparent group-hover:skew-x-6"></span>
                  <span className="relative z-10">Cadastrar</span>
                </Link>
              </div>
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
                      {user?.profileImage ? (
                        <div className="relative w-full h-full">
                          {/* Imagem atual com fade-out quando em transição */}
                          <div className={`absolute inset-0 transition-opacity duration-500 ${imageTransition.isChanging ? 'opacity-0' : 'opacity-100'}`}>
                            <Image 
                              src={user.profileImage.startsWith('http') ? user.profileImage : `${window.location.origin}${user.profileImage}`} 
                              alt={user.username} 
                              width={40} 
                              height={40} 
                              className="object-cover w-full h-full"
                              style={{ objectFit: 'cover', objectPosition: 'center' }}
                              onError={(e) => {
                                console.log('Erro ao carregar imagem:', user.profileImage);
                                // Usar um fallback diretamente em vez de um arquivo
                                e.currentTarget.style.display = 'none';
                                // Mostrar a primeira letra do nome do usuário como fallback
                                const parent = e.currentTarget.parentElement;
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
                          
                          {/* Nova imagem com fade-in quando em transição */}
                          {imageTransition.isChanging && (
                            <div className="absolute inset-0 opacity-0 animate-fadeIn">
                              <Image 
                                src={imageTransition.newImage.startsWith('http') ? imageTransition.newImage : `${window.location.origin}${imageTransition.newImage}`} 
                                alt={user.username} 
                                width={40} 
                                height={40} 
                                className="object-cover w-full h-full"
                                style={{ objectFit: 'cover', objectPosition: 'center' }}
                                onError={(e) => {
                                  console.log('Erro ao carregar nova imagem:', imageTransition.newImage);
                                  // Usar um fallback diretamente em vez de um arquivo
                                  e.currentTarget.style.display = 'none';
                                  // Mostrar a primeira letra do nome do usuário como fallback
                                  const parent = e.currentTarget.parentElement;
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
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary-dark/30 flex items-center justify-center">
                          <FiUser size={20} className="text-white" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-white text-sm font-medium group-hover:text-primary transition-colors duration-300">{user.username}</span>
                      <span className="text-xs text-gray-400">
                        {user.role === 'admin' ? 'Administrador' : 
                          (user.orders && user.orders.count > 0 ? 'Cliente' : 'Usuário')}
                      </span>
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
                <Link 
                  href="/auth/login" 
                  className="relative overflow-hidden group px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-dark-300 group-hover:bg-dark-400"></span>
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-dark-400 group-hover:bg-transparent group-hover:skew-x-6"></span>
                  <span className="relative z-10">Login</span>
                </Link>
                <Link 
                  href="/auth/register" 
                  className="relative overflow-hidden group px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-primary group-hover:bg-primary-light"></span>
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-primary-dark opacity-70 group-hover:bg-transparent group-hover:skew-x-6"></span>
                  <span className="relative z-10">Cadastrar</span>
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

          {loadingUser ? (
            // Botões de login/cadastro para usuários durante carregamento - Mobile
            <div className="flex flex-col space-y-3 pt-2 border-t border-dark-300/50">
              <Link 
                href="/auth/login" 
                className="relative overflow-hidden group py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 text-center"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-dark-300 group-hover:bg-dark-400"></span>
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-dark-400 group-hover:bg-transparent group-hover:skew-x-6"></span>
                <span className="relative z-10">Login</span>
              </Link>
              <Link 
                href="/auth/register" 
                className="relative overflow-hidden group py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 text-center"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-primary group-hover:bg-primary-light"></span>
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-primary-dark opacity-70 group-hover:bg-transparent group-hover:skew-x-6"></span>
                <span className="relative z-10">Cadastrar</span>
              </Link>
            </div>
          ) : user ? (
            // Menu para usuários logados - Enhanced
            <div className="flex flex-col space-y-2 pt-2 border-t border-dark-300/50">
              <div className="flex items-center space-x-3 py-2">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/50 shadow-md">
                  {user?.profileImage ? (
                    <div className="relative w-full h-full">
                      {/* Imagem atual com fade-out quando em transição */}
                      <div className={`absolute inset-0 transition-opacity duration-500 ${imageTransition.isChanging ? 'opacity-0' : 'opacity-100'}`}>
                        <Image 
                          src={user.profileImage.startsWith('http') ? user.profileImage : `${window.location.origin}${user.profileImage}`} 
                          alt={user.username} 
                          width={40} 
                          height={40} 
                          className="object-cover w-full h-full"
                          style={{ objectFit: 'cover', objectPosition: 'center' }}
                          onError={(e) => {
                            console.log('Erro ao carregar imagem:', user.profileImage);
                            // Usar um fallback diretamente em vez de um arquivo
                            e.currentTarget.style.display = 'none';
                            // Mostrar a primeira letra do nome do usuário como fallback
                            const parent = e.currentTarget.parentElement;
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
                      
                      {/* Nova imagem com fade-in quando em transição */}
                      {imageTransition.isChanging && (
                        <div className="absolute inset-0 opacity-0 animate-fadeIn">
                          <Image 
                            src={imageTransition.newImage.startsWith('http') ? imageTransition.newImage : `${window.location.origin}${imageTransition.newImage}`} 
                            alt={user.username} 
                            width={40} 
                            height={40} 
                            className="object-cover w-full h-full"
                            style={{ objectFit: 'cover', objectPosition: 'center' }}
                            onError={(e) => {
                              console.log('Erro ao carregar nova imagem:', imageTransition.newImage);
                              // Usar um fallback diretamente em vez de um arquivo
                              e.currentTarget.style.display = 'none';
                              // Mostrar a primeira letra do nome do usuário como fallback
                              const parent = e.currentTarget.parentElement;
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
                      )}
                    </div>
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
                className="relative overflow-hidden group py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 text-center"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-dark-300 group-hover:bg-dark-400"></span>
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-dark-400 group-hover:bg-transparent group-hover:skew-x-6"></span>
                <span className="relative z-10">Login</span>
              </Link>
              <Link 
                href="/auth/register" 
                className="relative overflow-hidden group py-2.5 text-sm font-medium text-white rounded-lg transition-all duration-300 text-center"
                onClick={() => setIsMenuOpen(false)}
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-primary group-hover:bg-primary-light"></span>
                <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-primary-dark opacity-70 group-hover:bg-transparent group-hover:skew-x-6"></span>
                <span className="relative z-10">Cadastrar</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}