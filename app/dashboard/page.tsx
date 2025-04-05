'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  FiDownload, FiCreditCard, FiShoppingBag, FiHelpCircle, 
  FiPackage, FiEye, FiChevronRight, FiRefreshCw, 
  FiCalendar, FiDollarSign, FiClock, FiUser,
  FiArrowUp, FiBarChart2, FiPercent, FiAlertTriangle
} from 'react-icons/fi';
import ErrorDisplay from '../components/ui/ErrorDisplay';
import { useLocalCache } from '../hooks/useLocalCache';
import { useFetch } from '../hooks/useFetch';
import { ProductGrid } from '../components/dashboard/ProductGrid';
import { PendingTable } from '../components/dashboard/PendingTable';
import { DashboardStats } from '../components/dashboard/DashboardStats';

// Definir a função fetchAssignments globalmente para prevenir erros
export const fetchAssignments = async (page: number = 1): Promise<void> => {
  try {
    console.warn('fetchAssignments foi chamado no dashboard, mas está desativado para prevenir erros. Página:', page);
    return Promise.resolve();
  } catch (error) {
    console.error('Erro em fetchAssignments:', error);
    return Promise.resolve();
  }
};

// Atribuir à window para garantir que está disponível globalmente
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.fetchAssignments = fetchAssignments;
}

interface UserInfo {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  profileImage?: string;
}

// Definição de tipos para melhorar o TypeScript
interface Product {
  _id?: string;
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  status?: string;
}

interface Order {
  _id?: string;
  orderId?: string;
  createdAt?: string;
  totalAmount?: number;
  status?: string;
  paymentInfo?: {
    status?: string;
    method?: string;
  };
}

// Contador global para evitar requisições duplicadas
let requestCounter = 0;

interface DashboardState {
  serverHealth: boolean;
  mounted: boolean;
  userInfo: UserInfo | null;
  stats: {
    totalProducts: number;
    totalOrders: number;
    revenue: number;
  };
  products: Product[];
  recentOrders: Order[];
  isLoading: boolean;
  error: string;
}

