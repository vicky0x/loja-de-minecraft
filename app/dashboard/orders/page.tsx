'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FiShoppingBag, 
  FiChevronLeft, 
  FiChevronRight, 
  FiEye,
  FiCheck,
  FiX,
  FiClock,
  FiRefreshCw,
  FiAlertCircle
} from 'react-icons/fi';
import OrderStatusBadge from '@/app/components/OrderStatusBadge';

// Polyfill para AbortSignal.timeout para navegadores que não suportam
if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
  AbortSignal.timeout = function timeout(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image?: string | null;
  };
  price: number;
  name: string;
}

interface Order {
  _id: string;
  orderItems: OrderItem[];
  totalAmount: number;
  paymentMethod: 'pix' | 'credit_card';
  paymentStatus?: string;
  orderStatus?: string;
  paymentInfo: {
    id?: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded' | 'expired' | 'canceled';
    method: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let queryParams = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString()
      });
      
      const response = await fetch(`/api/user/orders?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Importante: Rejeitar requisições de rede com timeout
        signal: AbortSignal.timeout(15000) // 15 segundos de timeout
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          error: `Erro ${response.status}: ${response.statusText || 'Erro desconhecido'}`
        }));
        throw new Error(errorData.error || 'Erro ao carregar pedidos');
      }
      
      const data = await response.json().catch(() => {
        throw new Error('Erro ao processar resposta do servidor');
      });
      
      console.log("Dados recebidos da API:", data);
      
      // Validar dados recebidos
      if (!data || !Array.isArray(data.orders)) {
        console.warn('Resposta da API não contém a lista de pedidos esperada', data);
        setOrders([]);
        setPagination({
          total: 0,
          totalPages: 0,
          currentPage: 1,
          itemsPerPage: 10
        });
      } else {
        setOrders(data.orders || []);
        setPagination(data.pagination || {
          total: 0,
          totalPages: 0,
          currentPage: 1,
          itemsPerPage: 10
        });
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
            <FiCheck className="mr-1" />
            Pago
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400">
            <FiClock className="mr-1" />
            Pendente
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400">
            <FiX className="mr-1" />
            Falha
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
            <FiRefreshCw className="mr-1" />
            Reembolsado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
            <FiAlertCircle className="mr-1" />
            {status || 'Desconhecido'}
          </span>
        );
    }
  };

  const getPaymentMethodBadge = (method: string) => {
    switch (method?.toLowerCase() || '') {
      case 'pix':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/30 text-indigo-400">
            PIX
          </span>
        );
      case 'credit_card':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/30 text-purple-400">
            Cartão
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-700 text-gray-400">
            {method || 'Outro'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meus Pedidos</h2>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 px-3 py-2 bg-dark-300 hover:bg-dark-400 rounded-md"
        >
          <FiRefreshCw />
          <span>Atualizar</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
          <p className="font-medium">Erro</p>
          <p>{error}</p>
        </div>
      )}

      {/* Tabela de Pedidos */}
      <div className="bg-dark-200 rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b border-dark-300">
          <div className="flex items-center space-x-3">
            <FiShoppingBag className="text-primary text-xl" />
            <h3 className="text-lg font-semibold">Histórico de Pedidos</h3>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Todos os seus pedidos e transações
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-gray-400">Você ainda não realizou nenhum pedido</p>
            <Link href="/products" className="text-primary hover:text-primary/80 inline-block mt-2">
              Ver produtos disponíveis
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-300">
              <thead className="bg-dark-300">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Valor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-200 divide-y divide-dark-300">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-dark-300">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {order._id.substring(order._id.length - 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white">
                        {(order.orderItems || []).map((item, index) => (
                          <div key={item._id} className={index > 0 ? 'mt-1' : ''}>
                            {item.product?.name || item.name || 'Produto'}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-gray-400">
                        {(order.orderItems || []).length} {(order.orderItems || []).length === 1 ? 'item' : 'itens'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(order.totalAmount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <OrderStatusBadge 
                        status={order.paymentStatus || order.paymentInfo?.status} 
                        size="sm" 
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      <Link 
                        href={`/dashboard/orders/${order._id}`}
                        className="flex items-center text-primary hover:text-white"
                      >
                        <FiEye className="mr-1" />
                        Detalhes
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!loading && orders.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-dark-300">
            <div className="text-sm text-gray-400">
              Mostrando {Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.total)} a{' '}
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.total)} de {pagination.total} resultados
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage <= 1}
                className={`p-2 rounded-md ${
                  pagination.currentPage <= 1
                    ? 'bg-dark-300 text-gray-600 cursor-not-allowed'
                    : 'bg-dark-300 text-gray-400 hover:bg-dark-400'
                }`}
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, i) => {
                const pageNum = getPageNumber(i, pagination.currentPage, pagination.totalPages);
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNum }))}
                    className={`w-8 h-8 rounded-md ${
                      pagination.currentPage === pageNum
                        ? 'bg-primary text-white'
                        : 'bg-dark-300 text-gray-400 hover:bg-dark-400'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage >= pagination.totalPages}
                className={`p-2 rounded-md ${
                  pagination.currentPage >= pagination.totalPages
                    ? 'bg-dark-300 text-gray-600 cursor-not-allowed'
                    : 'bg-dark-300 text-gray-400 hover:bg-dark-400'
                }`}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Função auxiliar para calcular números da página na paginação
function getPageNumber(index: number, currentPage: number, totalPages: number): number {
  // Para 5 botões de página, tentar centralizar a página atual
  if (totalPages <= 5) {
    return index + 1;
  }
  
  // Se estamos nas primeiras páginas
  if (currentPage <= 3) {
    return index + 1;
  }
  
  // Se estamos nas últimas páginas
  if (currentPage >= totalPages - 2) {
    return totalPages - 4 + index;
  }
  
  // No meio
  return currentPage - 2 + index;
} 