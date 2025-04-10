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
  FiSave,
  FiCheck,
  FiLoader,
  FiBox
} from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

// Tipos necessários
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
  name: string;
  price: number;
  delivered?: boolean;
  quantity: number;
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
  orderItems: OrderItem[];
  totalAmount: number;
  paymentInfo: PaymentInfo;
  couponApplied?: {
    code: string;
    discount: number;
  };
  discountAmount?: number;
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
  const [actionLoading, setActionLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [markingItemId, setMarkingItemId] = useState<string | null>(null);
  
  // Função para buscar detalhes do pedido
  const fetchOrderData = async () => {
    try {
      setLoading(true);
      setError(null); // Limpar erros anteriores
      
      if (!orderId) {
        setError('ID do pedido não encontrado');
        setLoading(false);
        return;
      }
      
      // Usar o endpoint correto de admin
      const response = await fetch(`/api/admin/orders/${orderId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || `Erro ao carregar dados do pedido (${response.status})`);
      }
      
      const data = await response.json();
      
      // Verificar se os dados do pedido existem
      if (!data || !data.order) {
        throw new Error('Dados do pedido não encontrados na resposta');
      }
      
      // Processar os itens do pedido para garantir que a quantidade seja validada
      const processedItems = data.order.orderItems.map((item: any) => {
        // Verificar se a quantidade é válida
        let quantity = 1; // Valor padrão
        
        if (typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) {
          quantity = Math.floor(item.quantity);
        } else if (typeof item.quantity === 'string' && item.quantity.trim() !== '') {
          const parsedQuantity = parseInt(item.quantity.trim(), 10);
          if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
            quantity = parsedQuantity;
          }
        }
        
        console.log(`Admin - Item ${item._id}: Quantidade original = ${item.quantity}, Processada = ${quantity}`);
        
        return {
          ...item,
          quantity: quantity
        };
      });
      
      // Atualizar o pedido com os itens processados
      const processedOrder = {
        ...data.order,
        orderItems: processedItems
      };
      
      setOrder(processedOrder);
      
      // Se tivermos status de pagamento, atualizar o dropdown de status
      if (processedOrder.paymentInfo && processedOrder.paymentInfo.status) {
        setUpdateStatus(processedOrder.paymentInfo.status);
      }
      
      // Verificar se o pedido tem itens
      if (processedOrder.orderItems.length > 0) {
        try {
          // Carregar dados completos dos produtos com tratamento de erros
          const productPromises = processedOrder.orderItems.map(async (item: OrderItem) => {
            if (item && item.product && item.product._id) {
              try {
                // Buscar dados completos e atualizados do produto
                const productResponse = await fetch(`/api/products/${item.product._id}`);
                if (productResponse.ok) {
                  const productData = await productResponse.json();
                  console.log(`Produto carregado: ${productData.product.name}, deliveryType: ${productData.product.deliveryType}`);
                  return productData.product;
                }
              } catch (err) {
                console.error(`Erro ao buscar dados do produto ${item.product._id}:`, err);
              }
            }
            return null;
          });

          const productDetails = await Promise.all(productPromises);
          
          // Mesclar os dados de produtos com os itens do pedido
          const enhancedItems = processedOrder.orderItems.map((item: OrderItem, index: number) => {
            const productDetail = productDetails[index];
            
            if (!productDetail) return item; // Se não tiver detalhes, manter o item original
            
            // Determinar o tipo de entrega (produto principal ou variante)
            let deliveryType = productDetail.deliveryType || 'automatic';
            let variantDeliveryType = undefined;
            
            // Se tiver variante, verificar o deliveryType da variante específica
            if (item.variant && item.variant._id && 
                Array.isArray(productDetail.variants) && productDetail.variants.length > 0) {
              
              const matchingVariant = productDetail.variants.find(
                (v: any) => v._id === item.variant?._id
              );
              
              if (matchingVariant) {
                variantDeliveryType = matchingVariant.deliveryType;
                // Se a variante tiver um tipo de entrega específico, ele tem prioridade
                if (variantDeliveryType) {
                  console.log(`Variante ${matchingVariant.name} tem tipo de entrega específico: ${variantDeliveryType}`);
                }
              }
            }
            
            // Determinar o tipo de entrega final (priorizar variante sobre produto)
            const finalDeliveryType = variantDeliveryType || deliveryType;
            
            // Log para debug
            console.log(`Item ${item.name}: tipo de entrega do produto=${deliveryType}, tipo de entrega da variante=${variantDeliveryType}, tipo de entrega final=${finalDeliveryType}`);
            
            return {
              ...item,
              product: {
                ...item.product,
                deliveryType: deliveryType
              },
              variant: item.variant ? {
                ...item.variant,
                deliveryType: variantDeliveryType
              } : undefined
            };
          });
          
          // Atualizar o pedido com os itens enriquecidos de forma segura
          setOrder(prevOrder => {
            if (!prevOrder) return processedOrder; // Precaução extra
            return {
              ...prevOrder,
              orderItems: enhancedItems
            };
          });
        } catch (err) {
          console.error('Erro ao processar detalhes dos produtos:', err);
          // Em caso de erro nos detalhes dos produtos, manter os dados básicos do pedido
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
      setError(error instanceof Error ? error.message : 'Não foi possível carregar os dados do pedido.');
    } finally {
      setLoading(false);
    }
  };
  
  // Buscar detalhes do pedido
  useEffect(() => {
    if (orderId) {
      fetchOrderData();
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
      await fetchOrderData();
      
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
        notes: 'Pagamento aprovado manualmente por administrador',
        paymentInfo: {
          status: 'paid'
        },
        paymentStatus: 'paid',
        orderStatus: 'processing'
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
      await fetchOrderData();
      
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
  
  // Adicionar função para marcar produto como entregue manualmente
  const markProductAsDelivered = async (itemId: string) => {
    try {
      if (!order) return;
      
      // Encontrar o item específico
      const targetItem = order.orderItems.find(item => item._id === itemId);
      if (!targetItem) {
        toast.error('Item não encontrado no pedido');
        return;
      }
      
      // Verificar se o item já foi entregue
      if (targetItem.delivered) {
        toast.success('Este item já foi entregue');
        return;
      }
      
      // Verificar se o item tem entrega manual antes de permitir a marcação
      const productDeliveryType = targetItem.product?.deliveryType;
      const variantDeliveryType = targetItem.variant?.deliveryType;
      const finalDeliveryType = variantDeliveryType || productDeliveryType || 'automatic';
      
      if (finalDeliveryType !== 'manual') {
        toast.error('Apenas itens com entrega manual podem ser marcados como entregues');
        return;
      }
      
      setActionLoading(true);
      setMarkingItemId(itemId);
      
      const response = await fetch(`/api/orders/${orderId}/deliver-item`, {
        method: 'POST',
        credentials: 'include',  // Adicionado para garantir que os cookies sejam enviados
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          itemId, 
          note: `Produto entregue manualmente pelo administrador em ${new Date().toLocaleString('pt-BR')}`
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Erro ao marcar produto como entregue');
      }
      
      // Atualizar o estado local
      setOrder(prevOrder => {
        if (!prevOrder) return null;
        const updatedItems = prevOrder.orderItems.map(item => {
          if (item._id === itemId) {
            return {
              ...item,
              delivered: true
            };
          }
          return item;
        });
        
        return {
          ...prevOrder,
          orderItems: updatedItems
        };
      });
      
      // Adicionar nota automática
      if (order && order.orderItems) {
        const productName = order.orderItems.find(item => item._id === itemId)?.name || 'desconhecido';
        await addNote(`Produto ${productName} marcado como entregue manualmente.`);
      }
      
      // Atualizar página
      fetchOrderData();
      
      toast.success('Produto marcado como entregue com sucesso!');
    } catch (error) {
      console.error('Erro ao marcar produto como entregue:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao marcar produto como entregue');
    } finally {
      setActionLoading(false);
      setMarkingItemId(null);
    }
  };
  
  // Função que lida com o clique no botão de marcar como entregue
  const handleMarkAsDelivered = async (itemId: string) => {
    if (actionLoading) return;
    
    try {
      // Mostrar confirmação antes de prosseguir
      if (confirm('Confirma que deseja marcar este item como entregue?')) {
        try {
          await markProductAsDelivered(itemId);
        } catch (error) {
          console.error('Erro ao marcar produto como entregue:', error);
          
          // Verificar se é um erro específico de autenticação
          if (error instanceof Error) {
            const errorMsg = error.message.toLowerCase();
            
            if (errorMsg.includes('não autenticado') || errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
              toast.error('Sessão expirada. Por favor, faça login novamente.');
              // Redirecionar para a página de login após um breve delay
              setTimeout(() => {
                router.push('/auth/login');
              }, 1500);
              return;
            }
            
            if (errorMsg.includes('não autorizado') || errorMsg.includes('forbidden') || errorMsg.includes('403')) {
              toast.error('Você não tem permissão para realizar esta ação. É necessário ser administrador.');
              return;
            }
            
            // Para outros erros, mostrar a mensagem específica
            toast.error(error.message);
          } else {
            // Mensagem genérica para outros tipos de erro
            toast.error('Erro ao marcar produto como entregue');
          }
        }
      }
    } catch (error) {
      console.error('Erro ao processar ação:', error);
      toast.error('Ocorreu um erro inesperado. Tente novamente mais tarde.');
    }
  };
  
  // Função para processar a quantidade dos itens
  const processQuantity = (item: OrderItem): number => {
    try {
      // Verificar se a quantidade já é um número válido
      if (typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0) {
        return Math.floor(item.quantity);
      }
      
      // Se for um objeto (como visto nos logs), tentar extrair o valor
      if (typeof item.quantity === 'object' && item.quantity !== null) {
        const qtyObj = item.quantity as any;
        
        // Verificar se tem propriedade quantity
        if (typeof qtyObj.quantity === 'number' && !isNaN(qtyObj.quantity)) {
          return Math.floor(qtyObj.quantity);
        }
        
        // Verificar se tem propriedade rawValue
        if (typeof qtyObj.rawValue === 'number' && !isNaN(qtyObj.rawValue)) {
          return Math.floor(qtyObj.rawValue);
        }
      }
      
      // Se for string, tentar converter
      if (typeof item.quantity === 'string' && item.quantity.trim() !== '') {
        const parsedQty = parseInt(item.quantity.trim(), 10);
        if (!isNaN(parsedQty) && parsedQty > 0) {
          return parsedQty;
        }
      }
      
      // Valor padrão se nada funcionar
      return 1;
    } catch (error) {
      console.error('Erro ao processar quantidade:', error);
      return 1; // Valor padrão em caso de erro
    }
  };
  
  // Função para adicionar nota ao pedido
  const addNote = async (content: string) => {
    if (!content.trim() || !order) return;
    
    try {
      // Usar a rota PUT existente, enviando apenas a nota sem alterar o status
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: order.paymentInfo.status, // Manter o status atual
          notes: content // Adicionar apenas a nota
        })
      });
      
      if (!response.ok) {
        throw new Error('Erro ao adicionar nota');
      }
      
      // Atualizar pedido após adicionar nota
      fetchOrderData();
    } catch (error) {
      console.error('Erro ao adicionar nota:', error);
    }
  };
  
  // Função para buscar notas do pedido
  const fetchNotes = () => {
    // Como é uma função de verificação, deixamos vazia mas definida
    // Pode ser implementada posteriormente quando necessário buscar notas do pedido
    console.log('Função fetchNotes chamada para o pedido:', orderId);
  };
  
  // Se o componente estiver em estado de loading ou erro, retorna os respectivos componentes
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
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

  // O componente principal que é renderizado quando temos os dados do pedido
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
      
      {/* Tabela de itens do pedido */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Itens do Pedido</h3>
        <div className="bg-dark-200 rounded-lg overflow-hidden shadow">
          <table className="min-w-full divide-y divide-dark-400">
            <thead className="bg-dark-300">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Produto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tipo de Entrega
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-400">
              {order.orderItems.map((item: OrderItem) => (
                <tr key={item._id}>
                  {/* Produto */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        {item.product && item.product.images && item.product.images.length > 0 ? (
                          <img 
                            className="h-10 w-10 rounded-md object-cover" 
                            src={item.product.images[0]} 
                            alt={item.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-product.jpg';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                            <FiBox className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{item.name}</div>
                        {item.variant && (
                          <div className="text-xs text-gray-500">
                            Variante: {item.variant.name}
                          </div>
                        )}
                        <div className="text-xs text-primary mt-1">
                          R$ {item.price.toFixed(2)}
                        </div>
                        
                        {/* Mostrar quantidade */}
                        <div className="mt-1">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Qtd: {processQuantity(item)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Tipo de Entrega */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* Verificação robusta do tipo de entrega, considerando tanto produto quanto variante */}
                    {(() => {
                      // Verificar o tipo de entrega do produto
                      const productDeliveryType = item.product?.deliveryType;
                      
                      // Verificar o tipo de entrega da variante (se existir)
                      const variantDeliveryType = item.variant?.deliveryType;
                      
                      // Priorizar o tipo de entrega da variante, se disponível
                      const finalDeliveryType = variantDeliveryType || productDeliveryType || 'automatic';
                      
                      // Log para debug
                      console.log(`Item ${item.name}: produto=${productDeliveryType}, variante=${variantDeliveryType}, final=${finalDeliveryType}`);
                      
                      // Exibir o tipo de entrega
                      if (finalDeliveryType === 'manual') {
                        return (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            Manual
                          </span>
                        );
                      } else {
                        return (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Automática
                          </span>
                        );
                      }
                    })()}
                  </td>
                  
                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.delivered ? (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Entregue
                      </span>
                    ) : (
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                        Pendente
                      </span>
                    )}
                  </td>
                  
                  {/* Código */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.code ? (
                      <div className="text-sm text-gray-300 font-mono">{item.code}</div>
                    ) : (
                      <div className="text-sm text-gray-500 italic">Não atribuído</div>
                    )}
                  </td>
                  
                  {/* Ações */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {(() => {
                      // Determinar se o item já foi entregue
                      const isItemDelivered = !!item.delivered;
                      
                      // Verificar o tipo de entrega do produto
                      const productDeliveryType = item.product?.deliveryType;
                      
                      // Verificar o tipo de entrega da variante (se existir)
                      const variantDeliveryType = item.variant?.deliveryType;
                      
                      // Priorizar o tipo de entrega da variante, se disponível
                      const finalDeliveryType = variantDeliveryType || productDeliveryType || 'automatic';
                      
                      // Mostrar o botão apenas se o tipo de entrega for manual e o item não estiver entregue
                      if (!isItemDelivered && finalDeliveryType === 'manual') {
                        return (
                          <button
                            onClick={() => handleMarkAsDelivered(item._id)}
                            disabled={isSaving}
                            className="text-primary hover:text-primary-dark focus:outline-none disabled:opacity-50"
                          >
                            {isSaving && markingItemId === item._id ? (
                              <span className="flex items-center">
                                <span className="animate-spin h-4 w-4 mr-2 border-b-2 border-primary rounded-full"></span>
                                Processando...
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <FiCheckCircle className="mr-1" />
                                Marcar como entregue
                              </span>
                            )}
                          </button>
                        );
                      }
                      
                      return null;
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
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