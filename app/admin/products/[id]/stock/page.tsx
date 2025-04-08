'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiUpload, FiTrash2, FiDownload, FiSearch, FiFilter, FiPlus } from 'react-icons/fi';

interface StockItem {
  _id: string;
  code: string;
  isUsed: boolean;
  assignedTo?: {
    _id: string;
    username: string;
    email: string;
  };
  assignedAt?: string;
  createdAt: string;
}

interface Variant {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  deliveryType?: 'automatic' | 'manual';
}

export default function ProductStockPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [isUsedFilter, setIsUsedFilter] = useState<string>('false');
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkCodes, setBulkCodes] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [hasVariants, setHasVariants] = useState(true);
  const [directProductStock, setDirectProductStock] = useState(0);

  // Carregar dados do produto
  useEffect(() => {
    async function fetchProductData() {
      try {
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          throw new Error('Falha ao carregar dados do produto');
        }
        
        const data = await response.json();
        setProduct(data.product);
        
        // Verificar se o produto tem variantes
        const productHasVariants = Array.isArray(data.product.variants) && data.product.variants.length > 0;
        setHasVariants(productHasVariants);
        
        if (productHasVariants) {
          // Selecionar a primeira variante por padrão
          setSelectedVariant(data.product.variants[0]._id);
        } else {
          // Se não tiver variantes, definir o estoque direto do produto
          setDirectProductStock(data.product.stock || 0);
        }
      } catch (error) {
        console.error('Erro ao carregar produto:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProductData();
  }, [id]);

  // Carregar itens de estoque
  useEffect(() => {
    if ((hasVariants && selectedVariant) || !hasVariants) {
      fetchStockItems();
    }
  }, [selectedVariant, isUsedFilter, pagination.page, hasVariants]);

  // Função para buscar itens de estoque
  const fetchStockItems = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log(`Buscando itens de estoque para produto ${id}, hasVariants: ${hasVariants}, variante: ${selectedVariant || 'nenhuma'}`);
      
      let url = `/api/stock?product=${id}`;
      
      // Adicionar variante ao URL apenas se o produto tiver variantes
      if (hasVariants && selectedVariant) {
        url += `&variant=${selectedVariant}`;
      }
      
      // Adicionar outros parâmetros
      url += `&isUsed=${isUsedFilter}&limit=${pagination.limit}&page=${pagination.page}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      console.log('URL de requisição:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar itens de estoque');
      }
      
      const data = await response.json();
      console.log(`Recebidos ${data.items.length} itens de estoque`);
      setStockItems(data.items);
      setPagination(data.pagination);
      
      // Atualizar também o estoque direto para produtos sem variantes
      if (!hasVariants) {
        // Se o estoque for zero, definir como null para evitar o problema de "unidade fantasma"
        const stockValue = data.pagination.total > 0 ? data.pagination.total : null;
        setDirectProductStock(stockValue || 0); // Para exibição na interface, usar 0 se for null
        if (product) {
          setProduct({...product, stock: stockValue});
        }
      }
    } catch (error) {
      console.error('Erro ao carregar itens de estoque:', error);
      setError('Não foi possível carregar os itens de estoque.');
    } finally {
      setLoading(false);
    }
  };

  // Adicionar itens de estoque manualmente
  const handleAddStockItems = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (hasVariants && !selectedVariant) {
      setError('Selecione uma variante primeiro.');
      return;
    }
    
    const itemsToAdd = bulkCodes
      .split('\n')
      .map(line => line.trim())
      .filter(code => code !== '');
    
    if (itemsToAdd.length === 0) {
      setError('Adicione pelo menos um código.');
      return;
    }
    
    try {
      setActionInProgress(true);
      console.log('Enviando requisição para adicionar itens:', {
        productId: id,
        variantId: hasVariants ? selectedVariant : undefined,
        itemsCount: itemsToAdd.length
      });
      
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          variantId: hasVariants ? selectedVariant : undefined,
          items: itemsToAdd,
        }),
      });
      
      const data = await response.json();
      console.log('Resposta da API:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao adicionar itens ao estoque');
      }
      
      // Limpar o formulário e atualizar a lista
      setBulkCodes('');
      setBulkMode(false);
      
      if (hasVariants) {
        // Atualizar a contagem de estoque na variante selecionada
        if (product && product.variants) {
          const updatedVariants = product.variants.map((variant: Variant) => {
            if (variant._id === selectedVariant) {
              // Verificar se a variante tem entrega manual e preservar esse status
              if (variant.deliveryType === 'manual') {
                // Para variantes com entrega manual, manter o estoque como 99999
                return { ...variant, stock: 99999 };
              }
              // Para variantes com entrega automática, usar o valor retornado pela API
              return { ...variant, stock: data.current_stock };
            }
            return variant;
          });
          
          setProduct({ ...product, variants: updatedVariants });
        }
      } else {
        // Atualizar o estoque direto do produto
        // Verificar se o produto tem entrega manual e preservar esse status
        if (product && product.deliveryType === 'manual') {
          // Para produtos com entrega manual, manter o estoque como 99999
          setDirectProductStock(99999);
          setProduct({ ...product, stock: 99999 });
        } else {
          // Para produtos com entrega automática, usar o valor retornado pela API
          setDirectProductStock(data.current_stock);
          setProduct({ ...product, stock: data.current_stock });
        }
      }
      
      // Atualizar a lista de itens de estoque
      fetchStockItems();
      
      alert(`${data.added} itens adicionados ao estoque com sucesso.`);
    } catch (error: any) {
      console.error('Erro ao adicionar itens:', error);
      let mensagemErro = 'Ocorreu um erro ao adicionar os itens ao estoque.';
      
      if (error.message) {
        mensagemErro = `Erro: ${error.message}`;
      }
      
      // Verificar se o erro contém informações de resposta da API
      if (error.response) {
        try {
          const errorData = await error.response.json();
          if (errorData.message) {
            mensagemErro = `Erro da API: ${errorData.message}`;
          }
        } catch (e) {
          console.error('Erro ao analisar resposta de erro:', e);
        }
      }
      
      setError(mensagemErro);
    } finally {
      setActionInProgress(false);
    }
  };

  // Carregar arquivo para importação
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  // Importar itens de estoque de um arquivo
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (hasVariants && !selectedVariant) {
      setError('Selecione uma variante primeiro.');
      return;
    }
    
    if (!file) {
      setError('Selecione um arquivo para importar.');
      return;
    }
    
    try {
      setActionInProgress(true);
      console.log('Enviando arquivo para importação:', {
        productId: id,
        variantId: hasVariants ? selectedVariant : undefined,
        fileName: file.name,
        fileSize: file.size
      });
      
      const formData = new FormData();
      formData.append('productId', id);
      if (hasVariants && selectedVariant) {
        formData.append('variantId', selectedVariant);
      }
      formData.append('file', file);
      
      const response = await fetch('/api/stock/bulk', {
        method: 'POST',
        body: formData,
        // Importante: assegurar que os cookies são enviados para manter a autenticação
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Resposta da API de importação:', data);
      
      if (!response.ok) {
        let mensagemErro = data.message || 'Erro ao importar itens';
        
        // Mensagens específicas para códigos de erro comuns
        if (response.status === 401) {
          mensagemErro = 'Sua sessão expirou. Por favor, faça login novamente.';
        } else if (response.status === 403) {
          mensagemErro = 'Você não tem permissão para importar estoque. Acesso somente para administradores.';
        }
        
        throw new Error(mensagemErro);
      }
      
      // Limpar o formulário e atualizar a lista
      setFile(null);
      // Resetar o input de arquivo
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      if (hasVariants) {
        // Atualizar a contagem de estoque na variante selecionada
        if (product && product.variants) {
          const updatedVariants = product.variants.map((variant: Variant) => {
            if (variant._id === selectedVariant) {
              // Verificar se a variante tem entrega manual e preservar esse status
              if (variant.deliveryType === 'manual') {
                // Para variantes com entrega manual, manter o estoque como 99999
                return { ...variant, stock: 99999 };
              }
              // Para variantes com entrega automática, usar o valor retornado pela API
              return { ...variant, stock: data.current_stock };
            }
            return variant;
          });
          
          setProduct({ ...product, variants: updatedVariants });
        }
      } else {
        // Atualizar o estoque direto do produto
        // Verificar se o produto tem entrega manual e preservar esse status
        if (product && product.deliveryType === 'manual') {
          // Para produtos com entrega manual, manter o estoque como 99999
          setDirectProductStock(99999);
          setProduct({ ...product, stock: 99999 });
        } else {
          // Para produtos com entrega automática, usar o valor retornado pela API
          setDirectProductStock(data.current_stock);
          setProduct({ ...product, stock: data.current_stock });
        }
      }
      
      // Atualizar a lista de itens
      fetchStockItems();
      
      alert(`Importação concluída: ${data.added} itens adicionados, ${data.duplicates} duplicados.`);
    } catch (error: any) {
      console.error('Erro ao importar arquivo:', error);
      
      let mensagemErro = 'Ocorreu um erro ao importar os itens.';
      
      if (error.message) {
        mensagemErro = `Erro: ${error.message}`;
      }
      
      // Verificar se o erro contém informações de resposta da API
      if (error.response) {
        try {
          const errorData = await error.response.json();
          if (errorData.message) {
            mensagemErro = `Erro da API: ${errorData.message}`;
          }
        } catch (e) {
          console.error('Erro ao analisar resposta de erro:', e);
        }
      }
      
      setError(mensagemErro);
    } finally {
      setActionInProgress(false);
    }
  };

  // Remover itens de estoque selecionados
  const handleRemoveSelectedItems = async () => {
    if (selectedItems.length === 0) {
      setError('Selecione pelo menos um item para remover.');
      return;
    }
    
    if (!confirm(`Tem certeza que deseja remover ${selectedItems.length} itens do estoque?`)) {
      return;
    }
    
    try {
      setActionInProgress(true);
      
      const response = await fetch('/api/stock', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedItems,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao remover itens');
      }
      
      // Limpar seleção e atualizar a lista
      setSelectedItems([]);
      
      if (hasVariants) {
        // Atualizar a contagem de estoque na variante selecionada
        if (product && product.variants) {
          const stockCount = product.variants.find((v: Variant) => v._id === selectedVariant)?.stock - data.deleted;
          
          const updatedVariants = product.variants.map((variant: Variant) => {
            if (variant._id === selectedVariant) {
              return { ...variant, stock: Math.max(0, stockCount) };
            }
            return variant;
          });
          
          setProduct({ ...product, variants: updatedVariants });
        }
      }
      
      fetchStockItems();
      
      alert(`${data.deleted} itens removidos com sucesso.`);
    } catch (error) {
      console.error('Erro ao remover itens:', error);
      setError(error.message || 'Ocorreu um erro ao remover os itens.');
    } finally {
      setActionInProgress(false);
    }
  };

  // Alternar seleção de todos os itens
  const toggleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems(stockItems.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  // Alternar seleção de um item específico
  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prevSelected => {
      if (prevSelected.includes(itemId)) {
        return prevSelected.filter(id => id !== itemId);
      } else {
        return [...prevSelected, itemId];
      }
    });
  };

  // Manipular busca
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStockItems();
  };

  // Alternar páginas
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  };

  if (loading && !product) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gerenciar Estoque</h2>
        <Link 
          href={`/admin/products/${id}`}
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Detalhes
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
          {error}
        </div>
      )}
      
      <div className="bg-dark-200 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-white mb-4">
          {product?.name} - Gerenciamento de Estoque
        </h3>
        
        {/* Seleção de variante (apenas para produtos com variantes) */}
        {hasVariants ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Selecione a Variante
            </label>
            <select
              value={selectedVariant}
              onChange={(e) => setSelectedVariant(e.target.value)}
              className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {product?.variants.map((variant: Variant) => (
                <option key={variant._id} value={variant._id}>
                  {variant.name} - Estoque: {variant.stock === 99999 ? 'Grande estoque' : `${variant.stock} unidades`}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-6">
            <div className="bg-dark-300 p-4 rounded-md">
              <h4 className="text-white font-medium mb-2">Estoque do Produto</h4>
              <div className="flex items-center">
                <span className="text-gray-300 mr-2">Estoque atual:</span>
                <span className="text-white font-semibold">{directProductStock === 99999 ? 'Grande estoque disponível' : `${directProductStock} unidades`}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">
                Este produto não possui variantes. Você gerencia o estoque através dos códigos individuais adicionados abaixo.
              </p>
            </div>
          </div>
        )}
        
        {/* Ações de estoque (para ambos os tipos de produtos) */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <button
            type="button"
            onClick={() => setBulkMode(!bulkMode)}
            className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md flex items-center justify-center"
          >
            <FiPlus className="mr-2" />
            Adicionar Códigos
          </button>
          
          <label className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md flex items-center justify-center cursor-pointer">
            <FiUpload className="mr-2" />
            Importar Arquivo
            <input
              type="file"
              id="file-input"
              accept=".txt,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          
          {file && (
            <button
              type="button"
              onClick={handleFileUpload}
              disabled={actionInProgress}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50"
            >
              {actionInProgress ? 'Processando...' : 'Processar Arquivo'}
            </button>
          )}
          
          {selectedItems.length > 0 && (
            <button
              type="button"
              onClick={handleRemoveSelectedItems}
              disabled={actionInProgress}
              className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50"
            >
              <FiTrash2 className="mr-2" />
              Remover ({selectedItems.length})
            </button>
          )}
        </div>
        
        {/* Formulário para adicionar itens em massa */}
        {bulkMode && (
          <div className="bg-dark-300 p-4 rounded-md mb-6">
            <h4 className="text-white font-medium mb-2">Adicionar Códigos em Massa</h4>
            <p className="text-gray-400 text-sm mb-3">
              Adicione um código por linha. Códigos duplicados serão ignorados.
            </p>
            
            <form onSubmit={handleAddStockItems}>
              <textarea
                value={bulkCodes}
                onChange={(e) => setBulkCodes(e.target.value)}
                rows={6}
                placeholder="Insira um código por linha..."
                className="w-full px-3 py-2 bg-dark-400 text-white border border-dark-500 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-3"
              />
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setBulkMode(false)}
                  className="bg-dark-400 hover:bg-dark-500 text-white py-1 px-3 rounded-md mr-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress || !bulkCodes.trim()}
                  className="bg-primary hover:bg-primary/90 text-white py-1 px-3 rounded-md disabled:opacity-50"
                >
                  {actionInProgress ? 'Adicionando...' : 'Adicionar Itens'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {/* Filtros e pesquisa */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <form onSubmit={handleSearch} className="flex">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar por código..."
                className="flex-1 px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="bg-primary px-3 py-2 rounded-r-md text-white"
              >
                <FiSearch />
              </button>
            </form>
          </div>
          
          <div className="flex items-center">
            <span className="text-gray-300 mr-2">Filtrar:</span>
            <select
              value={isUsedFilter}
              onChange={(e) => setIsUsedFilter(e.target.value)}
              className="px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="false">Disponível</option>
              <option value="true">Usado</option>
              <option value="">Todos</option>
            </select>
          </div>
        </div>
        
        {/* Tabela de itens de estoque */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-dark-300">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === stockItems.length && stockItems.length > 0}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="h-4 w-4 bg-dark-300 border border-dark-400 rounded focus:ring-primary focus:ring-2"
                    />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Atribuído a
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Data
                </th>
              </tr>
            </thead>
            <tbody className="bg-dark-300 divide-y divide-dark-400">
              {stockItems.length > 0 ? (
                stockItems.map((item) => (
                  <tr key={item._id} className="hover:bg-dark-400">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item._id)}
                        onChange={() => toggleSelectItem(item._id)}
                        className="h-4 w-4 bg-dark-300 border border-dark-400 rounded focus:ring-primary focus:ring-2"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-mono text-sm text-white">{item.code}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.isUsed 
                          ? 'bg-red-900/30 text-red-400' 
                          : 'bg-green-900/30 text-green-400'
                      }`}>
                        {item.isUsed ? 'Usado' : 'Disponível'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.assignedTo ? (
                        <div className="text-sm text-white">
                          {item.assignedTo.username}
                          <div className="text-xs text-gray-400">{item.assignedTo.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {item.isUsed ? (
                        new Date(item.assignedAt as string).toLocaleString('pt-BR')
                      ) : (
                        new Date(item.createdAt).toLocaleString('pt-BR')
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-400">
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Paginação */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-gray-400">
              Mostrando {stockItems.length} de {pagination.total} itens
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-dark-300 text-white rounded-md disabled:opacity-50"
              >
                Anterior
              </button>
              
              <span className="px-3 py-1 bg-dark-400 text-white rounded-md">
                {pagination.page} / {pagination.pages}
              </span>
              
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 bg-dark-300 text-white rounded-md disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 