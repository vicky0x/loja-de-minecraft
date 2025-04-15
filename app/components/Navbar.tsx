'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { FiSearch, FiShoppingCart, FiUser, FiLogOut, FiSettings, FiPackage, FiCode, FiX } from 'react-icons/fi';
import { useCart } from '@/app/contexts/CartContext';
import { useAuth } from '../hooks/useAuth';
import { toastUtils } from '@/app/utils/toast';
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

// Interface para os resultados da pesquisa rápida
interface ProductPreview {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  featured?: boolean;
  shortDescription?: string;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hashFaq, setHashFaq] = useState(false);
  // Estado para detectar se estamos em telas grandes quando no dashboard
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  
  // Estado para o preview de pesquisa
  const [showSearchPreview, setShowSearchPreview] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchPreviewRef = useRef<HTMLDivElement>(null);
  
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

  // Efeito para animar transição da imagem de perfil quando for atualizada
  useEffect(() => {
    // Forçar atualização sempre que a imagem mudar
    if (user?.profileImage) {
      
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
      const timeSinceLastUpdate = currentTime - (lastUpdateTimeRef.current || 0);
      const minUpdateInterval = 10000; // 10 segundos
      const returningFromProfilePage = window.location.pathname.includes('/profile') || 
                                      document.referrer.includes('/profile');
      
      if (returningFromProfilePage || timeSinceLastUpdate > minUpdateInterval) {
        refreshUserData();
        lastUpdateTimeRef.current = currentTime;
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Efeito para monitorar eventos de autenticação e imagem de perfil
  useEffect(() => {
    const handleAuthEvent = () => {
      // Atualizar apenas após delay para evitar loops
      setTimeout(() => {
        refreshUserData();
      }, 500);
    };
    
    const handleProfileImageUpdated = (event: Event) => {
      if (event instanceof CustomEvent && event.detail?.imageUrl) {
        const newImageUrl = event.detail.imageUrl;
        
        // Evitar atualização se a imagem for a mesma
        if (user && user.profileImage === newImageUrl) {
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
            // Erro silencioso
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
            // Atualizar timestamp para evitar loops
            localStorage.setItem('lastAuthCheck', currentTime.toString());
            
            // Forçar atualização dos dados
            refreshUserData();
          }
        }
      } catch (error) {
        // Erro silencioso
      }
    };
    
    // Adicionar os event listeners
    window.addEventListener('auth-state-changed', handleAuthEvent);
    window.addEventListener('profile-image-updated', handleProfileImageUpdated);
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
      window.removeEventListener('profile-image-updated', handleProfileImageUpdated);
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
            // Erro silencioso
          }
          
          // Atualizar o contexto
          refreshUserData();
        }
      }
    } catch (error) {
      // Erro silencioso
    }
  };

  // Função para lidar com logout
  const handleLogout = async () => {
    // Exibir toast de loading ao iniciar o logout
    const loadingToast = toastUtils.loading('Saindo da conta...');
    
    try {
      // Fechar o dropdown
      setIsDropdownOpen(false);
      
      // Mostrar overlay de carregamento
      const overlayElement = document.createElement('div');
      overlayElement.style.position = 'fixed';
      overlayElement.style.inset = '0';
      overlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlayElement.style.backdropFilter = 'blur(5px)';
      overlayElement.style.zIndex = '9999';
      overlayElement.style.display = 'flex';
      overlayElement.style.alignItems = 'center';
      overlayElement.style.justifyContent = 'center';
      overlayElement.style.flexDirection = 'column';
      overlayElement.style.color = 'white';
      overlayElement.style.fontFamily = 'sans-serif';
      
      const spinnerElement = document.createElement('div');
      spinnerElement.style.width = '40px';
      spinnerElement.style.height = '40px';
      spinnerElement.style.border = '3px solid rgba(255, 255, 255, 0.3)';
      spinnerElement.style.borderRadius = '50%';
      spinnerElement.style.borderTopColor = '#fff';
      spinnerElement.style.animation = 'spin 1s ease-in-out infinite';
      
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      
      const textElement = document.createElement('div');
      textElement.textContent = 'Saindo da conta...';
      textElement.style.marginTop = '16px';
      textElement.style.fontSize = '16px';
      
      document.head.appendChild(styleElement);
      overlayElement.appendChild(spinnerElement);
      overlayElement.appendChild(textElement);
      document.body.appendChild(overlayElement);
      
      // Evitar que o usuário navegue durante o logout
      const beforeUnloadHandler = (e) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };
      window.addEventListener('beforeunload', beforeUnloadHandler);
      
      // Definir flags para prevenir redirecionamentos indesejados
      sessionStorage.setItem('logout_in_progress', 'true');
      sessionStorage.setItem('block_auth_checks', 'true');
      
      // Limpar todos os dados relevantes no localStorage
      try {
        // Limpar dados de redirecionamento
        localStorage.removeItem('redirectAfterLogin');
        localStorage.removeItem('isAuthenticated');
        localStorage.setItem('isAuthenticated', 'false');
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        
        // Limpar flags de redirecionamento
        sessionStorage.removeItem('redirect_count');
        sessionStorage.removeItem('anti_loop_active');
        sessionStorage.removeItem('navigation_history');
      } catch (e) {
        console.error('Erro ao limpar storage antes do logout:', e);
      }
      
      // Desabilitar o Next.js Router temporariamente
      const originalPush = router.push;
      const originalReplace = router.replace;
      try {
        router.push = () => Promise.resolve(false);
        router.replace = () => Promise.resolve(false);
      } catch (e) {
        console.error('Erro ao sobrescrever router:', e);
      }

      // Chamar a função de logout do contexto
      const success = await logout();

      // Sucesso: atualizar o toast
      toastUtils.update(loadingToast.id, 'Logout realizado com sucesso!', 'success');
      
      // Se não houver redirecionamento após 2 segundos, forçar
      setTimeout(() => {
        // Remover o overlay
        try {
          document.body.removeChild(overlayElement);
          document.head.removeChild(styleElement);
        } catch (e) {
          console.error('Erro ao remover overlay:', e);
        }
        
        // Remover o handler de beforeunload
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        
        // Verificar se ainda estamos na mesma página
        if (window.location.pathname !== '/auth/login') {
          console.log('Redirecionamento de logout não ocorreu, forçando...');
          
          // Limpar tudo e forçar redirecionamento
          localStorage.clear();
          sessionStorage.clear();
          
          // Redirecionar direto para login
          window.location.href = `/auth/login?forced_logout=true&t=${Date.now()}`;
        }
      }, 2000);
    } catch (error) {
      console.error('Erro crítico durante logout:', error);
      toastUtils.update(loadingToast.id, 'Erro ao fazer logout', 'error');
      
      // Tentar logout direto como fallback
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth/login';
      }, 1000);
    }
  };

  // Função para buscar produtos enquanto digita
  const searchProducts = async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchPreview(false);
      return;
    }

    try {
      setIsSearching(true);
      setShowSearchPreview(true);
      
      const response = await fetch(`/api/search/quick?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Falha ao buscar produtos');
      }
      
      const data = await response.json();
      setSearchResults(data.products || []);
      
      // Garantir que o preview seja exibido se houver resultados
      if (data.products && data.products.length > 0) {
        setShowSearchPreview(true);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Efeito para buscar produtos quando o usuário digita
  useEffect(() => {
    // Não fazer nada se o campo estiver vazio
    if (searchQuery.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchPreview(false);
      return () => {}; // Retorno vazio para evitar warning
    }
    
    // Não buscar se tiver menos de 2 caracteres
    if (searchQuery.length < 2) {
      setIsSearching(false);
      return () => {}; // Retorno vazio para evitar warning
    }
    
    // Debounce para evitar muitas chamadas de API
    const timer = setTimeout(() => {
      searchProducts(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Efeito para fechar o preview ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchPreviewRef.current && !searchPreviewRef.current.contains(event.target as Node)) {
        setShowSearchPreview(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modificamos a função handleSearch para remover a referência ao preview
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchPreview(false);
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Efeito para verificar se o hash da página é #faq
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkHash = () => {
        setHashFaq(window.location.hash === '#faq');
      };
      
      // Verificar inicialmente
      checkHash();
      
      // Adicionar listener para alterações no hash
      window.addEventListener('hashchange', checkHash);
      
      return () => window.removeEventListener('hashchange', checkHash);
    }
  }, []);

  // Se estamos na dashboard, não renderizar a navbar principal
  if (isDashboard) {
    return null;
  }

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-dark-200/90 backdrop-blur-md shadow-lg' : 'bg-dark-200/80 backdrop-blur-sm'
      } h-16 md:h-20 flex items-center`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-full">
          {/* Logo e Nome da Loja - Desktop e Mobile */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group" style={{ WebkitTapHighlightColor: 'transparent' }}>
              <div className="flex items-center">
                <div className="relative mr-2 overflow-hidden rounded-full w-8 h-8 md:w-9 md:h-9 flex-shrink-0 shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300">
                  <Image 
                    src="/fantasy_logo.png" 
                    alt="Fantasy Store Logo" 
                    width={38} 
                    height={38} 
                    className="object-cover transform group-hover:scale-110 transition-all duration-300"
                    quality={100}
                    priority
                  />
                </div>
                <span className="text-white font-bold text-xl md:text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-light to-primary group-hover:from-white group-hover:to-primary-light transition-all duration-500">
                  Fantasy<span className="text-white group-hover:text-primary-light transition-colors duration-500">Store</span><span className="text-primary text-2xl md:text-3xl">.</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Área central da navbar - Somente para desktop */}
          <div className="hidden lg:flex flex-1 items-center justify-center mx-6">
            {/* Navigation Links - Desktop */}
            <nav className="flex items-center space-x-8 mr-6">
              <Link href="/" className={`text-sm font-medium transition-colors duration-300 ${pathname === '/' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                Início
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/products" className={`text-sm font-medium transition-colors duration-300 ${pathname === '/products' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                Produtos
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/category" className={`text-sm font-medium transition-colors duration-300 ${pathname === '/category' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                Categorias
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/dashboard/support" className={`text-sm font-medium transition-colors duration-300 ${pathname.startsWith('/dashboard/support') ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                Suporte
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/#faq" className={`text-sm font-medium transition-colors duration-300 ${pathname === '/' && hashFaq ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>

            {/* Barra de pesquisa - versão desktop */}
            <form 
              onSubmit={handleSearch}
              className="flex flex-1 max-w-md relative search-container"
            >
              <input 
                type="text" 
                placeholder="Buscar produtos..." 
                className="w-full bg-dark-300/70 rounded-full py-2 px-4 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 border border-dark-400 hover:border-primary/30 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchQuery(newValue);
                  
                  // Limpar resultados quando o campo estiver vazio
                  if (newValue.length === 0) {
                    setSearchResults([]);
                    setShowSearchPreview(false);
                  }
                }}
                onFocus={() => {
                  if (searchQuery.length >= 2) {
                    setShowSearchPreview(true);
                  }
                }}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiSearch size={16} />
              </div>
              <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary/20 hover:bg-primary/40 text-primary rounded-full p-1 transition-all duration-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              
              {/* Preview dos resultados */}
              {showSearchPreview && (
                <div 
                  ref={searchPreviewRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-dark-200 rounded-lg shadow-lg overflow-hidden z-50 border border-dark-400/50"
                >
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
                      <p className="text-gray-400 text-sm">Buscando produtos...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map(product => (
                        <Link 
                          key={product._id} 
                          href={`/products/${product.slug}`}
                          onClick={() => setShowSearchPreview(false)}
                          className="flex items-center p-3 hover:bg-dark-300 transition-colors border-b border-dark-400/30 last:border-b-0"
                        >
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-dark-400 flex-shrink-0 mr-3">
                            {product.images && product.images[0] ? (
                              <Image 
                                src={product.images[0]} 
                                alt={product.name} 
                                width={48} 
                                height={48} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-dark-500">
                                <FiPackage className="text-gray-400" size={18} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{product.name}</p>
                            <p className="text-primary text-sm font-semibold">R$ {product.price.toFixed(2)}</p>
                          </div>
                          {product.featured && (
                            <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full ml-2">
                              Destaque
                            </span>
                          )}
                        </Link>
                      ))}
                      
                      <div className="p-2 bg-dark-300/50 border-t border-dark-400/30">
                        <button 
                          onClick={handleSearch}
                          className="w-full py-2 text-center text-sm text-primary hover:text-white hover:bg-primary/20 rounded-md transition-colors"
                        >
                          Ver todos os resultados
                        </button>
                      </div>
                    </div>
                  ) : searchQuery.length > 1 ? (
                    <div className="p-4 text-center">
                      <p className="text-gray-400">Nenhum produto encontrado</p>
                    </div>
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-gray-400 text-sm">Digite pelo menos 2 caracteres para buscar</p>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Versão média - só menu de navegação sem busca */}
          <div className="hidden md:flex lg:hidden justify-center mx-2">
            <nav className="flex items-center space-x-4">
              <Link href="/" className={`text-xs font-medium transition-colors duration-300 ${pathname === '/' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                Início
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/products" className={`text-xs font-medium transition-colors duration-300 ${pathname === '/products' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                Produtos
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/category" className={`text-xs font-medium transition-colors duration-300 ${pathname === '/category' ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                Categorias
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/#faq" className={`text-xs font-medium transition-colors duration-300 ${pathname === '/' && hashFaq ? 'text-primary' : 'text-gray-300 hover:text-white'} relative group`} style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}>
                FAQ
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>
          </div>

          {/* Botões e menu do usuário - versão desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Botão de pesquisa para telas médias */}
            <div className="md:flex lg:hidden">
              <button
                className="text-white p-2 rounded-lg hover:bg-dark-300/50 transition-colors duration-300"
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                aria-label="Pesquisar"
              >
                <FiSearch className="h-5 w-5" />
              </button>
            </div>
            
            {loadingUser ? (
              // Mostrar botões de login/cadastro mesmo durante o carregamento
              <div className="flex space-x-3">
                <Link 
                  href="/auth/login" 
                  className="relative overflow-hidden group px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-dark-300 group-hover:bg-dark-400"></span>
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-dark-400 group-hover:bg-transparent group-hover:skew-x-6"></span>
                  <span className="relative z-10">Login</span>
                </Link>
                <Link 
                  href="/auth/register" 
                  className="relative overflow-hidden group px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
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
                                // Usar um fallback diretamente em vez de um arquivo
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  parent.classList.add('bg-gray-600');
                                  parent.classList.add('flex');
                                  parent.classList.add('items-center');
                                  parent.classList.add('justify-center');
                                  
                                  const iconElement = document.createElement('div');
                                  iconElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400" height="22" width="22" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                  parent.appendChild(iconElement);
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
                                  // Usar um fallback diretamente em vez de um arquivo
                                  e.currentTarget.style.display = 'none';
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.classList.add('bg-gray-600');
                                    parent.classList.add('flex');
                                    parent.classList.add('items-center');
                                    parent.classList.add('justify-center');
                                    
                                    const iconElement = document.createElement('div');
                                    iconElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400" height="22" width="22" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                    parent.appendChild(iconElement);
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
                      
                      {user.role === 'developer' && (
                        <Link 
                          href="/admin" 
                          className="flex items-center px-4 py-2 text-sm text-white hover:bg-primary/10 hover:text-primary transition-all duration-300"
                          style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                        >
                          <FiCode size={16} className="mr-2" />
                          Painel de Desenvolvimento
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
                  className="relative overflow-hidden group px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
                  style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
                >
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform translate-x-0 -skew-x-0 bg-dark-300 group-hover:bg-dark-400"></span>
                  <span className="absolute inset-0 w-full h-full transition-all duration-300 ease-out transform skew-x-0 bg-dark-400 group-hover:bg-transparent group-hover:skew-x-6"></span>
                  <span className="relative z-10">Login</span>
                </Link>
                <Link 
                  href="/auth/register" 
                  className="relative overflow-hidden group px-4 py-2 text-sm font-medium text-white rounded-lg transition-all duration-300 flex items-center justify-center"
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
            {/* Botão de pesquisa para mobile */}
            <button
              className="text-white p-2 rounded-lg hover:bg-dark-300/50 transition-colors duration-300"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Pesquisar"
            >
              <FiSearch className="h-6 w-6" />
            </button>
            
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
            
            {/* Botão de menu para mobile */}
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

      {/* Barra de pesquisa mobile */}
      {isSearchOpen && (
        <div className="absolute top-[calc(100%)] left-0 right-0 p-3 bg-dark-300/95 backdrop-blur-lg border-t border-dark-400/30 search-container z-[60] shadow-md">
          <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full bg-dark-400/50 rounded-lg py-2.5 px-4 pl-10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 border border-dark-500/30 hover:border-primary/30 transition-all duration-300"
              value={searchQuery}
              onChange={(e) => {
                const newValue = e.target.value;
                setSearchQuery(newValue);
                
                // Limpar resultados quando o campo estiver vazio
                if (newValue.length === 0) {
                  setSearchResults([]);
                  setShowSearchPreview(false);
                }
              }}
              onFocus={() => {
                if (searchQuery.length >= 2) {
                  setShowSearchPreview(true);
                }
              }}
              autoFocus
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FiSearch size={18} />
            </div>
            <button 
              type="button" 
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              onClick={() => {
                setIsSearchOpen(false);
                setShowSearchPreview(false);
              }}
            >
              <FiX size={18} />
            </button>
            
            {/* Preview dos resultados para mobile */}
            {showSearchPreview && (
              <div 
                ref={searchPreviewRef}
                className="absolute top-full left-0 right-0 mt-2 bg-dark-200 rounded-lg shadow-lg overflow-hidden z-50 border border-dark-400/50"
              >
                {isSearching ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full mb-2"></div>
                    <p className="text-gray-400 text-sm">Buscando produtos...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map(product => (
                      <Link 
                        key={product._id} 
                        href={`/products/${product.slug}`}
                        onClick={() => {
                          setShowSearchPreview(false);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center p-3 hover:bg-dark-300 transition-colors border-b border-dark-400/30 last:border-b-0"
                      >
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-dark-400 flex-shrink-0 mr-3">
                          {product.images && product.images[0] ? (
                            <Image 
                              src={product.images[0]} 
                              alt={product.name} 
                              width={48} 
                              height={48} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-dark-500">
                              <FiPackage className="text-gray-400" size={18} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{product.name}</p>
                          <p className="text-primary text-sm font-semibold">R$ {product.price.toFixed(2)}</p>
                        </div>
                        {product.featured && (
                          <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full ml-2">
                            Destaque
                          </span>
                        )}
                      </Link>
                    ))}
                    
                    <div className="p-2 bg-dark-300/50 border-t border-dark-400/30">
                      <button 
                        onClick={handleSearch}
                        className="w-full py-2 text-center text-sm text-primary hover:text-white hover:bg-primary/20 rounded-md transition-colors"
                      >
                        Ver todos os resultados
                      </button>
                    </div>
                  </div>
                ) : searchQuery.length > 1 ? (
                  <div className="p-4 text-center">
                    <p className="text-gray-400">Nenhum produto encontrado</p>
                  </div>
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-400 text-sm">Digite pelo menos 2 caracteres para buscar</p>
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Menu Mobile - Enhanced */}
      <div 
        className={`md:hidden fixed top-16 left-0 right-0 z-50 bg-dark-200/95 backdrop-blur-md border-t border-dark-400/30 ${
          isMenuOpen ? 'max-h-[calc(100vh-4rem)] overflow-y-auto py-4 shadow-lg' : 'max-h-0 py-0 border-t-0'
        } overflow-hidden transition-all duration-500`}
      >
        <div className="container mx-auto px-4 flex flex-col space-y-4 pb-6">
          {/* Navigation Links - Mobile */}
          <nav className="flex flex-col space-y-3 border-b border-dark-300/50 pb-4">
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
              href="/category" 
              className={`py-2 text-sm font-medium ${pathname === '/category' ? 'text-primary' : 'text-gray-300'}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              Categorias
            </Link>
            <Link 
              href="/dashboard/support" 
              className={`py-2 text-sm font-medium ${pathname.startsWith('/dashboard/support') ? 'text-primary' : 'text-gray-300'}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              Suporte
            </Link>
            <Link 
              href="/#faq" 
              className={`py-2 text-sm font-medium ${pathname === '/' && hashFaq ? 'text-primary' : 'text-gray-300'}`}
              onClick={() => setIsMenuOpen(false)}
              style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
            >
              FAQ
            </Link>
          </nav>
          
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
                            // Usar um fallback diretamente em vez de um arquivo
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.classList.add('bg-gray-600');
                              parent.classList.add('flex');
                              parent.classList.add('items-center');
                              parent.classList.add('justify-center');
                              
                              const iconElement = document.createElement('div');
                              iconElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400" height="22" width="22" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                              parent.appendChild(iconElement);
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
                              // Usar um fallback diretamente em vez de um arquivo
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.classList.add('bg-gray-600');
                                parent.classList.add('flex');
                                parent.classList.add('items-center');
                                parent.classList.add('justify-center');
                                
                                const iconElement = document.createElement('div');
                                iconElement.innerHTML = '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400" height="22" width="22" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
                                parent.appendChild(iconElement);
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