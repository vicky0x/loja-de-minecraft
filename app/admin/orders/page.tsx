'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  FiSearch, 
  FiFilter, 
  FiRefreshCw, 
  FiChevronLeft, 
  FiChevronRight,
  FiEye,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiPackage,
  FiClock,
  FiCheck,
  FiX
} from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import OrderDetailModal from '@/app/components/OrderDetailModal';
import OrderStatusBadge from '@/app/components/OrderStatusBadge';

// Polyfill para AbortSignal.timeout para navegadores que não suportam
if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
  AbortSignal.timeout = function timeout(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

// Interfaces TypeScript
interface User {
  _id: string;
  username: string;
  email: string;
}

interface Order {
  _id: string;
  user: User;
  items: any[];
  totalAmount: number;
  paymentInfo: {
    method: string;
    status: string;
  };
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Estados
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Estado para o modal de detalhes
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  
  // Estado para filtros
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  
  // Buscar pedidos com base nos filtros e paginação
  useEffect(() => {
    const page = searchParams.get('page') || '1';
    const statusParam = searchParams.get('status') || '';
    const searchParam = searchParams.get('search') || '';
    const startDateParam = searchParams.get('startDate') || '';
    const endDateParam = searchParams.get('endDate') || '';
    
    setStatus(statusParam);
    setSearchTerm(searchParam);
    setStartDate(startDateParam);
    setEndDate(endDateParam);
    
    fetchOrders(
      parseInt(page), 
      statusParam, 
      searchParam, 
      startDateParam, 
      endDateParam
    );
  }, [searchParams]);
  
  const fetchOrders = async (
    page = 1, 
    statusFilter = status, 
    search = searchTerm, 
    start = startDate, 
    end = endDate
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      if (start) params.append('startDate', start);
      if (end) params.append('endDate', end);
      
      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
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
      
      // Validar dados recebidos
      if (!data || !Array.isArray(data.orders)) {
        console.warn('Resposta da API não contém a lista de pedidos esperada', data);
        setOrders([]);
        setPagination({
          total: 0,
          page,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      } else {
        setOrders(data.orders || []);
        setPagination(data.pagination || {
          total: 0,
          page,
          limit: 10,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        });
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Navegar para outra página
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    
    router.push(`/admin/orders?${params.toString()}`);
  };
  
  // Aplicar filtros
  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    params.set('page', '1');
    
    if (status) params.set('status', status);
    if (searchTerm) params.set('search', searchTerm);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    
    router.push(`/admin/orders?${params.toString()}`);
    setShowFilters(false);
  };
  
  // Limpar filtros
  const handleClearFilters = () => {
    setStatus('');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    
    router.push('/admin/orders');
    setShowFilters(false);
  };
  
  // Função para formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };
  
  // Função para determinar a cor do status
  const getStatusColor = (status?: string) => {
    switch(status?.toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-green-500 text-green-100';
      case 'processing':
        return 'bg-blue-500 text-blue-100';
      case 'pending':
        return 'bg-yellow-500 text-yellow-100';
      case 'canceled':
        return 'bg-red-500 text-red-100';
      case 'expired':
        return 'bg-red-400 text-red-100';
      case 'fulfilled':
        return 'bg-purple-500 text-purple-100';
      default:
        return 'bg-gray-500 text-gray-100';
    }
  };
  
  // Função para traduzir o status
  const translateStatus = (status?: string) => {
    switch(status?.toLowerCase()) {
      case 'paid':
        return 'Pago';
      case 'completed':
        return 'Completo';
      case 'processing':
        return 'Processando';
      case 'pending':
        return 'Pendente';
      case 'canceled':
        return 'Cancelado';
      case 'expired':
        return 'Expirado';
      case 'fulfilled':
        return 'Entregue';
      default:
        return status || 'Desconhecido';
    }
  };
  
  // Renderização dos paginadores
  const renderPagination = () => {
    const { page, totalPages } = pagination;
    
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-between items-center mt-6 px-4">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={!pagination.hasPrevPage}
          className={`flex items-center px-3 py-1 rounded ${
            pagination.hasPrevPage 
              ? 'text-primary hover:bg-dark-300' 
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          <FiChevronLeft className="mr-1" />
          Anterior
        </button>
        
        <div className="text-center text-sm">
          Página {page} de {totalPages}
        </div>
        
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={!pagination.hasNextPage}
          className={`flex items-center px-3 py-1 rounded ${
            pagination.hasNextPage 
              ? 'text-primary hover:bg-dark-300' 
              : 'text-gray-600 cursor-not-allowed'
          }`}
        >
          Próximo
          <FiChevronRight className="ml-1" />
        </button>
      </div>
    );
  };
  
  // Função para abrir o modal de detalhes
  const openDetailModal = (orderId: string) => {
    // Reativando o modal simplificado
    setSelectedOrderId(orderId);
    setIsDetailModalOpen(true);
  };
  
  // Função para fechar o modal de detalhes
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    // Recarregar os pedidos para caso tenha ocorrido alguma atualização
    fetchOrders(pagination.page);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h1 className="text-2xl font-bold">Gerenciamento de Pedidos</h1>
        
        <div className="flex flex-col md:flex-row gap-2">
          {/* Barra de pesquisa */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar pedido ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-dark-200 w-full md:w-64 pl-10 pr-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          {/* Botões de ação */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-dark-200 hover:bg-dark-300 px-3 py-2 rounded-md flex items-center"
            >
              <FiFilter className="mr-2" />
              Filtros
            </button>
            <button
              onClick={() => fetchOrders(pagination.page)}
              className="bg-dark-200 hover:bg-dark-300 px-3 py-2 rounded-md flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Atualizar
            </button>
          </div>
        </div>
      </div>
      
      {/* Painel de filtros */}
      {showFilters && (
        <div className="bg-dark-200 rounded-lg p-4">
          <h3 className="font-semibold mb-4">Filtros avançados</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-dark-300 w-full px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Todos</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="failed">Falha</option>
                <option value="refunded">Reembolsado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-dark-300 w-full px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Data final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-dark-300 w-full px-3 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4 gap-2">
            <button
              onClick={handleClearFilters}
              className="bg-dark-300 hover:bg-dark-400 px-4 py-2 rounded-md"
            >
              Limpar
            </button>
            <button
              onClick={handleApplyFilters}
              className="bg-primary hover:bg-primary/90 px-4 py-2 rounded-md"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
      
      {/* Mensagem de erro */}
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
          <p className="font-semibold">Erro ao carregar pedidos</p>
          <p>{error}</p>
        </div>
      )}
      
      {/* Tabela de pedidos */}
      <div className="bg-dark-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 mb-2">Nenhum pedido encontrado</p>
            <p className="text-sm text-gray-500">Tente ajustar os filtros ou criar novos pedidos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-dark-300 text-gray-300 text-sm">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Data</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Valor</th>
                  <th className="px-4 py-3 font-semibold">Método</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-300">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-dark-300/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs">{order._id.substring(0, 8)}...</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiCalendar className="text-gray-400 mr-2" size={14} />
                        <span className="text-xs">{formatDate(order.createdAt)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{order.user?.username || 'Usuário não disponível'}</span>
                        <span className="text-gray-400 text-xs">{order.user?.email || 'Email não disponível'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiDollarSign className="text-gray-400 mr-1" size={14} />
                        <span className="font-medium">R$ {order.totalAmount.toFixed(2).replace(".", ",")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {order.paymentInfo?.method || 'Desconhecido'}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.paymentInfo?.status || order.orderStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <Link 
                          href={`/admin/orders/${order._id}`}
                          className="bg-primary/20 hover:bg-primary/30 text-primary p-2 rounded-full transition-colors"
                          title="Ver detalhes"
                        >
                          <FiEye size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Paginação */}
      {!loading && orders.length > 0 && renderPagination()}
      
      {/* Modal de detalhes (não será usado, pois redirecionamos para a página individual) */}
      {isDetailModalOpen && (
        <OrderDetailModal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          orderId={selectedOrderId}
        />
      )}
    </div>
  );
} 