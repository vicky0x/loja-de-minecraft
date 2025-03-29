'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FiArrowLeft, 
  FiCalendar, 
  FiCreditCard, 
  FiDollarSign, 
  FiUser,
  FiFileText,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiEdit,
  FiRefreshCw,
  FiSave
} from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos necessários
interface OrderItem {
  productId: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
  };
  variantId?: string;
  quantity: number;
  price: number;
  name: string;
}

interface User {
  _id: string;
  username: string;
  email: string;
  name?: string;
  cpf?: string;
  phone?: string;
}

interface StatusHistoryItem {
  status: string;
  changedBy: string;
  changedAt: string;
}

interface Note {
  content: string;
  addedBy: string;
  addedAt: string;
}

interface PaymentInfo {
  method: string;
  status: string;
  transactionId?: string;
  expirationDate?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  pixCopiaECola?: string;
}

interface CustomerData {
  firstName?: string;
  lastName?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  address?: string;
}

interface Order {
  _id: string;
  user: User;
  items: OrderItem[];
  totalAmount: number;
  paymentInfo: PaymentInfo;
  couponApplied?: {
    code: string;
    discount: number;
  };
  createdAt: string;
  updatedAt: string;
  statusHistory?: StatusHistoryItem[];
  notes?: Note[];
  productAssigned: boolean;
  customerData?: CustomerData;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [assigningProducts, setAssigningProducts] = useState(false);
  
  // Função para buscar detalhes do pedido
  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Buscando detalhes do pedido:', orderId);
      
      const response = await fetch(`/api/admin/orders/${orderId}`);
      
