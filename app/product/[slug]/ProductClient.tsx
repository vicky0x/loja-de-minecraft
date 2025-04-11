'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiShoppingCart, FiPackage, FiCheck, FiClock, FiShield, FiDownload, FiAward, FiStar, FiLock, FiUser, FiTrendingUp, FiX, FiInfo, FiAlertOctagon, FiTool, FiCode, FiEye, FiHeart } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';
import { motion, AnimatePresence } from 'framer-motion';
import VariantStockModal from '@/app/components/VariantStockModal';
import { useCart } from '@/app/contexts/CartContext';
import toast from 'react-hot-toast';
import { useAuth } from '@/app/hooks/useAuth';
import { formatProductName } from '@/app/utils/formatters';

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

export function ProductClient({ initialProduct, slug }: { initialProduct: Product | null, slug: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
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
    if (slug && !initialProduct) {
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
  }, [slug, initialProduct]);

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

  // Inicializar produto e variante a partir dos dados iniciais
  useEffect(() => {
    if (initialProduct) {
      // Verificar se o produto tem variantes
      const productHasVariants = 
        Array.isArray(initialProduct.variants) && 
        initialProduct.variants.length > 0;
      
      setHasVariants(productHasVariants);
      
      // Se tiver variantes, selecionar a primeira por padrão
      if (productHasVariants) {
        const firstVariant = initialProduct.variants[0];
        setSelectedVariant(firstVariant._id);
        setVariant(firstVariant);
      } else if (initialProduct.price !== undefined) {
        // Se não tiver variantes, criar uma variante simulada com os dados do produto
        const stockValue = initialProduct.stock === null || initialProduct.stock === undefined ? 0 : initialProduct.stock;
        const singleVariant: Variant = {
          _id: 'single',
          name: 'Padrão',
          description: '',
          price: initialProduct.price,
          stock: stockValue,
          features: []
        };
        setSelectedVariant('single');
        setVariant(singleVariant);
      }
    }
  }, [initialProduct]);

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
    const isLargeStock = variant && variant.stock === 99999;
    const maxAllowed = isLargeStock ? 30 : (variant ? variant.stock : 0);
    
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
    if (product?.deliveryType === 'manual' || (variant && variant.deliveryType === 'manual')) {
      return 'text-green-400';
    }
    
    if (stock > 10) return 'text-green-400';
    if (stock > 0) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  const getStockText = (stock: number) => {
    // Verificar se o produto ou a variante tem entrega manual
    if (product?.deliveryType === 'manual' || (variant && variant.deliveryType === 'manual')) {
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

        {/* Remainder of UI code... */}
      </div>
      
      <VariantStockModal
        productId={product._id}
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
      />
    </div>
  );
} 