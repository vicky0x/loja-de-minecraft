'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { FiArrowLeft, FiShoppingCart, FiPackage, FiCheck, FiClock, FiShield, FiDownload, FiAward, FiStar, FiLock, FiUser, FiTrendingUp, FiX, FiInfo, FiAlertOctagon, FiTool, FiCode, FiEye, FiHeart } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import VariantStockModal from '@/app/components/VariantStockModal';
import { useCart } from '@/app/contexts/CartContext';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/hooks/useAuth';
import { formatProductName } from '@/app/utils/formatters';
import { toast as hotToast } from 'react-hot-toast';
import ProductCard from '@/app/components/ProductCard';
import ProductReviews from '@/app/components/products/ProductReviews';
import ProductVariantSelector from '@/app/components/products/ProductVariantSelector';

// Função auxiliar para extrair o ID do vídeo do YouTube
const extractYouTubeId = (url: string): string => {
  // Se já for um ID simples (sem URL)
  if (!url || url.trim() === '') return '';
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  
  // Se for uma URL de incorporação, extrair o ID
  if (url.includes('youtube.com/embed/')) {
    return url.split('youtube.com/embed/')[1].split('?')[0];
  }
  
  // Se for uma URL completa, extrair o ID
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : url;
};

// Interface para os ícones
interface IconProps extends IconBaseProps {
  className?: string;
}

interface Variant {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  features: string[];
  deliveryType?: 'automatic' | 'manual';
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
  deliveryType?: 'automatic' | 'manual';
  originalPrice?: number;
  discountPercentage?: number;
  tutorial_video_url?: string;
}

// Cor primária mais clara para efeitos de luz
const primaryLight = "#6c63ff";  // Ajuste para a cor primária da sua aplicação

// Wrappers para todos os ícones utilizados
const IconFiArrowLeft = (props: IconProps) => <FiArrowLeft {...props} />;
const IconFiShoppingCart = (props: IconProps) => <FiShoppingCart {...props} />;
const IconFiPackage = (props: IconProps) => <FiPackage {...props} />;
const IconFiCheck = (props: IconProps) => <FiCheck {...props} />;
const IconFiClock = (props: IconProps) => <FiClock {...props} />;
const IconFiShield = (props: IconProps) => <FiShield {...props} />;
const IconFiDownload = (props: IconProps) => <FiDownload {...props} />;
const IconFiAward = (props: IconProps) => <FiAward {...props} />;
const IconFiStar = (props: IconProps) => <FiStar {...props} />;
const IconFiLock = (props: IconProps) => <FiLock {...props} />;
const IconFiUser = (props: IconProps) => <FiUser {...props} />;
const IconFiTrendingUp = (props: IconProps) => <FiTrendingUp {...props} />;
const IconFiX = (props: IconProps) => <FiX {...props} />;
const IconFiInfo = (props: IconProps) => <FiInfo {...props} />;
const IconFiAlertOctagon = (props: IconProps) => <FiAlertOctagon {...props} />;
const IconFiTool = (props: IconProps) => <FiTool {...props} />;
const IconFiCode = (props: IconProps) => <FiCode {...props} />;
const IconFiEye = (props: IconProps) => <FiEye {...props} />;
const IconFiHeart = (props: IconProps) => <FiHeart {...props} />;

