'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiDownload, FiCreditCard, FiShoppingBag, FiHelpCircle, FiPackage, FiEye, FiChevronRight } from 'react-icons/fi';

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

  useEffect(() => {
    // Carregar estatísticas
    fetchStats();
    
    // Carregar produtos atribuídos ao usuário
    fetchUserProducts();
    
    // Carregar pedidos recentes
    fetchRecentOrders();
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
      
      const response = await fetch('/api/user/orders?limit=3');
      
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

  // Função para obter badge de status do pedido
  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-900/30 text-green-400">
            Pago
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-900/30 text-yellow-400">
            Pendente
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-900/30 text-red-400">
            Falha
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-900/30 text-blue-400">
            Reembolsado
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-700 text-gray-400">
            {status || 'Desconhecido'}
          </span>
        );
    }
  };

  const StatCard = ({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) => (
    <div className="bg-dark-200 rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${color} text-white mr-4`}>
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{value}</h3>
          <p className="text-gray-400">{title}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Bem-vindo à sua Área de Cliente</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Compras"
          value={stats.purchases}
          icon={<FiShoppingBag className="h-6 w-6" />}
          color="bg-primary"
        />
        <StatCard
          title="Downloads"
          value={stats.downloads}
          icon={<FiDownload className="h-6 w-6" />}
          color="bg-primary"
        />
        <StatCard
          title="Assinaturas Ativas"
          value={stats.activeSubscriptions}
          icon={<FiCreditCard className="h-6 w-6" />}
          color="bg-primary"
        />
        <StatCard
          title="Tickets de Suporte"
          value={stats.tickets}
          icon={<FiHelpCircle className="h-6 w-6" />}
          color="bg-primary"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Produtos do usuário */}
        <div className="lg:col-span-2 bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-white flex items-center">
            <FiPackage className="mr-2" />
            Meus Produtos
          </h3>
          
          {error && (
            <div className="bg-red-900/30 border-l-4 border-red-500 p-3 text-red-400 mb-4">
              {error}
            </div>
          )}
          
          {productsLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {userProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-dark-400">
                    <thead className="bg-dark-300">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Produto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Variante
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Data de Aquisição
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-dark-300 divide-y divide-dark-400">
                      {userProducts.map((product) => (
                        <tr key={product._id} className="hover:bg-dark-400">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-white">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-300">{product.variant?.name || 'Padrão'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {product.status ? (
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                product.status === 'Ativo' 
                                  ? 'bg-green-900/30 text-green-400' 
                                  : product.status === 'Em Manutenção'
                                    ? 'bg-yellow-900/30 text-yellow-400'
                                    : product.status === 'Beta'
                                      ? 'bg-blue-900/30 text-blue-400'
                                      : 'bg-red-900/30 text-red-400'
                              }`}>
                                {product.status}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {formatDate(product.assignedAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm flex space-x-3">
                            <Link 
                              href={`/dashboard/downloads?product=${product._id}`} 
                              className="text-primary hover:text-primary/80 flex items-center"
                            >
                              <FiDownload className="mr-1" />
                              <span>Download</span>
                            </Link>
                            <Link 
                              href={`/dashboard/products/${product._id}`} 
                              className="text-blue-400 hover:text-blue-300 flex items-center"
                            >
                              <FiEye className="mr-1" />
                              <span>Detalhes</span>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 bg-dark-300 rounded-md text-center">
                  <p className="text-gray-400">Você ainda não possui produtos.</p>
                  <Link href="/products" className="inline-block mt-2 text-primary hover:text-primary/80">
                    Explorar produtos
                  </Link>
                </div>
              )}
            </>
          )}
          
          {userProducts.length > 0 && (
            <div className="mt-4 text-right">
              <Link 
                href="/dashboard/products" 
                className="text-primary hover:text-primary/80 inline-flex items-center"
              >
                <span>Ver todos os produtos</span>
                <FiChevronRight className="ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Pedidos recentes */}
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-white flex items-center">
            <FiShoppingBag className="mr-2" />
            Pedidos Recentes
          </h3>
          
          {ordersLoading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="bg-dark-300 p-4 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-white">
                            <span 
                              className="cursor-help" 
                              title={`ID completo: ${order._id}`}
                            >
                              Pedido #{order._id.substring(order._id.length - 8)}
                            </span>
                          </p>
                          <p className="text-sm text-gray-400">{formatDate(order.createdAt)}</p>
                        </div>
                        {getOrderStatusBadge(order.paymentInfo.status)}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-400">
                          {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'itens'} - 
                          R$ {order.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-3 flex justify-end">
                        <Link 
                          href={`/dashboard/orders/${order._id}`} 
                          className="text-primary hover:text-primary/80 text-sm flex items-center"
                        >
                          <span>Ver detalhes</span>
                          <FiChevronRight className="ml-1" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-dark-300 rounded-md text-center">
                  <p className="text-gray-400">Você ainda não realizou pedidos.</p>
                  <Link href="/products" className="inline-block mt-2 text-primary hover:text-primary/80">
                    Explorar produtos
                  </Link>
                </div>
              )}
            </>
          )}
          
          {recentOrders.length > 0 && (
            <div className="mt-4 text-right">
              <Link 
                href="/dashboard/orders" 
                className="text-primary hover:text-primary/80 inline-flex items-center"
              >
                <span>Ver todos os pedidos</span>
                <FiChevronRight className="ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Links Rápidos</h3>
          <div className="space-y-3">
            <Link href="/dashboard/downloads" className="flex items-center text-gray-300 hover:text-primary">
              <FiDownload className="h-5 w-5 mr-2" />
              <span>Acessar meus downloads</span>
            </Link>
            <Link href="/dashboard/profile" className="flex items-center text-gray-300 hover:text-primary">
              <FiShoppingBag className="h-5 w-5 mr-2" />
              <span>Atualizar perfil</span>
            </Link>
            <Link href="/dashboard/support" className="flex items-center text-gray-300 hover:text-primary">
              <FiHelpCircle className="h-5 w-5 mr-2" />
              <span>Suporte técnico</span>
            </Link>
          </div>
        </div>
        
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Avisos</h3>
          <div className="p-4 bg-dark-300 border border-primary/20 text-gray-300 rounded-md">
            <p className="font-medium text-primary">Bem-vindo ao Fantasy Cheats!</p>
            <p className="mt-1 text-sm text-gray-300">
              Obrigado por se juntar a nós. Descubra os melhores cheats para seus jogos favoritos.
              Se precisar de ajuda, nossa equipe de suporte está disponível 24/7.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 