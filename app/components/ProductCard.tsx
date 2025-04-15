'use client';

import { useState, useEffect, useRef } from 'react';
import { FiShoppingCart, FiEye, FiPackage, FiTrendingUp, FiShield, FiClock, FiAward, FiX, FiStar } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import VariantStockModal from './VariantStockModal';
import ProductRating from './ProductRating';
import { formatProductName } from '@/app/utils/formatters';

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
  const [rating, setRating] = useState(4.9); // Rating inicial
  const [reviewCount, setReviewCount] = useState(0); // Número de avaliações
  const [isAnimatingRating, setIsAnimatingRating] = useState(false); // Estado de animação
  
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
    if (totalStock === 99999) return 'Grande estoque disponível';
    if (totalStock <= 0) return 'Esgotado';
    if (totalStock <= 5) return 'Últimas unidades';
    if (totalStock <= 10) return 'Estoque baixo';
    return 'Disponível';
  };
  
  const getStockClass = () => {
    const totalStock = getTotalStock();
    if (totalStock <= 0) return 'bg-red-900/70 text-red-200 border border-red-500/40';
    if (totalStock <= 5) return 'bg-yellow-900/70 text-yellow-200 border border-yellow-500/40';
    if (totalStock <= 10) return 'bg-yellow-900/70 text-yellow-200 border border-yellow-500/40';
    return 'bg-dark-800/70 text-green-300 border border-green-500/40';
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
  const imageUrl = hasImage 
    ? product.images[0].startsWith('http') ? product.images[0] : `${product.images[0]}`
    : 'https://placehold.co/600x400/222/444?text=Sem+Imagem';
  
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
  
  const totalStock = getTotalStock();
  const discount = getDiscountPercentage();
  
  // Função para gerar rating baseado no ID do produto (para consistência)
  useEffect(() => {
    if (product && product._id) {
      // Usar o ID do produto como seed para gerar uma classificação entre 4.5 e 5.0
      const idSum = product._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const baseSeed = idSum % 100;
      const calculatedRating = 4.5 + (baseSeed / 200); // Rating entre 4.5 e 5.0
      setRating(calculatedRating);
      
      // Gerar também um número de avaliações baseado no ID para consistência
      const baseReviews = 300 + (idSum % 700);
      setReviewCount(baseReviews);
    }
  }, [product]);
  
  return (
    <>
      <div 
        ref={cardRef} 
        className="bg-gradient-to-b from-dark-300/90 to-dark-200 rounded-xl overflow-hidden shadow-md transition-all duration-400 hover:shadow-xl hover:shadow-dark-400/30 product-card"
      >
        <div className="relative rounded-lg overflow-hidden z-10">
          {/* Badge de estoque */}
          <div className={`absolute top-4 right-4 text-xs font-medium px-2.5 py-1 rounded-full z-20 backdrop-blur-xl shadow-sm ${getStockClass()}`}>
            {getStockStatus()}
          </div>
          
          {/* Container da imagem com padding */}
          <div className="pt-3 px-3 pb-0 bg-gradient-to-br from-dark-800 to-dark-900">
            {/* Imagem sem efeito de zoom */}
            <div className="h-52 relative overflow-hidden rounded-lg product-card-image">
              <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="bg-gradient-to-br from-dark-800 to-dark-900 h-full w-full opacity-90"></div>
                {/* Padrão sutil no fundo */}
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
              
              {/* Gradiente na parte inferior para melhorar transição com o conteúdo */}
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-dark-300/90 to-transparent z-10"></div>
            </div>
          </div>
          
          {/* Badge de destaque com animação mais sutil */}
          {product.featured && (
            <div className="absolute top-4 left-4 bg-dark-800/80 text-white text-xs font-medium px-3 py-1 rounded-full z-20 flex items-center border border-primary/30 shadow-sm transition-all duration-300">
              <span className="mr-1.5 inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
              Destaque
            </div>
          )}
          
          {/* Badge de status */}
          {product.status && getStatusConfig(product.status) && (
            <div className={`absolute bottom-[53px] left-4 bg-dark-800/80 ${getStatusConfig(product.status)?.textColor} border ${getStatusConfig(product.status)?.borderColor}/30 text-xs px-3 py-1 rounded-full flex items-center backdrop-blur-xl z-20 shadow-sm transition-all duration-300`}>
              {getStatusConfig(product.status)?.icon && (
                <span className="mr-1.5">{getStatusConfig(product.status)?.icon}</span>
              )}
              {getStatusConfig(product.status)?.label}
            </div>
          )}
        </div>
        
        <div className="p-5 flex flex-col justify-between h-[200px] relative z-10 bg-gradient-to-b from-dark-300/90 to-dark-200">
          {/* Título com efeito mais sutil */}
          <div className="relative">
            <h3 className="text-white font-medium text-base mb-1 group-hover:text-primary transition-colors duration-300">{formatProductName(product.name)}</h3>
            <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary/30 group-hover:w-1/4 transition-all duration-500"></span>
          </div>
          
          {/* Sistema de avaliações */}
          <ProductRating 
            rating={rating} 
            reviewCount={reviewCount} 
            isAnimating={isAnimatingRating} 
          />
          
          <div>
            <div className="flex items-baseline mb-3 relative">
              {hasVariants ? (
                <span className="text-primary font-bold text-xl transition-all duration-300">{`R$ ${getBasePrice().toFixed(2).replace('.', ',')}`}</span>
              ) : (
                <span className="text-primary font-bold text-xl transition-all duration-300">{`R$ ${getBasePrice().toFixed(2).replace('.', ',')}`}</span>
              )}
              
              {getOriginalPrice() && getOriginalPrice() > 0 && (
                <span className="text-gray-400 line-through text-sm ml-2">
                  R$ {getOriginalPrice().toFixed(2).replace('.', ',')}
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
                disabled={totalStock <= 0}
                className={`product-card-button w-full py-2.5 px-4 rounded-lg text-center font-medium transition-all duration-300 relative overflow-hidden ${
                  totalStock <= 0 
                  ? 'bg-dark-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-primary text-white hover:bg-primary-dark group-hover:shadow-md'
                }`}
              >
                {totalStock <= 0 ? 'Esgotado' : (
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
      
      {/* Modal para exibir estoque das variantes */}
      {isStockModalOpen && (
        <VariantStockModal
          product={product}
          onClose={() => setIsStockModalOpen(false)}
        />
      )}
    </>
  );
} 