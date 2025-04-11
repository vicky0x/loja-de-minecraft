'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiArrowLeft, FiShoppingBag, FiClock, FiCheckCircle, FiAlertCircle, FiXCircle, FiArrowRight, FiEye } from 'react-icons/fi';
import PixPaymentModal from '../components/PixPaymentModal';

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
    images: string[];
  };
  variant: string;
  price: number;
  name: string;
}

interface Order {
  _id: string;
  orderItems: OrderItem[];
  totalAmount: number;
  paymentMethod: 'pix' | 'credit_card';
  paymentInfo: {
    id?: string;
    status: 'pending' | 'paid' | 'failed' | 'refunded';
    method: string;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
    expirationDate?: string;
  };
  couponApplied?: string;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(15000)
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
      
      if (!data || !Array.isArray(data.orders)) {
        console.warn('Resposta da API não contém a lista de pedidos esperada', data);
        setOrders([]);
      } else {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!selectedOrder) return { isPaid: false };
    
    try {
      const response = await fetch('/api/payment/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder._id,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao verificar status do pagamento');
      }
      
      const data = await response.json();
      
      if (data.isPaid && selectedOrder) {
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order._id === selectedOrder._id 
              ? { 
                  ...order, 
                  paymentInfo: { 
                    ...order.paymentInfo, 
                    status: 'paid' 
                  } 
                } 
              : order
          )
        );
      }
      
      return data;
    } catch (err) {
      console.error('Erro ao verificar status:', err);
      return { isPaid: false };
    }
  };

  const handleViewPixPayment = (order: Order) => {
    if (order.paymentMethod !== 'pix' || !order.paymentInfo.pixQrCode) {
      return;
    }
    
    setSelectedOrder(order);
    setIsPixModalOpen(true);
  };

  const closePixModal = () => {
    setIsPixModalOpen(false);
    setSelectedOrder(null);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (err) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400 border border-green-800/30">
            <FiCheckCircle className="inline mr-1" />
            Pago
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-900/30 text-yellow-400 border border-yellow-800/30">
            <FiClock className="inline mr-1" />
            Pendente
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-900/30 text-red-400 border border-red-800/30">
            <FiXCircle className="inline mr-1" />
            Falhou
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/30">
            <FiArrowLeft className="inline mr-1" />
            Reembolsado
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-900/30 text-gray-400 border border-gray-800/30">
            <FiAlertCircle className="inline mr-1" />
            Desconhecido
          </span>
        );
    }
  };

  const renderLoading = () => (
    <div className="flex justify-center items-center h-64">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-400">Carregando seus pedidos...</p>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-900/30 border-l-4 border-red-500 p-4 my-4">
      <div className="flex items-start">
        <FiAlertCircle className="text-red-500 mt-1 mr-3" />
        <div>
          <p className="text-red-400 font-medium">Erro ao carregar pedidos</p>
          <p className="text-red-300">{error}</p>
          <button 
            onClick={fetchOrders}
            className="mt-2 text-red-400 hover:text-red-300 flex items-center"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );

  const renderEmptyState = () => (
    <div className="text-center py-12 border border-dashed border-dark-400 rounded-md">
      <FiShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">Nenhum pedido encontrado</h3>
      <p className="text-gray-400 mb-6">Você ainda não fez nenhum pedido.</p>
      <Link 
        href="/products" 
        className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md"
      >
        Ver produtos disponíveis
        <FiArrowRight className="ml-2" />
      </Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Meus Pedidos</h1>
        <Link 
          href="/account" 
          className="text-gray-400 hover:text-white flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Minha Conta
        </Link>
      </div>

      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : orders.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-dark-200 rounded-lg overflow-hidden shadow-md">
              <div className="px-6 py-4 border-b border-dark-300 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <div className="flex items-center mb-2">
                    <span className="text-sm text-gray-400 mr-2">Pedido:</span>
                    <span className="text-white font-medium">{order._id}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                <div className="mt-3 sm:mt-0 flex items-center">
                  {getStatusBadge(order.paymentInfo.status)}
                  {order.paymentMethod === 'pix' && 
                   order.paymentInfo.status === 'pending' && 
                   order.paymentInfo.pixQrCode && (
                    <button
                      onClick={() => handleViewPixPayment(order)}
                      className="ml-3 px-3 py-1 text-xs bg-primary hover:bg-primary/90 text-white rounded-md flex items-center"
                    >
                      <FiEye className="mr-1" /> Ver Pagamento
                    </button>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4">
                <h3 className="text-md font-medium text-white mb-3">Itens do pedido</h3>
                <div className="space-y-3">
                  {order.orderItems.map((item) => (
                    <div 
                      key={item._id} 
                      className="flex items-center p-3 bg-dark-300 rounded-md"
                    >
                      <div className="text-white">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-gray-400">{item.variant}</div>
                      </div>
                      <div className="ml-auto font-medium text-white">
                        R$ {item.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-dark-300">
                <div className="flex justify-between items-center">
                  <div className="text-gray-400">Método de pagamento</div>
                  <div className="text-white">
                    {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão de crédito'}
                  </div>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-gray-400">Desconto aplicado</div>
                    <div className="text-green-400">-R$ {order.discountAmount.toFixed(2)}</div>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div className="text-gray-400">Total</div>
                  <div className="text-white font-bold">R$ {order.totalAmount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedOrder && (
        <PixPaymentModal
          isOpen={isPixModalOpen}
          onClose={closePixModal}
          paymentData={selectedOrder ? {
            paymentId: selectedOrder.paymentInfo.id || '',
            qrCode: selectedOrder.paymentInfo.pixQrCode || '',
            qrCodeBase64: selectedOrder.paymentInfo.pixQrCodeBase64 || '',
            expirationDate: selectedOrder.paymentInfo.expirationDate || '',
            orderId: selectedOrder._id
          } : null}
          onCheckStatus={checkPaymentStatus}
        />
      )}
    </div>
  );
} 