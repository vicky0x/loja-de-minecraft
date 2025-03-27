'use client';

import { useState, useEffect, useCallback } from 'react';
import { FiX, FiPackage, FiLoader, FiRefreshCw } from 'react-icons/fi';

interface Variant {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface VariantStockModalProps {
  productId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function VariantStockModal({ productId, isOpen, onClose }: VariantStockModalProps) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [error, setError] = useState('');
  const [productName, setProductName] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Função para buscar os dados do produto e suas variantes
  const fetchProductVariants = useCallback(async (showRefreshIndicator = true) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError('');
      
      const response = await fetch(`/api/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar dados do produto');
      }
      
      const data = await response.json();
      if (data.product) {
        if (data.product.variants) {
          setVariants(data.product.variants);
        } else {
          setVariants([]);
        }
        setProductName(data.product.name || 'Produto');
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
            Planos e Estoque: {productName}
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
              <span className="text-white">Carregando planos...</span>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
              {error}
            </div>
          ) : variants.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-400">
                  Última atualização: {formattedLastUpdate}
                </div>
                <button
                  onClick={() => fetchProductVariants(true)}
                  disabled={refreshing}
                  className="flex items-center text-primary hover:text-primary/80 disabled:text-gray-500"
                >
                  <FiRefreshCw className={`mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm">Atualizar</span>
                </button>
              </div>
              
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
                        <div className={`text-lg font-bold ${
                          variant.stock > 10 
                            ? 'text-green-400' 
                            : variant.stock > 0 
                              ? 'text-yellow-400' 
                              : 'text-red-400'
                        }`}>
                          {variant.stock}
                        </div>
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
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              Este produto não possui planos/variantes cadastrados.
            </div>
          )}
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