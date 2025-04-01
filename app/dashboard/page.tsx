'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiDownload, FiCreditCard, FiShoppingBag, FiHelpCircle, 
  FiPackage, FiEye, FiChevronRight, FiRefreshCw, 
  FiCalendar, FiDollarSign, FiClock, FiUser,
  FiArrowUp, FiBarChart2, FiPercent
} from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  status: string;
  lastUpdate: string;
  variant: {
    _id: string;
    name: string;
  };
  code: string;
  assignedAt: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    purchases: 0,
    downloads: 0,
    activeSubscriptions: 0,
    tickets: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Carregar estatísticas
    fetchStats();
    
    // Carregar produtos atribuídos ao usuário
    fetchUserProducts();
    
    // Carregar pedidos recentes
    fetchRecentOrders();

    // Carregar informações do usuário
    fetchUserInfo();
  }, []);
  
  const fetchStats = async () => {
    try {
      // Em produção, substituir por chamada real à API
      setTimeout(() => {
        setStats({
          purchases: 5,
          downloads: 12,
          activeSubscriptions: 1,
          tickets: 0
        });
        
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setLoading(false);
    }
  };

  const fetchUserInfo = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.user);
      }
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
    }
  };
  
  const fetchUserProducts = async () => {
    try {
      setProductsLoading(true);
      setError('');
      
      const response = await fetch('/api/user/products');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao carregar produtos');
      }
      
      const data = await response.json();
      setUserProducts(data.products || []);
    } catch (error: any) {
      console.error('Erro ao carregar produtos do usuário:', error);
      setError(error.message || 'Erro ao carregar seus produtos');
    } finally {
      setProductsLoading(false);
    }
  };

  const fetchRecentOrders = async () => {
    try {
      setOrdersLoading(true);
      
      const response = await fetch('/api/user/orders?limit=5');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erro ao carregar pedidos recentes');
      }
      
      const data = await response.json();
      setRecentOrders(data.orders || []);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos recentes:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Função para atualizar todos os dados do dashboard
  const refreshDashboard = async () => {
    setLoading(true);
    setProductsLoading(true);
    setOrdersLoading(true);
    
    await Promise.all([
      fetchStats(),
      fetchUserProducts(),
      fetchRecentOrders(),
      fetchUserInfo()
    ]);
  };

  // Função para formatar data de forma segura
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      // Verificar se a data é válida e posterior a 2020
      if (isNaN(date.getTime()) || date.getFullYear() < 2020) {
        return new Date().toLocaleDateString('pt-BR');
      }
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return new Date().toLocaleDateString('pt-BR');
    }
  };

  // Formatar valores monetários
  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading && productsLoading && ordersLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Título da Página */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center">
          <span className="text-gray-400 mr-2">Hoje: </span>
          <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
          <button 
            onClick={refreshDashboard}
            className="ml-4 p-2 bg-dark-400 hover:bg-dark-500 rounded-lg transition-colors"
            title="Atualizar dados"
          >
            <FiRefreshCw className="text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Métricas principais - Cards mais largos como na versão admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Compras */}
        <div className="bg-dark-200 rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Compras</p>
              <p className="text-2xl font-bold mt-1">{stats.purchases}</p>
              <p className="text-xs mt-2 text-gray-400">Pedidos realizados</p>
            </div>
            <div className="p-3 bg-blue-900/30 text-blue-400 rounded-lg">
              <FiShoppingBag className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Downloads */}
        <Link href="/dashboard/products" className="bg-dark-200 rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Downloads</p>
              <p className="text-2xl font-bold mt-1">{stats.downloads}</p>
              <p className="text-xs mt-2 text-gray-400">Arquivos baixados</p>
            </div>
            <div className="p-3 bg-green-900/30 text-green-400 rounded-lg">
              <FiDownload className="w-8 h-8" />
            </div>
          </div>
        </Link>

        {/* Assinaturas Ativas */}
        <div className="bg-dark-200 rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Assinaturas Ativas</p>
              <p className="text-2xl font-bold mt-1">{stats.activeSubscriptions}</p>
              <p className="text-xs mt-2 text-gray-400">Planos ativos</p>
            </div>
            <div className="p-3 bg-purple-900/30 text-purple-400 rounded-lg">
              <FiCreditCard className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* Tickets de Suporte */}
        <div className="bg-dark-200 rounded-lg p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Tickets de Suporte</p>
              <p className="text-2xl font-bold mt-1">{stats.tickets}</p>
              <p className="text-xs mt-2 text-gray-400">Suportes ativos</p>
            </div>
            <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded-lg">
              <FiHelpCircle className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Produtos e Resumo de Atividades - mesma estrutura da admin */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Meus Produtos - Container maior à esquerda */}
        <div className="lg:col-span-2 bg-dark-200 rounded-lg shadow-md">
          <div className="flex justify-between items-center px-6 py-4 border-b border-dark-400">
            <h3 className="text-xl font-bold flex items-center">
              <FiPackage className="mr-2" />
              Meus Produtos
            </h3>
            <Link href="/dashboard/products" className="text-primary hover:text-primary/80 text-sm flex items-center">
              Ver todos <FiChevronRight className="ml-1" />
            </Link>
          </div>
          
          <div className="p-6">
            {productsLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                {userProducts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="bg-dark-300">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Produto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Variante
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-400">
                        {userProducts.slice(0, 3).map((product) => (
                          <tr key={product._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {product.variant?.name || 'Padrão'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400">
                                Ativo
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link 
                                href={`/dashboard/products/${product._id}`}
                                className="text-primary hover:text-primary/80 mx-1"
                              >
                                <FiEye className="w-5 h-5 inline" />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-white">Nenhum produto ainda</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Você ainda não tem produtos atribuídos.
                    </p>
                    <div className="mt-6">
                      <Link 
                        href="/products" 
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                      >
                        <FiShoppingBag className="mr-2 -ml-1 h-5 w-5" />
                        Explorar Produtos
                      </Link>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Resumo de Atividade - Container menor à direita */}
        <div className="bg-dark-200 rounded-lg shadow-md">
          <div className="flex justify-between items-center px-6 py-4 border-b border-dark-400">
            <h3 className="text-xl font-bold flex items-center">
              <FiClock className="mr-2" />
              Últimas Atividades
            </h3>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-dark-300 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-green-900/30 text-green-400 mr-3">
                    <FiDownload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Download Realizado</p>
                    <p className="text-xs text-gray-400 mt-1">CS2 AIM - 1 Dia</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">Hoje</p>
              </div>
              
              <div className="bg-dark-300 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-blue-900/30 text-blue-400 mr-3">
                    <FiShoppingBag className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Compra Realizada</p>
                    <p className="text-xs text-gray-400 mt-1">Valorant AIM - 1 Dia</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">30/03/2025</p>
              </div>

              <div className="bg-dark-300 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="p-2 rounded-full bg-purple-900/30 text-purple-400 mr-3">
                    <FiCreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Assinatura Ativada</p>
                    <p className="text-xs text-gray-400 mt-1">Plano Mensal</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-right">28/03/2025</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pedidos Recentes - Seção inteira como na admin */}
      <div className="bg-dark-200 rounded-lg shadow-md">
        <div className="flex justify-between items-center px-6 py-4 border-b border-dark-400">
          <h3 className="text-xl font-bold flex items-center">
            <FiShoppingBag className="mr-2" />
            Pedidos Recentes
          </h3>
          <Link href="/dashboard/orders" className="text-primary hover:text-primary/80 text-sm flex items-center">
            Ver todos <FiChevronRight className="ml-1" />
          </Link>
        </div>
        
        <div className="p-6">
          {ordersLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {recentOrders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-dark-300">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-dark-400">
                      {recentOrders.map((order) => (
                        <tr key={order._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                            #{order._id.substring(0, 8)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatCurrency(order.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {order.paymentInfo?.status === 'paid' && (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400">
                                Pago
                              </span>
                            )}
                            {order.paymentInfo?.status === 'pending' && (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/30 text-yellow-400">
                                Pendente
                              </span>
                            )}
                            {order.paymentInfo?.status === 'failed' && (
                              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900/30 text-red-400">
                                Falha
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link 
                              href={`/dashboard/orders/${order._id}`}
                              className="text-primary hover:text-primary/80"
                            >
                              Ver detalhes
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-white">Nenhum pedido recente</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Você ainda não realizou nenhum pedido.
                  </p>
                  <div className="mt-6">
                    <Link 
                      href="/products" 
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                    >
                      <FiShoppingBag className="mr-2 -ml-1 h-5 w-5" />
                      Comprar Agora
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 