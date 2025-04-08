'use client';

import React from 'react';
import Link from 'next/link';
import { FiPackage, FiEye, FiShield, FiClock, FiX, FiAward } from 'react-icons/fi';

// Interface para produtos
interface Product {
  _id?: string;
  id?: string;
  name?: string;
  status?: string;
  image?: string;
  shortDescription?: string;
  createdAt?: string;
  assignedAt?: string; // Data de aquisição
  slug?: string; // Adicionando o campo slug
  variant?: { name?: string };
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
  // Remover o log de debug
  // console.log('ProductGrid - produtos recebidos:', products);

  // Adicionar um ID único para cada produto sem ID
  const getProductId = (product: Product): string => {
    return product._id || product.id || `temp-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Obter configuração visual de acordo com o status
  const getStatusConfig = (status?: string) => {
    // Se o status for null, undefined ou string vazia
    if (!status) {
      return null;
    }
    
    // Convertendo para minúsculas e garantindo que é uma string
    const validStatus = String(status).toLowerCase();
    
    // Verificações mais específicas para cada status
    if (validStatus === 'detectavel' || (validStatus.includes('detect') && !validStatus.includes('indetect'))) {
      return {
        label: 'Detectável',
        bgColor: 'bg-yellow-900/40',
        borderColor: 'border-yellow-500',
        textColor: 'text-yellow-400',
        icon: <FiClock size={12} className="flex-shrink-0" />,
      };
    }
    else if (validStatus === 'manutencao' || validStatus.includes('manut')) {
      return {
        label: 'Em Manutenção',
        bgColor: 'bg-red-900/40',
        borderColor: 'border-red-500',
        textColor: 'text-red-400',
        icon: <FiX size={12} className="flex-shrink-0" />,
      };
    }
    else if (validStatus === 'beta' || validStatus.includes('beta')) {
      return {
        label: 'Beta',
        bgColor: 'bg-blue-900/40',
        borderColor: 'border-blue-500',
        textColor: 'text-blue-400',
        icon: <FiAward size={12} className="flex-shrink-0" />,
      };
    }
    else if (validStatus === 'indetectavel' || validStatus.includes('indetect')) {
      return {
        label: 'Indetectável',
        bgColor: 'bg-green-900/40',
        borderColor: 'border-green-500',
        textColor: 'text-green-400',
        icon: <FiShield size={12} className="flex-shrink-0" />,
      };
    }
    else {
      // Caso padrão
      return {
        label: 'Indetectável',
        bgColor: 'bg-green-900/40',
        borderColor: 'border-green-500',
        textColor: 'text-green-400',
        icon: <FiShield size={12} className="flex-shrink-0" />,
      };
    }
  };
  
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(n => (
          <div key={n} className="bg-dark-200/50 rounded-xl h-[400px]"></div>
        ))}
      </div>
    );
  }
  
  // Se não tiver produtos
  if (!products || products.length === 0) {
    return (
      <div className="bg-dark-200 rounded-lg p-8 text-center">
        <FiPackage className="mx-auto text-4xl mb-4 text-primary/60" />
        <h3 className="text-lg font-medium text-white mb-2">Nenhum produto encontrado</h3>
        <p className="text-gray-400">Você ainda não comprou nenhum produto</p>
      </div>
    );
  }
  
  // Garantir que temos apenas produtos válidos
  const validProducts = products.filter(p => p && (typeof p === 'object'));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {validProducts.map((product) => {
        const productId = getProductId(product);
        
        // Usar o nome real do produto
        let productName = product.name || "Produto Sem Nome";
        
        // Formatar data de aquisição
        const assignedDate = product.assignedAt 
          ? new Date(product.assignedAt).toLocaleDateString('pt-BR')
          : '07/04/2025'; // Fallback para data padrão
        
        const imageUrl = product.image || 'https://placehold.co/600x400/222/444?text=Sem+Imagem';
        
        // Determinar a variante ou usar "Padrão" como fallback
        const variant = product.variant?.name || 'Padrão';
        
        return (
          <div 
            key={productId} 
            className="bg-[#1e1e1e] rounded-lg overflow-hidden"
          >
            {/* Imagem de capa */}
            <div className="w-full h-60 overflow-hidden">
              <img 
                src={imageUrl}
                alt={productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.src = 'https://placehold.co/600x400/111/222?text=Sem+Imagem';
                }}
              />
            </div>
            
            {/* Conteúdo do card */}
            <div className="p-6 pt-5 pb-4">
              {/* Título do produto */}
              <h3 className="text-white font-semibold text-xl mb-2">{productName}</h3>
              
              {/* Tipo do produto/variante */}
              <p className="text-gray-400 text-sm mb-1">
                {variant}
              </p>
              
              {/* Data de aquisição */}
              <p className="text-gray-500 text-xs">
                Adquirido em: {assignedDate}
              </p>
              
              {/* Botão de ver detalhes */}
              <div className="mt-4 text-right">
                <Link 
                  href={`/dashboard/products/${productId}`}
                  className="text-[#ff6b00] hover:text-[#ff8533] inline-flex items-center font-medium"
                >
                  <span>Ver detalhes</span>
                  <span className="text-lg ml-1">›</span>
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductGrid; 