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
}

export default function ProductCard({ product }: { product: Product }) {
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [salesCount, setSalesCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const countAnimationTriggered = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Gerar um número de vendas baseado no ID do produto para consistência
  useEffect(() => {
    // Usar o ID do produto para gerar um número de base entre 100 e 980
    const idSum = product._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const baseSales = 100 + (idSum % 880);
    
    // Definir o valor inicial
    setSalesCount(baseSales);
    
    // A cada hora, incrementar um valor pequeno (1-3)
    const interval = setInterval(() => {
      setSalesCount(current => {
        // Incremento aleatório entre 1 e 3
        const increment = Math.floor(Math.random() * 3) + 1;
        return current + increment;
      });
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
    return product.variants.reduce((total, variant) => total + variant.stock, 0);
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
  
  // Obter o preço base (menor preço entre as variantes)
  const getBasePrice = () => {
    if (!product.variants || product.variants.length === 0) return 0;
    return Math.min(...product.variants.map(v => v.price));
  };
  
  // Verificar se o produto tem imagem
  const hasImage = product.images && product.images.length > 0;
  const mainImage = hasImage ? product.images[0] : '/placeholder-product.jpg';
  
  // Adicionar a função para configuração do status logo após a função getBasePrice
  const getStatusConfig = (status?: string) => {
    // Adicionar log para depuração
    console.log('Status recebido no ProductCard:', status);
    
    // Se o status for null, undefined ou string vazia
    if (!status) {
      return null; // Retornar null para indicar que não há status
    }
    
    // Convertendo para minúsculas e garantindo que é uma string
    const validStatus = status.toLowerCase();
    console.log('Status convertido para minúsculas:', validStatus);
    
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
      console.log('Status não reconhecido, usando padrão Indetectável');
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
          {/* Imagem do produto com fallback */}
          <div className="aspect-w-16 aspect-h-9 bg-dark-300 relative">
            {/* Background image for all product cards */}
            <div className="absolute inset-0 z-0 opacity-20">
              <img 
                src="https://wallpapercave.com/wp/wp9493309.jpg"
                alt="Background"
                className="w-full h-full object-cover"
              />
            </div>
            {hasImage ? (
              product.images[0].startsWith('data:') ? (
                // Imagem base64
                <img 
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : product.images[0].startsWith('/uploads/') ? (
                // Imagem do servidor
                <img 
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : product.images[0].startsWith('http') ? (
                // URL externa
                <img 
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                // Fallback para texto
                <div className="flex items-center justify-center h-full p-4 text-gray-400">
                  <span>Imagem não disponível</span>
                </div>
              )
            ) : (
              // Nenhuma imagem encontrada
              <div className="flex items-center justify-center h-full p-4 text-gray-400">
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
          
          {/* Badge de status do estoque */}
          <div className={`absolute top-2 right-2 text-xs font-bold px-2 py-1 rounded-md ${getStockClass()}`}>
            {getStockStatus()}
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-white font-semibold mb-2 line-clamp-1">{product.name}</h3>
          
          {product.shortDescription && (
            <div 
              className="text-gray-400 text-sm mb-4 line-clamp-2 product-description"
              dangerouslySetInnerHTML={{ 
                __html: product.shortDescription
                  // Remover tags HTML não permitidas para segurança
                  .replace(/<(?!\/?(strong|em|span|b|i|p|br)\b)[^>]+>/gi, '') 
              }}
            />
          )}
          
          {/* Contador de vendas com animação */}
          <div className="relative mb-3 overflow-hidden">
            <div className="bg-gradient-to-r from-dark-300 to-dark-400 rounded-md p-2 group transition-all duration-300 hover:shadow-md hover:shadow-primary/10 border border-dark-400 hover:border-primary/30">
              <div className="flex items-center">
                <div className="w-7 h-7 rounded-full bg-green-900/40 flex items-center justify-center mr-2 group-hover:scale-110 transition-transform">
                  <FiTrendingUp className="text-green-400 animate-subtle-bounce" size={14} />
                </div>
                <div>
                  <div className="flex items-center">
                    <span className="text-green-400 font-bold">{displayedCount}</span>
                    <span className="text-xs ml-1.5 text-gray-300">clientes satisfeitos</span>
                  </div>
                  <div className="text-xs text-gray-400">Produto muito vendido</div>
                </div>
              </div>
              <div className="absolute -bottom-0.5 left-0 h-0.5 bg-gradient-to-r from-green-500/70 to-primary/70 w-0 group-hover:w-full transition-all duration-700"></div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-primary font-bold">
                R$ {getBasePrice().toFixed(2).replace('.', ',')}
              </div>
            </div>
            
            <div className="flex space-x-1">
              {/* Botão para ver estoque */}
              <button
                onClick={() => setIsStockModalOpen(true)}
                className="p-2 text-white hover:text-primary transition-colors"
                title="Ver estoque"
              >
                <FiPackage size={18} />
              </button>
              
              {/* Link para visualizar produto */}
              <Link
                href={`/product/${product.slug}`}
                className="p-2 text-white hover:text-primary transition-colors"
                title="Ver detalhes"
              >
                <FiEye size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <VariantStockModal 
        productId={product._id}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />
    </>
  );
} 