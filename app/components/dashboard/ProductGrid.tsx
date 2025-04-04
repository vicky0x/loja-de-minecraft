import React from 'react';
import Link from 'next/link';
import { FiPackage, FiEye } from 'react-icons/fi';

// Interface para produtos
interface Product {
  _id?: string;
  id?: string;
  name?: string;
  status?: string;
  image?: string;
  shortDescription?: string;
}

// Props do componente
export interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ 
  products = [], 
  isLoading = false 
}) => {
  // Adicionar um ID único para cada produto sem ID
  const getProductId = (product: Product): string => {
    return product._id || product.id || `temp-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Formatação de valores monetários
  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className="bg-dark-200/50 rounded-lg p-4 h-40"></div>
        ))}
      </div>
    );
  }
  
  // Se não tiver produtos
  if (!products || products.length === 0) {
    return (
      <div className="bg-dark-200 rounded-lg p-6 text-center">
        <FiPackage className="mx-auto text-3xl mb-2 text-primary/50" />
        <p className="text-gray-400">Nenhum produto encontrado</p>
      </div>
    );
  }
  
  // Garantir que temos apenas produtos válidos
  const validProducts = products.filter(p => p && (typeof p === 'object'));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {validProducts.map((product) => {
        const productId = getProductId(product);
        const productName = product.name || 'Produto sem nome';
        
        return (
          <div 
            key={productId} 
            className="bg-dark-200 rounded-lg p-4 flex"
          >
            <div 
              className="w-16 h-16 bg-dark-300 rounded-md flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden"
            >
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiPackage className="text-xl text-primary/70" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-100 truncate">
                {productName}
              </h3>
              
              {product.status && (
                <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${
                  product.status === 'indetectavel' 
                    ? 'bg-green-900/30 text-green-400' 
                    : product.status === 'manutencao' 
                    ? 'bg-yellow-900/30 text-yellow-400'
                    : 'bg-red-900/30 text-red-400'
                }`}>
                  {product.status === 'indetectavel' 
                    ? 'Indetectável' 
                    : product.status === 'manutencao' 
                    ? 'Manutenção'
                    : product.status === 'detectavel'
                    ? 'Detectável'
                    : 'Beta'}
                </span>
              )}
              
              {product.shortDescription && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                  {product.shortDescription}
                </p>
              )}
            </div>
            
            <Link 
              href={`/dashboard/products/${productId}`}
              className="self-center text-blue-500 hover:text-blue-400 ml-2"
            >
              <FiEye className="h-5 w-5" />
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid; 