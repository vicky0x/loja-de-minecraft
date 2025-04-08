'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiPackage,
  FiDollarSign,
  FiCalendar,
  FiCreditCard,
  FiCheck,
  FiX,
  FiClock,
  FiRefreshCw,
  FiAlertCircle,
  FiClipboard,
  FiDownload
} from 'react-icons/fi';
import Image from 'next/image';

interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image?: string | null;
  images?: string[];
  deliveryType?: string;
}

interface OrderItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    images: string[];
    deliveryType?: string;
  };
  variant?: {
    _id: string;
    name: string;
    deliveryType?: string;
  };
  price: number;
  name: string;
  delivered?: boolean;
  quantity: number;
}

interface Coupon {
  _id: string;
  code: string;
  discount: number;
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
    receiptUrl?: string;
    pixQrCode?: string;
    pixQrCodeBase64?: string;
    pixCopyPaste?: string;
    expirationDate?: string;
  };
  couponApplied?: Coupon;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
  productAssigned: boolean;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }
  }, [orderId]);

  // Verificar se o pagamento PIX expirou com base na data de expiração
  useEffect(() => {
    if (order && 
        order.paymentMethod === 'pix' && 
        order.paymentInfo.status === 'pending' && 
        order.paymentInfo.expirationDate) {
      
      const expirationDate = new Date(order.paymentInfo.expirationDate);
      const now = new Date();
      
      // Se a data de expiração já passou e o status ainda é pendente
      if (expirationDate < now) {
        console.log('PIX expirado, atualizando status do pedido localmente');
        
        // Atualizar o estado do pedido localmente
        setOrder({
          ...order,
          paymentInfo: {
            ...order.paymentInfo,
            status: 'expired'
          }
        });
        
        // Opcionalmente, pode-se fazer uma chamada para atualizar o status no servidor
        fetch('/api/payment/check-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: order._id,
            paymentId: order.paymentInfo.id
          })
        }).catch(err => console.error('Erro ao verificar expiração do PIX:', err));
      }
    }
  }, [order]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Iniciando busca de detalhes do pedido: ${orderId}`);
      
      const response = await fetch(`/api/user/orders/${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `Erro ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.error || `Erro ao carregar detalhes do pedido: ${response.status}`);
      }
      
      const data = await response.json().catch(() => {
        throw new Error('Erro ao processar resposta do servidor');
      });
      
      console.log('Dados do pedido recebidos:', data);
      
      // Verificar se temos a estrutura de dados esperada
      if (!data || !data.order) {
        throw new Error('Dados do pedido inválidos ou incompletos');
      }
      
      // Verificar se o pedido tem a estrutura esperada
      const orderData = data.order;
      
      // Garantir que orderItems exista e seja um array
      if (!orderData.orderItems || !Array.isArray(orderData.orderItems)) {
        console.warn('orderItems ausente ou não é um array. Adicionando array vazio.');
        orderData.orderItems = [];
      }
      
      // Garantir que paymentInfo exista
      if (!orderData.paymentInfo) {
        console.warn('paymentInfo ausente. Adicionando objeto vazio.');
        orderData.paymentInfo = {
          status: 'pending',
          method: orderData.paymentMethod || 'desconhecido'
        };
      }
      
      // Garantir valores padrão para campos essenciais e validar quantidade
      const processedOrder = {
        ...orderData,
        _id: orderData._id || orderId,
        totalAmount: orderData.totalAmount || 0,
        paymentMethod: orderData.paymentMethod || 'pix',
        discountAmount: orderData.discountAmount || 0,
        createdAt: orderData.createdAt || new Date().toISOString(),
        updatedAt: orderData.updatedAt || new Date().toISOString(),
        productAssigned: orderData.productAssigned || false,
        orderItems: orderData.orderItems.map((item: any) => {
          // Processar quantidade adequadamente
          let quantity = 1; // Valor padrão

          // Verificar se existe uma quantidade válida
          if (typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) {
            quantity = Math.floor(item.quantity);
          } else if (typeof item.quantity === 'string' && item.quantity.trim() !== '') {
            const parsedQuantity = parseInt(item.quantity.trim(), 10);
            if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
              quantity = parsedQuantity;
            }
          }

          console.log(`Processando item ${item._id || 'novo'}: quantidade original = ${item.quantity}, processada = ${quantity}`);

          return {
            _id: item._id || '',
            name: item.name || 'Produto',
            variant: item.variant || '',
            price: item.price || 0,
            product: item.product || {
              _id: '',
              name: item.name || 'Produto',
              price: item.price || 0,
              description: '',
              image: null,
              deliveryType: item.product?.deliveryType,
              images: item.product?.images || []
            },
            delivered: item.delivered,
            quantity: quantity // Usar a quantidade processada
          };
        })
      };
      
      setOrder(processedOrder);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return 'Data inválida';
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
      case 'expired':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400">
            <FiX className="mr-1" />
            Expirado
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

  const checkPaymentStatus = async () => {
    if (!order) return;
    
    try {
      setLoading(true);
      
      // Fazer a chamada para verificar o status do pagamento
      const response = await fetch('/api/payment/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order._id,
          paymentId: order.paymentInfo.id
        })
      });
      
      const result = await response.json();
      console.log('Verificação de status:', result);
      
      if (result.isPaid) {
        // Se o pagamento foi confirmado, atualizar os dados do pedido
        fetchOrderDetails(order._id);
      } else {
        // Se ainda estiver aguardando, apenas atualizar o loading state
        setLoading(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/orders" className="text-primary hover:text-primary/80 flex items-center">
            <FiArrowLeft className="mr-1" />
            Voltar para Pedidos
          </Link>
        </div>
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
          <p className="font-medium">Erro</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard/orders" className="text-primary hover:text-primary/80 flex items-center">
            <FiArrowLeft className="mr-1" />
            Voltar para Pedidos
          </Link>
        </div>
        <div className="bg-dark-200 rounded-lg p-10 text-center">
          <p className="text-gray-400">Pedido não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Link href="/dashboard/orders" className="text-primary hover:text-primary/80 flex items-center">
              <FiArrowLeft className="mr-1" />
              Voltar para Pedidos
            </Link>
          </div>
          <h2 className="text-2xl font-bold mt-2">Detalhes do Pedido #{order._id.substring(order._id.length - 8)}</h2>
          <p className="text-sm text-gray-400 mt-1">
            ID Completo: <span className="font-mono">{order._id}</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 mr-2">Status:</span>
          {getStatusBadge(order.paymentInfo.status)}
        </div>
      </div>

      {/* Status do pagamento */}
      {order.paymentInfo.status === 'pending' && (
        <div className="bg-yellow-900/30 border-l-4 border-yellow-500 p-4 text-yellow-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="font-medium flex items-center"><FiAlertCircle className="mr-1" /> Aguardando pagamento</p>
            <p className="text-sm">Seu pedido está aguardando a confirmação do pagamento.</p>
          </div>
          <button 
            onClick={checkPaymentStatus} 
            className="bg-dark-300 hover:bg-dark-400 py-2 px-4 rounded flex items-center whitespace-nowrap"
          >
            <FiRefreshCw className="mr-2" />
            Verificar Status
          </button>
        </div>
      )}

      {/* Status do pagamento expirado */}
      {order.paymentInfo.status === 'expired' && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <p className="font-medium flex items-center"><FiAlertCircle className="mr-1" /> Pagamento expirado</p>
            <p className="text-sm">O prazo para pagamento deste pedido expirou. Por favor, crie um novo pedido.</p>
          </div>
          <Link
            href="/cart"
            className="bg-dark-300 hover:bg-dark-400 py-2 px-4 rounded flex items-center whitespace-nowrap"
          >
            <FiArrowLeft className="mr-2" />
            Ir para o Carrinho
          </Link>
        </div>
      )}

      {/* Grid de informações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Gerais */}
        <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-dark-300">
            <h3 className="text-lg font-semibold">Informações do Pedido</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <FiClipboard className="text-primary mt-1" />
              <div>
                <p className="text-gray-400 text-sm">ID do Pedido</p>
                <p className="font-medium font-mono">{order._id}</p>
                <p className="text-xs text-gray-500 mt-1">Na lista de pedidos, mostramos apenas os últimos 8 caracteres para facilitar a visualização.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCalendar className="text-primary mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Data do Pedido</p>
                <p className="font-medium">{formatDate(order.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiCreditCard className="text-primary mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Método de Pagamento</p>
                <p className="font-medium flex items-center space-x-2">
                  <span>{order.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito'}</span>
                  {getPaymentMethodBadge(order.paymentMethod)}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiDollarSign className="text-primary mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Valor Total</p>
                <p className="font-medium">R$ {order.totalAmount.toFixed(2)}</p>
                {order.discountAmount > 0 && (
                  <p className="text-xs text-green-400">Desconto: R$ {order.discountAmount.toFixed(2)}</p>
                )}
                {order.couponApplied && (
                  <p className="text-xs text-primary">Cupom: {order.couponApplied.code} ({order.couponApplied.discount}%)</p>
                )}
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <FiPackage className="text-primary mt-1" />
              <div>
                <p className="text-gray-400 text-sm">Produtos</p>
                <p className="font-medium">{order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'itens'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações de Pagamento */}
        <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-dark-300">
            <h3 className="text-lg font-semibold">Detalhes do Pagamento</h3>
          </div>
          <div className="p-6">
            {/* Exibir QR Code PIX para pagamentos pendentes */}
            {order.paymentMethod === 'pix' && 
             order.paymentInfo.status === 'pending' && 
             order.paymentInfo.pixQrCodeBase64 && (
              <div className="mb-6">
                <h4 className="font-medium mb-4">QR Code PIX</h4>
                <div className="flex flex-col items-center">
                  <div className="bg-white p-4 rounded-lg mb-4">
                    <img 
                      src={`data:image/png;base64,${order.paymentInfo.pixQrCodeBase64}`} 
                      alt="QR Code PIX" 
                      className="w-48 h-48"
                    />
                  </div>
                  {order.paymentInfo.pixCopyPaste && (
                    <div className="w-full">
                      <p className="text-gray-400 text-sm mb-1">Código PIX Copia e Cola:</p>
                      <div className="flex">
                        <input
                          type="text"
                          value={order.paymentInfo.pixCopyPaste}
                          readOnly
                          className="bg-dark-300 border border-dark-400 rounded-l-md p-2 flex-1 text-sm font-mono"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.paymentInfo.pixCopyPaste || '');
                            alert('Código PIX copiado!');
                          }}
                          className="bg-primary px-4 rounded-r-md"
                        >
                          Copiar
                        </button>
                      </div>
                    </div>
                  )}
                  {order.paymentInfo.expirationDate && (
                    <div className="mt-4 p-3 bg-dark-300 rounded-lg text-center">
                      <p className="text-sm text-gray-400">
                        Válido até: {formatDate(order.paymentInfo.expirationDate)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mostrar instruções e status */}
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-2">Status do Pagamento</p>
                <div className="p-4 bg-dark-300 rounded-lg">
                  {getStatusBadge(order.paymentInfo.status)}
                  <p className="mt-2 text-sm text-gray-400">
                    {order.paymentInfo.status === 'paid' && 'Seu pagamento foi confirmado. Obrigado pela compra!'}
                    {order.paymentInfo.status === 'pending' && 'Seu pagamento está sendo processado. Aguarde a confirmação.'}
                    {order.paymentInfo.status === 'expired' && 'O prazo para pagamento expirou. Por favor, faça um novo pedido.'}
                    {order.paymentInfo.status === 'failed' && 'Houve um problema com seu pagamento. Por favor, entre em contato com o suporte.'}
                    {order.paymentInfo.status === 'refunded' && 'Seu pagamento foi reembolsado.'}
                  </p>
                </div>
              </div>

              {/* Link para recibo */}
              {order.paymentInfo.receiptUrl && (
                <div>
                  <p className="font-medium mb-2">Comprovante de Pagamento</p>
                  <a
                    href={order.paymentInfo.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary/80 rounded-md"
                  >
                    <FiDownload className="mr-2" />
                    Baixar Comprovante
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Produtos */}
      <div className="py-4">
        <h3 className="text-lg font-semibold mb-4 text-white">Produtos</h3>
        
        {/* NOVO: Aviso de Entrega Manual */}
        {order.orderItems.some(item => 
          item.product?.deliveryType === 'manual' || 
          item.variant?.deliveryType === 'manual'
        ) && (
          <div className="mb-6 bg-amber-900/30 border border-amber-500/30 rounded-xl p-4 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-amber-500/20 p-2 rounded-full mr-3">
                <FiClock className="text-amber-400 text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-amber-400 font-semibold text-lg mb-1">Entrega Manual</h3>
                <p className="text-white text-sm leading-relaxed">
                  Este pedido possui produtos com <strong>entrega manual</strong> e será entregue em até <strong>24 horas</strong> após a confirmação do pagamento.
                </p>
                <p className="text-white/80 text-sm mt-2">
                  Nossa equipe trabalha para fazer a entrega em <strong>poucos minutos</strong>. Fique tranquilo, não é necessário entrar em contato com o suporte para solicitar informações sobre a entrega.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          {order.orderItems.map((item: OrderItem) => (
            <div 
              key={item._id} 
              className="bg-dark-300 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-dark-400"
            >
              <div className="flex items-center gap-3">
                {/* Imagem do produto */}
                <div className="h-16 w-16 rounded overflow-hidden bg-dark-400 flex-shrink-0">
                  {item.product ? (
                    <img
                      src={
                        item.product.images && item.product.images.length > 0
                          ? item.product.images[0]
                          : item.product.image || '/placeholder-image.jpg'
                      }
                      alt={item.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        console.log('Erro ao carregar imagem:', e);
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        (e.target as HTMLImageElement).onerror = null; // Prevenir loop infinito
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <FiPackage size={24} className="text-gray-500" />
                    </div>
                  )}
                </div>
                
                {/* Nome e preço */}
                <div>
                  <h4 className="font-medium text-white">{item.name}</h4>
                  <p className="text-primary">R$ {item.price.toFixed(2)}</p>
                  
                  {/* Tipo de entrega e status */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {/* Destacar a quantidade do produto com estilo melhorado */}
                    <span className="px-2 py-1 bg-dark-400 text-white text-xs font-medium rounded-full flex items-center">
                      <span className="mr-1">Quantidade:</span> 
                      <span className="font-bold text-primary">{item.quantity}</span>
                    </span>
                    
                    {/* Tipo de entrega */}
                    {typeof item.product?.deliveryType === 'string' ? (
                      item.product.deliveryType === 'automatic' ? (
                        <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                          Entrega Automática
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-amber-600/20 text-amber-400 text-xs rounded-full">
                          Entrega Manual
                        </span>
                      )
                    ) : (
                      <span className="px-2 py-1 bg-blue-600/20 text-blue-400 text-xs rounded-full">
                        Entrega Automática
                      </span>
                    )}
                    
                    {/* Status de entrega (somente para entrega manual) */}
                    {typeof item.product?.deliveryType === 'string' && item.product.deliveryType === 'manual' && (
                      item.delivered ? (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                          Entregue
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full">
                          Aguardando Entrega
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Link para suporte */}
      <div className="bg-dark-200 rounded-lg p-6 text-center">
        <p className="text-gray-400 mb-3">Precisa de ajuda com seu pedido?</p>
        <Link href="/dashboard/support" className="text-primary hover:text-primary/80 inline-flex items-center">
          <FiAlertCircle className="mr-1" />
          Contatar o Suporte
        </Link>
      </div>
    </div>
  );
} 