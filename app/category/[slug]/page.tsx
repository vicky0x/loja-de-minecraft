'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGrid, FiList, FiShoppingBag, FiFilter, FiX, FiArrowLeft, FiTag, FiPackage, FiStar, FiCheck, FiArrowRight, FiChevronDown } from 'react-icons/fi';
import ProductList from '../../components/ProductList';
import { formatProductName } from '@/app/utils/formatters';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

interface Variant {
  _id: string;
  name: string;
  price: number;
  stock: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  images: string[];
  price?: number;
  featured: boolean;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  variants: Variant[];
  stock?: number;
  status?: string;
}

export default function CategoryPage() {
  // Usar o hook useParams em vez de receber params como props
  const params = useParams();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para filtros e ordenação
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndProducts();
    } else {
      // Se não tiver slug, redirecionar para a página principal
      router.push('/');
    }
  }, [slug, router]);

  // Aplicar filtros sempre que os produtos ou filtros mudarem
  useEffect(() => {
    applyFilters();
  }, [products, sortBy, priceRange]);

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/categories/slug/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Categoria não encontrada');
        } else {
          throw new Error('Erro ao carregar categoria');
        }
        return;
      }
      
      const data = await response.json();
      setCategory(data.category);
      setProducts(data.products || []);
      setFilteredProducts(data.products || []);
    } catch (error: any) {
      console.error('Erro ao buscar categoria e produtos:', error);
      setError(error.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];
    
    // Filtrar por preço
    filtered = filtered.filter(product => {
      const lowestPrice = getProductPrice(product);
      return lowestPrice >= priceRange[0] && lowestPrice <= priceRange[1];
    });
    
    // Ordenar produtos
    switch (sortBy) {
      case 'featured':
        filtered = filtered.sort((a, b) => (a.featured === b.featured ? 0 : a.featured ? -1 : 1));
        break;
      case 'price-asc':
        filtered = filtered.sort((a, b) => getProductPrice(a) - getProductPrice(b));
        break;
      case 'price-desc':
        filtered = filtered.sort((a, b) => getProductPrice(b) - getProductPrice(a));
        break;
      case 'newest':
        filtered = filtered.sort((a, b) => new Date(b._id.substring(0, 8)).getTime() - new Date(a._id.substring(0, 8)).getTime());
        break;
      default:
        break;
    }
    
    setFilteredProducts(filtered);
  };

  // Função auxiliar para obter o menor preço do produto (considerando variantes)
  const getProductPrice = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return Math.min(...product.variants.map(v => v.price));
    }
    return product.price || 0;
  };

  // Função auxiliar para obter o total de estoque do produto
  const getProductStock = (product: Product): number => {
    if (product.variants && product.variants.length > 0) {
      return product.variants.reduce((total, v) => total + (v.stock || 0), 0);
    }
    return product.stock || 0;
  };

  // Função para renderizar desconto
  const calculateDiscount = (price: number): number => {
    const originalPrice = price * 1.6; // Exemplo de cálculo de desconto
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  // Handling loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-300/50 rounded-md w-1/3 mb-8"></div>
            <div className="h-4 bg-dark-300/50 rounded-md w-2/3 mb-12"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div key={item} className="bg-dark-300/30 rounded-xl overflow-hidden h-80">
                  <div className="h-48 bg-dark-400/30"></div>
                  <div className="p-4">
                    <div className="h-5 bg-dark-400/40 rounded-md w-3/4 mb-3"></div>
                    <div className="h-4 bg-dark-400/40 rounded-md w-1/2 mb-4"></div>
                    <div className="h-6 bg-dark-400/40 rounded-md w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handling error state
  if (error || !category) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200 flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md w-full bg-dark-300/50 backdrop-blur-md rounded-2xl p-8 border border-dark-400/20 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-20 h-20 mx-auto mb-6 text-red-400 flex items-center justify-center bg-red-500/10 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
          >
            <FiX size={36} />
          </motion.div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Categoria não encontrada</h2>
          <p className="text-gray-300 text-center mb-8">{error || 'Esta categoria pode ter sido removida ou está temporariamente indisponível.'}</p>
          <Link 
            href="/" 
            className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl text-center transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Voltar para a loja
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200">
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Cabeçalho da categoria */}
        <div className="mb-8">
          <motion.div 
            className="flex items-center mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/" className="text-gray-400 hover:text-primary transition-colors flex items-center">
              <FiArrowLeft className="mr-2" />
              <span>Voltar</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-white">{category.name}</h1>
            </div>
            <div className="w-20"></div> {/* Espaço para equilibrar o layout */}
          </motion.div>
          
          <motion.p 
            className="text-gray-400 text-center mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {category.description}
          </motion.p>
        </div>
        
        {/* Barra de filtros */}
        <motion.div 
          className="mb-8 bg-dark-300/40 backdrop-blur-sm rounded-xl p-4 border border-dark-400/20 shadow-md"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <FiGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <FiList size={18} />
                </button>
              </div>
              
              <div className="text-gray-400 hidden md:block">
                <span>{filteredProducts.length} produtos encontrados</span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[180px]">
                <select 
                  className="w-full bg-dark-400/50 text-white rounded-md border border-dark-500/50 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="featured">Destaques</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                  <option value="newest">Mais recentes</option>
                </select>
              </div>
              
              <button 
                className="bg-dark-400/60 text-white rounded-md px-4 py-2 flex items-center space-x-2 hover:bg-dark-500/60 transition-colors"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FiFilter size={18} />
                <span className="hidden sm:inline-block">Filtros</span>
              </button>
            </div>
          </div>
          
          {/* Filtros adicionais expansíveis */}
          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-6 mt-4 border-t border-dark-400/30">
                  <h3 className="text-white font-medium mb-4">Faixa de preço</h3>
                  <div className="flex items-center space-x-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="1000" 
                      step="10"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                      className="w-full"
                    />
                    <span className="text-white whitespace-nowrap">
                      R$ {priceRange[0].toFixed(2).replace('.', ',')} - R$ {priceRange[1].toFixed(2).replace('.', ',')}
                    </span>
                    <input 
                      type="range" 
                      min={priceRange[0]} 
                      max="1000" 
                      step="10"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Lista de produtos */}
        {filteredProducts.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FiPackage className="mx-auto text-5xl text-gray-500 mb-4" />
            <h3 className="text-2xl font-medium text-white mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-400">Não há produtos disponíveis nesta categoria no momento.</p>
          </motion.div>
        ) : (
          viewMode === 'grid' ? (
            // Usar o componente ProductList para visualização em grid
            <ProductList 
              selectedIds={filteredProducts.map(p => p._id)} 
              limit={filteredProducts.length} 
              showTitle={false} 
            />
          ) : (
            // Visualização em lista (mantém o código existente)
            <motion.div 
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {filteredProducts.map((product, index) => {
                const productPrice = getProductPrice(product);
                const productStock = getProductStock(product);
                const discount = calculateDiscount(productPrice);
                
                return (
                  <motion.div 
                    key={product._id}
                    className="bg-dark-300/40 rounded-xl overflow-hidden shadow-lg border border-dark-400/20 backdrop-blur-sm hover:shadow-xl hover:border-dark-400/40 transition-all duration-300 group relative flex"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: 0.1 + (index * 0.05) } 
                    }}
                    whileHover={{
                      y: -3,
                      transition: { duration: 0.2 }
                    }}
                  >
                    <Link href={`/product/${product.slug}`} className="flex-shrink-0 w-40 h-40 sm:w-60 sm:h-60 relative overflow-hidden">
                      {product.images && product.images.length > 0 ? (
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 bg-dark-400/20">
                          <FiPackage size={40} />
                        </div>
                      )}
                      
                      {product.featured && (
                        <div className="absolute top-3 left-3 bg-primary text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
                          Destaque
                        </div>
                      )}
                      
                      {discount > 0 && (
                        <div className="absolute top-3 right-3 bg-green-600 text-white text-xs font-medium px-2 py-1 rounded-full shadow-md">
                          -{discount}%
                        </div>
                      )}
                    </Link>
                    
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div>
                        <Link 
                          href={`/product/${product.slug}`}
                          className="block text-xl font-medium text-white hover:text-primary transition-colors"
                        >
                          {formatProductName(product.name)}
                        </Link>
                        
                        {product.shortDescription && (
                          <p className="text-gray-400 mt-2 line-clamp-3">
                            {product.shortDescription}
                          </p>
                        )}
                      </div>
                      
                      <div className="mt-6 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline">
                            <span className="text-primary font-bold text-2xl">R$ {productPrice.toFixed(2).replace('.', ',')}</span>
                            {discount > 0 && (
                              <span className="text-gray-500 line-through text-sm ml-2">
                                R$ {(productPrice * 1.6).toFixed(2).replace('.', ',')}
                              </span>
                            )}
                          </div>
                          
                          <div className="mt-2">
                            <span className={`text-sm font-medium px-2 py-1 rounded-full inline-block ${
                              productStock <= 0 ? 'bg-red-900/20 text-red-400 border border-red-500/20' :
                              productStock <= 5 ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-500/20' :
                              'bg-green-900/20 text-green-400 border border-green-500/20'
                            }`}>
                              {productStock <= 0 ? 'Esgotado' :
                               productStock <= 5 ? `Apenas ${productStock} unidades` :
                               'Em estoque'}
                            </span>
                          </div>
                        </div>
                        
                        <Link 
                          href={`/product/${product.slug}`}
                          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors flex items-center"
                        >
                          <span>Ver produto</span>
                          <FiArrowRight className="ml-2" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )
        )}
      </div>
    </div>
  );
} 