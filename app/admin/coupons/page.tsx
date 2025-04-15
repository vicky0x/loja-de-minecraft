'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiChevronRight,
  FiChevronLeft,
  FiTag,
  FiCalendar,
  FiPercent,
  FiDollarSign,
  FiRefreshCw,
  FiFilter,
  FiBox,
  FiShoppingBag
} from 'react-icons/fi';

// Tipos
interface Coupon {
  _id: string;
  code: string;
  description: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  maxUses: number;
  usedCount: number;
  minAmount: number;
  maxAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: string[];
  categories: string[];
  createdBy: {
    _id: string;
    username: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Carregar cupons ao montar o componente
  useEffect(() => {
    fetchCoupons();
  }, [pagination.page, search, filterActive]);

  // Buscar cupons da API
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = `/api/coupons?page=${pagination.page}&limit=${pagination.limit}`;
      
      if (search) {
        url += `&code=${encodeURIComponent(search)}`;
      }
      
      if (filterActive !== null) {
        url += `&active=${filterActive}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao buscar cupons');
      }
      
      setCoupons(data.coupons);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar cupons');
      console.error('Erro ao buscar cupons:', err);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de confirmação de exclusão
  const openDeleteModal = (coupon: Coupon) => {
    setCouponToDelete(coupon);
    setShowDeleteModal(true);
  };

  // Fechar modal de confirmação
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCouponToDelete(null);
  };

  // Excluir cupom
  const deleteCoupon = async () => {
    if (!couponToDelete) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/coupons/${couponToDelete._id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao excluir cupom');
      }
      
      setSuccess(`Cupom ${couponToDelete.code} excluído com sucesso`);
      closeDeleteModal();
      fetchCoupons(); // Recarregar lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cupom');
      console.error('Erro ao excluir cupom:', err);
    } finally {
      setLoading(false);
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Limpar mensagens
  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  // Verificar se o cupom está expirado
  const isExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  // Mudar de página
  const changePage = (page: number) => {
    if (page < 1 || page > pagination.pages) return;
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gerenciamento de Cupons</h2>
        <Link 
          href="/admin/coupons/new" 
          className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" />
          Novo Cupom
        </Link>
      </div>
      
      {/* Mensagens de erro e sucesso */}
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-grow">{error}</div>
          <button onClick={clearMessages} className="ml-auto">
            <FiX className="hover:text-white transition-colors" />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 flex items-start">
          <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <div className="flex-grow">{success}</div>
          <button onClick={clearMessages} className="ml-auto">
            <FiX className="hover:text-white transition-colors" />
          </button>
        </div>
      )}
      
      {/* Filtros e busca */}
      <div className="bg-dark-200 rounded-lg p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-grow">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código do cupom..."
              className="w-full pl-10 pr-4 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterActive(filterActive === 'true' ? null : 'true')}
            className={`px-3 py-2 rounded-md flex items-center ${
              filterActive === 'true' ? 'bg-green-600 text-white' : 'bg-dark-300 text-gray-300'
            }`}
          >
            <FiCheckCircle className="mr-2" />
            Ativos
          </button>
          
          <button
            onClick={() => setFilterActive(filterActive === 'false' ? null : 'false')}
            className={`px-3 py-2 rounded-md flex items-center ${
              filterActive === 'false' ? 'bg-red-600 text-white' : 'bg-dark-300 text-gray-300'
            }`}
          >
            <FiX className="mr-2" />
            Inativos
          </button>
          
          <button
            onClick={() => {
              setSearch('');
              setFilterActive(null);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 bg-dark-300 text-gray-300 rounded-md flex items-center hover:bg-dark-400"
            title="Limpar filtros"
          >
            <FiRefreshCw className="mr-2" />
            Limpar
          </button>
        </div>
      </div>
      
      {/* Tabela de cupons */}
      <div className="bg-dark-200 rounded-lg overflow-hidden">
        {loading && coupons.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <FiLoader className="animate-spin text-primary mr-2" size={24} />
            <span className="text-gray-400">Carregando cupons...</span>
          </div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col justify-center items-center py-12 text-gray-400">
            <FiTag className="mb-2" size={32} />
            <p>Nenhum cupom encontrado</p>
            {(search || filterActive !== null) && (
              <p className="mt-2 text-sm">Tente remover os filtros aplicados</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-dark-300 text-gray-300 text-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Desconto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Validade
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Produtos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-300">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-dark-300/50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiTag className="mr-2 text-primary" />
                        <div>
                          <div className="font-medium text-white">{coupon.code}</div>
                          <div className="text-sm text-gray-400">{coupon.description || 'Sem descrição'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {coupon.discountType === 'percentage' ? (
                          <FiPercent className="mr-2 text-green-500" />
                        ) : (
                          <FiDollarSign className="mr-2 text-green-500" />
                        )}
                        <span className="text-white">
                          {coupon.discount}
                          {coupon.discountType === 'percentage' ? '%' : ' R$'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="flex items-center text-sm">
                          <FiCalendar className="mr-2 text-gray-400" />
                          <span className={isExpired(coupon.endDate) ? 'text-red-400' : 'text-gray-300'}>
                            {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                          </span>
                        </div>
                        {isExpired(coupon.endDate) && (
                          <span className="text-xs text-red-400 mt-1">Expirado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {coupon.maxUses > 0 ? (
                          <span>
                            {coupon.usedCount} / {coupon.maxUses}
                          </span>
                        ) : (
                          <span>{coupon.usedCount} / ∞</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-300">
                        {coupon.products && coupon.products.length > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-900/30 text-blue-400">
                            <FiBox className="mr-1" />
                            Específicos ({coupon.products.length})
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-gray-700/30 text-gray-400">
                            <FiShoppingBag className="mr-1" />
                            Todos
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        coupon.isActive 
                          ? 'bg-green-900/30 text-green-400' 
                          : 'bg-red-900/30 text-red-400'
                      }`}>
                        {coupon.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link 
                          href={`/admin/coupons/${coupon._id}`}
                          className="p-2 text-gray-400 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <FiEdit2 size={18} />
                        </Link>
                        <button
                          onClick={() => openDeleteModal(coupon)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Paginação */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center px-4 py-3 bg-dark-300 border-t border-dark-400">
            <div className="text-sm text-gray-400">
              Mostrando {(pagination.page - 1) * pagination.limit + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} cupons
            </div>
            <div className="flex space-x-1">
              <button
                onClick={() => changePage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`p-2 rounded-md ${
                  pagination.page === 1 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:bg-dark-400 hover:text-white'
                }`}
              >
                <FiChevronLeft size={18} />
              </button>
              
              {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === pagination.pages || 
                  (page >= pagination.page - 1 && page <= pagination.page + 1)
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 py-1 text-gray-600">...</span>
                    )}
                    <button
                      onClick={() => changePage(page)}
                      className={`w-8 h-8 rounded-md ${
                        pagination.page === page
                          ? 'bg-primary text-white'
                          : 'text-gray-400 hover:bg-dark-400 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))
              }
              
              <button
                onClick={() => changePage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className={`p-2 rounded-md ${
                  pagination.page === pagination.pages
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-gray-400 hover:bg-dark-400 hover:text-white'
                }`}
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && couponToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-2">Confirmar Exclusão</h3>
            <p className="text-gray-300 mb-4">
              Tem certeza que deseja excluir o cupom <span className="font-semibold text-white">{couponToDelete.code}</span>?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 rounded-md bg-dark-300 text-gray-300 hover:bg-dark-400 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={deleteCoupon}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FiLoader className="animate-spin mr-2" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="mr-2" />
                    Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 