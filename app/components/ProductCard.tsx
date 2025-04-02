'use client';

import { useState, useEffect, useRef } from 'react';
import { FiShoppingCart, FiEye, FiPackage, FiTrendingUp, FiShield, FiClock, FiAward, FiX } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import VariantStockModal from './VariantStockModal';

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
  slug: string;
  shortDescription: string;
  images: string[];
  featured: boolean;
  variants: Variant[];
  status?: 'indetectavel' | 'detectavel' | 'manutencao' | 'beta';
  price?: number;  // Preço direto para produtos sem variantes
  stock?: number;  // Estoque direto para produtos sem variantes
  originalPrice?: number; // Preço original antes do desconto
  discountPercentage?: number; // Porcentagem de desconto
}

export default function ProductCard({ product }: { product: Product }) {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Verificar se o produto tem variantes
  const hasVariants = product.variants && product.variants.length > 0;
  
  // Verificar o status do estoque
  const getTotalStock = () => {
    if (hasVariants) {
      return product.variants.reduce((total, variant) => total + variant.stock, 0);
    }
    // Para produtos sem variantes, retornar o estoque diretamente
    return product.stock || 0;
  };
  
  const getStockStatus = () => {
    const totalStock = getTotalStock();
    if (totalStock <= 0) return 'Esgotado';
    if (totalStock <= 5) return 'Últimas unidades';
    if (totalStock <= 10) return 'Estoque baixo';
    return 'Disponível';
  };
  
  const getStockClass = () => {
    const totalStock = getTotalStock();
    if (totalStock <= 0) return 'bg-red-900/30 text-red-400';
    if (totalStock <= 10) return 'bg-yellow-900/30 text-yellow-400';
    return 'bg-green-900/30 text-green-400';
  };
  
  // Obter o preço base (menor preço entre as variantes ou preço direto)
  const getBasePrice = () => {
    if (hasVariants) {
      return Math.min(...product.variants.map(v => v.price));
    }
    // Para produtos sem variantes, retornar o preço diretamente
    return product.price || 0;
  };
  
  // Obter o preço original para exibição
  const getOriginalPrice = () => {
    // Se tiver um preço original definido, use-o
    if (product.originalPrice) {
      return product.originalPrice;
    }
    
    // Se tiver um percentual de desconto definido, calcule o preço original
    if (product.discountPercentage && product.discountPercentage > 0) {
      const basePrice = getBasePrice();
      return basePrice / (1 - (product.discountPercentage / 100));
    }
    
    // Caso contrário, retorne null (sem preço original)
    return null;
  };
  
  // Verificar se tem desconto
  const hasDiscount = () => {
    return getOriginalPrice() !== null;
  };
  
  // Obter o percentual de desconto
  const getDiscountPercentage = () => {
    if (product.discountPercentage) {
      return product.discountPercentage;
    }
    
    const originalPrice = getOriginalPrice();
    const basePrice = getBasePrice();
    
    if (originalPrice && basePrice) {
      const discount = ((originalPrice - basePrice) / originalPrice) * 100;
      return Math.round(discount);
    }
    
    return 0;
  };
  
  // Verificar se tem imagem
  const hasImage = product.images && product.images.length > 0;
  const mainImage = hasImage ? product.images[0] : '/placeholder-product.jpg';
  
  // Adicionar a função para configuração do status logo após a função getBasePrice
  const getStatusConfig = (status?: string) => {
    // Se o status for null, undefined ou string vazia
    if (!status) {
      return null; // Retornar null para indicar que não há status
    }
    
    // Convertendo para minúsculas e garantindo que é uma string
    const validStatus = status.toLowerCase();
    
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
      // Caso padrão para qualquer outro valor
      return {
        label: 'Indetectável',
        bgColor: 'bg-green-900/40',
        borderColor: 'border-green-500',
        textColor: 'text-green-400',
        icon: <FiShield size={12} className="flex-shrink-0" />,
      };
    }
  };
  
  return (
    <>
      <div ref={cardRef} className="bg-dark-200 rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg">
        <div className="relative">
          {/* Badge de status do estoque - movida para antes da imagem, mas mantendo seu estilo */}
          <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-md z-20 ${getStockClass()}`}>
            {getStockStatus()}
          </div>
          
          {/* Imagem do produto com fallback */}
          <div className="aspect-w-4 aspect-h-10 bg-dark-300 relative">
            {/* Background pattern with wavy lines */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <div className="wavy-pattern h-full w-full"></div>
            </div>
            {hasImage ? (
              product.images[0].startsWith('data:') ? (
                // Imagem base64
                <img 
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover relative z-10"
                />
              ) : product.images[0].startsWith('/uploads/') ? (
                // Imagem do servidor
                <img 
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover relative z-10"
                />
              ) : product.images[0].startsWith('http') ? (
                // URL externa
                <img 
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover relative z-10"
                />
              ) : (
                // Fallback para texto
                <div className="flex items-center justify-center h-full p-4 text-gray-400 relative z-10">
                  <span>Imagem não disponível</span>
                </div>
              )
            ) : (
              // Nenhuma imagem encontrada
              <div className="flex items-center justify-center h-full p-4 text-gray-400 relative z-10">
                <span>Sem imagem</span>
              </div>
            )}
          </div>
          
          {/* Badge de destaque */}
          {product.featured && (
            <div className="absolute top-2 left-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
              Destaque
            </div>
          )}
          
          {/* Badge de status do cheat - exibir apenas se houver status */}
          {product.status && getStatusConfig(product.status) && (
            <div className={`absolute bottom-2 left-2 ${getStatusConfig(product.status)?.bgColor} ${getStatusConfig(product.status)?.textColor} text-xs font-medium px-2 py-1 rounded-md flex items-center border ${getStatusConfig(product.status)?.borderColor} animate-pulse-slow`}>
              <div className="flex items-center justify-center mr-1.5">
                {getStatusConfig(product.status)?.icon}
              </div>
              {getStatusConfig(product.status)?.label}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="text-white font-medium text-base mb-2">{product.name}</h3>
          
          {product.shortDescription && (
            <div 
              className="text-gray-400 text-xs mb-4 line-clamp-2 product-description"
              dangerouslySetInnerHTML={{ 
                __html: product.shortDescription
                  // Remover tags HTML não permitidas para segurança
                  .replace(/<(?!\/?(strong|em|span|b|i|p|br)\b)[^>]+>/gi, '') 
              }}
            />
          )}
          
          {/* Preço e botão de detalhes */}
          <div>
            <div className="mb-3">
              {hasDiscount() && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-gray-400 line-through text-sm">
                    R$ {getOriginalPrice()!.toFixed(2).replace('.', ',')}
                  </span>
                  {getDiscountPercentage() > 0 && (
                    <span className="bg-green-600/30 text-green-400 text-xs font-bold px-2 py-0.5 rounded">
                      -{getDiscountPercentage()}%
                    </span>
                  )}
                </div>
              )}
              <div className="text-primary font-bold text-xl">
                R$ {getBasePrice().toFixed(2).replace('.', ',')}
              </div>
            </div>
            
            <Link
              href={`/product/${product.slug}`}
              className="relative block w-full text-center bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md transition-all duration-300 overflow-hidden group"
            >
              <span className="relative z-10">Ver detalhes</span>
              <span className="absolute left-0 top-0 w-full h-0 bg-gradient-to-r from-[#e05400] to-[#ff8a42] opacity-50 group-hover:h-full transition-all duration-300"></span>
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-500 delay-100"></span>
            </Link>
          </div>
        </div>
      </div>
      
      {hasVariants && (
        <VariantStockModal 
          productId={product._id}
          isOpen={isStockModalOpen}
          onClose={() => setIsStockModalOpen(false)}
        />
      )}
    </>
  );
} 