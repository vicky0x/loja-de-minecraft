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
    pendingOrders: number;
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
      pendingOrders: 0,
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
        
        // Carregar dados básicos com tratamento de erros
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
            .catch(error => {
              console.error('Erro ao processar produtos:', error);
              setState(prev => ({ ...prev, products: [] }));
            });
          
          // Carregar pedidos recentes com tratamento de erros
          fetch('/api/user/orders?limit=5')
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
                const pendingOrders = orders.filter(
                  order => order.paymentInfo?.status === 'pending' || 
                         order.status === 'pending'
                ).length;
                
                const totalRevenue = orders
                  .filter(order => order.paymentInfo?.status === 'paid' || order.status === 'completed')
                  .reduce((sum, order) => sum + (order.totalAmount || 0), 0);
                
                setState(prev => ({
                  ...prev,
                  recentOrders: orders,
                  stats: {
                    ...prev.stats,
                    pendingOrders,
                    revenue: totalRevenue
                  }
                }));
              }
            })
            .catch(error => {
              console.error('Erro ao processar pedidos:', error);
              setState(prev => ({ ...prev, recentOrders: [] }));
            });
          
        } catch (dataError) {
          console.error('Erro ao carregar dados do dashboard:', dataError);
          setState(prev => ({ 
            ...prev, 
            error: 'Ocorreu um erro ao carregar os dados do dashboard.' 
          }));
        }
      } catch (e) {
        console.error('Erro geral no carregamento do dashboard:', e);
      } finally {
        // Finalizar carregamento após um tempo mínimo
        setTimeout(() => {
          setState(prev => ({ ...prev, isLoading: false }));
        }, 800);
      }
    };

    loadDashboard();
    
    return () => {
      // Limpeza ao desmontar
    };
  }, [shouldLoadData, router]);

  // Renderizar o dashboard independente de erros de autenticação
  if (!state.mounted) {
    return <div className="min-h-screen flex items-center justify-center">
      <span className="animate-pulse">Carregando...</span>
    </div>;
  }

  return (
    <div className="p-6">
      {state.isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <span className="animate-pulse">Carregando dashboard...</span>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
          
          {state.error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg text-red-400">
              {state.error}
            </div>
          )}
          
          <DashboardStats 
            stats={state.stats}
            isLoading={false}
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2">
              <h2 className="text-xl font-semibold mb-4">Produtos Populares</h2>
              <ProductGrid products={state.products} isLoading={false} />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Pedidos Recentes</h2>
              <PendingTable orders={state.recentOrders} isLoading={false} />
            </div>
          </div>
        </>
      )}
    </div>
  );
} 