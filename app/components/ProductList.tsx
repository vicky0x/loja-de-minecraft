'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FiStar, FiAlertCircle, FiPlus, FiShoppingCart, FiGrid, FiList, FiChevronDown, FiChevronUp, FiFilter, FiX } from 'react-icons/fi';
import ErrorDisplay from './ui/ErrorDisplay';
import { toast } from 'react-hot-toast';
import { formatProductName } from '@/app/utils/formatters';

interface Product {
  _id: string;
  name: string;
  images?: string[];
  slug: string;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  stock?: number;
  status?: string;
  image?: string;
}

interface FormattedProduct extends Product {
  image: string;
  rating?: number;
  ratingCount?: number;
}

interface ProductListProps {
  selectedIds?: string[]; // IDs específicos de produtos para exibir
  limit?: number; // Número máximo de produtos a mostrar
  showTitle?: boolean; // Se deve mostrar o título
  title?: string; // Título personalizado
}

export default function ProductList({ 
  selectedIds, 
  limit = 4, 
  showTitle = false,
  title = "Produtos em Destaque" 
}: ProductListProps) {
  const [products, setProducts] = useState<FormattedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedProductIds, setFailedProductIds] = useState<string[]>([]);
  const [ratings, setRatings] = useState<{[key: string]: number}>({});
  const [ratingCounts, setRatingCounts] = useState<{[key: string]: number}>({});
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  const [lastHourlyUpdate, setLastHourlyUpdate] = useState<number>(Date.now());
  const [renderError, setRenderError] = useState<Error | null>(null);
  
  // Estado para rastrear quais elementos estão animando
  const [animatingRatings, setAnimatingRatings] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    let isMounted = true; // Flag para evitar atualização do estado após desmontagem
    
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        setFailedProductIds([]); // Limpar lista de IDs com falha
        
        // Se temos IDs específicos, buscar produtos por ID
        if (selectedIds && selectedIds.length > 0) {
          // Verificar se todos os IDs são válidos
          const invalidIds = selectedIds.filter(id => !id || typeof id !== 'string' || id.trim() === '');
          if (invalidIds.length > 0) {
            console.error(`IDs inválidos encontrados:`, invalidIds);
            setFailedProductIds(invalidIds);
          }
          
          const formattedProducts = await fetchProductsByIds(selectedIds);
          
          if (isMounted) {
            setProducts(formattedProducts);
          }
        } else {
          // Caso contrário, buscar produtos em destaque
          const formattedProducts = await fetchFeaturedProducts(limit);
          
          if (isMounted) {
            setProducts(formattedProducts);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        
        if (isMounted) {
          setError('Falha ao carregar produtos');
          setProducts([]);
          
          if (selectedIds && selectedIds.length > 0) {
            // Marcar todos os IDs como falha
            setFailedProductIds(selectedIds);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();
    
    return () => {
      isMounted = false; // Evitar atualização do estado após desmontagem
    };
  }, [selectedIds, limit]);

  // Efeito para inicializar contadores fake de avaliações
  useEffect(() => {
    if (products.length > 0) {
      const initialRatings: {[key: string]: number} = {};
      const initialRatingCounts: {[key: string]: number} = {};
      
      // Ordenar produtos por preço para calcular as avaliações proporcionalmente inversas ao preço
      const sortedProducts = [...products].sort((a, b) => a.price - b.price);
      const totalProducts = sortedProducts.length;
      
      sortedProducts.forEach((product, index) => {
        // Cria valores baseados no ID do produto para garantir consistência em todas as páginas
        // Converte os primeiros 8 caracteres do ID para um número para usar como seed
        const baseSeed = parseInt(product._id.substring(0, 8), 16);
        
        // Avaliação entre 4.7 e 5.0, consistente para o mesmo produto em qualquer página
        // Produtos mais baratos tendem a ter avaliações um pouco melhores
        const position = totalProducts > 1 ? index / (totalProducts - 1) : 0;
        const ratingBonus = 0.3 * (1 - position); // 0.3 para o mais barato, 0 para o mais caro
        initialRatings[product._id] = 4.7 + ((baseSeed % 20) / 100) + ratingBonus;
        
        // Contagem de avaliações - produtos mais baratos têm muito mais avaliações
        // Escala de 300 a 50, com base na posição relativa do produto no ranking de preço
        const maxCount = 500;
        const minCount = 50;
        const countRange = maxCount - minCount;
        
        // Calcular inversamente proporcional ao preço
        // Produtos mais baratos (início do array) têm mais avaliações
        const countMultiplier = 1 - (index / totalProducts);
        initialRatingCounts[product._id] = Math.floor(minCount + (countRange * countMultiplier));
      });
      
      setRatings(initialRatings);
      setRatingCounts(initialRatingCounts);
    }
  }, [products]);

  // Efeito para incrementar contadores de forma consistente em todas as páginas
  useEffect(() => {
    // Armazenar as contagens no localStorage para manter consistência entre páginas
    const storedCounts = localStorage.getItem('productRatingCounts');
    if (storedCounts) {
      try {
        const parsedCounts = JSON.parse(storedCounts);
        setRatingCounts(prevCounts => ({
          ...prevCounts,
          ...parsedCounts
        }));
      } catch (e) {
        console.error('Erro ao carregar contagens salvas:', e);
      }
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeDiff = now - lastUpdateTime;
      const hourlyDiff = now - lastHourlyUpdate;
      
      // Simular atualizações horárias - a cada 60 segundos para teste
      // Em produção, pode-se ajustar para 60 * 60 * 1000 (1 hora)
      if (hourlyDiff >= 60 * 1000) {
        setLastHourlyUpdate(now);
        
        // Incrementar contagens de avaliações para todos os produtos
        setRatingCounts(prev => {
          const newCounts = {...prev};
          
          // Ordenar produtos por preço para incrementar proporcionalmente
          const sortedProducts = [...products].sort((a, b) => a.price - b.price);
          const totalProducts = sortedProducts.length;
          
          sortedProducts.forEach((product, index) => {
            // Produtos mais baratos recebem mais incrementos de avaliações
            const position = totalProducts > 1 ? index / (totalProducts - 1) : 0;
            const incrementMultiplier = 1 - position;
            
            // Usar o ID do produto como seed para o incremento, garantindo consistência
            const productSeed = parseInt(product._id.substring(0, 4), 16);
            const date = new Date();
            const daySeed = date.getDate() + date.getMonth() * 30;
            
            // Base de incremento entre 1 e 4, multiplicado pelo fator de preço
            const baseIncrement = 1 + ((productSeed + daySeed) % 4);
            const increment = Math.max(1, Math.round(baseIncrement * incrementMultiplier * 3));
            
            newCounts[product._id] = (prev[product._id] || 0) + increment;
          });
          
          // Salvar as novas contagens no localStorage para persistência entre páginas
          localStorage.setItem('productRatingCounts', JSON.stringify(newCounts));
          
          return newCounts;
        });
      }
      
      // Atualizações visuais menores a cada poucos segundos
      if (timeDiff >= 5000) {
        setLastUpdateTime(now);
        
        // Seleciona um produto aleatório para animação visual
        const randomProductIndex = Math.floor(Math.random() * products.length);
        if (randomProductIndex < products.length && products[randomProductIndex]) {
          const productId = products[randomProductIndex]._id;
          
          // Ajusta a avaliação média ligeiramente
          setRatings(prev => {
            const currentRating = prev[productId] || 4.85;
            // Manter entre 4.7 e 5.0
            const newRating = Math.max(4.7, Math.min(5.0, currentRating + (Math.random() * 0.1 - 0.05)));
            
            // Ativa a animação
            setAnimatingRatings(prev => ({
              ...prev,
              [productId]: true
            }));
            
            // Desativa a animação após 500ms
            setTimeout(() => {
              setAnimatingRatings(prev => ({
                ...prev,
                [productId]: false
              }));
            }, 500);
            
            return {
              ...prev,
              [productId]: parseFloat(newRating.toFixed(1))
            };
          });
        }
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [products, lastUpdateTime, lastHourlyUpdate]);

  // Função para buscar produtos por IDs específicos
  async function fetchProductsByIds(ids: string[]): Promise<FormattedProduct[]> {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }
      
      // Array para rastrear IDs de produtos que falharam
      const failedIds: string[] = [];
      
      // Buscar cada produto por ID
      const productPromises = ids.map(async (id) => {
        try {
          // Se o ID for inválido, marcar como falha imediatamente
          if (!id || typeof id !== 'string' || id.trim() === '') {
            failedIds.push(id || 'id-invalido');
            return null;
          }
          
          // Verificação específica para ID problemático mencionado no erro
          if (id === '67f13240d2815ba12e2b847a') {
            console.warn('ID problemático detectado, marcando como indisponível:', id);
            failedIds.push(id);
            return null;
          }

          const response = await fetch(`/api/products/${id}`);
          
          if (!response.ok) {
            // Melhor tratamento do erro com mensagem clara
            if (response.status === 404) {
              console.warn(`Produto não encontrado: ${id}`);
              failedIds.push(id);
              return null;
            } else {
              console.error(`Erro ao buscar produto ${id}: status ${response.status}`);
              failedIds.push(id);
              return null;
            }
          }
          
          // Tratar problema de resposta JSON inválida
          try {
            const data = await response.json();
            if (!data || !data.product) {
              console.error(`Dados inválidos retornados para o produto ${id}`);
              failedIds.push(id);
              return null;
            }
            return data.product;
          } catch (jsonError) {
            console.error(`Erro ao processar JSON para produto ${id}:`, jsonError);
            failedIds.push(id);
            return null;
          }
        } catch (err) {
          console.error(`Erro de rede ao buscar produto ${id}:`, err);
          failedIds.push(id);
          return null;
        }
      });

      // Usar Promise.allSettled em vez de Promise.all para garantir que erros em promessas 
      // individuais não interrompam todo o conjunto
      const settledPromises = await Promise.allSettled(productPromises);
      
      // Atualizar o estado com os IDs de produtos que falharam
      if (failedIds.length > 0) {
        setFailedProductIds(failedIds);
        // Notificar usuário apenas se houver muitos produtos com falha
        if (failedIds.length > 1 || (ids.length === 1 && failedIds.length === 1)) {
          toast.error(`Falha ao carregar ${failedIds.length} produto(s)`);
        }
      }
      
      // Processar resultados, pegando apenas os que foram resolvidos com sucesso
      const productsData = settledPromises
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value !== null)
        .map(result => result.value);
      
      // Filtrar produtos nulos e mapear para o formato esperado
      const formattedProducts = productsData
        .filter(product => product !== null && typeof product === 'object')
        .map(product => formatProduct(product));

      // Se não encontramos nenhum produto mas tínhamos IDs para buscar, mostrar erro
      if (formattedProducts.length === 0 && ids.length > 0) {
        setError('Não foi possível carregar nenhum dos produtos solicitados');
      }
        
      return formattedProducts;
    } catch (error) {
      console.error('Erro ao buscar produtos por IDs:', error);
      // Notificar o usuário do erro
      setError('Falha ao carregar produtos. Tente novamente mais tarde.');
      // Retornar array vazio em caso de erro para evitar quebrar a renderização
      return [];
    }
  }

  // Função para buscar produtos em destaque
  async function fetchFeaturedProducts(limit: number): Promise<FormattedProduct[]> {
    try {
      const response = await fetch(`/api/products?featured=true&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Falha ao buscar produtos em destaque');
      }
      
      const data = await response.json();
      
      // Verificar se temos produtos e se é um array
      if (!data.products || !Array.isArray(data.products)) {
        console.error('Formato de resposta inválido:', data);
        return [];
      }
      
      // Mapear os produtos para o formato esperado pelo componente
      return data.products
        .filter(product => product && typeof product === 'object')
        .map(product => formatProduct(product));
    } catch (error) {
      console.error('Erro ao buscar produtos em destaque:', error);
      return [];
    }
  }

  // Função para formatar um produto para o formato usado pelo componente
  function formatProduct(product: Product): FormattedProduct {
    if (!product) {
      throw new Error('Produto inválido');
    }
    
    return {
      _id: product._id || 'sem-id',
      name: product.name || 'Produto sem nome',
      image: product.image || (product.images && product.images.length > 0 ? product.images[0] : '/images/placeholder.png'),
      slug: product.slug || 'sem-slug',
      price: typeof product.price === 'number' ? product.price : 0,
      originalPrice: typeof product.originalPrice === 'number' ? product.originalPrice : 0,
      discountPercentage: typeof product.discountPercentage === 'number' ? product.discountPercentage : 0,
      stock: typeof product.stock === 'number' ? product.stock : 0,
      status: product.stock === 0 ? 'Esgotado' : (product.stock && product.stock < 5 ? 'Últimas unidades' : ''),
      images: product.images || []
    };
  }

  // Função para obter a cor da classificação com base no valor
  const getRatingColorClass = (rating: number): string => {
    if (rating >= 4.9) return 'text-amber-400';
    if (rating >= 4.8) return 'text-yellow-500';
    return 'text-yellow-600';
  };

  // Componente para exibir quando um produto específico falha ao carregar
  function ProductErrorPlaceholder({ id = '' }: { id?: string }) {
    // Formatar ID para exibição mais amigável
    const formattedId = id ? id.substring(0, 8) + '...' : 'ID desconhecido';
    
    return (
      <div className="group relative flex flex-col bg-dark-200/70 rounded-xl overflow-hidden border border-dark-300/50 transition-all duration-500 animate-fade-in">
        <div className="relative w-full pt-[80%] bg-gradient-to-b from-dark-300/50 to-dark-200/50 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <FiAlertCircle size={32} className="text-red-400 mb-2" />
            <p className="text-red-300 font-medium">Produto não encontrado</p>
            <p className="text-xs text-gray-400 mt-2">Este produto pode ter sido removido ou está temporariamente indisponível</p>
            <p className="text-xs font-mono bg-dark-400/70 px-2 py-1 rounded mt-2 text-gray-500">{formattedId}</p>
          </div>
        </div>
        <div className="flex flex-col flex-grow px-4 py-3">
          <div className="h-4 bg-dark-300/70 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-dark-300/70 rounded mb-2 w-1/2"></div>
        </div>
        <div className="px-4 py-3">
          <div className="h-8 bg-dark-300/70 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  // Wrapper para capturar erros de renderização
  try {
    if (renderError) {
      return (
        <ErrorDisplay 
          title="Erro de renderização" 
          message="Ocorreu um erro ao renderizar os produtos. Por favor, tente novamente mais tarde."
          onRetry={() => {
            setRenderError(null);
            setError(null);
            setLoading(true);
            // Se temos IDs específicos, buscar produtos por ID
            if (selectedIds && selectedIds.length > 0) {
              fetchProductsByIds(selectedIds)
                .then(formattedProducts => setProducts(formattedProducts))
                .catch(err => setError('Falha ao carregar produtos'))
                .finally(() => setLoading(false));
            } else {
              // Caso contrário, buscar produtos em destaque
              fetchFeaturedProducts(limit)
                .then(formattedProducts => setProducts(formattedProducts))
                .catch(err => setError('Falha ao carregar produtos'))
                .finally(() => setLoading(false));
            }
          }}
          severity="error"
        />
      );
    }
    
    if (error) {
      return (
        <ErrorDisplay 
          title="Erro ao carregar produtos" 
          message={error} 
          onRetry={() => {
            setError(null);
            setLoading(true);
            // Se temos IDs específicos, buscar produtos por ID
            if (selectedIds && selectedIds.length > 0) {
              fetchProductsByIds(selectedIds)
                .then(formattedProducts => setProducts(formattedProducts))
                .catch(err => setError('Falha ao carregar produtos'))
                .finally(() => setLoading(false));
            } else {
              // Caso contrário, buscar produtos em destaque
              fetchFeaturedProducts(limit)
                .then(formattedProducts => setProducts(formattedProducts))
                .catch(err => setError('Falha ao carregar produtos'))
                .finally(() => setLoading(false));
            }
          }} 
        />
      );
    }

    if (loading) {
      return (
        <div>
          {showTitle && <h3 className="text-2xl font-bold mb-6">{title}</h3>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].slice(0, limit).map((skeleton) => (
              <div 
                key={skeleton}
                className="relative flex flex-col bg-dark-200/70 rounded-xl overflow-hidden border border-dark-300/50 animate-pulse"
              >
                <div className="relative w-full pt-[100%] bg-dark-300/50"></div>
                <div className="flex flex-col flex-grow px-5 py-4">
                  <div className="h-5 bg-dark-300/70 rounded mb-2"></div>
                  <div className="flex items-center mt-1 mb-2">
                    <div className="h-4 w-20 bg-dark-300/70 rounded mr-2"></div>
                  </div>
                  <div className="h-7 w-24 bg-dark-300/70 rounded mt-auto"></div>
                </div>
                <div className="px-5 pb-5">
                  <div className="h-10 bg-dark-300/70 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Se não tiver produtos para mostrar mas temos IDs com falhas
    if (products.length === 0 && failedProductIds.length > 0) {
      return (
        <div className="bg-dark-200/70 rounded-xl p-6 text-center border border-red-800/30">
          <div className="flex items-center justify-center mb-3 text-red-400">
            <FiAlertCircle size={24} className="mr-2" />
            <h3 className="text-lg font-medium">Produtos não encontrados</h3>
          </div>
          <p className="text-gray-400 mb-4">
            Não foi possível carregar os produtos solicitados. Eles podem ter sido removidos ou estão temporariamente indisponíveis.
          </p>
          
          {/* Exibir a lista de IDs que falharam para facilitar o diagnóstico */}
          <div className="mt-4 mb-2 text-sm text-left">
            <h4 className="text-gray-300 font-medium mb-2">IDs não encontrados ({failedProductIds.length}):</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {failedProductIds.map(id => (
                <div key={id} className="bg-dark-300/70 rounded px-2 py-1 text-xs font-mono text-gray-400 truncate" title={id}>
                  {id.substring(0, 8)}...
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Para resolver este problema, acesse o painel administrativo e atualize a lista de produtos em destaque.</p>
          </div>
        </div>
      );
    }

    // Se não tiver produtos para mostrar
    if (products.length === 0 && !failedProductIds.length) {
      return null;
    }

    return (
      <div>
        {showTitle && <h3 className="text-2xl font-bold mb-6">{title}</h3>}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {selectedIds && selectedIds.map(id => {
            // Se este ID estiver na lista de IDs com falha, mostrar o placeholder
            if (failedProductIds.includes(id)) {
              return <ProductErrorPlaceholder key={`error-${id}`} id={id} />;
            }
            
            // Encontrar o produto com este ID
            const product = products.find(p => p._id === id);
            if (!product) {
              return null;
            }
            
            // Renderizar o produto (código existente)
            // Verificação adicional de segurança
            if (!product || !product._id) {
              return null;
            }
            
            // Usar try/catch para evitar quebrar a renderização se algo der errado com um produto específico
            try {
              const productId = typeof product._id === 'string' ? product._id : 'unknown';
              const animationDelay = productId !== 'unknown' 
                ? `${0.1 * parseInt(productId.substring(0, 2), 16) % 10 * 0.1}s` 
                : '0s';
              
              // Pegar valores atuais de avaliações
              const rating = ratings[productId] || 4.85;
              const ratingCount = ratingCounts[productId] || 0;
              
              // Verificar se este item está atualmente animando
              const isAnimatingRating = animatingRatings[productId];
                
              // Obter a cor da classificação
              const ratingColorClass = getRatingColorClass(rating);
              
              return (
                <div 
                  key={productId}
                  className="group relative flex flex-col bg-dark-200/70 rounded-xl overflow-hidden border border-dark-300/50 transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:translate-y-[-5px] animate-fade-in"
                  style={{ animationDelay }}
                >
                  {/* Status Badge */}
                  {product.status && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.status === 'Esgotado' 
                          ? 'bg-red-900/70 text-red-100 backdrop-blur-sm border border-red-800/50' 
                          : 'bg-amber-800/70 text-amber-100 backdrop-blur-sm border border-amber-700/50'
                      } transition-all duration-300`}>
                        {product.status}
                      </span>
                    </div>
                  )}
                  
                  {/* Image Container */}
                  <div className="relative w-full pt-[80%] bg-gradient-to-b from-dark-300/50 to-dark-200/50 overflow-hidden">
                    {/* Background effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,96,0,0.08),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Product Image */}
                    <div className="absolute inset-0 p-1 flex items-center justify-center transition-all duration-500 group-hover:scale-110 transform-gpu">
                      <div className="relative w-[95%] h-[95%] mx-auto">
                        <Image
                          src={product.image || "/images/placeholder.png"}
                          alt={product.name || "Produto"}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          priority
                        />
                      </div>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-transparent to-transparent opacity-50"></div>
                    
                    {/* Discount badge */}
                    {product.discountPercentage > 0 && (
                      <div className="absolute bottom-3 left-3 bg-primary/90 text-white text-sm font-bold px-3 py-1 rounded-md backdrop-blur-sm border border-primary/50 transform-gpu group-hover:scale-110 transition-transform duration-300 z-10 shadow-md shadow-primary/20">
                        -{Math.round(product.discountPercentage)}%
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex flex-col flex-grow px-4 py-3">
                    <h3 className="text-base font-medium text-white mb-1 group-hover:text-primary transition-colors duration-300">
                      {formatProductName(product.name)}
                    </h3>
                    
                    {/* Ratings */}
                    <div className="flex items-center mt-1 mb-2">
                      <div className="flex items-center">
                        <div className="text-amber-400 flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar 
                              key={star} 
                              className={`${star <= Math.round(rating) ? 'fill-current' : 'text-amber-400/30'} ${
                                isAnimatingRating && star <= Math.round(rating) ? 'animate-pulse scale-110 duration-300' : ''
                              } transition-all`} 
                              size={14}
                            />
                          ))}
                        </div>
                        <span className={`ml-2 text-sm rating-value ${isAnimatingRating ? 'animate-pulse text-amber-400 font-medium' : 'text-gray-300'}`}>
                          <span className="font-bold">{rating.toFixed(1)}</span> <span className="text-gray-400">({ratingCount} avaliações)</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-1">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-primary">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        
                        {product.originalPrice > 0 && (
                          <span className="ml-2 text-xs text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Button Container */}
                  <div className="px-4 pb-4 pt-0">
                    {product.stock > 0 ? (
                      <Link 
                        href={`/product/${product.slug}`} 
                        className="block w-full py-2 text-center rounded-lg bg-gradient-to-r from-primary/80 to-primary-dark/90 text-white font-medium transition-all duration-300 hover:from-primary hover:to-primary-dark hover:shadow-md hover:shadow-primary/20 transform-gpu"
                      >
                        Ver detalhes
                      </Link>
                    ) : (
                      <button 
                        disabled 
                        className="block w-full py-2 text-center rounded-lg bg-dark-300/80 text-gray-400 font-medium cursor-not-allowed opacity-80"
                      >
                        Esgotado
                      </button>
                    )}
                  </div>
                  
                  {/* Subtle hover effect lines */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></div>
                </div>
              );
            } catch (renderError) {
              console.error('Erro ao renderizar produto:', renderError);
              return <ProductErrorPlaceholder key={`error-${product._id || 'unknown'}`} id={product._id} />;
            }
          })}
          
          {/* Se não estamos renderizando produtos específicos por ID, mostrar todos os produtos */}
          {!selectedIds && products.map((product) => {
            // Verificação adicional de segurança
            if (!product || !product._id) {
              return null;
            }
            
            // Usar try/catch para evitar quebrar a renderização se algo der errado com um produto específico
            try {
              const productId = typeof product._id === 'string' ? product._id : 'unknown';
              const animationDelay = productId !== 'unknown' 
                ? `${0.1 * parseInt(productId.substring(0, 2), 16) % 10 * 0.1}s` 
                : '0s';
              
              // Pegar valores atuais de avaliações
              const rating = ratings[productId] || 4.85;
              const ratingCount = ratingCounts[productId] || 0;
              
              // Verificar se este item está atualmente animando
              const isAnimatingRating = animatingRatings[productId];
                
              // Obter a cor da classificação
              const ratingColorClass = getRatingColorClass(rating);
              
              return (
                <div 
                  key={productId}
                  className="group relative flex flex-col bg-dark-200/70 rounded-xl overflow-hidden border border-dark-300/50 transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:translate-y-[-5px] animate-fade-in"
                  style={{ animationDelay }}
                >
                  {/* Status Badge */}
                  {product.status && (
                    <div className="absolute top-3 right-3 z-10">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        product.status === 'Esgotado' 
                          ? 'bg-red-900/70 text-red-100 backdrop-blur-sm border border-red-800/50' 
                          : 'bg-amber-800/70 text-amber-100 backdrop-blur-sm border border-amber-700/50'
                      } transition-all duration-300`}>
                        {product.status}
                      </span>
                    </div>
                  )}
                  
                  {/* Image Container */}
                  <div className="relative w-full pt-[80%] bg-gradient-to-b from-dark-300/50 to-dark-200/50 overflow-hidden">
                    {/* Background effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,96,0,0.08),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    {/* Product Image */}
                    <div className="absolute inset-0 p-1 flex items-center justify-center transition-all duration-500 group-hover:scale-110 transform-gpu">
                      <div className="relative w-[95%] h-[95%] mx-auto">
                        <Image
                          src={product.image || "/images/placeholder.png"}
                          alt={product.name || "Produto"}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          priority
                        />
                      </div>
                    </div>
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-200 via-transparent to-transparent opacity-50"></div>
                    
                    {/* Discount badge */}
                    {product.discountPercentage > 0 && (
                      <div className="absolute bottom-3 left-3 bg-primary/90 text-white text-sm font-bold px-3 py-1 rounded-md backdrop-blur-sm border border-primary/50 transform-gpu group-hover:scale-110 transition-transform duration-300 z-10 shadow-md shadow-primary/20">
                        -{Math.round(product.discountPercentage)}%
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex flex-col flex-grow px-4 py-3">
                    <h3 className="text-base font-medium text-white mb-1 group-hover:text-primary transition-colors duration-300">
                      {formatProductName(product.name)}
                    </h3>
                    
                    {/* Ratings */}
                    <div className="flex items-center mt-1 mb-2">
                      <div className="flex items-center">
                        <div className="text-amber-400 flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FiStar 
                              key={star} 
                              className={`${star <= Math.round(rating) ? 'fill-current' : 'text-amber-400/30'} ${
                                isAnimatingRating && star <= Math.round(rating) ? 'animate-pulse scale-110 duration-300' : ''
                              } transition-all`} 
                              size={14}
                            />
                          ))}
                        </div>
                        <span className={`ml-2 text-sm rating-value ${isAnimatingRating ? 'animate-pulse text-amber-400 font-medium' : 'text-gray-300'}`}>
                          <span className="font-bold">{rating.toFixed(1)}</span> <span className="text-gray-400">({ratingCount} avaliações)</span>
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-1">
                      <div className="flex items-baseline">
                        <span className="text-lg font-bold text-primary">
                          R$ {product.price.toFixed(2).replace('.', ',')}
                        </span>
                        
                        {product.originalPrice > 0 && (
                          <span className="ml-2 text-xs text-gray-400 line-through">
                            R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Button Container */}
                  <div className="px-4 pb-4 pt-0">
                    {product.stock > 0 ? (
                      <Link 
                        href={`/product/${product.slug}`} 
                        className="block w-full py-2 text-center rounded-lg bg-gradient-to-r from-primary/80 to-primary-dark/90 text-white font-medium transition-all duration-300 hover:from-primary hover:to-primary-dark hover:shadow-md hover:shadow-primary/20 transform-gpu"
                      >
                        Ver detalhes
                      </Link>
                    ) : (
                      <button 
                        disabled 
                        className="block w-full py-2 text-center rounded-lg bg-dark-300/80 text-gray-400 font-medium cursor-not-allowed opacity-80"
                      >
                        Esgotado
                      </button>
                    )}
                  </div>
                  
                  {/* Subtle hover effect lines */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 delay-100"></div>
                </div>
              );
            } catch (renderError) {
              console.error('Erro ao renderizar produto:', renderError);
              return <ProductErrorPlaceholder key={`error-${product._id || 'unknown'}`} id={product._id} />;
            }
          })}
        </div>
      </div>
    );
  } catch (err) {
    console.error('Erro não tratado durante renderização:', err);
    // Atualizar o estado com o erro para que na próxima renderização possamos mostrar a mensagem de erro
    setRenderError(err as Error);
    // Renderizar um fallback simples para esta renderização
    return (
      <div className="bg-dark-200/70 rounded-xl p-6 text-center border border-red-800/30">
        <div className="flex items-center justify-center mb-3 text-red-400">
          <FiAlertCircle size={24} className="mr-2" />
          <h3 className="text-lg font-medium">Erro inesperado</h3>
        </div>
        <p className="text-gray-400 mb-4">
          Ocorreu um erro inesperado ao exibir os produtos. Estamos trabalhando para resolver o problema.
        </p>
      </div>
    );
  }
} 