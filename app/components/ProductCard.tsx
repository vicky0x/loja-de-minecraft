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
  const [salesCount, setSalesCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const countAnimationTriggered = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Verificar se o produto tem variantes
  const hasVariants = product.variants && product.variants.length > 0;
  
  // Gerar um número de vendas personalizado e realista para cada produto
  useEffect(() => {
    // Função para gerar um hash determinístico a partir da string do ID
    const generateSeed = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash);
    };
    
    // Obter valor base a partir do ID do produto
    const seed = generateSeed(product._id);
    
    // Definir valores específicos para criar mais variação
    // O operador módulo cria um padrão cíclico, garantindo diferentes faixas
    const modValue = seed % 25; // 25 categorias diferentes
    
    let salesValue: number;
    
    // Distribuição personalizada para maior variabilidade
    if (modValue === 0) salesValue = 390 + (seed % 15); // ~390-404 vendas
    else if (modValue === 1) salesValue = 350 + (seed % 30); // ~350-379 vendas
    else if (modValue === 2) salesValue = 280 + (seed % 25); // ~280-304 vendas
    else if (modValue === 3) salesValue = 240 + (seed % 20); // ~240-259 vendas
    else if (modValue === 4) salesValue = 220 + (seed % 18); // ~220-237 vendas
    else if (modValue === 5) salesValue = 180 + (seed % 15); // ~180-194 vendas
    else if (modValue === 6) salesValue = 150 + (seed % 20); // ~150-169 vendas
    else if (modValue === 7) salesValue = 110 + (seed % 25); // ~110-134 vendas
    else if (modValue === 8) salesValue = 180 + (seed % 15); // ~180-194 vendas
    else if (modValue === 9) salesValue = 250 + (seed % 20); // ~250-269 vendas
    else if (modValue === 10) salesValue = 210 + (seed % 15); // ~210-224 vendas
    else if (modValue === 11) salesValue = 90 + (seed % 10); // ~90-99 vendas
    else if (modValue === 12) salesValue = 170 + (seed % 15); // ~170-184 vendas
    else if (modValue === 13) salesValue = 150 + (seed % 18); // ~150-167 vendas
    else if (modValue === 14) salesValue = 130 + (seed % 15); // ~130-144 vendas
    else if (modValue === 15) salesValue = 110 + (seed % 12); // ~110-121 vendas
    else if (modValue === 16) salesValue = 90 + (seed % 15); // ~90-104 vendas
    else if (modValue === 17) salesValue = 80 + (seed % 10); // ~80-89 vendas
    else if (modValue === 18) salesValue = 70 + (seed % 10); // ~70-79 vendas
    else if (modValue === 19) salesValue = 60 + (seed % 8); // ~60-67 vendas
    else if (modValue === 20) salesValue = 50 + (seed % 10); // ~50-59 vendas
    else if (modValue === 21) salesValue = 40 + (seed % 8); // ~40-47 vendas
    else if (modValue === 22) salesValue = 30 + (seed % 8); // ~30-37 vendas
    else if (modValue === 23) salesValue = 20 + (seed % 10); // ~20-29 vendas
    else salesValue = 10 + (seed % 10); // ~10-19 vendas
    
    // Adicionar um pequeno ajuste aleatório para números menos redondos
    const randomAdjustment = Math.floor(Math.random() * 5) - 2; // -2 a +2
    salesValue += randomAdjustment;
    
    // Definir o valor inicial
    setSalesCount(salesValue);
    
    // Opcional: incremento ocasional para simular novas vendas
    const interval = setInterval(() => {
      // Apenas 30% de chance de incremento a cada hora
      if (Math.random() < 0.3) {
        setSalesCount(current => current + 1);
      }
    }, 60 * 60 * 1000); // A cada hora
    
    return () => clearInterval(interval);
  }, [product._id]);
  
  // Efeito para animar a contagem quando o card é visível
  useEffect(() => {
    if (!cardRef.current) return;
    
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !countAnimationTriggered.current) {
        countAnimationTriggered.current = true;
        
        // Animar o contador
        let start = 0;
        const duration = 1500; // 1.5 segundos
        const startTime = performance.now();
        
        const animateCount = (timestamp: number) => {
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Função de easing para suavizar a animação
          const easeOutQuart = 1 - Math.pow(1 - progress, 4);
          
          setDisplayedCount(Math.floor(easeOutQuart * salesCount));
          
          if (progress < 1) {
            requestAnimationFrame(animateCount);
          } else {
            setDisplayedCount(salesCount);
          }
        };
        
        requestAnimationFrame(animateCount);
      }
    }, { threshold: 0.1 });
    
    observer.observe(cardRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [salesCount]);
  
  // Atualizar o contador exibido quando o salesCount mudar após a animação inicial
  useEffect(() => {
    if (countAnimationTriggered.current) {
      setDisplayedCount(salesCount);
    }
  }, [salesCount]);
  
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
    
    // Se não tiver desconto, retorne null
    return null;
  };
  
  // Verificar se o produto tem desconto
  const hasDiscount = () => {
    return (product.originalPrice !== undefined && product.originalPrice > 0) || 
           (product.discountPercentage !== undefined && product.discountPercentage > 0);
  };
  
  // Calcular porcentagem de desconto
  const getDiscountPercentage = () => {
    // Se já tiver porcentagem definida, use-a
    if (product.discountPercentage && product.discountPercentage > 0) {
      return product.discountPercentage;
    }
    
    // Se tiver preço original, calcule a porcentagem
    if (product.originalPrice && product.originalPrice > 0) {
      const basePrice = getBasePrice();
      if (basePrice > 0 && product.originalPrice > basePrice) {
        return Math.round(((product.originalPrice - basePrice) / product.originalPrice) * 100);
      }
    }
    
    return 0;
  };
  
  // Verificar se o produto tem imagem
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
          <div className="aspect-w-16 aspect-h-9 bg-dark-300 relative">
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