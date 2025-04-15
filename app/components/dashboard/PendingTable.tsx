import React from 'react';
import { FiClock, FiCheckCircle, FiAlertCircle, FiArrowRight, FiShoppingBag } from 'react-icons/fi';
import Link from 'next/link';

// Interface para pedidos
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

// Props do componente
interface PendingTableProps {
  orders: Order[];
  isLoading?: boolean;
}

export const PendingTable: React.FC<PendingTableProps> = ({ 
  orders = [], 
  isLoading = false 
}) => {
  // Formatação de valores monetários
  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Formatação de datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data indisponível';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  // Formatar ID de pedido para exibição
  const formatOrderId = (order: Order) => {
    if (order.orderId) {
      return `Pedido #${order.orderId.substring(0, 8)}`;
    } else if (order._id) {
      return `Pedido #${order._id.substring(0, 8)}`;
    } else if (order.createdAt) {
      // Usar a data como identificador alternativo se não tiver ID
      try {
        const date = new Date(order.createdAt);
        const timestamp = date.getTime().toString().substring(0, 8);
        return `Pedido #${timestamp}`;
      } catch (e) {
        return 'Pedido Processado';
      }
    } else {
      return 'Pedido Processado';
    }
  };
  
  // Renderizar status com ícone apropriado
  const getStatusBadge = (order: Order) => {
    const status = order.status || order.paymentInfo?.status || 'unknown';
    
    switch (status) {
      case 'completed':
      case 'paid':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400">
            <FiCheckCircle className="mr-1" /> Concluído
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-900/30 text-yellow-400">
            <FiClock className="mr-1" /> Pendente
          </span>
        );
      case 'cancelled':
      case 'failed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-900/30 text-red-400">
            <FiAlertCircle className="mr-1" /> Cancelado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-900/30 text-green-400">
            <FiCheckCircle className="mr-1" /> Concluído
          </span>
        );
    }
  };
  
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="bg-dark-200 rounded-lg p-4 space-y-3 animate-pulse">
        {[1, 2, 3].map(n => (
          <div key={n} className="h-16 bg-dark-300/50 rounded-md"></div>
        ))}
      </div>
    );
  }
  
  // Se não tiver pedidos
  if (!orders || orders.length === 0) {
    return (
      <div className="bg-dark-200 rounded-lg p-6 text-center">
        <FiShoppingBag className="mx-auto text-3xl mb-2 text-primary/50" />
        <p className="text-gray-400">Você ainda não fez nenhum pedido</p>
      </div>
    );
  }
  
  return (
    <div className="bg-dark-200 rounded-lg shadow">
      <div className="p-4 border-b border-dark-300">
        <h3 className="font-medium">Meus Pedidos</h3>
      </div>
      <div className="divide-y divide-dark-300">
        {orders.map((order, index) => (
          <div key={order._id || order.orderId || index} className="p-4 hover:bg-dark-300/30 transition-colors">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center space-x-1 text-sm">
                  <span 
                    className="text-gray-300"
                    title="ID abreviado. Veja o ID completo na página de detalhes."
                  >
                    {formatOrderId(order)}
                  </span>
                  <span className="text-gray-500 text-xs ml-1">(ID resumido)</span>
                </div>
                <div className="mt-1">
                  {getStatusBadge(order)}
                </div>
                <div className="mt-1 text-sm text-gray-400">
                  {formatDate(order.createdAt)}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="font-medium">
                  {formatCurrency(order.totalAmount || 0)}
                </div>
                <Link 
                  href={`/dashboard/orders/${order._id || order.orderId || 'details'}`}
                  className="mt-2 text-primary hover:text-primary/80 inline-flex items-center text-xs"
                >
                  Detalhes <FiArrowRight className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingTable; 