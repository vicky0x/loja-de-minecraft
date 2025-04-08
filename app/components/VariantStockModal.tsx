'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiX, FiPackage, FiLoader, FiRefreshCw, FiEdit, FiSave, FiCheck } from 'react-icons/fi';

interface Variant {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface Product {
  _id: string;
  name: string;
  price?: number;
  stock?: number;
  variants: Variant[];
}

interface VariantStockModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VariantStockModal({ productId, isOpen, onClose }: VariantStockModalProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [productName, setProductName] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [productStock, setProductStock] = useState<number | undefined>(undefined);
  const [productPrice, setProductPrice] = useState<number | undefined>(undefined);
  const [hasVariants, setHasVariants] = useState(true);
  const [editingStock, setEditingStock] = useState(false);
  const [newStockValue, setNewStockValue] = useState(0);
  const [editingStockForVariant, setEditingStockForVariant] = useState<string | null>(null);
  const [variantNewStockValues, setVariantNewStockValues] = useState<Record<string, number>>({});

  // Função para buscar os dados do produto e suas variantes
  const fetchProductVariants = useCallback(async (showRefreshIndicator = true) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      setSuccessMessage('');
      
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do produto');
      }
      
      const data = await response.json();
      if (data.product) {
        const product = data.product as Product;
        setProductName(product.name || 'Produto');
        
        // Determinar se o produto tem variantes ou usa estoque direto
        const productHasVariants = Array.isArray(product.variants) && product.variants.length > 0;
        setHasVariants(productHasVariants);
        
        if (productHasVariants) {
          setVariants(product.variants);
          // Inicializar os valores de edição para cada variante
          const initialStockValues: Record<string, number> = {};
          product.variants.forEach(v => {
            initialStockValues[v._id] = v.stock;
          });
          setVariantNewStockValues(initialStockValues);
          
          // Limpar os valores de estoque direto quando usando variantes
          setProductStock(undefined);
          setProductPrice(undefined);
        } else {
          // Quando não tiver variantes, usar o estoque e preço direto do produto
          setVariants([]);
          setProductStock(product.stock || 0);
          setNewStockValue(product.stock || 0);
          setProductPrice(product.price || 0);
        }
        
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Erro ao carregar variantes:', error);
      setError('Não foi possível carregar os dados do produto. Tente novamente mais tarde.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [productId]);

  // Atualizar o estoque do produto sem variante
  const updateProductStock = async () => {
    if (!productId || hasVariants) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      // Enviar requisição para atualizar apenas o estoque
      const response = await fetch(`/api/products/${productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: newStockValue,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar estoque');
      }
      
      // Atualizar o estoque localmente
      setProductStock(newStockValue);
      setEditingStock(false);
      setSuccessMessage('Estoque atualizado com sucesso!');
      
      // Recarregar os dados após um curto período
      setTimeout(() => {
        fetchProductVariants(true);
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao atualizar estoque:', error);
      setError(error.message || 'Erro ao atualizar estoque. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Atualizar o estoque de uma variante
  const updateVariantStock = async (variantId: string) => {
    if (!productId || !variantId) return;
    
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');
      
      const newStock = variantNewStockValues[variantId];
      
      // Enviar requisição para atualizar o estoque da variante
      const response = await fetch(`/api/products/${productId}/variants/${variantId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stock: newStock,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao atualizar estoque da variante');
      }
      
      // Atualizar o estoque localmente
      setVariants(variants.map(v => 
        v._id === variantId 
          ? {...v, stock: newStock} 
          : v
      ));
      
      setEditingStockForVariant(null);
      setSuccessMessage('Estoque atualizado com sucesso!');
      
      // Recarregar os dados após um curto período
      setTimeout(() => {
        fetchProductVariants(true);
      }, 1500);
      
    } catch (error: any) {
      console.error('Erro ao atualizar estoque da variante:', error);
      setError(error.message || 'Erro ao atualizar estoque. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Carregar dados quando o modal for aberto
  useEffect(() => {
    if (isOpen && productId) {
      fetchProductVariants(false);
    }
  }, [isOpen, productId, fetchProductVariants]);

  // Configurar atualização automática a cada 30 segundos quando o modal estiver aberto
  useEffect(() => {
    if (!isOpen) return;
    
    const intervalId = setInterval(() => {
      fetchProductVariants(true);
    }, 30000); // Atualiza a cada 30 segundos
    
    return () => clearInterval(intervalId);
  }, [isOpen, fetchProductVariants]);

  // Se o modal não estiver aberto, não renderize nada
  if (!isOpen) return null;

  // Formatar a hora da última atualização
  const formattedLastUpdate = lastUpdated 
    ? lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-dark-200 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-4 border-b border-dark-400">
          <h3 className="text-xl font-semibold text-white flex items-center">
            <FiPackage className="mr-2" />
            {hasVariants ? 'Planos e Estoque:' : 'Estoque:'} {productName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white focus:outline-none"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* Conteúdo */}
        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <FiLoader className="animate-spin text-primary mr-2" size={20} />
              <span className="text-white">Carregando dados do produto...</span>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
              {error}
            </div>
          ) : successMessage ? (
            <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 mb-4">
              <div className="flex items-center">
                <FiCheck className="mr-2" />
                {successMessage}
              </div>
            </div>
          ) : null}
          
          {!loading && !error && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-400">
                Última atualização: {formattedLastUpdate}
              </div>
              <button
                onClick={() => fetchProductVariants(true)}
                disabled={refreshing || saving}
                className="flex items-center text-primary hover:text-primary/80 disabled:text-gray-500"
              >
                <FiRefreshCw className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">Atualizar</span>
              </button>
            </div>
          )}
          
          {!loading && !error && hasVariants && variants.length > 0 ? (
            <div className="space-y-4">
              {variants.map((variant) => (
                <div key={variant._id} className="bg-dark-300 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white mb-1">{variant.name}</h4>
                      <p className="text-sm text-gray-400 mb-2">{variant.description}</p>
                      <div className="text-lg font-semibold text-white">
                        R$ {variant.price.toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="font-medium text-white mb-1">Estoque:</div>
                      {editingStockForVariant === variant._id ? (
                        <div className="flex items-center">
                          <input
                            type="number"
                            min="0"
                            value={variantNewStockValues[variant._id]}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              if (!isNaN(value) && value >= 0) {
                                setVariantNewStockValues({
                                  ...variantNewStockValues,
                                  [variant._id]: value
                                });
                              }
                            }}
                            className="w-20 px-2 py-1 bg-dark-400 text-white border border-dark-500 rounded-md mr-2"
                          />
                          <button
                            onClick={() => updateVariantStock(variant._id)}
                            disabled={saving}
                            className="p-1 text-green-400 hover:text-green-300"
                          >
                            {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                          </button>
                          <button
                            onClick={() => setEditingStockForVariant(null)}
                            className="p-1 text-red-400 hover:text-red-300 ml-1"
                          >
                            <FiX />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          {!editingStockForVariant[variant._id] ? (
                            <div className={`text-lg font-bold ${
                              variant.stock > 10 
                                ? 'text-green-400' 
                                : variant.stock > 0 
                                  ? 'text-yellow-400' 
                                  : 'text-red-400'
                            }`}>
                              {variant.stock === 99999 ? 'Grande estoque disponível' : variant.stock}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className={`text-lg font-bold ${
                                variant.stock > 10 
                                  ? 'text-green-400' 
                                  : variant.stock > 0 
                                    ? 'text-yellow-400' 
                                    : 'text-red-400'
                              }`}>
                                {variant.stock}
                              </div>
                              <button
                                onClick={() => setEditingStockForVariant(null)}
                                className="p-1 text-red-400 hover:text-red-300 ml-2"
                              >
                                <FiX />
                              </button>
                            </div>
                          )}
                          <button
                            onClick={() => setEditingStockForVariant(variant._id)}
                            className="p-1 text-primary hover:text-primary/80 ml-2"
                            title="Editar estoque"
                          >
                            <FiEdit size={16} />
                          </button>
                        </div>
                      )}
                      {variant.stock <= 5 && variant.stock > 0 && (
                        <div className="text-xs text-yellow-400 mt-1">
                          Estoque baixo
                        </div>
                      )}
                      {variant.stock === 0 && (
                        <div className="text-xs text-red-400 mt-1">
                          Indisponível
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading && !error && !hasVariants && productPrice !== undefined ? (
            <div className="bg-dark-300 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-white mb-1">Preço único</h4>
                  <div className="text-lg font-semibold text-white">
                    R$ {productPrice.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-medium text-white mb-1">Estoque:</div>
                  {editingStock ? (
                    <div className="flex items-center">
                      <input
                        type="number"
                        min="0"
                        value={newStockValue}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (!isNaN(value) && value >= 0) {
                            setNewStockValue(value);
                          }
                        }}
                        className="w-20 px-2 py-1 bg-dark-400 text-white border border-dark-500 rounded-md mr-2"
                      />
                      <button
                        onClick={updateProductStock}
                        disabled={saving}
                        className="p-1 text-green-400 hover:text-green-300"
                      >
                        {saving ? <FiLoader className="animate-spin" /> : <FiSave />}
                      </button>
                      <button
                        onClick={() => setEditingStock(false)}
                        className="p-1 text-red-400 hover:text-red-300 ml-1"
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className={`text-lg font-bold ${
                        productStock! > 10 
                          ? 'text-green-400' 
                          : productStock! > 0 
                            ? 'text-yellow-400' 
                            : 'text-red-400'
                      }`}>
                        {productStock === 99999 ? 'Grande estoque disponível' : productStock}
                      </div>
                      <button
                        onClick={() => setEditingStock(true)}
                        className="p-1 text-primary hover:text-primary/80 ml-2"
                        title="Editar estoque"
                      >
                        <FiEdit size={16} />
                      </button>
                    </div>
                  )}
                  {productStock! <= 5 && productStock! > 0 && (
                    <div className="text-xs text-yellow-400 mt-1">
                      Estoque baixo
                    </div>
                  )}
                  {productStock === 0 && (
                    <div className="text-xs text-red-400 mt-1">
                      Indisponível
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : !loading && !error ? (
            <div className="text-center py-8 text-gray-400">
              Este produto não possui planos/variantes cadastrados.
            </div>
          ) : null}
        </div>
        
        {/* Rodapé */}
        <div className="border-t border-dark-400 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
} 