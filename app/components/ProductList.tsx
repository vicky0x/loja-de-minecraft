'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

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

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);
        
        // Se temos IDs específicos, buscar produtos por ID
        if (selectedIds && selectedIds.length > 0) {
          const formattedProducts = await fetchProductsByIds(selectedIds);
          setProducts(formattedProducts);
        } else {
          // Caso contrário, buscar produtos em destaque
          const formattedProducts = await fetchFeaturedProducts(limit);
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setError('Falha ao carregar produtos');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedIds, limit]);

  // Função para buscar produtos por IDs específicos
  async function fetchProductsByIds(ids: string[]): Promise<FormattedProduct[]> {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }
      
      // Buscar cada produto por ID
      const productPromises = ids.map(async (id) => {
        try {
          const response = await fetch(`/api/products/${id}`);
          if (!response.ok) {
            console.error(`Erro ao buscar produto ${id}`);
            return null;
          }
          const data = await response.json();
          return data.product;
        } catch (err) {
          console.error(`Erro ao processar produto ${id}:`, err);
          return null;
        }
      });

      const productsData = await Promise.all(productPromises);
      
      // Filtrar produtos nulos e mapear para o formato esperado
      return productsData
        .filter(product => product !== null && typeof product === 'object')
        .map(product => formatProduct(product));
    } catch (error) {
      console.error('Erro ao buscar produtos por IDs:', error);
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

  // Se não tiver produtos para mostrar
  if (products.length === 0) {
    return null;
  }

  return (
    <div>
      {showTitle && <h3 className="text-2xl font-bold mb-6">{title}</h3>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => {
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
                    {product.name}
                  </h3>
                  
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
          } catch (err) {
            console.error('Erro ao renderizar produto:', err);
            return null;
          }
        })}
      </div>
    </div>
  );
} 