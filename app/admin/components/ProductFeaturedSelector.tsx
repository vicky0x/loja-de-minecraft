'use client';

import React, { useState, useEffect } from 'react';
import { FiCheck, FiSearch, FiX, FiLoader, FiPlus, FiSave } from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  images?: string[];
  slug: string;
  price: number;
  featured?: boolean;
}

export default function ProductFeaturedSelector() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invalidProductIds, setInvalidProductIds] = useState<string[]>([]);
  const [isRemovingInvalid, setIsRemovingInvalid] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchSelectedProducts();
  }, []);

  // Verificar produtos inválidos sempre que a lista de produtos ou selecionados mudar
  useEffect(() => {
    if (products.length > 0 && selectedProducts.length > 0) {
      // Criar um Set para busca mais rápida
      const validIdSet = new Set(products.map(p => p?._id).filter(Boolean));
      
      // Encontrar IDs selecionados que não existem nos produtos válidos
      const invalidIds = selectedProducts.filter(id => !validIdSet.has(id));
      
      if (invalidIds.length > 0) {
        console.warn('IDs de produtos inválidos encontrados:', invalidIds);
        setInvalidProductIds(invalidIds);
      } else {
        setInvalidProductIds([]);
      }
    }
  }, [products, selectedProducts]);

  // Buscar todos os produtos
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products?limit=100');
      if (!response.ok) {
        throw new Error('Falha ao buscar produtos');
      }
      const data = await response.json();
      // Garantir que sempre temos um array, mesmo que vazio
      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setError('Falha ao carregar produtos. Tente novamente.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Buscar produtos selecionados para a página principal
  const fetchSelectedProducts = async () => {
    try {
      const response = await fetch('/api/featuredProducts');
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.featuredProducts)) {
          setSelectedProducts(data.featuredProducts);
          // A verificação de IDs inválidos agora é feita no useEffect
        } else {
          // Se não houver produtos em destaque na API, buscar os featured do banco
          fetchFeaturedFromDatabase();
        }
      } else {
        fetchFeaturedFromDatabase();
      }
    } catch (error) {
      console.error('Erro ao buscar produtos em destaque:', error);
      fetchFeaturedFromDatabase();
    }
  };

  // Função de fallback para buscar produtos com featured=true no banco
  const fetchFeaturedFromDatabase = async () => {
    try {
      const response = await fetch('/api/products?featured=true&limit=20');
      if (response.ok) {
        const data = await response.json();
        if (data.products && Array.isArray(data.products)) {
          const featuredIds = data.products.map((product: Product) => product._id);
          setSelectedProducts(featuredIds);
        } else {
          setSelectedProducts([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar produtos featured do banco:', error);
      setSelectedProducts([]);
    }
  };

  // Salvar produtos selecionados
  const saveSelectedProducts = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      const response = await fetch('/api/featuredProducts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featuredProducts: selectedProducts }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess('Produtos selecionados com sucesso! Os produtos selecionados agora aparecem na página inicial.');
      } else {
        throw new Error(data.message || 'Falha ao salvar produtos em destaque');
      }
    } catch (error: any) {
      console.error('Erro ao salvar produtos:', error);
      setError(error.message || 'Falha ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Função para limpar produtos inválidos dos destaques
  const removeInvalidProducts = async () => {
    try {
      setIsRemovingInvalid(true);
      setError(null);
      
      // Filtrar apenas os produtos válidos
      const validProducts = selectedProducts.filter(id => !invalidProductIds.includes(id));
      
      // Atualizar o estado
      setSelectedProducts(validProducts);
      
      // Salvar os produtos válidos na API
      const response = await fetch('/api/featuredProducts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ featuredProducts: validProducts }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setSuccess(`${invalidProductIds.length} produtos inválidos foram removidos dos destaques.`);
        setInvalidProductIds([]);
      } else {
        throw new Error(data.message || 'Falha ao atualizar produtos em destaque');
      }
    } catch (error: any) {
      console.error('Erro ao remover produtos inválidos:', error);
      setError(error.message || 'Falha ao remover produtos inválidos. Tente novamente.');
    } finally {
      setIsRemovingInvalid(false);
    }
  };

  // Alternar seleção de produto
  const toggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        // Limitar a 4 produtos selecionados
        if (prev.length >= 4) {
          // Remover o primeiro e adicionar o novo
          const newSelection = [...prev.slice(1), productId];
          return newSelection;
        }
        return [...prev, productId];
      }
    });
  };

  // Filtrar produtos com base na pesquisa
  const filteredProducts = products.filter(product => 
    product && product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-dark-200 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-white mb-4">Selecionar Produtos para a Página Principal</h3>
      
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 mb-4">
          {success}
        </div>
      )}
      
      {invalidProductIds.length > 0 && (
        <div className="bg-amber-900/30 border-l-4 border-amber-500 p-4 text-amber-400 mb-4 flex flex-col">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">Atenção: {invalidProductIds.length} produtos em destaque não foram encontrados</p>
              <p className="text-sm mt-1">Esses produtos podem ter sido excluídos ou estão temporariamente indisponíveis.</p>
            </div>
            <button 
              onClick={removeInvalidProducts}
              disabled={isRemovingInvalid}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md ml-4 text-sm flex items-center whitespace-nowrap disabled:opacity-50"
            >
              {isRemovingInvalid ? 'Removendo...' : 'Remover inválidos'}
            </button>
          </div>
          <div className="mt-2 text-xs space-y-1">
            {invalidProductIds.map(id => (
              <div key={id} className="font-mono bg-dark-400/50 p-1 rounded">ID: {id}</div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="w-full pl-10 pr-4 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setSearchTerm('')}
              >
                <FiX className="text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
          
          <button
            onClick={saveSelectedProducts}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FiLoader className="animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Salvar Seleção
              </>
            )}
          </button>
        </div>
        
        <div className="mt-2 text-sm text-gray-400 flex justify-between">
          <span>{selectedProducts.length} produtos selecionados para a página principal</span>
          <span className={selectedProducts.length >= 4 ? "text-amber-400" : ""}>
            {selectedProducts.length}/4 (máximo)
          </span>
        </div>
      </div>
      
      {/* Exibir selecionados primeiro */}
      {selectedProducts.length > 0 && products.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-white mb-2">Produtos Selecionados:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {selectedProducts.map((id, index) => {
              const product = products.find(p => p && p._id === id);
              if (!product) return (
                <div key={`missing-${id}-${index}`} className="bg-red-900/20 border border-red-500/30 p-3 rounded-md flex items-center">
                  <div className="text-red-400 text-sm">Produto não encontrado (ID: {id.substring(0, 8)}...)</div>
                </div>
              );
              
              return (
                <div 
                  key={product._id}
                  className="bg-primary/20 border border-primary/30 p-3 rounded-md flex items-center space-x-2"
                >
                  {/* Ordem */}
                  <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  
                  {/* Imagem do produto */}
                  <div className="w-10 h-10 bg-dark-400 rounded-md overflow-hidden flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiPlus className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  
                  {/* Nome do produto */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
                  </div>
                  
                  {/* Botão para remover */}
                  <button
                    onClick={() => toggleProductSelection(product._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FiX />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2">
          {filteredProducts.length > 0 ? (
            filteredProducts
              // Filtrar para não mostrar os já selecionados
              .filter(product => product && product._id && !selectedProducts.includes(product._id))
              .map(product => (
                <div 
                  key={product._id}
                  className="p-4 rounded-md flex items-center space-x-3 cursor-pointer transition-colors bg-dark-300 border border-dark-400 hover:bg-dark-400"
                  onClick={() => toggleProductSelection(product._id)}
                >
                  {/* Imagem do produto */}
                  <div className="w-12 h-12 bg-dark-400 rounded-md overflow-hidden flex-shrink-0">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiPlus className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  
                  {/* Informações do produto */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
                    <div className="text-xs text-gray-400 truncate">
                      R$ {(product.price || 0).toFixed(2).replace('.', ',')}
                      {product.featured && (
                        <span className="ml-2 text-primary text-xs">Destaque</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Adicionar botão */}
                  <button 
                    className="w-6 h-6 rounded-full bg-dark-400 flex items-center justify-center text-gray-300 hover:bg-primary/20 hover:text-white transition-colors"
                    disabled={selectedProducts.length >= 4}
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
              ))
          ) : searchTerm ? (
            <div className="col-span-full text-center py-8 text-gray-400">
              Nenhum produto encontrado para "{searchTerm}"
            </div>
          ) : (
            <div className="col-span-full text-center py-8 text-gray-400">
              Nenhum produto disponível
            </div>
          )}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-400">
        <p>Selecione até 4 produtos que deseja exibir na página principal. Os produtos selecionados serão exibidos na ordem em que foram selecionados.</p>
      </div>
    </div>
  );
} 