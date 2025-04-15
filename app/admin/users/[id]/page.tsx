'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import React from 'react';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiCalendar,
  FiCreditCard, FiDollarSign, FiShoppingBag, FiClock,
  FiArrowLeft, FiRefreshCw, FiShield, FiInfo,
  FiCheckCircle, FiAlertCircle, FiXCircle, FiEye,
  FiGlobe, FiServer, FiPackage, FiActivity, FiDatabase
} from 'react-icons/fi';
import toast from 'react-hot-toast';

interface OrderItem {
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
    receiptUrl?: string;
  };
  couponApplied?: string;
  discountAmount: number;
  createdAt: string;
  updatedAt: string;
}

interface TimelineItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status?: string;
  items?: number;
  date: string;
}

interface UserDetail {
  _id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  memberNumber: number | null;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  cpf?: string;
  address?: string;
  phone?: string;
  stats: {
    totalSpent: number;
    totalOrders: number;
    lastActivity: string;
  };
  clientInfo: {
    ip: string;
    userAgent: string;
  };
  orders: Order[];
  timeline: TimelineItem[];
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.id as string;
  
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  
  // Buscar detalhes do usuário
  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao buscar detalhes do usuário');
      }
      
      const data = await response.json();
      setUser(data.user);
      setError('');
    } catch (error: any) {
      setError(error.message || 'Erro ao buscar detalhes do usuário');
      toast.error(error.message || 'Erro ao buscar detalhes do usuário');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserDetails();
  }, [userId]);
  
  // Funções para formatação de dados
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            <FiRefreshCw className="inline mr-1" />
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
  
  // Função para copiar ID para o clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('ID copiado para a área de transferência!');
      })
      .catch((err) => {
        console.error('Erro ao copiar: ', err);
        toast.error('Erro ao copiar ID');
      });
  };
  
  // Interface da página
  const renderLoading = () => (
    <div className="flex justify-center items-center h-96">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-400">Carregando detalhes do usuário...</p>
      </div>
    </div>
  );
  
  const renderError = () => (
    <div className="flex justify-center items-center h-96">
      <div className="text-center">
        <FiAlertCircle className="mx-auto text-red-500 mb-4" size={40} />
        <p className="text-gray-400 mb-4">{error}</p>
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => fetchUserDetails()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FiRefreshCw className="inline mr-2" />
            Tentar novamente
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="px-4 py-2 bg-dark-400 text-white rounded-lg hover:bg-dark-500 transition-colors"
          >
            <FiArrowLeft className="inline mr-2" />
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
  
  const renderProfileTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Informações Básicas */}
      <div className="bg-dark-300 rounded-xl shadow-md p-6 border border-dark-400/50">
        <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
          <FiUser className="mr-2 text-primary" />
          Informações Básicas
        </h3>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
          <div className="h-20 w-20 rounded-full bg-dark-500 flex items-center justify-center overflow-hidden mr-4 mb-4 sm:mb-0">
            {user?.profileImage ? (
              <Image
                src={user.profileImage}
                alt={user.username}
                width={80}
                height={80}
                className="object-cover"
              />
            ) : (
              <FiUser className="text-gray-400" size={40} />
            )}
          </div>
          <div>
            <h4 className="text-white text-xl font-bold">{user?.username}</h4>
            <p className="text-gray-400">{user?.name || 'Nome não informado'}</p>
            <div className="mt-2">
              {user?.role === 'admin' ? (
                <span className="px-2 py-1 text-xs rounded-full bg-purple-900/30 text-purple-400 border border-purple-800/30">
                  <FiShield className="inline mr-1" />
                  Administrador
                </span>
              ) : (
                <span className="px-2 py-1 text-xs rounded-full bg-blue-900/30 text-blue-400 border border-blue-800/30">
                  <FiUser className="inline mr-1" />
                  Usuário
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center">
              <span 
                onClick={() => copyToClipboard(user?._id || '')}
                className="px-2 py-1 text-xs rounded-full bg-dark-500/80 text-gray-300 border border-dark-600/50 font-mono flex items-center cursor-pointer hover:bg-dark-400 transition-colors"
                title="Clique para copiar"
              >
                <FiDatabase className="inline mr-1" />
                ID: {user?._id}
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="border-t border-dark-400 pt-4">
            <p className="text-gray-400 text-sm">Email</p>
            <div className="flex items-center">
              <FiMail className="text-gray-500 mr-2" />
              <p className="text-white">{user?.email}</p>
            </div>
          </div>
          
          <div className="border-t border-dark-400 pt-4">
            <p className="text-gray-400 text-sm">Telefone</p>
            <div className="flex items-center">
              <FiPhone className="text-gray-500 mr-2" />
              <p className="text-white">{user?.phone || 'Não informado'}</p>
            </div>
          </div>
          
          <div className="border-t border-dark-400 pt-4">
            <p className="text-gray-400 text-sm">CPF</p>
            <div className="flex items-center">
              <FiCreditCard className="text-gray-500 mr-2" />
              <p className="text-white">{user?.cpf || 'Não informado'}</p>
            </div>
          </div>
          
          <div className="border-t border-dark-400 pt-4">
            <p className="text-gray-400 text-sm">Membro #</p>
            <div className="flex items-center">
              <FiInfo className="text-gray-500 mr-2" />
              <p className="text-white">{user?.memberNumber || 'Não atribuído'}</p>
            </div>
          </div>
          
          <div className="border-t border-dark-400 pt-4">
            <p className="text-gray-400 text-sm">Membro desde</p>
            <div className="flex items-center">
              <FiCalendar className="text-gray-500 mr-2" />
              <p className="text-white">{user?.createdAt ? formatDate(user.createdAt) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Estatísticas e Informações de Cliente */}
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="bg-dark-300 rounded-xl shadow-md p-6 border border-dark-400/50">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            <FiActivity className="mr-2 text-primary" />
            Estatísticas do Cliente
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-dark-400 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-900/30 text-blue-400 mr-3">
                  <FiDollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Gasto</p>
                  <p className="text-lg font-bold text-white">
                    R$ {user?.stats?.totalSpent?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-400 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-900/30 text-green-400 mr-3">
                  <FiShoppingBag className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total de Pedidos</p>
                  <p className="text-lg font-bold text-white">
                    {user?.stats?.totalOrders || 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-dark-400 rounded-lg p-4 sm:col-span-2">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-900/30 text-yellow-400 mr-3">
                  <FiClock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Última Atividade</p>
                  <p className="text-base font-medium text-white">
                    {user?.stats?.lastActivity ? formatDate(user.stats.lastActivity) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Informações do Cliente */}
        <div className="bg-dark-300 rounded-xl shadow-md p-6 border border-dark-400/50">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            <FiServer className="mr-2 text-primary" />
            Informações do Cliente
          </h3>
          
          <div className="space-y-4">
            <div className="border-t border-dark-400 pt-4">
              <p className="text-gray-400 text-sm">Endereço IP</p>
              <div className="flex items-center">
                <FiGlobe className="text-gray-500 mr-2" />
                <p className="text-white">{user?.clientInfo?.ip || 'Não disponível'}</p>
              </div>
            </div>
            
            <div className="border-t border-dark-400 pt-4">
              <p className="text-gray-400 text-sm">Navegador/Dispositivo</p>
              <div className="flex items-start">
                <FiInfo className="text-gray-500 mr-2 mt-1" />
                <p className="text-white break-all text-sm">
                  {user?.clientInfo?.userAgent || 'Não disponível'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderOrdersTab = () => (
    <div className="bg-dark-300 rounded-xl shadow-md border border-dark-400/50">
      <h3 className="text-white text-lg font-semibold p-6 border-b border-dark-400 flex items-center">
        <FiShoppingBag className="mr-2 text-primary" />
        Histórico de Pedidos
      </h3>
      
      {user?.orders && user.orders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-400">
            <thead className="bg-dark-400">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pedido
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Itens
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Total
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Método
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-300 divide-y divide-dark-400">
              {user.orders.map((order) => (
                <tr key={order._id} className="hover:bg-dark-400/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white font-medium">#{order._id.slice(-6)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300 text-sm">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiPackage className="text-gray-500 mr-2" />
                      <span className="text-gray-300">{order.orderItems.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-white font-medium">
                      R$ {order.totalAmount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                    {order.paymentMethod === 'pix' ? 'PIX' : 'Cartão de crédito'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.paymentInfo.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center">
          <FiShoppingBag className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <p className="text-gray-400">Este usuário ainda não realizou nenhum pedido.</p>
        </div>
      )}
    </div>
  );
  
  const renderTimelineTab = () => (
    <div className="bg-dark-300 rounded-xl shadow-md p-6 border border-dark-400/50">
      <h3 className="text-white text-lg font-semibold mb-6 flex items-center">
        <FiActivity className="mr-2 text-primary" />
        Linha do Tempo
      </h3>
      
      {user?.timeline && user.timeline.length > 0 ? (
        <div className="relative pl-8 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-dark-400">
          {user.timeline.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative mb-8 last:mb-0"
            >
              <div className="absolute left-[-28px] top-1 w-6 h-6 rounded-full bg-dark-500 border-2 border-dark-400 flex items-center justify-center">
                {item.type === 'registration' ? (
                  <FiUser className="h-3 w-3 text-blue-400" />
                ) : item.type === 'order' ? (
                  <FiShoppingBag className="h-3 w-3 text-green-400" />
                ) : (
                  <FiActivity className="h-3 w-3 text-yellow-400" />
                )}
              </div>
              
              <div className="bg-dark-400 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                  <h4 className="text-white font-semibold">{item.title}</h4>
                  <span className="text-gray-400 text-sm">
                    {formatDate(item.date)}
                  </span>
                </div>
                
                <p className="text-gray-300 mb-2">{item.description}</p>
                
                {item.type === 'order' && item.status && (
                  <div className="mt-2">
                    {getStatusBadge(item.status)}
                    {item.items && (
                      <span className="ml-2 text-xs text-gray-400">
                        {item.items} {item.items === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FiClock className="mx-auto h-12 w-12 text-gray-500 mb-4" />
          <p className="text-gray-400">Nenhuma atividade para exibir.</p>
        </div>
      )}
    </div>
  );
  
  return (
    <div className="container mx-auto px-4 pb-12">
      {/* Cabeçalho */}
      <div className="mb-6 bg-dark-300 rounded-xl p-6 border border-dark-400/50 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/admin/users')}
              className="mr-4 p-2 bg-dark-400 rounded-lg hover:bg-dark-500 transition-colors"
            >
              <FiArrowLeft className="text-white" />
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center">
              <FiUser className="mr-2 text-primary" size={24} />
              Detalhes do Usuário
            </h1>
          </div>
          
          <button
            onClick={fetchUserDetails}
            className="px-4 py-2 bg-dark-400 text-white rounded-lg hover:bg-dark-500 transition-colors flex items-center"
          >
            <FiRefreshCw className="mr-2" />
            Atualizar
          </button>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : (
        <>
          {/* Abas de navegação */}
          <div className="mb-6 bg-dark-300 rounded-xl overflow-hidden shadow-lg">
            <div className="flex flex-wrap border-b border-dark-400">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'profile'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-white hover:bg-dark-400/50'
                }`}
              >
                <FiUser className="inline mr-2" />
                Perfil
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'orders'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-white hover:bg-dark-400/50'
                }`}
              >
                <FiShoppingBag className="inline mr-2" />
                Pedidos
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === 'timeline'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-white hover:bg-dark-400/50'
                }`}
              >
                <FiActivity className="inline mr-2" />
                Linha do Tempo
              </button>
            </div>
          </div>
          
          {/* Conteúdo da aba */}
          <div className="space-y-6">
            {activeTab === 'profile' && renderProfileTab()}
            {activeTab === 'orders' && renderOrdersTab()}
            {activeTab === 'timeline' && renderTimelineTab()}
          </div>
        </>
      )}
    </div>
  );
} 