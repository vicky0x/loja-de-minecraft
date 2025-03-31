'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiShoppingCart, FiPackage, FiCheck, FiClock, FiShield, FiDownload, FiAward, FiStar, FiLock, FiUser, FiTrendingUp, FiX, FiInfo, FiAlertOctagon, FiTool, FiCode } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import VariantStockModal from '@/app/components/VariantStockModal';
import { useCart } from '@/app/contexts/CartContext';
import toast from 'react-hot-toast';

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
  price?: number;
  stock?: number;
  featured: boolean;
  requirements: string[];
  status: 'indetectavel' | 'detectavel' | 'manutencao' | 'beta';
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [variant, setVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [hasVariants, setHasVariants] = useState(true);
  const [lastStockUpdate, setLastStockUpdate] = useState<Date | null>(null);
  const [isRefreshingStock, setIsRefreshingStock] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [showRequirements, setShowRequirements] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  const [salesCount, setSalesCount] = useState(0);
  const [displayedCount, setDisplayedCount] = useState(0);
  const cart = useCart();

  // Ref para o elemento da imagem
  const imageRef = useRef<HTMLDivElement>(null);
  // Ref para o contador de vendas
  const countRef = useRef<HTMLDivElement>(null);
  const animationTriggered = useRef(false);
  
  // Animações de contagem
  const countUp = useRef(null);
  const [countersVisible, setCountersVisible] = useState(false);
  
  // Refs para interseção observer
  const imageGalleryRef = useRef<HTMLDivElement>(null);
  const countersRef = useRef<HTMLDivElement>(null);

  // Usado para detectar quando as seções estão visíveis
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target === countersRef.current && entry.isIntersecting) {
            setCountersVisible(true);
          }
        });
      },
      { threshold: 0.5 }
    );
    
    if (countersRef.current) {
      observer.observe(countersRef.current);
    }
    
    return () => {
      if (countersRef.current) {
        observer.unobserve(countersRef.current);
      }
    };
  }, []);

  useEffect(() => {
    fetchProduct();

    // Configurar atualização automática do estoque a cada 2 minutos
    const intervalId = setInterval(() => {
      if (product) {
        refreshProductStock();
        setLastStockUpdate(new Date());
      }
    }, 120000);  // 2 minutos
    
    return () => clearInterval(intervalId);
  }, [slug]);

  async function fetchProduct() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/products/slug/${slug}`);
      
      if (!response.ok) {
        throw new Error('Produto não encontrado');
      }
      
      const data = await response.json();
      
      if (data.product) {
        setProduct(data.product);
        
        // Verificar se o produto tem variantes
        const productHasVariants = 
          Array.isArray(data.product.variants) && 
          data.product.variants.length > 0;
        
        setHasVariants(productHasVariants);
        
        // Se tiver variantes, selecionar a primeira por padrão
        if (productHasVariants) {
          const firstVariant = data.product.variants[0];
          setSelectedVariant(firstVariant._id);
          setVariant(firstVariant);
        } else if (data.product.price !== undefined) {
          // Se não tiver variantes, criar uma variante simulada com os dados do produto
          const singleVariant: Variant = {
            _id: 'single',
            name: 'Padrão',
            description: '',
            price: data.product.price,
            stock: data.product.stock || 0,
            features: []
          };
          setSelectedVariant('single');
          setVariant(singleVariant);
        }
      } else {
        throw new Error('Erro ao carregar dados do produto');
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Erro ao buscar produto:', error);
    } finally {
      setLoading(false);
    }
  }

  // Função para atualizar os dados do estoque do produto
  const refreshProductStock = async () => {
    if (!product) return;
    
    try {
      const response = await fetch(`/api/products/${product._id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.product) {
          setProduct(data.product);
          
          // Atualizar a variante selecionada
          if (hasVariants && selectedVariant) {
            const updatedVariant = data.product.variants.find((v: Variant) => v._id === selectedVariant);
            if (updatedVariant) {
              setVariant(updatedVariant);
            }
          } else if (data.product.price !== undefined) {
            // Atualizar a variante simulada para produtos sem variantes
            setVariant({
              _id: 'single',
              name: 'Padrão',
              description: '',
              price: data.product.price,
              stock: data.product.stock || 0,
              features: []
            });
          }
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
    }
  };

  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
    
    if (product && hasVariants) {
      const selected = product.variants.find(v => v._id === variantId);
      if (selected) {
        setVariant(selected);
        // Resetar a quantidade quando mudar de variante
        setQuantity(1);
      }
    }
  };

  const getSelectedVariant = () => {
    if (!product || !selectedVariant) return null;
    
    if (hasVariants) {
      return product.variants.find(v => v._id === selectedVariant) || null;
    }
    
    // Se não tiver variantes, retorna a variante simulada
    return variant;
  };

  const increaseQuantity = () => {
    if (variant && quantity < variant.stock) {
      setQuantity(prev => prev + 1);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };
  
  const getTotalPrice = () => {
    if (!variant) return 0;
    return variant.price * quantity;
  };
  
  const handleAddToCart = () => {
    if (!product || !variant) return;
    
    // Lógica para adicionar ao carrinho
    const item = {
      productId: product._id,
      productName: product.name,
      productImage: product.images && product.images.length > 0 ? product.images[0] : '',
      variantId: variant._id,
      variantName: variant.name,
      price: variant.price,
      quantity: quantity,
      stock: variant.stock,
    };
    
    // Adicionar ao carrinho usando o contexto
    cart.addItem(item);
    
    // Feedback visual para o usuário
    toast.success(`${product.name} - ${variant.name} foi adicionado ao seu carrinho.`);
  };
  
  const getStockClass = (stock: number) => {
    if (stock > 10) return 'text-green-400';
    if (stock > 0) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getStockText = (stock: number) => {
    if (stock > 10) return 'Em estoque';
    if (stock > 0) return `Apenas ${stock} restantes`;
    return 'Esgotado';
  };
  
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'indetectavel':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-900/30',
          icon: <FiShield className="mr-1" />,
          text: 'Indetectável'
        };
      case 'detectavel':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/30',
          icon: <FiAlertOctagon className="mr-1" />,
          text: 'Detectável'
        };
      case 'manutencao':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-900/30',
          icon: <FiTool className="mr-1" />,
          text: 'Em Manutenção'
        };
      case 'beta':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/30',
          icon: <FiCode className="mr-1" />,
          text: 'Beta'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-800',
          icon: <FiInfo className="mr-1" />,
          text: 'Status Desconhecido'
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

  // Atualizar salesCount ao carregar o produto
  useEffect(() => {
    if (product && product._id) {
      // Gerar um número de vendas baseado no ID do produto para simular dados
      const idSum = product._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      const baseSales = 100 + (idSum % 880);
      setSalesCount(baseSales);
      
      // Configurar um intervalo para incrementar aleatoriamente o contador
      const salesInterval = setInterval(() => {
        setSalesCount(current => {
          const increment = Math.floor(Math.random() * 3) + 1;
          return current + increment;
        });
      }, 60 * 60 * 1000); // A cada hora
      
      return () => clearInterval(salesInterval);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse text-white">Carregando produto...</div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="bg-dark-200 rounded-lg p-6 text-center">
          <div className="text-red-400 mb-4">Erro ao carregar o produto</div>
          <div className="text-gray-300">{error || 'Produto não encontrado'}</div>
          <Link href="/" className="mt-6 inline-block px-4 py-2 bg-primary text-white rounded-md">
            Voltar para a Página Inicial
          </Link>
        </div>
      </div>
    );
  }

  const formattedLastUpdate = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-dark-100">
      <div className="container mx-auto py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center text-sm text-gray-400">
          <Link href="/" className="hover:text-primary">Início</Link>
          <span className="mx-2">/</span>
          {product.category && (
            <>
              <Link 
                href={`/category/${product.category.slug}`} 
                className="hover:text-primary"
              >
                {product.category.name}
              </Link>
              <span className="mx-2">/</span>
            </>
          )}
          <span className="text-gray-200">{product.name}</span>
        </div>
        
        <div className="bg-dark-200 rounded-xl p-4 md:p-6 lg:p-8 shadow-lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Galeria de imagens */}
            <div className="lg:col-span-2">
              <div className="relative">
                <div 
                  ref={imageRef}
                  className="aspect-video bg-dark-300 rounded-lg mb-4 overflow-hidden relative"
                >
                  <div className="relative h-full">
                    <img
                      src={product.images[currentImageIndex]}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  
                  {product.status && (
                    <div 
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-sm font-medium ${getStatusConfig(product.status).bgColor} ${getStatusConfig(product.status).color}`}
                    >
                      <div className="flex items-center">
                        {getStatusConfig(product.status).icon}
                        <span>{getStatusConfig(product.status).text}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Miniaturas */}
                <div className="flex overflow-x-auto gap-2 pb-2">
                  {product.images.map((image, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 ${
                        currentImageIndex === index ? 'border-primary' : 'border-transparent'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <img 
                        src={image} 
                        alt={`${product.name} - Imagem ${index + 1}`}
                        className="w-16 h-16 object-cover"
                      />
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Status do produto - detalhes */}
              {product.status && (
                <div className={`mt-6 p-4 rounded-lg ${getStatusConfig(product.status).bgColor} border ${getStatusConfig(product.status).color}`}>
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 p-2 rounded-full ${getStatusConfig(product.status).bgColor} ${getStatusConfig(product.status).color}`}>
                      {getStatusConfig(product.status).icon}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${getStatusConfig(product.status).color}`}>
                        Status: {getStatusConfig(product.status).text}
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">
                        {getStatusConfig(product.status).text === 'Indetectável' ? 'Nosso sistema anti-detecção está ativo e funcionando perfeitamente.' :
                         getStatusConfig(product.status).text === 'Detectável' ? 'Use com cautela, estamos trabalhando para melhorar a proteção.' :
                         getStatusConfig(product.status).text === 'Em Manutenção' ? 'Temporariamente indisponível enquanto realizamos atualizações.' :
                         getStatusConfig(product.status).text === 'Beta' ? 'Versão prévia com recursos experimentais. Use por sua conta e risco.' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Abas de navegação - Descrição/Requisitos/Garantia */}
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
                        dangerouslySetInnerHTML={{ __html: product.description }}
                      />
                    </div>
                  )}
                  
                  {activeTab === 'requirements' && (
                    <div>
                      <h3 className="text-lg font-medium text-white mb-4">Requisitos do Sistema</h3>
                      {product.requirements && product.requirements.length > 0 ? (
                        <div className="bg-dark-300/50 p-4 rounded-lg">
                          <ul className="space-y-3 divide-y divide-dark-400">
                            {product.requirements.map((req, index) => (
                              <li key={index} className="flex items-start text-gray-300 pt-3 first:pt-0">
                                <FiCheck className="text-primary mt-1 mr-2 flex-shrink-0" />
                                <span className="flex-1">{req}</span>
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
            
            <div className="lg:col-span-1">
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
                  
                  {product.shortDescription && (
                    <p className="text-gray-300 mt-2 text-sm">{product.shortDescription}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-6 text-sm">
                  {product.status && getStatusConfig(product.status) ? (
                    <div className={`flex items-center ${getStatusConfig(product.status).textColor}`}>
                      <span className="mr-2">{getStatusConfig(product.status).icon}</span>
                      <span>{getStatusConfig(product.status).text}</span>
                    </div>
                  ) : (
                    <div></div> /* Espaço reservado quando não há status */
                  )}
                  {product.status && getStatusConfig(product.status) ? (
                    <div className="flex items-center text-gray-400">
                      <FiClock className="mr-1" />
                      <span>Atualizado: {formattedLastUpdate}</span>
                    </div>
                  ) : (
                    <div></div> /* Não exibir "Atualizado" quando não há status */
                  )}
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
                
                <div className="mb-6">
                  {!hasVariants ? (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">Preço:</h3>
                        <div className="text-primary text-xl font-bold">
                          R$ {product.price?.toFixed(2).replace('.', ',')}
                        </div>
                      </div>
                      
                      <div className="bg-dark-300/50 rounded-lg p-4 border border-dark-400 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Disponibilidade:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.stock > 10 ? 'bg-green-900/30 text-green-400' :
                            product.stock > 0 ? 'bg-yellow-900/30 text-yellow-400' :
                            'bg-red-900/30 text-red-400'
                          }`}>
                            <span>{getStockText(product.stock || 0)}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-md font-medium text-white">
                          Escolha seu plano:
                        </h3>
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
                    </>
                  )}
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
      </div>
      
      <VariantStockModal
        productId={product._id}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />
    </div>
  );
} 