export default function ProductPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { isAuthenticated, isLoadingAuth: isLoading, checkAuth } = useAuth();

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
    if (slug) {
      fetchProduct();

      // Configurar atualização automática do estoque a cada 2 minutos
      const intervalId = setInterval(() => {
        if (product) {
          refreshProductStock();
          setLastStockUpdate(new Date());
        }
      }, 120000);  // 2 minutos
      
      return () => clearInterval(intervalId);
    }
  }, [slug]);

  // Fazer verificação de autenticação ao montar o componente
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        // Erro silencioso
      }
    };
    
    verifyAuth();
    
  }, [isAuthenticated, checkAuth]);

  const fetchProduct = async () => {
    if (!slug) {
      setError('URL de produto inválida');
      setLoading(false);
      return;
    }
    
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
          // Garantir que o estoque seja tratado corretamente (0 ou null como indisponível)
          const stockValue = data.product.stock === null || data.product.stock === undefined ? 0 : data.product.stock;
          const singleVariant: Variant = {
            _id: 'single',
            name: 'Padrão',
            description: '',
            price: data.product.price,
            stock: stockValue,
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
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar os dados do estoque do produto
  const refreshProductStock = async () => {
    if (!product || !slug) return;
    
    try {
      setIsRefreshingStock(true);
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
            // Garantir que o estoque seja tratado corretamente (0 ou null como indisponível)
            const stockValue = data.product.stock === null || data.product.stock === undefined ? 0 : data.product.stock;
            setVariant({
              _id: 'single',
              name: 'Padrão',
              description: '',
              price: data.product.price,
              stock: stockValue,
              features: []
            });
          }
        }
      }
    } catch (error) {
      // Erro silencioso
    } finally {
      setIsRefreshingStock(false);
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
    // Se o estoque for 99999 (estoque grande), permite aumentar até um limite alto mas razoável
    const isLargeStock = variant.stock === 99999;
    const maxAllowed = isLargeStock ? 30 : variant.stock;
    
    if (quantity < maxAllowed) {
      setQuantity(quantity + 1);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const getTotalPrice = () => {
    if (!variant) return 0;
    return variant.price * quantity;
  };
  
  // Obter o preço original para exibição
  const getOriginalPrice = () => {
    // Se o produto tiver um preço original definido, use-o
    if (product.originalPrice) {
      return product.originalPrice;
    }
    
    // Se tiver um percentual de desconto definido, calcule o preço original
    if (product.discountPercentage && product.discountPercentage > 0) {
      const basePrice = variant?.price || 0;
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
    const basePrice = variant?.price || 0;
    
    if (originalPrice && basePrice) {
      const discount = ((originalPrice - basePrice) / originalPrice) * 100;
      return Math.round(discount);
    }
    
    return 0;
  };
  
  const handleAddToCart = async () => {
    try {
      if (!variant || !variant.stock || variant.stock <= 0) return false;
      
      setIsAddingToCart(true);
      
      // Criar um identificador único para evitar duplicatas rápidas
      const requestId = `${product?._id}-${variant._id}-${Date.now()}`;
      
      // Verificar se foi uma requisição duplicada dentro de 2 segundos
      const lastRequestTime = localStorage.getItem(`lastAddToCart-${product?._id}-${variant._id}`);
      if (lastRequestTime && Date.now() - parseInt(lastRequestTime) < 2000) {
        setIsAddingToCart(false);
        return false;
      }
      
      // Registrar esta requisição
      localStorage.setItem(`lastAddToCart-${product?._id}-${variant._id}`, Date.now().toString());
      
      // Adicionar item ao carrinho através do contexto
      cart.addItem({
        productId: product?._id ?? '',
        productName: product?.name ?? '',
        productImage: product?.images?.[0] ?? '',
        variantId: variant._id,
        variantName: variant.name,
        price: variant.price,
        quantity: quantity,
        stock: variant.stock,
        hasVariants: hasVariants
      });
      
      return true;
    } catch (error) {
      return false;
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  const getStockClass = (stock: number) => {
    // Verificar se o produto ou a variante tem entrega manual
    if (product.deliveryType === 'manual' || (variant && variant.deliveryType === 'manual')) {
      return 'text-green-400';
    }
    
    if (stock > 10) return 'text-green-400';
    if (stock > 0) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getStockText = (stock: number) => {
    // Verificar se o produto ou a variante tem entrega manual
    if (product.deliveryType === 'manual' || (variant && variant.deliveryType === 'manual')) {
      return 'Grande estoque disponível';
    }
    
    if (stock === 99999) return 'Grande estoque disponível';
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
          icon: <IconFiShield className="mr-1" />,
          text: 'Indetectável'
        };
      case 'detectavel':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/30',
          icon: <IconFiAlertOctagon className="mr-1" />,
          text: 'Detectável'
        };
      case 'manutencao':
        return {
          color: 'text-orange-400',
          bgColor: 'bg-orange-900/30',
          icon: <IconFiTool className="mr-1" />,
          text: 'Em Manutenção'
        };
      case 'beta':
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/30',
          icon: <IconFiCode className="mr-1" />,
          text: 'Beta'
        };
      default:
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-800',
          icon: <IconFiInfo className="mr-1" />,
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
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200 flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-20 h-20 mx-auto mb-6 relative"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-primary"></div>
            <div className="absolute inset-2 rounded-full border-t-2 border-r-2 border-primary/70"></div>
            <div className="absolute inset-4 rounded-full border-b-2 border-r-2 border-primary/40"></div>
          </motion.div>
          <p className="text-white text-lg font-medium">Carregando seu produto</p>
          <p className="text-gray-400 text-sm mt-2">Preparando uma experiência incrível...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200 flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md w-full bg-dark-300/50 backdrop-blur-md rounded-2xl p-8 border border-dark-400/20 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="w-20 h-20 mx-auto mb-6 text-red-400 flex items-center justify-center bg-red-500/10 rounded-full"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", damping: 10, stiffness: 200, delay: 0.2 }}
          >
            <IconFiX size={36} />
          </motion.div>
          <h2 className="text-2xl font-bold text-white text-center mb-2">Produto não encontrado</h2>
          <p className="text-gray-300 text-center mb-8">{error || 'Este produto pode ter sido removido ou está temporariamente indisponível.'}</p>
          <Link 
            href="/" 
            className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl text-center transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Voltar para a loja
          </Link>
        </motion.div>
      </div>
    );
  }

  const formattedLastUpdate = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200">
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Navegação e Breadcrumb */}
        <motion.div 
          className="flex flex-col sm:flex-row sm:items-center gap-3 mb-8 text-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link 
            href="/" 
            className="flex items-center text-gray-400 hover:text-primary transition-colors group"
          >
            <IconFiArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar à loja</span>
          </Link>
          <div className="flex flex-wrap items-center space-x-2 text-gray-400 mt-2 sm:mt-0 sm:ml-auto">
            <Link href="/" className="hover:text-primary transition-colors">Início</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link 
                  href={`/category/${product.category.slug}`} 
                  className="hover:text-primary transition-colors max-w-[120px] truncate"
                >
                  {product.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-white max-w-[150px] sm:max-w-full truncate">{formatProductName(product.name)}</span>
          </div>
        </motion.div>

        {/* Corpo do produto */}
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Coluna Esquerda - Imagens */}
          <motion.div 
            className="w-full lg:w-3/5"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-dark-300/30 rounded-2xl p-6 backdrop-blur-sm border border-dark-400/10 shadow-xl">
              {/* Imagem principal */}
              <motion.div 
                className="aspect-auto relative overflow-hidden rounded-xl mb-4 bg-dark-400/20"
                layoutId="productImage"
              >
                <motion.img
                  key={currentImageIndex}
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-contain transition-all duration-500"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                
                {/* Badge de status */}
                {product.status && (
                  <motion.div 
                    className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-medium ${getStatusConfig(product.status).bgColor} ${getStatusConfig(product.status).color} backdrop-blur-md shadow-lg border border-current/20`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <div className="flex items-center">
                      {getStatusConfig(product.status).icon}
                      <span className="ml-1.5">{getStatusConfig(product.status).text}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
              
              {/* Galeria de miniaturas - Exibida apenas quando houver mais de uma imagem */}
              {product.images.length > 1 && (
                <div className="relative">
                  <motion.div 
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-dark-300/20 scrollbar-thumb-dark-400/50"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    {product.images.map((image, index) => (
                      <motion.div
                        key={index}
                        className={`relative cursor-pointer rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${
                          currentImageIndex === index 
                            ? 'ring-2 ring-primary shadow-lg shadow-primary/20 scale-105' 
                            : 'hover:ring-1 hover:ring-primary/50'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <div className="w-20 h-20 bg-dark-500 flex items-center justify-center">
                          <img 
                            src={image} 
                            alt={`${product.name} - Visualização ${index + 1}`}
                            className="w-full h-full object-contain p-1"
                          />
                          {currentImageIndex === index && (
                            <motion.div 
                              className="absolute inset-0 bg-primary/10"
                              layoutId="thumbnailHighlight"
                              transition={{ duration: 0.2 }}
                            />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </div>
            
            {/* Detalhes do produto */}
            <motion.div 
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {/* Seção com abas */}
              <div className="bg-dark-300/30 rounded-2xl overflow-hidden backdrop-blur-sm border border-dark-400/10 shadow-xl">
                <div className="flex border-b border-dark-400/30">
                  <motion.button
                    className={`py-4 px-6 font-medium text-sm transition-all relative ${
                      activeTab === 'description' 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('description')}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    whileTap={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  >
                    Descrição
                    {activeTab === 'description' && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        layoutId="activeTabIndicator"
                      />
                    )}
                  </motion.button>
                  <motion.button
                    className={`py-4 px-6 font-medium text-sm transition-all relative ${
                      activeTab === 'requirements' 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('requirements')}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    whileTap={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  >
                    Requisitos
                    {activeTab === 'requirements' && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        layoutId="activeTabIndicator"
                      />
                    )}
                  </motion.button>
                  <motion.button
                    className={`py-4 px-6 font-medium text-sm transition-all relative ${
                      activeTab === 'warranty' 
                        ? 'text-white' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    onClick={() => setActiveTab('warranty')}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    whileTap={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                  >
                    Garantia
                    {activeTab === 'warranty' && (
                      <motion.div 
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                        layoutId="activeTabIndicator"
                      />
                    )}
                  </motion.button>
                </div>
                
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {activeTab === 'description' && (
                      <motion.div 
                        className="text-gray-300"
                        key="description"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
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
                      </motion.div>
                    )}
                    
                    {activeTab === 'requirements' && (
                      <motion.div
                        key="requirements"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-xl font-medium text-white mb-4">Requisitos do Sistema</h3>
                        {product.requirements && product.requirements.length > 0 ? (
                          <div className="space-y-3">
                            {product.requirements.map((req, index) => (
                              <motion.div 
                                key={index} 
                                className="flex items-start bg-dark-400/20 p-4 rounded-xl"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                              >
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3 flex-shrink-0">
                                  <IconFiCheck className="text-primary" />
                                </div>
                                <div className="text-gray-300">{req}</div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400">Sem requisitos específicos para este produto.</p>
                        )}
                      </motion.div>
                    )}
                    
                    {activeTab === 'warranty' && (
                      <motion.div
                        key="warranty"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h3 className="text-xl font-medium text-white mb-4">Nossa Garantia</h3>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                          Oferecemos garantia de 30 dias em todos os nossos produtos. Se você encontrar qualquer problema durante este período,
                          nossa equipe de suporte estará disponível para ajudar 24 horas por dia, 7 dias por semana.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <motion.div 
                            className="bg-dark-400/20 rounded-xl p-5 flex flex-col items-center text-center"
                            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                              <IconFiShield className="text-primary" size={22} />
                            </div>
                            <h4 className="font-medium text-white mb-2">Garantia de 30 dias</h4>
                            <p className="text-sm text-gray-400">Garantimos que nossos produtos funcionem exatamente como descrito por 30 dias.</p>
                          </motion.div>
                          <motion.div 
                            className="bg-dark-400/20 rounded-xl p-5 flex flex-col items-center text-center"
                            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)" }}
                          >
                            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                              <IconFiUser className="text-primary" size={22} />
                            </div>
                            <h4 className="font-medium text-white mb-2">Suporte técnico 24/7</h4>
                            <p className="text-sm text-gray-400">Nossa equipe está sempre disponível para resolver qualquer problema.</p>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Coluna Direita - Informações de compra */}
          <motion.div 
            className="w-full lg:w-2/5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="sticky top-6">
              {/* Card principal */}
              <div className="bg-dark-300/50 backdrop-blur-xl rounded-2xl border border-dark-400/20 shadow-2xl overflow-hidden max-w-[600px] mx-auto">
                {/* Cabeçalho do produto */}
                <div className="p-6 pb-4">
                  {product.category && (
                    <Link 
                      href={`/products/category/${product.category.slug}`}
                      className="inline-block text-xs uppercase tracking-wider font-medium text-primary/90 hover:text-primary transition-colors mb-2 bg-primary/5 px-3 py-1 rounded-full"
                    >
                      {product.category.name}
                    </Link>
                  )}
                  <motion.h1 
                    className="text-2xl lg:text-3xl font-bold text-white mb-2"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {formatProductName(product.name)}
                  </motion.h1>
                  
                  {product.shortDescription && (
                    <motion.p 
                      className="text-gray-300 text-sm leading-relaxed"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      {product.shortDescription}
                    </motion.p>
                  )}
                </div>
                
                {/* Indicador de popularidade */}
                <motion.div 
                  className="px-6 pb-4" 
                  ref={countRef}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                >
                  <div className="bg-gradient-to-r from-dark-400/50 to-dark-400/30 rounded-xl overflow-hidden relative group hover:shadow-xl transition-all duration-500">
                    {/* Efeito de brilho animado */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                    
                    {/* Efeito de onda animada */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/0 via-primary/5 to-primary/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1500 ease-in-out"></div>
                    
                    {/* Borda brilhante */}
                    <div className="absolute inset-0 rounded-xl border border-green-500/0 group-hover:border-green-500/30 transition-all duration-500"></div>
                    
                    <div className="p-4 backdrop-blur-sm relative z-10 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-900/30 rounded-full mr-4 flex items-center justify-center backdrop-blur-sm border border-green-500/30 shadow-lg shadow-green-500/10 group-hover:shadow-green-500/20 transition-all duration-500">
                          <motion.div
                            animate={{ 
                              y: [0, -3, 0],
                              scale: [1, 1.1, 1] 
                            }}
                            transition={{ 
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse" 
                            }}
                          >
                            <IconFiTrendingUp className="text-green-400 group-hover:text-green-300 transition-colors duration-300" size={22} />
                          </motion.div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-baseline">
                            <motion.span 
                              className="text-green-400 text-2xl font-bold group-hover:text-green-300 transition-colors duration-300"
                              animate={{ 
                                scale: [1, 1.05, 1],
                                textShadow: [
                                  "0 0 0px rgba(74, 222, 128, 0)",
                                  "0 0 4px rgba(74, 222, 128, 0.3)",
                                  "0 0 0px rgba(74, 222, 128, 0)"
                                ]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                repeatType: "reverse" 
                              }}
                            >
                              {displayedCount}
                            </motion.span>
                            <span className="ml-2 text-white font-medium group-hover:text-white/90 transition-colors duration-300">clientes satisfeitos</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-400 group-hover:text-gray-300 transition-colors duration-300 flex items-center">
                            <motion.span 
                              className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 1, 0.7],
                                boxShadow: [
                                  "0 0 0px rgba(74, 222, 128, 0)",
                                  "0 0 4px rgba(74, 222, 128, 0.5)",
                                  "0 0 0px rgba(74, 222, 128, 0)"
                                ]
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: "loop"
                              }}
                            ></motion.span>
                            Alta taxa de satisfação • Produto muito procurado
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {/* Área de preço e seleção */}
                <div className="border-t border-dark-400/30">
                  <div className="p-6">
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                    >
                      {!hasVariants ? (
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-white">Preço:</h3>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-gray-400 text-sm line-through">
                                  {hasDiscount() ? `R$ ${getOriginalPrice().toFixed(2).replace('.', ',')}` : ''}
                                </span>
                                {hasDiscount() && (
                                  <span className="bg-green-900/30 text-green-400 text-xs font-medium py-0.5 px-2 rounded-full">
                                    -{getDiscountPercentage()}%
                                  </span>
                                )}
                              </div>
                              <div className="text-primary text-2xl font-bold">
                                R$ {product.price?.toFixed(2).replace('.', ',')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-dark-400/20 rounded-xl p-4 mb-6">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">Disponibilidade:</span>
                              <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                product.stock > 10 ? 'bg-green-900/30 text-green-400 border border-green-500/30' :
                                product.stock > 0 ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30' :
                                'bg-red-900/30 text-red-400 border border-red-500/30'
                              }`}>
                                <span>{getStockText(product.stock || 0)}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-center mb-5">
                            <h3 className="text-lg font-medium text-white">
                              Escolha seu plano:
                            </h3>
                          </div>
                          
                          <div className="space-y-3 mb-6">
                            {product.variants.map((variantItem, index) => (
                              <motion.div 
                                key={variantItem._id}
                                onClick={() => handleVariantChange(variantItem._id)}
                                className={`cursor-pointer rounded-xl overflow-hidden transition-all duration-300 ${
                                  selectedVariant === variantItem._id 
                                    ? 'ring-2 ring-primary bg-primary/5' 
                                    : 'ring-1 ring-dark-400/50 bg-dark-400/20 hover:ring-primary/50'
                                }`}
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.7 + (index * 0.1) }}
                              >
                                <div className="p-4">
                                  <div className="flex justify-between items-center">
                                    <div className="font-semibold text-white flex items-center">
                                      {selectedVariant === variantItem._id && (
                                        <motion.div 
                                          initial={{ scale: 0 }}
                                          animate={{ scale: 1 }}
                                          transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                          className="mr-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                                        >
                                          <IconFiCheck className="text-white text-sm" />
                                        </motion.div>
                                      )}
                                      {variantItem.name}
                                    </div>
                                    
                                    <div className="flex flex-col items-end">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className="text-gray-400 text-xs line-through">
                                          {hasDiscount() ? `R$ ${getOriginalPrice().toFixed(2).replace('.', ',')}` : ''}
                                        </span>
                                        {hasDiscount() && (
                                          <span className="bg-green-900/30 text-green-400 text-xs font-medium py-0.5 px-1.5 rounded-full">
                                            -{getDiscountPercentage()}%
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-primary font-medium">
                                        R$ {variantItem.price.toFixed(2).replace('.', ',')}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* NOVO: Badge de entrega manual para variantes */}
                                  {variantItem.deliveryType === 'manual' && (
                                    <div className="mt-2 bg-amber-900/20 border border-amber-500/20 rounded-lg p-2">
                                      <div className="flex items-center text-xs text-amber-400">
                                        <IconFiClock className="mr-1.5 flex-shrink-0" />
                                        <span>Entrega manual em até 24h</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {variantItem.features && variantItem.features.length > 0 && (
                                    <motion.ul 
                                      className="text-xs text-gray-400 mt-2 space-y-1.5"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      transition={{ duration: 0.4 }}
                                    >
                                      {variantItem.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start">
                                          <span className="w-1 h-1 rounded-full bg-primary/70 mt-1.5 mr-2 flex-shrink-0"></span>
                                          <span>{feature}</span>
                                        </li>
                                      ))}
                                    </motion.ul>
                                  )}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </>
                      )}
                    </motion.div>
                    
                    {/* Seletor de quantidade */}
                    {variant && variant.stock > 0 && (
                      <motion.div 
                        className="mb-6"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 }}
                      >
                        <h3 className="text-base font-medium text-white mb-3">Quantidade:</h3>
                        <div className="flex items-center">
                          <motion.button
                            onClick={decreaseQuantity}
                            disabled={quantity <= 1}
                            className={`w-12 h-12 flex items-center justify-center rounded-l-xl ${
                              quantity <= 1 
                                ? 'bg-dark-300/50 text-gray-500 cursor-not-allowed' 
                                : 'bg-dark-300/70 text-white hover:bg-dark-400/80'
                            } relative overflow-hidden group transition-all duration-300`}
                            whileHover={quantity > 1 ? { scale: 1.03 } : {}}
                            whileTap={quantity > 1 ? { scale: 0.97 } : {}}
                            type="button"
                            aria-label="Diminuir quantidade"
                            style={{
                              WebkitAppearance: 'none',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            {quantity > 1 && (
                              <span className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            )}
                            <motion.span 
                              className="text-2xl font-light"
                              animate={quantity > 1 ? { 
                                y: [0, -2, 0],
                                opacity: [0.8, 1, 0.8] 
                              } : {}}
                              transition={{ 
                                duration: 1.5, 
                                repeat: Infinity,
                                repeatType: "mirror" 
                              }}
                            >
                              −
                            </motion.span>
                          </motion.button>
                          
                          <motion.div 
                            className="w-16 h-12 flex items-center justify-center bg-dark-300/60 text-white font-medium text-lg border-x border-dark-400/50"
                            whileTap={{ scale: 0.97 }}
                          >
                            <motion.span
                              key={quantity}
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            >
                              {quantity}
                            </motion.span>
                          </motion.div>
                          
                          <motion.button
                            onClick={increaseQuantity}
                            disabled={quantity >= variant.stock}
                            className={`w-12 h-12 flex items-center justify-center rounded-r-xl ${
                              quantity >= variant.stock 
                                ? 'bg-dark-300/50 text-gray-500 cursor-not-allowed' 
                                : 'bg-dark-300/70 text-white hover:bg-dark-400/80'
                            } relative overflow-hidden group transition-all duration-300`}
                            whileHover={quantity < variant.stock ? { scale: 1.03 } : {}}
                            whileTap={quantity < variant.stock ? { scale: 0.97 } : {}}
                            type="button"
                            aria-label="Aumentar quantidade"
                            style={{
                              WebkitAppearance: 'none',
                              WebkitTapHighlightColor: 'transparent'
                            }}
                          >
                            {quantity < variant.stock && (
                              <span className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            )}
                            <motion.span 
                              className="text-xl"
                              animate={quantity < variant.stock ? { 
                                y: [0, -2, 0],
                                opacity: [0.8, 1, 0.8] 
                              } : {}}
                              transition={{ 
                                duration: 1.5, 
                                repeat: Infinity,
                                repeatType: "mirror" 
                              }}
                            >
                              +
                            </motion.span>
                          </motion.button>
                          
                          <div className="ml-4 text-gray-400 text-sm flex items-center space-x-1.5">
                            <motion.div 
                              className={`w-3 h-3 rounded-full ${
                                variant.stock > 10 ? 'bg-green-500' : 
                                variant.stock > 0 ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`}
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7],
                                boxShadow: [
                                  `0 0 0px ${variant.stock > 10 ? '#22c55e' : variant.stock > 0 ? '#eab308' : '#ef4444'}`,
                                  `0 0 8px ${variant.stock > 10 ? '#22c55e' : variant.stock > 0 ? '#eab308' : '#ef4444'}`,
                                  `0 0 0px ${variant.stock > 10 ? '#22c55e' : variant.stock > 0 ? '#eab308' : '#ef4444'}`
                                ]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity,
                                repeatType: "loop" 
                              }}
                            />
                            <motion.span
                              initial={{ opacity: 0.8 }}
                              whileHover={{ opacity: 1, x: 2 }}
                            >
                              {variant.stock === 99999 ? 'Grande estoque disponível' : `${variant.stock} disponíveis`}
                            </motion.span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Total e botões de ação */}
                    {variant && (
                      <>
                        <motion.div 
                          className="bg-dark-400/30 rounded-xl p-4 mb-6"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 0.9 }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Total:</span>
                            <motion.span 
                              className="text-2xl font-bold text-primary"
                              key={getTotalPrice()}
                              initial={{ scale: 1.1 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 10 }}
                            >
                              R$ {getTotalPrice().toFixed(2).replace('.', ',')}
                            </motion.span>
                          </div>
                          
                          {variant.stock <= 5 && variant.stock > 0 && (
                            <motion.div 
                              className="mt-3 text-yellow-400 text-xs flex items-center bg-yellow-900/20 p-2.5 rounded-lg border border-yellow-500/20 relative overflow-hidden"
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              transition={{ duration: 0.3, delay: 1 }}
                            >
                              {/* Efeito de pulsar com borda fixa */}
                              <motion.div 
                                className="absolute inset-0 bg-yellow-500/10 rounded-lg border border-yellow-500/30"
                                animate={{ 
                                  scale: [1, 1.02, 1],
                                  opacity: [0.3, 0.6, 0.3],
                                  boxShadow: ["0 0 0px rgba(250, 204, 21, 0)", "0 0 5px rgba(250, 204, 21, 0.2)", "0 0 0px rgba(250, 204, 21, 0)"]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  repeatType: "reverse"
                                }}
                              />
                              
                              {/* Efeito de brilho deslizante */}
                              <motion.div 
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-500/20 to-transparent rounded-lg"
                                initial={{ x: "-100%" }}
                                animate={{ x: "100%" }}
                                transition={{ 
                                  duration: 1.5,
                                  repeat: Infinity,
                                  repeatDelay: 0.5
                                }}
                              />
                              
                              <motion.div 
                                className="mr-1.5 flex-shrink-0 relative z-10"
                                animate={{ 
                                  rotateZ: [0, 10, 0, -10, 0],
                                  scale: [1, 1.1, 1]
                                }}
                                transition={{ 
                                  duration: 1.5,
                                  repeat: Infinity
                                }}
                              >
                                <IconFiClock />
                              </motion.div>
                              <span className="relative z-10">
                                <motion.span 
                                  className="font-semibold"
                                  animate={{ 
                                    textShadow: ["0 0 0px rgba(250, 204, 21, 0)", "0 0 3px rgba(250, 204, 21, 0.5)", "0 0 0px rgba(250, 204, 21, 0)"]
                                  }}
                                  transition={{ 
                                    duration: 1.5,
                                    repeat: Infinity
                                  }}
                                >
                                  Estoque limitado!
                                </motion.span> Poucas unidades disponíveis.
                              </span>
                            </motion.div>
                          )}
                        </motion.div>
                        
                        <motion.div 
                          className="grid grid-cols-2 gap-4"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: 1 }}
                        >
                          {/* Botão Adicionar ao Carrinho */}
                          <motion.button
                            onClick={() => {
                              if (!isAuthenticated) {
                                try {
                                  localStorage.setItem('redirectAfterLogin', '/cart');
                                } catch (error) {
                                  // Erro silencioso
                                }
                                
                                // Verificar novamente o estado de autenticação antes de mostrar o toast
                                const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
                                if (!storedAuth) {
                                  toast.success('É necessário fazer login para adicionar ao carrinho');
                                  router.push('/auth/login');
                                } else {
                                  // Se estiver autenticado no localStorage, atualizar o estado
                                  checkAuth();
                                  handleAddToCart();
                                }
                                return;
                              }
                              
                              if (variant && variant.stock && variant.stock > 0 && !isAddingToCart) {
                                handleAddToCart();
                              }
                            }}
                            disabled={!variant || !variant.stock || variant.stock <= 0 || isAddingToCart}
                            className={`relative py-3.5 px-5 rounded-xl flex items-center justify-center font-medium group overflow-hidden ${
                              !variant || !variant.stock || variant.stock <= 0 || isAddingToCart
                                ? 'bg-gray-600/30 text-gray-400 cursor-not-allowed'
                                : 'bg-dark-400 text-white hover:bg-dark-500 shadow-lg'
                            }`}
                            whileHover={variant && variant.stock > 0 && !isAddingToCart ? { y: -2 } : {}}
                            whileTap={variant && variant.stock > 0 && !isAddingToCart ? { y: 0 } : {}}
                          >
                            {variant && variant.stock > 0 && !isAddingToCart && (
                              <>
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-dark-400/0 via-dark-300/30 to-dark-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <motion.span 
                                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20"
                                  initial={{ scaleX: 0 }}
                                  whileHover={{ scaleX: 1 }}
                                  transition={{ duration: 0.5 }}
                                />
                              </>
                            )}
                            <motion.div 
                              className="flex items-center justify-center relative z-10 font-medium whitespace-nowrap"
                              whileHover={variant && variant.stock > 0 && !isAddingToCart ? { scale: 1.03 } : {}}
                              whileTap={variant && variant.stock > 0 && !isAddingToCart ? { scale: 0.97 } : {}}
                            >
                              <span>Adicionar ao Carrinho</span>
                            </motion.div>
                          </motion.button>

                          {/* Botão Comprar Agora */}
                          <motion.button
                            onClick={async () => {
                              if (variant && variant.stock && variant.stock > 0 && !isAddingToCart) {
                                try {
                                  // Se não estiver autenticado, salvar URL do carrinho e redirecionar
                                  if (!isAuthenticated) {
                                    try {
                                      localStorage.setItem('redirectAfterLogin', '/cart');
                                    } catch (error) {
                                      // Erro silencioso
                                    }
                                    
                                    // Verificar novamente o estado de autenticação antes de mostrar o toast
                                    const storedAuth = localStorage.getItem('isAuthenticated') === 'true';
                                    if (!storedAuth) {
                                      toast.success('É necessário fazer login para adicionar ao carrinho');
                                      router.push('/auth/login');
                                    } else {
                                      // Se estiver autenticado no localStorage, atualizar o estado
                                      await checkAuth();
                                      const addedToCart = await handleAddToCart();
                                      
                                      if (addedToCart === true) {
                                        setTimeout(() => {
                                        router.push('/cart');
                                        }, 500);
                                      }
                                    }
                                    return;
                                  }
                                  
                                  // Se estiver autenticado, adicionar ao carrinho e redirecionar
                                  const addedToCart = await handleAddToCart();
                                  
                                  if (addedToCart === true) {
                                    setTimeout(() => {
                                      router.push('/cart');
                                    }, 500);
                                  }
                                } catch (error) {
                                  // Erro silencioso
                                }
                              }
                            }}
                            disabled={!variant || !variant.stock || variant.stock <= 0 || isAddingToCart}
                            className={`relative py-3.5 px-5 rounded-xl flex items-center justify-center font-medium group overflow-hidden ${
                              !variant || !variant.stock || variant.stock <= 0 || isAddingToCart
                                ? 'bg-gray-600/30 text-gray-400 cursor-not-allowed'
                                : 'bg-primary text-white shadow-lg'
                            }`}
                            whileHover={variant && variant.stock > 0 && !isAddingToCart ? { y: -2 } : {}}
                            whileTap={variant && variant.stock > 0 && !isAddingToCart ? { y: 0 } : {}}
                          >
                            {variant && variant.stock > 0 && !isAddingToCart && (
                              <>
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-primary/0 via-primary-light/30 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                <motion.span 
                                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/20"
                                  initial={{ scaleX: 0 }}
                                  whileHover={{ scaleX: 1 }}
                                  transition={{ duration: 0.5 }}
                                />
                                <motion.div
                                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: 1 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="absolute inset-0 bg-gradient-to-r from-primary-light/0 via-primary-light/30 to-primary-light/0 animate-shimmer" />
                                </motion.div>
                                <motion.span
                                  className="absolute -inset-1 rounded-xl blur-sm group-hover:blur-md bg-primary/40 opacity-0 group-hover:opacity-70 transition-all duration-500"
                                  animate={variant && variant.stock > 0 ? {
                                    opacity: [0, 0.4, 0]
                                  } : {}}
                                  transition={{ duration: 2, repeat: Infinity }}
                                />
                              </>
                            )}
                            <motion.div 
                              className="flex items-center justify-center relative z-10 font-medium whitespace-nowrap"
                              whileHover={variant && variant.stock > 0 && !isAddingToCart ? { scale: 1.03 } : {}}
                              whileTap={variant && variant.stock > 0 && !isAddingToCart ? { scale: 0.97 } : {}}
                            >
                              {isAddingToCart ? (
                                <motion.div
                                  animate={{ 
                                    rotate: 360,
                                  }}
                                  transition={{ 
                                    duration: 1, 
                                    repeat: Infinity,
                                    ease: "linear" 
                                  }}
                                  className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                                />
                              ) : null}
                              <span>{isAddingToCart ? 'Processando...' : 'Comprar Agora'}</span>
                            </motion.div>
                          </motion.button>
                        </motion.div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Footer com benefícios */}
                <motion.div 
                  className="border-t border-dark-400/30 p-5 bg-dark-400/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.1 }}
                >
                  <div className="grid grid-cols-2 gap-y-4">
                    <motion.div 
                      className="flex items-center text-sm text-gray-400 group"
                      whileHover={{ x: 2, color: "#fff" }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2.5 group-hover:bg-primary/20 transition-colors">
                        <IconFiPackage className="text-primary" />
                      </div>
                      <span>Entrega garantida</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center text-sm text-gray-400 group"
                      whileHover={{ x: 2, color: "#fff" }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2.5 group-hover:bg-primary/20 transition-colors">
                        <IconFiShield className="text-primary" />
                      </div>
                      <span>Garantia de 30 dias</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center text-sm text-gray-400 group"
                      whileHover={{ x: 2, color: "#fff" }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2.5 group-hover:bg-primary/20 transition-colors">
                        <IconFiUser className="text-primary" />
                      </div>
                      <span>Suporte 24/7</span>
                    </motion.div>
                    <motion.div 
                      className="flex items-center text-sm text-gray-400 group"
                      whileHover={{ x: 2, color: "#fff" }}
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2.5 group-hover:bg-primary/20 transition-colors">
                        <IconFiLock className="text-primary" />
                      </div>
                      <span>Pagamento seguro</span>
                    </motion.div>
                  </div>
                </motion.div>
              </div>
              
              {/* Status detail card (se tiver status) */}
              {product.status && (
                <motion.div 
                  className={`mt-6 rounded-xl overflow-hidden backdrop-blur-sm shadow-lg ${getStatusConfig(product.status).bgColor} border border-opacity-20 ${getStatusConfig(product.status).color}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.2 }}
                >
                  <div className="p-4 flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${getStatusConfig(product.status).bgColor} bg-opacity-30 shadow-inner flex-shrink-0`}>
                      <motion.div
                        animate={{ rotate: [0, 5, 0, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                      >
                        {getStatusConfig(product.status).icon}
                      </motion.div>
                    </div>
                    <div>
                      <h3 className={`font-medium ${getStatusConfig(product.status).color}`}>
                        Status: {getStatusConfig(product.status).text}
                      </h3>
                      <p className="text-xs mt-1 text-white/80">
                        {getStatusConfig(product.status).text === 'Indetectável' ? 'Nosso sistema anti-detecção está ativo e funcionando perfeitamente.' :
                         getStatusConfig(product.status).text === 'Detectável' ? 'Use com cautela, estamos trabalhando para melhorar a proteção.' :
                         getStatusConfig(product.status).text === 'Em Manutenção' ? 'Temporariamente indisponível enquanto realizamos atualizações.' :
                         getStatusConfig(product.status).text === 'Beta' ? 'Versão prévia com recursos experimentais. Use por sua conta e risco.' : ''}
                      </p>
                      {lastStockUpdate && (
                        <div className="flex items-center text-xs mt-2 text-white/60">
                          <IconFiClock className="mr-1.5" size={12} />
                          <span>Atualizado: {formattedLastUpdate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      <VariantStockModal
        productId={product._id}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />

      {/* Vídeo Tutorial - Se disponível */}
      {product.tutorial_video_url && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Tutorial em Vídeo</h3>
          <div className="bg-dark-300 rounded-lg p-4">
            <div className="aspect-video relative bg-black/50 rounded-md flex items-center justify-center">
              <iframe 
                className="w-full h-full rounded-md"
                src={`https://www.youtube.com/embed/${extractYouTubeId(product.tutorial_video_url)}?autoplay=0&rel=0&modestbranding=1`}
                title="Tutorial de uso do produto"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 