export default function Dashboard() {
  const [state, setState] = useState<DashboardState>({
    serverHealth: false,
    mounted: false,
    userInfo: null,
    stats: {
      totalProducts: 0,
      totalOrders: 0,
      revenue: 0
    },
    products: [],
    recentOrders: [],
    isLoading: true,
    error: ''
  });
  
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [shouldLoadData, setShouldLoadData] = useState(false);

  // Verificar se houve redirecionamento recente
  useEffect(() => {
    try {
      // Verificar se há detecção de loop
      const loopDetected = localStorage.getItem('loop_detected') === 'true';
      if (loopDetected) {
        console.warn('Loop de redirecionamento detectado. Interrompendo ações no dashboard.');
        setState(prev => ({ 
          ...prev, 
          error: 'Ocorreu um erro de redirecionamento. Por favor, recarregue a página ou faça login novamente.',
          isLoading: false 
        }));
        return;
      }

      const redirectStatus = localStorage.getItem('auth_redirect_triggered');
      if (redirectStatus === 'multiple') {
        // Prevenir carregamento se estiver em loop de redirecionamento
        console.log('Detectado possível loop de redirecionamento. Interrompendo requisições.');
        setState(prev => ({ 
          ...prev, 
          error: 'Detectamos um problema com sua sessão. Por favor, tente fazer login novamente.',
          isLoading: false 
        }));
        return;
      }

      // Limpar flag de redirecionamento
      localStorage.setItem('auth_redirect_triggered', 'false');
      
      // Verificar autenticação
      checkAuthentication();
    } catch (e) {
      console.error('Erro ao verificar estado de redirecionamento:', e);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Verificar autenticação do usuário
  const checkAuthentication = async () => {
    if (isCheckingAuth) return;
    
    setIsCheckingAuth(true);
    
    try {
      console.log("Verificando autenticação no dashboard...");
      
      // Verificar no localStorage primeiro
      const token = localStorage.getItem('auth_token');
      const isAuth = localStorage.getItem('isAuthenticated');
      
      if (!token || isAuth !== 'true') {
        console.log('Usuário não autenticado. Redirecionando para login...');
        
        // Limpar tokens inválidos
        try {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('isAuthenticated');
          localStorage.removeItem('loop_detected');
          localStorage.removeItem('loop_detected_time');
          localStorage.removeItem('force_login_page');
          localStorage.removeItem('redirect_history');
          localStorage.removeItem('auth_redirect_triggered');
          localStorage.removeItem('dashboard_redirect_attempts');
        } catch (e) {
          console.error('Erro ao limpar tokens:', e);
        }
        
        // Redirecionamento simples para login
        window.location.href = '/auth/login';
        return;
      }
      
      console.log("Usuário autenticado. Carregando dados...");
      
      // Se passou pela verificação do localStorage, podemos carregar os dados
      setShouldLoadData(true);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Erro ao verificar autenticação. Por favor, tente novamente.',
        isLoading: false 
      }));
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // Método para verificar saúde do servidor e carregar dados
  useEffect(() => {
    if (!shouldLoadData) return;
    
    const loadDashboard = async () => {
      try {
        // Indicar que o componente foi montado
        setState(prev => ({ ...prev, mounted: true }));
        
        // Verificar saúde do servidor com tratamento de erros
        try {
          const healthResponse = await fetch('/api/health', { 
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          });
          
          if (healthResponse.ok) {
            setState(prev => ({ ...prev, serverHealth: true }));
          }
        } catch (healthError) {
          console.warn('Erro ao verificar saúde do servidor:', healthError);
          // Continuar mesmo com erro de saúde
          setState(prev => ({ ...prev, serverHealth: true }));
        }
        
        // Função para carregar os dados do usuário
        const fetchUserData = async () => {
          try {
            // Carregar produtos com tratamento de erros
            fetch('/api/user/products')
              .then(response => {
                if (!response.ok) {
                  if (response.status === 401) {
                    console.warn('Usuário não autenticado ao buscar produtos');
                    // Tratar erro de autenticação
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('isAuthenticated');
                    
                    // Prevenir loop
                    if (localStorage.getItem('auth_redirect_triggered') !== 'multiple') {
                      localStorage.setItem('auth_redirect_triggered', 'true');
                      router.push('/auth/login');
                    }
                    return { products: [] };
                  }
                  console.warn(`Erro ao buscar produtos: ${response.status}`);
                  return { products: [] };
                }
                return response.json();
              })
              .then(data => {
                if (data && Array.isArray(data.products)) {
                  setState(prev => ({
                    ...prev,
                    products: data.products,
                    stats: {
                      ...prev.stats,
                      totalProducts: data.products.length
                    }
                  }));
                }
              })
              .catch(error => console.error('Erro ao processar dados de produtos:', error));
            
            // Carregar pedidos recentes com tratamento de erros
            fetch('/api/user/orders')
              .then(response => {
                if (!response.ok) {
                  if (response.status === 401) {
                    console.warn('Usuário não autenticado ao buscar pedidos');
                    // Tratar erro de autenticação (não duplicar o redirecionamento)
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('isAuthenticated');
                    return { orders: [] };
                  }
                  console.warn(`Erro ao buscar pedidos: ${response.status}`);
                  return { orders: [] };
                }
                return response.json();
              })
              .then(data => {
                if (data && Array.isArray(data.orders)) {
                  const orders = data.orders;
                  // Contar realmente TODOS os pedidos feitos pelo usuário
                  const totalOrders = orders.length;
                  
                  const totalRevenue = orders
                    .filter(order => order.paymentInfo?.status === 'paid' || order.status === 'completed')
                    .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                  
                  // Mostrar apenas os 5 pedidos mais recentes na tabela
                  const recentOrders = orders.slice(0, 5);
                  
                  setState(prev => ({
                    ...prev,
                    recentOrders: recentOrders,
                    stats: {
                      ...prev.stats,
                      totalOrders: totalOrders, // Total real de todos os pedidos
                      revenue: totalRevenue
                    }
                  }));
                }
              })
              .catch(error => {
                console.error('Erro ao processar pedidos:', error);
                setState(prev => ({ ...prev, recentOrders: [] }));
              });
          } catch (error) {
            console.error('Erro ao atualizar dados:', error);
          }
        };
        
        // Carregar dados inicialmente
        await fetchUserData();
        
        // Configurar intervalo para atualizar dados a cada 30 segundos
        const intervalId = setInterval(() => {
          console.log('Atualizando dados do dashboard...');
          fetchUserData();
        }, 30000);
        
        setState(prev => ({ ...prev, isLoading: false }));
        
        // Limpar intervalo quando o componente for desmontado
        return () => {
          clearInterval(intervalId);
        };
        
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Erro desconhecido ao carregar dados',
          isLoading: false 
        }));
      }
    };
    
    loadDashboard();
  }, [shouldLoadData, router]);

  // Adicionar efeito para carregar os dados do usuário
  useEffect(() => {
    if (!shouldLoadData) return;
    
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.user) {
            setState(prev => ({
              ...prev,
              userInfo: data.user
            }));
          }
        }
      } catch (error) {
        console.error('Erro ao carregar informações do usuário:', error);
      }
    };
    
    fetchUserInfo();
  }, [shouldLoadData]);

  if (state.isLoading) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-400">Carregando seu dashboard...</p>
      </div>
    );
  }
  
  if (state.error) {
    return <ErrorDisplay message={state.error} />;
  }

  // Formato valores monetários
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho da página */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Bem-vindo, </span>
          <span className="font-medium">{state.userInfo?.name || state.userInfo?.username || 'Usuário'}</span>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Card 1: Produtos */}
        <div className="bg-dark-200 rounded-lg p-4 md:p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm">Seus Produtos</h3>
              <p className="text-2xl font-bold mt-1">{state.stats.totalProducts}</p>
              <p className="text-xs mt-2 text-gray-400">Produtos na sua conta</p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-lg">
              <FiShoppingBag className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        </div>
        
        {/* Card 2: Pedidos */}
        <div className="bg-dark-200 rounded-lg p-4 md:p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm">Pedidos Realizados</h3>
              <p className="text-2xl font-bold mt-1">{state.stats.totalOrders}</p>
              <p className="text-xs mt-2 text-gray-400">Total de pedidos realizados</p>
            </div>
            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-lg">
              <FiPackage className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        </div>
        
        {/* Card 3: Faturamento */}
        <div className="bg-dark-200 rounded-lg p-4 md:p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-gray-400 text-sm">Faturamento Total</h3>
              <p className="text-2xl font-bold mt-1">{formatCurrency(state.stats.revenue)}</p>
              <p className="text-xs mt-2 text-gray-400">Valor total de pedidos processados</p>
            </div>
            <div className="p-3 bg-green-500/10 text-green-500 rounded-lg">
              <FiDollarSign className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Meus Produtos</h2>
          <ProductGrid products={state.products} isLoading={false} />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Meus Pedidos</h2>
          <PendingTable orders={state.recentOrders} isLoading={false} />
        </div>
      </div>
    </div>
  );
} 