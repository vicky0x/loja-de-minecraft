'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiShoppingCart, FiPackage, FiCheck, FiClock, FiShield, FiDownload, FiAward, FiStar, FiLock, FiUser, FiTrendingUp, FiX, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import VariantStockModal from '@/app/components/VariantStockModal';

interface Variant {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  features: string[];
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  images: string[];
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  variants: Variant[];
  featured: boolean;
  requirements: string[];
  status: 'indetectavel' | 'detectavel' | 'manutencao' | 'beta';
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  const [lastStockUpdate, setLastStockUpdate] = useState<Date | null>(null);
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [showRequirements, setShowRequirements] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [salesCount, setSalesCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const animationTriggered = useRef(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/slug/${slug}`);
        
        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }
        
        const data = await response.json();
        setProduct(data.product);
        setLastStockUpdate(new Date());
        
        if (data.product.variants && data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0]._id);
        }
        
        if (data.product._id) {
          const idSum = data.product._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          const baseSales = 100 + (idSum % 880);
          setSalesCount(baseSales);
        }
      } catch (error) {
        console.error('Erro ao buscar produto:', error);
        setError('Não foi possível encontrar o produto solicitado.');
      } finally {
        setLoading(false);
      }
    }
    
    if (slug) {
      fetchProduct();
    }

    const intervalId = setInterval(() => {
      if (product) {
        refreshProductStock();
      }
    }, 120000);
    
    const salesInterval = setInterval(() => {
      setSalesCount(current => {
        const increment = Math.floor(Math.random() * 3) + 1;
        return current + increment;
      });
    }, 60 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
      clearInterval(salesInterval);
    };
  }, [slug]);

  const refreshProductStock = async () => {
    if (!product) return;
    
    try {
      setIsRefreshingStock(true);
      const response = await fetch(`/api/products/${product._id}`);
      
      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
        setLastStockUpdate(new Date());
      }
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
    } finally {
      setIsRefreshingStock(false);
    }
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
    setQuantity(1);
  };

  const getSelectedVariant = () => {
    if (!product || !selectedVariant) return null;
    return product.variants.find(v => v._id === selectedVariant) || null;
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed) return;
    
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomPosition({ x, y });
  };

  const increaseQuantity = () => {
    const variant = getSelectedVariant();
    if (!variant) return;
    
    if (quantity < variant.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const getTotalPrice = () => {
    const variant = getSelectedVariant();
    if (!variant) return 0;
    
    return variant.price * quantity;
  };

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    
    console.log(`Adicionado ao carrinho: ${product.name} - Variante: ${selectedVariant} - Quantidade: ${quantity}`);
  };

  const getStockClass = (stock: number) => {
    if (stock > 10) return 'text-green-400';
    if (stock > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStockText = (stock: number) => {
    if (stock > 10) return `${stock} em estoque`;
    if (stock > 5) return `Apenas ${stock} unidades`;
    if (stock > 0) return `Últimas ${stock} unidades!`;
    return 'Esgotado';
  };

  const getStatusConfig = (status: string) => {
    // Verificar se o status é válido
    const validStatus = ['indetectavel', 'detectavel', 'manutencao', 'beta'].includes(status) 
      ? status 
      : 'indetectavel'; // Fallback para 'indetectavel' se o status for inválido
    
    switch (validStatus) {
      case 'indetectavel':
        return {
          label: 'Indetectável',
          bgColor: 'bg-green-900/30',
          borderColor: 'border-green-500',
          textColor: 'text-green-400',
          icon: <FiShield className="mr-2" />,
          description: 'Nosso sistema anti-detecção está ativo e funcionando perfeitamente.',
          pulseColor: 'bg-green-500/30'
        };
      case 'detectavel':
        return {
          label: 'Risco de Detecção',
          bgColor: 'bg-yellow-900/30',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-400',
          icon: <FiClock className="mr-2" />,
          description: 'Use com cautela, estamos trabalhando para melhorar a proteção.',
          pulseColor: 'bg-yellow-500/30'
        };
      case 'manutencao':
        return {
          label: 'Em Manutenção',
          bgColor: 'bg-red-900/30',
          borderColor: 'border-red-500',
          textColor: 'text-red-400',
          icon: <FiX className="mr-2" />,
          description: 'Temporariamente indisponível enquanto realizamos atualizações.',
          pulseColor: 'bg-red-500/30'
        };
      case 'beta':
        return {
          label: 'Versão Beta',
          bgColor: 'bg-blue-900/30',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-400',
          icon: <FiAward className="mr-2" />,
          description: 'Versão prévia com recursos experimentais. Use por sua conta e risco.',
          pulseColor: 'bg-blue-500/30'
        };
      default:
        return {
          label: 'Status Desconhecido',
          bgColor: 'bg-gray-900/30',
          borderColor: 'border-gray-500',
          textColor: 'text-gray-400',
          icon: <FiInfo className="mr-2" />,
          description: 'Informação não disponível no momento.',
          pulseColor: 'bg-gray-500/30'
        };
    }
  };

  // Animar o contador quando o elemento estiver visível
  useEffect(() => {
    if (!countRef.current || !salesCount) return;
    
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      
      if (entry.isIntersecting && !animationTriggered.current) {
        animationTriggered.current = true;
        
        // Animação do contador com efeito suave
        let startTime: number;
        const duration = 2000; // 2 segundos
        
        const animateCount = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Função de easing para uma animação mais natural
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          setDisplayedCount(Math.floor(easeOut * salesCount));
          
          if (progress < 1) {
            requestAnimationFrame(animateCount);
          } else {
            setDisplayedCount(salesCount);
          }
        };
        
        requestAnimationFrame(animateCount);
      }
    }, { threshold: 0.1 });
    
    observer.observe(countRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [salesCount]);
  
  // Atualizar o contador exibido quando o salesCount mudar após a animação inicial
  useEffect(() => {
    if (animationTriggered.current) {
      setDisplayedCount(salesCount);
    }
  }, [salesCount]);

  // Adicionar esta função para formatar os requisitos do sistema
  const formatRequirements = (requirements: string[]) => {
    // Lista de chaves em português que queremos exibir
    const keysPT = [
      'Sistema Operacional',
      'Processador',
      'Memória',
      'Placa de Vídeo',
      'Armazenamento',
      'Notas Adicionais'
    ];
    
    // Mapeamento de chaves em inglês para português (para compatibilidade)
    const keyMapping: Record<string, string> = {
      'operating_system': 'Sistema Operacional',
      'processor': 'Processador',
      'memory': 'Memória',
      'graphics': 'Placa de Vídeo',
      'storage': 'Armazenamento',
      'additional_notes': 'Notas Adicionais'
    };
    
    // Objeto para armazenar valores filtrados
    const reqObj: Record<string, string> = {
      'Sistema Operacional': '',
      'Processador': '',
      'Memória': '',
      'Placa de Vídeo': '',
      'Armazenamento': '',
      'Notas Adicionais': ''
    };
    
    // Processar os requisitos reais
    if (requirements && requirements.length > 0) {
      // Primeiro, preencher com requisitos em inglês (serão sobrescritos se existirem em português)
      requirements.forEach(req => {
        const parts = req.split(':');
        if (parts.length > 1) {
          const key = parts[0].trim();
          const value = parts[1].trim();
          
          // Se a chave estiver em inglês, mapeá-la para português
          if (keyMapping[key]) {
            reqObj[keyMapping[key]] = value;
          }
          // Se já estiver em português, usar diretamente
          else if (keysPT.includes(key)) {
            reqObj[key] = value;
          }
        }
      });
    }
    
    // Retornar apenas os requisitos em português, filtrando chaves vazias
    return Object.entries(reqObj)
      .filter(([_, value]) => value && value.trim() !== '')
      .map(([key, value]) => ({
        key,
        value
      }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-dark-200 p-6 rounded-lg shadow-md">
          <div className="text-red-500 mb-4">{error || 'Produto não encontrado'}</div>
          <Link href="/products" className="text-primary hover:underline">
            ← Voltar para a lista de produtos
          </Link>
        </div>
      </div>
    );
  }

  const variant = getSelectedVariant();
  const formattedLastUpdate = lastStockUpdate 
    ? lastStockUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  return (
    <div className="bg-dark-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/products" className="text-primary hover:underline flex items-center group">
            <FiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para produtos</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="bg-dark-200 rounded-lg overflow-hidden shadow-lg mb-4">
              <div
                ref={imageRef}
                className="relative aspect-video cursor-zoom-in overflow-hidden"
                onClick={() => setIsZoomed(!isZoomed)}
                onMouseMove={handleImageMouseMove}
                onMouseLeave={() => setIsZoomed(false)}
              >
                {product.images && product.images.length > 0 ? (
                  <>
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={selectedImageIndex}
                        src={product.images[selectedImageIndex]}
                        alt={product.name}
                        className={`w-full h-full object-contain ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </AnimatePresence>
                    
                    {isZoomed && (
                      <div className="absolute inset-0 overflow-hidden">
                        <img
                          src={product.images[selectedImageIndex]}
                          alt={product.name}
                          className="absolute w-[200%] h-[200%] max-w-none"
                          style={{ 
                            top: `${-zoomPosition.y}%`, 
                            left: `${-zoomPosition.x}%`, 
                            transform: 'scale(2.5)',
                            transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` 
                          }}
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    Imagem não disponível
                  </div>
                )}
              </div>
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2 mb-6">
                {product.images.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-md overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-primary' : 'border-transparent'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - imagem ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            )}
            
            <div className="bg-dark-200 rounded-lg shadow-lg mt-8">
              <div className="flex border-b border-dark-300">
                <button
                  className={`py-3 px-4 font-medium text-sm transition-colors ${
                    activeTab === 'description' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('description')}
                >
                  Descrição
                </button>
                <button
                  className={`py-3 px-4 font-medium text-sm transition-colors ${
                    activeTab === 'requirements' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('requirements')}
                >
                  Requisitos
                </button>
                <button
                  className={`py-3 px-4 font-medium text-sm transition-colors ${
                    activeTab === 'warranty' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setActiveTab('warranty')}
                >
                  Garantia
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'description' && (
                  <div className="text-gray-300">
                    {/* Conteúdo HTML do editor rico */}
                    <div 
                      className="product-description prose prose-invert max-w-none 
                                 prose-headings:text-primary prose-headings:font-semibold prose-headings:mt-6 prose-headings:mb-3
                                 prose-p:mb-3 prose-p:leading-relaxed
                                 prose-strong:text-white prose-strong:font-semibold 
                                 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                 prose-ul:my-3 prose-ul:space-y-1 prose-ol:my-3 prose-ol:space-y-1 
                                 prose-li:text-gray-300 prose-li:my-0.5
                                 prose-blockquote:border-primary prose-blockquote:bg-dark-300/50 prose-blockquote:py-1 prose-blockquote:px-4
                                 whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: product.description.replace(/\n/g, '<br>') }}
                    />
                  </div>
                )}
                
                {activeTab === 'requirements' && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Requisitos do Sistema</h3>
                    {product.requirements && product.requirements.length > 0 ? (
                      <div className="bg-dark-300/50 p-4 rounded-lg">
                        <ul className="space-y-3 divide-y divide-dark-400">
                          {formatRequirements(product.requirements).map((req, index) => (
                            <li key={index} className="flex items-start text-gray-300 pt-3 first:pt-0">
                              <FiCheck className="text-primary mt-1 mr-2 flex-shrink-0" />
                              <span className="flex-1">{req.key}: {req.value}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-gray-400">Sem requisitos específicos.</p>
                    )}
                  </div>
                )}
                
                {activeTab === 'warranty' && (
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Nossa Garantia</h3>
                    <p className="text-gray-300 mb-4">
                      Oferecemos garantia de funcionamento em todos os nossos produtos. Se você tiver qualquer problema,
                      nossa equipe de suporte estará disponível para ajudar 24/7.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-start text-gray-300">
                        <FiShield className="text-primary mt-1 mr-2 flex-shrink-0" />
                        Garantia de funcionamento
                      </li>
                      <li className="flex items-start text-gray-300">
                        <FiUser className="text-primary mt-1 mr-2 flex-shrink-0" />
                        Suporte técnico 24/7
                      </li>
                      <li className="flex items-start text-gray-300">
                        <FiDownload className="text-primary mt-1 mr-2 flex-shrink-0" />
                        Atualizações gratuitas
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-5">
            <div className="bg-dark-200 rounded-lg p-6 shadow-lg sticky top-24">
              <div className="mb-4">
                {product.category && (
                  <Link 
                    href={`/products/category/${product.category.slug}`}
                    className="text-xs text-primary hover:underline uppercase tracking-wider"
                  >
                    {product.category.name}
                  </Link>
                )}
                <h1 className="text-2xl font-bold text-white mt-1">{product.name}</h1>
              </div>
              
              {product.status && (
                <motion.div 
                  className={`mb-6 p-4 rounded-lg border-l-4 ${getStatusConfig(product.status).borderColor} ${getStatusConfig(product.status).bgColor} relative overflow-hidden group`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className={`absolute inset-0 ${getStatusConfig(product.status).pulseColor} blur-xl animate-pulse`}></div>
                  </div>
                  <motion.div 
                    className="relative z-10 flex items-center"
                    initial={{ x: -10 }}
                    animate={{ x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full mr-3 ${getStatusConfig(product.status).bgColor} border ${getStatusConfig(product.status).borderColor}`}>
                      {getStatusConfig(product.status).icon}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${getStatusConfig(product.status).textColor}`}>
                        Status: {getStatusConfig(product.status).label}
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">
                        {getStatusConfig(product.status).description}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )}
              
              <div className="flex items-center justify-between mb-6 text-sm">
                <div className={`flex items-center ${getStatusConfig(product.status || 'indetectavel').textColor}`}>
                  {getStatusConfig(product.status || 'indetectavel').icon}
                  <span>{getStatusConfig(product.status || 'indetectavel').label}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <FiClock className="mr-1" />
                  <span>Atualizado: {formattedLastUpdate}</span>
                </div>
              </div>
              
              <div className="mb-6 overflow-hidden" ref={countRef}>
                <div className="bg-gradient-to-r from-dark-300/80 via-dark-400/60 to-dark-300/80 backdrop-blur-sm rounded-lg p-3 border border-dark-300/80 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/0 via-green-500/30 to-primary/0 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-1000 group-hover:duration-700 animate-gradient-x"></div>
                  
                  <div className="relative flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-900/30 rounded-full mr-3 overflow-hidden">
                      <div className="w-full h-full flex items-center justify-center z-10">
                        <FiTrendingUp className="text-green-400 animate-subtle-bounce" size={18} />
                      </div>
                      <div className="absolute w-full h-full bg-green-500/20 rounded-full animate-pulse"></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-baseline">
                        <span className="text-green-400 text-xl font-bold tracking-tight">{displayedCount}</span>
                        <span className="ml-2 text-gray-300 font-medium">clientes satisfeitos</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-400 mt-0.5 group-hover:text-gray-300 transition-colors">
                        <span className="inline-block mr-1 w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                        Produto muito procurado com alta taxa de satisfação
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-0.5 w-full bg-dark-500 mt-2 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-primary w-0 group-hover:w-full transition-all duration-1000 ease-out"></div>
                  </div>
                </div>
              </div>
              
              {product.shortDescription && (
                <p className="text-gray-300 mb-6 text-sm">{product.shortDescription}</p>
              )}
              
              {variant && (
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-primary">
                      R$ {variant.price.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">por licença</span>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    variant.stock > 10 ? 'bg-green-900/30 text-green-400' :
                    variant.stock > 0 ? 'bg-yellow-900/30 text-yellow-400' :
                    'bg-red-900/30 text-red-400'
                  }`}>
                    <span>{getStockText(variant.stock)}</span>
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-medium text-white">Escolha seu plano:</h3>
                  <button
                    onClick={() => setIsStockModalOpen(true)}
                    className="text-xs text-primary flex items-center"
                  >
                    <FiPackage className="mr-1" />
                    Ver todos os planos
                  </button>
                </div>
                
                <div className="space-y-3">
                  {product.variants.map((variant) => (
                    <motion.div 
                      key={variant._id}
                      onClick={() => handleVariantChange(variant._id)}
                      className={`cursor-pointer border rounded-lg p-4 transition-all ${
                        selectedVariant === variant._id 
                          ? 'border-primary bg-dark-300/50 shadow-lg shadow-primary/10' 
                          : 'border-dark-400 bg-dark-300/30 hover:border-gray-400'
                      }`}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="font-semibold text-white flex items-center">
                          {selectedVariant === variant._id && (
                            <FiCheck className="text-primary mr-2" />
                          )}
                          {variant.name}
                        </div>
                        <div className="text-primary font-medium">
                          R$ {variant.price.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      
                      {variant.features && variant.features.length > 0 && (
                        <ul className="text-xs text-gray-300 space-y-1 mt-2">
                          {variant.features.map((feature, index) => (
                            <li key={index}>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
              
              {variant && variant.stock > 0 && (
                <div className="mb-6">
                  <h3 className="text-md font-medium text-white mb-3">Quantidade:</h3>
                  <div className="flex items-center">
                    <button
                      onClick={decreaseQuantity}
                      disabled={quantity <= 1}
                      className="w-10 h-10 flex items-center justify-center bg-dark-300 text-white hover:bg-dark-400 disabled:opacity-50 rounded-l-md"
                    >
                      -
                    </button>
                    <div className="w-14 h-10 flex items-center justify-center bg-dark-300 text-white font-medium border-x border-dark-400">
                      {quantity}
                    </div>
                    <button
                      onClick={increaseQuantity}
                      disabled={quantity >= variant.stock}
                      className="w-10 h-10 flex items-center justify-center bg-dark-300 text-white hover:bg-dark-400 disabled:opacity-50 rounded-r-md"
                    >
                      +
                    </button>
                    
                    <div className="ml-4 text-sm text-gray-400">
                      {variant.stock} disponíveis
                    </div>
                  </div>
                </div>
              )}
              
              {variant && (
                <div className="bg-dark-300 p-4 rounded-lg mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-xl font-bold text-primary">
                      R$ {getTotalPrice().toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  {variant.stock <= 5 && variant.stock > 0 && (
                    <div className="mt-2 text-yellow-400 text-xs flex items-center">
                      <FiClock className="mr-1" />
                      Estoque limitado! Apenas {variant.stock} unidades disponíveis.
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  onClick={handleAddToCart}
                  disabled={!variant || variant.stock <= 0}
                  className={`py-3 rounded-md flex items-center justify-center font-medium ${
                    !variant || variant.stock <= 0
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-dark-300 hover:bg-dark-400 text-white'
                  }`}
                  whileHover={variant && variant.stock > 0 ? { scale: 1.02 } : {}}
                  whileTap={variant && variant.stock > 0 ? { scale: 0.98 } : {}}
                >
                  <FiShoppingCart className="mr-2" />
                  Adicionar ao Carrinho
                </motion.button>
                
                <motion.button
                  onClick={() => {
                    if (variant && variant.stock > 0) {
                      console.log(`Compra imediata: ${product.name} - ${variant.name} - Qtd: ${quantity}`);
                    }
                  }}
                  disabled={!variant || variant.stock <= 0}
                  className={`py-3 rounded-md flex items-center justify-center font-medium ${
                    !variant || variant.stock <= 0
                      ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary/90 text-white'
                  }`}
                  whileHover={variant && variant.stock > 0 ? { scale: 1.02 } : {}}
                  whileTap={variant && variant.stock > 0 ? { scale: 0.98 } : {}}
                >
                  Comprar Agora
                </motion.button>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm text-gray-300">
                <div className="flex items-center">
                  <FiDownload className="text-primary mr-2" />
                  Entrega imediata
                </div>
                <div className="flex items-center">
                  <FiShield className="text-primary mr-2" />
                  Garantia vitalícia
                </div>
                <div className="flex items-center">
                  <FiUser className="text-primary mr-2" />
                  Suporte 24/7
                </div>
                <div className="flex items-center">
                  <FiLock className="text-primary mr-2" />
                  Pagamento seguro
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <VariantStockModal
        productId={product._id}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />
    </div>
  );
} 