      // Tentar obter os dados mesmo se a resposta não for ok, para poder mostrar o erro
      const data = await response.json().catch(() => ({ error: 'Erro ao processar a resposta' }));
      console.log('Resposta da API:', data);
      
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Erro ao carregar detalhes do pedido');
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Dados retornados sem indicação de sucesso');
      }
      
      if (!data.order) {
        throw new Error('Dados do pedido não encontrados na resposta');
      }
      
      // Garantir que o objeto order possui todos os campos necessários
      const safeOrder = {
        _id: data.order._id || 'id-desconhecido',
        user: data.order.user || { 
          username: 'Usuário não encontrado', 
          email: 'email@desconhecido.com' 
        },
        items: Array.isArray(data.order.orderItems) ? data.order.orderItems : [],
        totalAmount: data.order.totalAmount || 0,
        paymentInfo: data.order.paymentInfo || { status: 'pending', method: 'desconhecido' },
        couponApplied: data.order.couponApplied,
        createdAt: data.order.createdAt,
        updatedAt: data.order.updatedAt,
        statusHistory: Array.isArray(data.order.statusHistory) ? data.order.statusHistory : [],
        notes: Array.isArray(data.order.notes) ? data.order.notes : [],
        productAssigned: !!data.order.productAssigned,
        customerData: data.order.customerData
      };
      
      setOrder(safeOrder);
      
      if (safeOrder.paymentInfo && safeOrder.paymentInfo.status) {
        setUpdateStatus(safeOrder.paymentInfo.status);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do pedido:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar detalhes do pedido');
    } finally {
      setLoading(false);
    }
  };
  
  // Buscar detalhes do pedido
  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);
  
  // Função para formatar datas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Data não disponível';
    
    try {
      return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (error) {
      return dateString;
    }
  };
  
  // Função para traduzir método de pagamento
  const translatePaymentMethod = (method?: string) => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'credit_card':
        return 'Cartão de Crédito';
      case 'billet':
        return 'Boleto Bancário';
      case 'crypto':
        return 'Criptomoeda';
      default:
        return method || 'Desconhecido';
    }
  };
  
  // Função para obter a cor do status
  const getStatusColor = (status?: string) => {
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
  const translateStatus = (status?: string) => {
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
  
  // Função para atualizar o status do pedido
  const handleUpdateOrder = async () => {
    if (!order) return;
    
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      
      const updateData = {
        status: updateStatus,
        notes: adminNote.trim() ? adminNote : undefined
      };
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Erro ao atualizar pedido');
      }
      
      setSaveSuccess(true);
      
      // Recarregar detalhes do pedido após atualização
      await fetchOrderDetails();
      
      // Limpar nota após salvar
      setAdminNote('');
      
      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      setSaveError(error instanceof Error ? error.message : 'Erro ao atualizar pedido');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Função para aprovar pagamento manualmente
  const handleApprovePayment = async () => {
    if (!order) return;
    
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(false);
      setAssigningProducts(true);
      
      const updateData = {
        status: 'paid',
        notes: 'Pagamento aprovado manualmente por administrador'
      };
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || 'Erro ao aprovar pagamento');
      }
      
      setSaveSuccess(true);
      
      // Recarregar detalhes do pedido após atualização
      await fetchOrderDetails();
      
      // Esconder mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao aprovar pagamento:', error);
      setSaveError(error instanceof Error ? error.message : 'Erro ao aprovar pagamento');
    } finally {
      setIsSaving(false);
      setAssigningProducts(false);
    }
  };
  
  // Renderização condicional de loading
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Renderização condicional de erro
  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Detalhes do Pedido</h2>
          <Link 
            href="/admin/orders" 
            className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Voltar para Pedidos
          </Link>
        </div>
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Erro ao carregar detalhes do pedido</p>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Detalhes do Pedido</h2>
          <Link 
            href="/admin/orders" 
            className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Voltar para Pedidos
          </Link>
        </div>
        <div className="bg-dark-200 rounded-lg p-6 text-center">
          <p className="text-gray-400">Pedido não encontrado</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-white">Pedido #{order._id.substring(0, 8)}</h2>
            <span 
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                getStatusColor(order.paymentInfo.status) === 'green' 
                  ? 'bg-green-900/30 text-green-400' 
                  : getStatusColor(order.paymentInfo.status) === 'yellow'
                  ? 'bg-yellow-900/30 text-yellow-400'
                  : getStatusColor(order.paymentInfo.status) === 'red'
                  ? 'bg-red-900/30 text-red-400'
                  : 'bg-blue-900/30 text-blue-400'
              }`}
            >
              {translateStatus(order.paymentInfo.status)}
            </span>
          </div>
          <p className="text-gray-400 mt-1">
            <span className="flex items-center gap-1">
              <FiCalendar className="inline" size={14} />
              {formatDate(order.createdAt)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {order.paymentInfo.status === 'pending' && (
            <button
              onClick={handleApprovePayment}
              disabled={isSaving || assigningProducts}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {assigningProducts ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Atribuindo...
                </>
              ) : (
                <>
                  <FiCheckCircle className="mr-2" />
                  Aprovar Pagamento
                </>
              )}
            </button>
          )}
          <Link 
            href="/admin/orders" 
            className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Voltar
          </Link>
        </div>
      </div>
      
      {/* Mensagens de erro e sucesso */}
      {saveError && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}
      
      {saveSuccess && (
        <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 flex items-start">
          <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>Pedido atualizado com sucesso!</span>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detalhes do Cliente */}
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiUser className="mr-2" />
            Informações do Cliente
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-400">Nome de Usuário</p>
              <p className="text-white">{order.user?.username || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Email</p>
              <p className="text-white break-all">{order.user?.email || 'N/A'}</p>
            </div>
            {order.user?.name && (
              <div>
                <p className="text-sm text-gray-400">Nome Completo</p>
                <p className="text-white">{order.user.name}</p>
              </div>
            )}
            {order.user?.cpf && (
              <div>
                <p className="text-sm text-gray-400">CPF</p>
                <p className="text-white">{order.user.cpf}</p>
              </div>
            )}
            {order.user?.phone && (
              <div>
                <p className="text-sm text-gray-400">Telefone</p>
                <p className="text-white">{order.user.phone}</p>
              </div>
            )}
            <div className="pt-2">
              <Link 
                href={`/admin/users/${order.user?._id}`} 
                className="text-primary hover:underline flex items-center"
              >
                Ver perfil completo
                <FiArrowLeft className="ml-1 rotate-180" size={14} />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Detalhes do Pagamento */}
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiCreditCard className="mr-2" />
            Informações de Pagamento
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-gray-400">Método</p>
                <p className="text-white">{translatePaymentMethod(order.paymentInfo.method)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className={`font-medium ${
                  getStatusColor(order.paymentInfo.status) === 'green' 
                    ? 'text-green-400' 
                    : getStatusColor(order.paymentInfo.status) === 'yellow'
                    ? 'text-yellow-400'
                    : getStatusColor(order.paymentInfo.status) === 'red'
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}>
                  {translateStatus(order.paymentInfo.status)}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-400">Valor Total</p>
              <p className="text-xl font-semibold text-white">
                R$ {order.totalAmount.toFixed(2).replace('.', ',')}
              </p>
              {order.couponApplied && (
                <div className="flex gap-2 items-center mt-1">
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                    Cupom: {order.couponApplied.code}
                  </span>
                  <span className="text-xs text-gray-400">
                    Desconto: {order.discountAmount ? `R$ ${order.discountAmount.toFixed(2).replace('.', ',')}` : 'N/A'}
                  </span>
                </div>
              )}
            </div>
            
            <div>
              <p className="text-sm text-gray-400">ID da Transação</p>
              <div className="mt-1 flex items-center">
                {order.paymentInfo.transactionId ? (
                  <div className="text-white break-all font-mono text-sm bg-dark-300 p-2 rounded border border-dark-400">
                    {order.paymentInfo.transactionId}
                  </div>
                ) : (
                  <span className="text-red-400">N/A</span>
                )}
              </div>
            </div>
            
            {order.paymentInfo.expirationDate && (
              <div>
                <p className="text-sm text-gray-400">Expira em</p>
                <p className="text-white">{formatDate(order.paymentInfo.expirationDate)}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Dados do Checkout */}
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiFileText className="mr-2" />
            Dados do Checkout
          </h3>
          
          {order.customerData ? (
            <div className="space-y-3">
              {order.customerData.firstName && (
                <div>
                  <p className="text-sm text-gray-400">Nome</p>
                  <p className="text-white">{order.customerData.firstName}</p>
                </div>
              )}
              
              {order.customerData.lastName && (
                <div>
                  <p className="text-sm text-gray-400">Sobrenome</p>
                  <p className="text-white">{order.customerData.lastName}</p>
                </div>
              )}
              
              {order.customerData.email && (
                <div>
                  <p className="text-sm text-gray-400">Email no checkout</p>
                  <p className="text-white break-all">{order.customerData.email}</p>
                </div>
              )}
              
              {order.customerData.cpf && (
                <div>
                  <p className="text-sm text-gray-400">CPF no checkout</p>
                  <p className="text-white">{order.customerData.cpf}</p>
                </div>
              )}
              
              {order.customerData.phone && (
                <div>
                  <p className="text-sm text-gray-400">Telefone no checkout</p>
                  <p className="text-white">{order.customerData.phone}</p>
                </div>
              )}
              
              {order.customerData.address && (
                <div>
                  <p className="text-sm text-gray-400">Endereço</p>
                  <p className="text-white">{order.customerData.address}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Dados do checkout não disponíveis</p>
          )}
        </div>
      </div>
      
      {/* Atualizar Status */}
      <div className="bg-dark-200 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <FiEdit className="mr-2" />
          Atualizar Pedido
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="updateStatus" className="block text-sm font-medium text-gray-300 mb-1">
              Status do Pagamento
            </label>
            <select 
              id="updateStatus"
              value={updateStatus || order.paymentInfo.status || ''}
              onChange={(e) => setUpdateStatus(e.target.value)}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
              <option value="failed">Falha</option>
              <option value="refunded">Reembolsado</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="adminNote" className="block text-sm font-medium text-gray-300 mb-1">
              Nota Administrativa
            </label>
            <textarea 
              id="adminNote"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Adicione uma nota (opcional)"
              rows={3}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          
          <button
            onClick={handleUpdateOrder}
            disabled={isSaving || (updateStatus === order.paymentInfo.status && !adminNote.trim())}
            className="w-full bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Produtos do Pedido */}
      <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 pb-4">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
            <FiPackage className="mr-2" />
            Produtos
          </h3>
          <p className="text-gray-400 text-sm">
            {order.productAssigned ? 'Produtos já foram atribuídos ao cliente' : 'Produtos ainda não foram atribuídos ao cliente'}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-dark-300 text-gray-300 text-sm">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Plano/Variante</th>
                <th className="px-4 py-3 text-center">Quantidade</th>
                <th className="px-4 py-3 text-right">Preço</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {order.items.map((item, index) => (
                <tr key={index} className="hover:bg-dark-300/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {item.productId && item.productId.images && item.productId.images.length > 0 ? (
                        <img 
                          src={item.productId.images[0]} 
                          alt={item.productId?.name || 'Produto'} 
                          className="w-10 h-10 object-cover rounded mr-3" 
                        />
                      ) : (
                        <div className="w-10 h-10 bg-dark-400 rounded mr-3 flex items-center justify-center text-gray-500">
                          <FiPackage size={20} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-white">
                          {item.productId?.name || item.name || 'Produto'}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {item.productId?._id || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">
                    {typeof item.variantId === 'string' && item.variantId
                      ? item.variantId 
                      : 'Padrão'}
                  </td>
                  <td className="px-4 py-3 text-white text-center">
                    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-dark-400 text-white text-sm font-medium">
                      {item.quantity || 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    R$ {(item.price || 0).toFixed(2).replace('.', ',')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-dark-300">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right font-medium text-white">Total:</td>
                <td className="px-4 py-3 text-right font-semibold text-white">
                  R$ {order.totalAmount.toFixed(2).replace('.', ',')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      {/* Histórico de Status e Notas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Histórico de Status */}
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiClock className="mr-2" />
            Histórico de Status
          </h3>
          
          {(!order.statusHistory || order.statusHistory.length === 0) ? (
            <p className="text-gray-400">Nenhum histórico de status disponível</p>
          ) : (
            <div className="space-y-3">
              {order.statusHistory.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()).map((item, index) => (
                <div key={index} className="border-l-2 border-dark-400 pl-4 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className={`font-medium ${
                        getStatusColor(item.status) === 'green' 
                          ? 'text-green-400' 
                          : getStatusColor(item.status) === 'yellow'
                          ? 'text-yellow-400'
                          : getStatusColor(item.status) === 'red'
                          ? 'text-red-400'
                          : 'text-blue-400'
                      }`}>
                        {translateStatus(item.status)}
                      </p>
                      <p className="text-xs text-gray-400">{item.changedBy}</p>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(item.changedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Notas Administrativas */}
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiFileText className="mr-2" />
            Notas Administrativas
          </h3>
          
          {(!order.notes || order.notes.length === 0) ? (
            <p className="text-gray-400">Nenhuma nota administrativa disponível</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {order.notes.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()).map((note, index) => (
                <div key={index} className="bg-dark-300 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-primary font-medium">{note.addedBy}</p>
                    <p className="text-xs text-gray-400">{formatDate(note.addedAt)}</p>
                  </div>
                  <p className="text-white whitespace-pre-wrap">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* QR Code PIX (se aplicável) */}
      {order.paymentInfo.method === 'pix' && order.paymentInfo.qrCodeBase64 && (
        <div className="bg-dark-200 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
            <FiCreditCard className="mr-2" />
            QR Code PIX
          </h3>
          
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className="bg-white p-4 rounded-lg mx-auto md:mx-0">
              <img 
                src={`data:image/png;base64,${order.paymentInfo.qrCodeBase64}`} 
                alt="QR Code PIX" 
                className="w-48 h-48 object-contain"
              />
            </div>
            
            {order.paymentInfo.pixCopiaECola && (
              <div className="flex-1">
                <p className="text-sm text-gray-400 mb-2">Código Copia e Cola:</p>
                <div className="bg-dark-300 p-3 rounded-lg mb-4 relative">
                  <p className="text-white text-sm break-all pr-8">{order.paymentInfo.pixCopiaECola}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(order.paymentInfo.pixCopiaECola || '');
                      alert('Código copiado para a área de transferência!');
                    }}
                    className="absolute right-2 top-2 p-1 text-primary hover:text-white"
                    title="Copiar código"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
                
                {order.paymentInfo.expirationDate && (
                  <div className="text-sm">
                    <p className="text-gray-400">Expira em:</p>
                    <p className="text-white">{formatDate(order.paymentInfo.expirationDate)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}