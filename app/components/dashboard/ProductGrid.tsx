'use client';

import React from 'react';
import Link from 'next/link';
import { FiPackage, FiEye, FiShield, FiClock, FiX, FiAward } from 'react-icons/fi';
import { formatProductName } from '@/app/utils/formatters';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        
        // Configuração de status (se existir)
        const statusConfig = product.status ? getStatusConfig(product.status) : null;
        
        return (
          <div 
            key={productId} 
            className="bg-gradient-to-b from-dark-300/90 to-dark-200 rounded-xl overflow-hidden shadow-md transition-all duration-400 hover:shadow-xl hover:shadow-dark-400/30 transform hover:-translate-y-1 flex flex-col h-[420px]"
          >
            <div className="relative rounded-lg overflow-hidden z-10">
              {/* Container da imagem com padding */}
              <div className="pt-3 px-3 pb-0 bg-gradient-to-br from-dark-800 to-dark-900">
                {/* Imagem com efeitos */}
                <div className="h-44 relative overflow-hidden rounded-lg">
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="bg-gradient-to-br from-dark-800 to-dark-900 h-full w-full opacity-90"></div>
                    {/* Padrão sutil no fundo */}
                    <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                  </div>
                  
                  <img 
                    src={imageUrl}
                    alt={productName}
                    className="w-full h-full object-cover relative z-10 transition-all duration-500"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400/111/222?text=Sem+Imagem';
                    }}
                  />
                  
                  {/* Gradiente na parte inferior para melhorar transição com o conteúdo */}
                  <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-dark-300/90 to-transparent z-10"></div>
                </div>
              </div>
              
              {/* Badge de status */}
              {statusConfig && (
                <div className={`absolute bottom-[8px] left-4 bg-dark-800/80 ${statusConfig.textColor} border ${statusConfig.borderColor}/30 text-xs px-3 py-1 rounded-full flex items-center backdrop-blur-xl z-20 shadow-sm transition-all duration-300`}>
                  {statusConfig.icon && (
                    <span className="mr-1.5">{statusConfig.icon}</span>
                  )}
                  {statusConfig.label}
                </div>
              )}
            </div>
            
            {/* Conteúdo do card */}
            <div className="p-5 relative z-10 flex-grow flex flex-col">
              {/* Título do produto */}
              <div className="relative group">
                <h3 className="text-white font-medium text-lg mb-1 transition-colors duration-300 line-clamp-2 h-14">
                  {formatProductName(productName)}
                </h3>
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary/30 group-hover:w-1/4 transition-all duration-500"></span>
              </div>
              
              {/* Tipo do produto/variante */}
              <p className="text-gray-400 text-sm mb-2">
                {variant}
              </p>
              
              {/* Data de aquisição */}
              <p className="text-gray-500 text-xs mb-4 flex items-center">
                <span className="inline-block w-2 h-2 rounded-full bg-primary/50 mr-2"></span>
                Adquirido em: {assignedDate}
              </p>
              
              {/* Botão de ver detalhes */}
              <div className="mt-auto">
                <Link 
                  href={`/dashboard/products/${productId}`}
                  className="block w-full"
                >
                  <button className="w-full py-2.5 px-4 rounded-lg text-center font-medium transition-all duration-300 relative overflow-hidden bg-primary text-white hover:bg-primary-dark group">
                    <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">Ver detalhes</span>
                    <span className="absolute bottom-0 left-1/2 right-1/2 h-[1px] bg-white/20 group-hover:left-4 group-hover:right-4 transition-all duration-500"></span>
                  </button>
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