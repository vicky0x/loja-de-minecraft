'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProductList() {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/products?limit=9');
        if (!response.ok) {
          throw new Error('Falha ao carregar produtos');
        }
        const data = await response.json();
        setAvailableProducts(data.products || []);
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const calculateDiscount = (price: number, originalPrice: number) => {
    if (!originalPrice || originalPrice <= 0 || !price) return 0;
    const discount = ((originalPrice - price) / originalPrice) * 100;
    return Math.round(discount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
      {availableProducts.slice(0, 4).map((product: any, index: number) => {
        const hasVariants = product.variants && product.variants.length > 0;
        const lowestPrice = hasVariants 
          ? Math.min(...product.variants.map((v: any) => v.price)) 
          : product.price;
        
        const stock = hasVariants
          ? product.variants.reduce((total: number, v: any) => total + (v.stock || 0), 0)
          : product.stock || 0;
        
        const imageUrl = product.images && product.images.length > 0 
          ? product.images[0].startsWith('http') ? product.images[0] : `${product.images[0]}`
          : 'https://placehold.co/600x400/222/444?text=Sem+Imagem';
        
        const discount = product.discountPercentage
          ? product.discountPercentage
          : calculateDiscount(lowestPrice, product.originalPrice);
        
        return (
          <div 
            key={product._id} 
            className="bg-gradient-to-b from-dark-300/90 to-dark-200 rounded-xl overflow-hidden shadow-md transition-all duration-400 hover:shadow-xl hover:shadow-dark-400/30 product-card" 
            style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
          >
            <div className="relative rounded-lg overflow-hidden z-10">
              <div className={`absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full z-20 backdrop-blur-xl shadow-sm ${
                stock <= 0 ? 'bg-red-900/70 text-red-200 border border-red-500/40' :
                stock <= 5 ? 'bg-yellow-900/70 text-yellow-200 border border-yellow-500/40' :
                'bg-dark-800/70 text-green-300 border border-green-500/40'
              }`}>
                {stock <= 0 ? 'Esgotado' :
                 stock <= 5 ? 'Últimas unidades' :
                 stock <= 10 ? 'Estoque baixo' :
                 'Disponível'}
              </div>
              
              <div className="pt-3 px-3 pb-0 bg-gradient-to-br from-dark-800 to-dark-900">
                <div className="h-52 relative overflow-hidden rounded-lg product-card-image">
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-dark-800 to-dark-900 h-full w-full opacity-90"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                  </div>
                  
                  <img 
                    src={imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover relative z-10 transition-all duration-500"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400/111/222?text=Imagem+Indisponível';
                    }}
                  />
                  
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-dark-300/90 to-transparent z-10"></div>
                </div>
              </div>
              
              {product.featured && (
                <div className="absolute top-4 left-4 bg-dark-800/80 text-white text-xs font-medium px-3 py-1 rounded-full z-20 flex items-center border border-primary/30 shadow-sm transition-all duration-300">
                  <span className="mr-1.5 inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Destaque
                </div>
              )}
              
              {product.status === 'indetectavel' && (
                <div className="absolute bottom-[53px] left-4 bg-dark-800/80 text-green-300 border border-green-500/30 text-xs px-3 py-1 rounded-full flex items-center backdrop-blur-xl z-20 shadow-sm transition-all duration-300">
                  <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Indetectável
                </div>
              )}
            </div>
            
            <div className="p-5 flex flex-col justify-between h-48 relative z-10 bg-gradient-to-b from-dark-300/90 to-dark-200">
              <div className="relative">
                <h3 className="text-white font-medium text-base mb-3 group-hover:text-primary transition-colors duration-300">{product.name}</h3>
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary/30 group-hover:w-1/4 transition-all duration-500"></span>
              </div>
              
              <div>
                <div className="flex items-baseline mb-3 relative">
                  <span className="text-primary font-bold text-xl transition-all duration-300">{`R$ ${lowestPrice.toFixed(2).replace('.', ',')}`}</span>
                  
                  {product.originalPrice && product.originalPrice > 0 && (
                    <span className="text-gray-400 line-through text-sm ml-2">
                      R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                  
                  {discount > 0 && (
                    <span className="ml-auto bg-green-900/40 text-green-300 text-xs px-2.5 py-1 rounded-full border border-green-500/20 shadow-sm transition-all duration-300">
                      -{Math.round(discount)}%
                    </span>
                  )}
                </div>
                
                <Link href={`/product/${product.slug}`} className="block mt-3">
                  <button 
                    disabled={stock <= 0}
                    className={`product-card-button w-full py-2.5 px-4 rounded-lg text-center font-medium transition-all duration-300 relative overflow-hidden ${
                      stock <= 0 
                      ? 'bg-dark-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-primary text-white hover:bg-primary-dark group-hover:shadow-md'
                    }`}
                  >
                    {stock <= 0 ? 'Esgotado' : (
                      <>
                        <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">Ver detalhes</span>
                        <span className="btn-underline absolute bottom-0 left-1/2 right-1/2 h-[1px] bg-white/20 group-hover:left-4 group-hover:right-4 transition-all duration-500"></span>
                      </>
                    )}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
} 