'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FiUser, FiDollarSign, FiShoppingBag, FiPercent, 
  FiTrendingUp, FiUsers, FiBarChart2, FiCalendar,
  FiRefreshCw, FiBox, FiClock, FiCheck, FiAlertTriangle,
  FiMail, FiEye
} from 'react-icons/fi';

export default function AdminDashboard() {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Buscar estatísticas do dashboard
  useEffect(() => {
    const fetchDashboardStats = async (retryCount = 0) => {
      try {
        setStatsLoading(true);
        setStatsError(null);
        
        // Usar AbortController para poder cancelar a solicitação se necessário
        const controller = new AbortController();
        const signal = controller.signal;
        
        // Timeout aumentado para 30 segundos para permitir mais tempo de resposta
        const timeout = setTimeout(() => {
          console.log('Timeout na requisição de estatísticas, abortando...');
          controller.abort();
        }, 30000); // 30 segundos
        
        console.log('Iniciando busca de estatísticas...');
        const response = await fetch('/api/admin/stats', {
          signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        // Limpar o timeout, pois a requisição se completou
        clearTimeout(timeout);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = `Erro ao carregar estatísticas (status: ${response.status})`;
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              console.error('Erro ao processar resposta JSON de erro:', parseError);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Erro ao processar JSON da resposta de estatísticas:', jsonError);
          throw new Error('Erro ao processar dados de estatísticas do servidor');
        }
        
        if (!data || !data.stats) {
          console.error('Dados de estatísticas recebidos são inválidos:', data);
          throw new Error('Formato de resposta inválido para estatísticas');
        }
        
        console.log('Estatísticas recebidas com sucesso');
        setDashboardStats(data.stats);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        
        // Se for um erro de aborto, indicar que o tempo esgotou
        const errorMessage = error instanceof DOMException && error.name === 'AbortError'
          ? 'Tempo de resposta esgotado. Tentativas de carregamento foram interrompidas.'
          : error instanceof Error 
            ? error.message 
            : 'Erro desconhecido ao carregar estatísticas';
        
        setStatsError(errorMessage);
        
        // Tentar novamente automaticamente até 3 vezes com backoff progressivo
        if (retryCount < 3 && (
            error instanceof TypeError || // Erro de rede
            (error instanceof DOMException && error.name === 'AbortError') || // Timeout
            (error instanceof Error && error.message.includes('processar')) // Erro de processamento
        )) {
          const retryDelay = 2000 * Math.pow(1.5, retryCount); // Backoff exponencial
          console.log(`Tentando novamente carregamento de estatísticas (${retryCount + 1}/3) em ${retryDelay}ms...`);
          
          // Mostrar mensagem no estado
          setStatsError(`Tentando novamente em alguns segundos... (${retryCount + 1}/3)`);
          
          // Esperar um tempo progressivamente maior antes de tentar novamente
          setTimeout(() => fetchDashboardStats(retryCount + 1), retryDelay);
        } else if (retryCount >= 3) {
          setStatsError('Falha ao carregar estatísticas após várias tentativas. Tente atualizar a página.');
        }
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Buscar dados reais de pedidos recentes
  useEffect(() => {
    const fetchRecentOrders = async (retryCount = 0) => {
      try {
        setOrdersLoading(true);
        setOrdersError(null);
        
        // Usar AbortController para poder cancelar a solicitação se necessário
        const controller = new AbortController();
        const signal = controller.signal;
        
        // Timeout aumentado para 30 segundos para permitir mais tempo de resposta
        const timeout = setTimeout(() => {
          console.log('Timeout na requisição de pedidos recentes, abortando...');
          controller.abort();
        }, 30000); // 30 segundos
        
        console.log('Iniciando busca de pedidos recentes...');
        const response = await fetch('/api/admin/orders?limit=5', {
          signal,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        // Limpar o timeout, pois a requisição se completou
        clearTimeout(timeout);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          let errorMessage = `Erro ao carregar pedidos recentes (status: ${response.status})`;
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json();
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              console.error('Erro ao processar resposta JSON de erro:', parseError);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('Erro ao processar JSON da resposta:', jsonError);
          throw new Error('Erro ao processar dados do servidor');
        }
        
        if (!data) {
          console.error('Dados recebidos são nulos ou indefinidos');
          throw new Error('Dados de pedidos inválidos');
        }
        
        // Verificação mais segura do formato dos dados
        const ordersArray = Array.isArray(data.orders) 
          ? data.orders 
          : Array.isArray(data) 
            ? data 
            : [];
        
        console.log(`Recebidos ${ordersArray.length} pedidos recentes`);
        
        setRecentOrders(ordersArray);
      } catch (error) {
        console.error('Erro ao buscar pedidos recentes:', error);
        
        // Se for um erro de aborto, indicar que o tempo esgotou
        const errorMessage = error instanceof DOMException && error.name === 'AbortError'
          ? 'Tempo de resposta esgotado. Tentativas de carregamento foram interrompidas.'
          : error instanceof Error 
            ? error.message 
            : 'Erro desconhecido ao carregar pedidos';
        
        setOrdersError(errorMessage);
        
        // Tentar novamente automaticamente até 3 vezes com backoff progressivo
        if (retryCount < 3 && (
            error instanceof TypeError || // Erro de rede
            (error instanceof DOMException && error.name === 'AbortError') || // Timeout
            (error instanceof Error && error.message.includes('processar')) // Erro de processamento
        )) {
          const retryDelay = 2000 * Math.pow(1.5, retryCount); // Backoff exponencial
          console.log(`Tentando novamente carregamento de pedidos (${retryCount + 1}/3) em ${retryDelay}ms...`);
          
          // Mostrar mensagem no estado
          setOrdersError(`Tentando novamente em alguns segundos... (${retryCount + 1}/3)`);
          
          // Esperar um tempo progressivamente maior antes de tentar novamente
          setTimeout(() => fetchRecentOrders(retryCount + 1), retryDelay);
        } else if (retryCount >= 3) {
          setOrdersError('Falha ao carregar pedidos após várias tentativas. Tente atualizar a página.');
        }
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchRecentOrders();
  }, []);

  // Função para atualizar os dados do dashboard
  const refreshDashboard = async () => {
    try {
      setStatsLoading(true);
      setStatsError(null);
      setOrdersLoading(true);
      setOrdersError(null);
      
      // Usar AbortController para poder cancelar as solicitações se necessário
      const controller = new AbortController();
      const signal = controller.signal;
      
      // Timeout aumentado para 30 segundos para permitir mais tempo de resposta
      const timeout = setTimeout(() => {
        console.log('Timeout na atualização manual do dashboard, abortando...');
        controller.abort();
      }, 30000); // 30 segundos
      
      console.log('Iniciando atualização manual do dashboard...');
      
      const requestOptions = {
        signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      };
      
      let statsData, ordersData;
      
      try {
        const [statsResponse, ordersResponse] = await Promise.all([
          fetch('/api/admin/stats', requestOptions),
          fetch('/api/admin/orders?limit=5', requestOptions)
        ]);
        
        // Limpar o timeout, pois as requisições se completaram
        clearTimeout(timeout);
        
        // Processar resposta de estatísticas
        if (!statsResponse.ok) {
          const contentType = statsResponse.headers.get('content-type');
          let errorMessage = `Erro ao carregar estatísticas (status: ${statsResponse.status})`;
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await statsResponse.json();
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              console.error('Erro ao processar resposta JSON de erro (stats):', parseError);
            }
          }
          
          setStatsError(errorMessage);
        } else {
          try {
            statsData = await statsResponse.json();
            
            if (statsData && statsData.stats) {
              setDashboardStats(statsData.stats);
              console.log('Estatísticas atualizadas com sucesso');
            } else {
              setStatsError('Formato de resposta inválido para estatísticas');
            }
          } catch (jsonError) {
            console.error('Erro ao processar JSON de estatísticas:', jsonError);
            setStatsError('Erro ao processar dados de estatísticas');
          }
        }
        
        // Processar resposta de pedidos
        if (!ordersResponse.ok) {
          const contentType = ordersResponse.headers.get('content-type');
          let errorMessage = `Erro ao carregar pedidos recentes (status: ${ordersResponse.status})`;
          
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await ordersResponse.json();
              errorMessage = errorData.error || errorMessage;
            } catch (parseError) {
              console.error('Erro ao processar resposta JSON de erro (orders):', parseError);
            }
          }
          
          setOrdersError(errorMessage);
        } else {
          try {
            ordersData = await ordersResponse.json();
            
            // Verificação mais segura do formato dos dados
            const ordersArray = Array.isArray(ordersData.orders) 
              ? ordersData.orders 
              : Array.isArray(ordersData) 
                ? ordersData 
                : [];
            
            setRecentOrders(ordersArray);
            console.log(`${ordersArray.length} pedidos recentes atualizados com sucesso`);
          } catch (jsonError) {
            console.error('Erro ao processar JSON de pedidos:', jsonError);
            setOrdersError('Erro ao processar dados de pedidos');
          }
        }
      } catch (fetchError) {
        // Limpar o timeout em caso de erro
        clearTimeout(timeout);
        
        console.error('Erro na atualização manual do dashboard:', fetchError);
        
        // Mensagem de erro específica para timeout
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          const errorMsg = 'Tempo limite excedido ao atualizar dados. Tente novamente.';
          setStatsError(errorMsg);
          setOrdersError(errorMsg);
        } else {
          setStatsError('Falha ao carregar dados. Verifique sua conexão.');
          setOrdersError('Falha ao carregar dados. Verifique sua conexão.');
        }
      }
    } finally {
      setStatsLoading(false);
      setOrdersLoading(false);
    }
  };

  // Função para formatar datas
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  // Formatar valores monetários
  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'green';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      case 'refunded':
        return 'blue';
      default:
        return 'gray';
    }
  };

  // Função para traduzir o status
  const translateStatus = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falha';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status || 'Desconhecido';
    }
  };

  return (
    <div className="space-y-8">
      {/* Cabeçalho da página */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <span className="text-gray-400">Hoje: </span>
            <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
          </div>
          <button 
            onClick={refreshDashboard}
            disabled={statsLoading || ordersLoading}
            className="p-2 bg-dark-500 rounded-lg hover:bg-dark-600 transition-colors"
            title="Atualizar dados"
          >
            <FiRefreshCw className={`text-gray-400 ${(statsLoading || ordersLoading) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Exibir erros se houver */}
      {statsError && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4">
          <p className="font-medium text-red-400">Erro ao carregar estatísticas</p>
          <p className="text-red-300">{statsError}</p>
          
          {statsError.includes('autorizado') || statsError.includes('Não autorizado') ? (
            <div className="mt-3">
              <p className="text-red-300 mb-2">Sua sessão pode ter expirado ou você não tem permissões de administrador.</p>
              <Link href="/login?redirect=/admin" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors">
                <FiUser className="mr-2" />
                Fazer login novamente
              </Link>
            </div>
          ) : null}
        </div>
      )}

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Total de Usuários */}
        <div className="bg-dark-200 rounded-lg p-4 md:p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Total de Usuários</p>
              {statsLoading ? (
                <div className="bg-dark-300 animate-pulse h-8 w-20 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">
                  {dashboardStats?.users?.total || 0}
                </p>
              )}
              <p className="text-xs mt-2 text-gray-400">Usuários registrados no sistema</p>
            </div>
            <div className="p-3 bg-blue-900/30 text-blue-400 rounded-lg">
              <FiUsers className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        </div>

        {/* Vendas do Dia */}
        <div className="bg-dark-200 rounded-lg p-4 md:p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Vendas do Dia</p>
              {statsLoading ? (
                <div className="bg-dark-300 animate-pulse h-8 w-28 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(dashboardStats?.orders?.revenue?.daily?.revenue || 0)}
                </p>
              )}
              <p className="text-xs mt-2 text-green-400 flex items-center">
                <FiTrendingUp className="mr-1" />
                {statsLoading ? '...' : `${dashboardStats?.orders?.revenue?.daily?.orders || 0} pedidos hoje`}
              </p>
            </div>
            <div className="p-3 bg-green-900/30 text-green-400 rounded-lg">
              <FiDollarSign className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        </div>

        {/* Faturamento Mensal */}
        <div className="bg-dark-200 rounded-lg p-4 md:p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Faturamento Mensal</p>
              {statsLoading ? (
                <div className="bg-dark-300 animate-pulse h-8 w-28 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(dashboardStats?.orders?.revenue?.monthly?.revenue || 0)}
                </p>
              )}
              <p className="text-xs mt-2 text-gray-400">
                <FiCalendar className="inline mr-1" />
                {statsLoading ? '...' : `${dashboardStats?.orders?.revenue?.monthly?.orders || 0} pedidos no mês`}
              </p>
            </div>
            <div className="p-3 bg-purple-900/30 text-purple-400 rounded-lg">
              <FiBarChart2 className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-dark-200 rounded-lg p-4 md:p-6 shadow-md">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm">Taxa de Conversão</p>
              {statsLoading ? (
                <div className="bg-dark-300 animate-pulse h-8 w-20 rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold mt-1">
                  {`${dashboardStats?.conversion?.rate || 0}%`}
                </p>
              )}
              <p className="text-xs mt-2 text-gray-400">
                <FiEye className="inline mr-1" />
                {statsLoading ? '...' : `${dashboardStats?.conversion?.visitors || 0} visitantes`}
              </p>
            </div>
            <div className="p-3 bg-yellow-900/30 text-yellow-400 rounded-lg">
              <FiPercent className="w-6 h-6 md:w-8 md:h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Resumo de faturamento */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Faturamento por período */}
        <div className="lg:col-span-2 bg-dark-200 rounded-lg shadow-md">
          <div className="p-4 md:p-6 border-b border-dark-300">
            <h3 className="text-lg font-bold">Resumo de Faturamento</h3>
          </div>
          <div className="p-4 md:p-6">
            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="bg-dark-300 animate-pulse h-4 w-20 rounded"></div>
                    <div className="bg-dark-300 animate-pulse h-4 w-24 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-dark-300 pb-4">
                  <div className="flex items-center">
                    <FiClock className="mr-2 text-blue-400" />
                    <span>Hoje</span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {formatCurrency(dashboardStats?.orders?.revenue?.daily?.revenue || 0)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({dashboardStats?.orders?.revenue?.daily?.orders || 0} pedidos)
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-b border-dark-300 pb-4">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 text-green-400" />
                    <span>Esta Semana</span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {formatCurrency(dashboardStats?.orders?.revenue?.weekly?.revenue || 0)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({dashboardStats?.orders?.revenue?.weekly?.orders || 0} pedidos)
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-b border-dark-300 pb-4">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 text-yellow-400" />
                    <span>Este Mês</span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {formatCurrency(dashboardStats?.orders?.revenue?.monthly?.revenue || 0)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({dashboardStats?.orders?.revenue?.monthly?.orders || 0} pedidos)
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 text-purple-400" />
                    <span>Este Ano</span>
                  </div>
                  <div>
                    <span className="font-medium">
                      {formatCurrency(dashboardStats?.orders?.revenue?.yearly?.revenue || 0)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      ({dashboardStats?.orders?.revenue?.yearly?.orders || 0} pedidos)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top Produtos */}
        <div className="lg:col-span-2 bg-dark-200 rounded-lg shadow-md">
          <div className="p-4 md:p-6 border-b border-dark-300 flex justify-between items-center">
            <h3 className="text-lg font-bold">Top Produtos</h3>
            <Link href="/admin/products" className="text-primary hover:underline text-sm">
              Ver todos
            </Link>
          </div>
          <div className="p-4 md:p-6">
            {statsLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-dark-300 animate-pulse rounded-lg"></div>
                    <div className="flex-1">
                      <div className="bg-dark-300 animate-pulse h-4 w-40 rounded mb-2"></div>
                      <div className="bg-dark-300 animate-pulse h-3 w-20 rounded"></div>
                    </div>
                    <div className="text-right">
                      <div className="bg-dark-300 animate-pulse h-4 w-20 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : dashboardStats?.products?.topSelling && dashboardStats.products.topSelling.length > 0 ? (
              <div className="space-y-6">
                {dashboardStats.products.topSelling.map((product: any) => (
                  <div key={product.id} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-dark-300 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.details?.images && product.details.images.length > 0 ? (
                        <Image
                          src={product.details.images[0]}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      ) : (
                        <FiBox className="text-primary" size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <Link href={`/admin/products/${product.id}`} className="font-medium text-white hover:text-primary">
                        {product.name}
                      </Link>
                      <div className="text-gray-400 text-sm">Vendidos: {product.sales}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Nenhum produto vendido ainda.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pedidos recentes */}
      <div className="bg-dark-200 rounded-lg shadow-md">
        <div className="p-4 md:p-6 border-b border-dark-300 flex justify-between items-center">
          <h3 className="text-lg font-bold">Pedidos Recentes</h3>
          <Link href="/admin/orders" className="text-primary hover:underline text-sm">
            Ver todos
          </Link>
        </div>
        <div className="p-4 md:p-6">
          {ordersLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : ordersError ? (
            <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 mb-4">
              <p className="font-medium">Erro ao carregar pedidos</p>
              <p>{ordersError}</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhum pedido encontrado.
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="pb-3 pl-4 md:pl-0 font-medium">ID</th>
                    <th className="pb-3 font-medium">Usuário</th>
                    <th className="pb-3 font-medium">Data</th>
                    <th className="pb-3 font-medium">Valor</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 pr-4 md:pr-0 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-300">
                  {recentOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-dark-300">
                      <td className="py-3 pr-4 pl-4 md:pl-0">
                        <span 
                          className="font-mono text-xs cursor-help" 
                          title={`ID completo: ${order._id}`}
                        >
                          #{order._id.substring(order._id.length - 8)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {order.user ? (
                          <>
                            <div className="font-medium">{order.user.username || 'Usuário'}</div>
                            <div className="text-sm text-gray-400">{order.user.email || 'Email não disponível'}</div>
                          </>
                        ) : (
                          <div className="text-gray-400">Usuário não disponível</div>
                        )}
                      </td>
                      <td className="py-3 pr-4">{formatDate(order.createdAt)}</td>
                      <td className="py-3 pr-4">{formatCurrency(order.totalAmount)}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium 
                            ${getStatusColor(order.paymentInfo?.status) === 'green' ? 'bg-green-900/30 text-green-400' : 
                            getStatusColor(order.paymentInfo?.status) === 'yellow' ? 'bg-yellow-900/30 text-yellow-400' : 
                            getStatusColor(order.paymentInfo?.status) === 'red' ? 'bg-red-900/30 text-red-400' : 
                            getStatusColor(order.paymentInfo?.status) === 'blue' ? 'bg-blue-900/30 text-blue-400' : 
                            'bg-gray-900/30 text-gray-400'}`}
                        >
                          {translateStatus(order.paymentInfo?.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 md:pr-0">
                        <Link 
                          href={`/admin/orders/${order._id}`} 
                          className="px-3 py-1 bg-primary/20 text-primary hover:bg-primary/30 transition-colors rounded-md text-sm"
                        >
                          Detalhes
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 