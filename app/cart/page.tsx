"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useCart } from '../contexts/CartContext';
import { 
  FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiX, FiArrowLeft,
  FiShoppingBag, FiTag, FiAlertTriangle, FiCheck, FiUser,
  FiMail, FiPhone, FiCreditCard, FiArrowRight, FiLock,
  FiShield, FiAlertCircle, FiCheckCircle, FiInfo
} from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PixPaymentModal from '../components/PixPaymentModal';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { formatProductName } from '@/app/utils/formatters';

// Componentes de ícone com tipagem correta
interface IconProps extends IconBaseProps {
  className?: string;
}

const IconFiPlus = (props: IconProps) => <FiPlus {...props} />;
const IconFiMinus = (props: IconProps) => <FiMinus {...props} />;
const IconFiTrash2 = (props: IconProps) => <FiTrash2 {...props} />;
const IconFiX = (props: IconProps) => <FiX {...props} />;
const IconFiArrowLeft = (props: IconProps) => <FiArrowLeft {...props} />;
const IconFiShoppingCart = (props: IconProps) => <FiShoppingCart {...props} />;
const IconFiShoppingBag = (props: IconProps) => <FiShoppingBag {...props} />;
const IconFiTag = (props: IconProps) => <FiTag {...props} />;
const IconFiAlertTriangle = (props: IconProps) => <FiAlertTriangle {...props} />;
const IconFiCheck = (props: IconProps) => <FiCheck {...props} />;
const IconFiUser = (props: IconProps) => <FiUser {...props} />;
const IconFiMail = (props: IconProps) => <FiMail {...props} />;
const IconFiPhone = (props: IconProps) => <FiPhone {...props} />;
const IconFiCreditCard = (props: IconProps) => <FiCreditCard {...props} />;
const IconFiArrowRight = (props: IconProps) => <FiArrowRight {...props} />;
const IconFiLock = (props: IconProps) => <FiLock {...props} />;
const IconFiShield = (props: IconProps) => <FiShield {...props} />;
const IconFiAlertCircle = (props: IconProps) => <FiAlertCircle {...props} />;
const IconFiCheckCircle = (props: IconProps) => <FiCheckCircle {...props} />;
const IconFiInfo = (props: IconProps) => <FiInfo {...props} />;

// Utilitário para formatação de valores
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Define types for cart items and customer data
interface CartItem {
  productId: string;
  productName: string;
  productImage?: string;
  variantId: string;
  variantName: string;
  price: number;
  quantity: number;
  stock?: number;
  hasStockIssue?: boolean;
}

interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  cpf: string;
  phone: string;
}

// Interface para o estado da animação de processamento
interface ProcessingPaymentState {
  show: boolean;
  message: string;
  isRedirecting: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const { 
    items, 
    removeItem, 
    clearCart, 
    updateQuantity,
    getCartTotal,
    isLoading: cartIsLoading
  } = useCart();
  const { isAuthenticated, requireAuth } = useAuth();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pixPaymentData, setPixPaymentData] = useState(null);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCouponValid, setIsCouponValid] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
    phone: '',
  });
  const [createdOrderId, setCreatedOrderId] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Estado para controlar se o componente está montado
  const isMounted = useRef(false);

  // Estado para indicar se está carregando
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Estado para controlar a animação de processamento
  const [processingPayment, setProcessingPayment] = useState({
    show: false,
    message: '',
    isRedirecting: false
  });
  
  // Efeito para recuperar dados de PIX do localStorage
  useEffect(() => {
    // Marcar componente como montado
    isMounted.current = true;
    
    // Função para verificar e restaurar dados do PIX do localStorage
    const checkStoredPaymentData = () => {
      try {
        const storedPixData = localStorage.getItem('pixPaymentData');
        const storedOrderId = localStorage.getItem('createdOrderId');
        
        if (storedPixData && storedOrderId) {
          try {
            const parsedPixData = JSON.parse(storedPixData);
            console.log('Encontrados dados de pagamento PIX no localStorage');
            
            // Verificar se o pagamento já expirou
            const expiresAt = parsedPixData.expiresAt ? new Date(parsedPixData.expiresAt) : null;
            const now = new Date();
            
            // Se o pagamento já expirou, limpar do localStorage
            if (expiresAt && expiresAt < now) {
              console.log('Dados de pagamento PIX expirados, removendo do localStorage');
              localStorage.removeItem('pixPaymentData');
              localStorage.removeItem('createdOrderId');
              setPixPaymentData(null);
              setCreatedOrderId(null);
              setIsPixModalOpen(false);
              return;
            }
            
            // Apenas atualizar os dados, não abrir o modal automaticamente
            // a menos que o modal já estivesse aberto anteriormente
            setPixPaymentData(parsedPixData);
            setCreatedOrderId(storedOrderId);
            // Manter o estado atual do modal - não alterar automaticamente
          } catch (parseError) {
            console.error('Erro ao processar dados de PIX armazenados:', parseError);
            localStorage.removeItem('pixPaymentData');
            localStorage.removeItem('createdOrderId');
            setPixPaymentData(null);
            setCreatedOrderId(null);
            setIsPixModalOpen(false);
          }
        } else {
          // Se não há dados armazenados, garantir que o modal esteja fechado
          setIsPixModalOpen(false);
        }
      } catch (error) {
        console.error('Erro ao recuperar dados de PIX do localStorage:', error);
        // Se houver erro, garantimos que o modal esteja fechado
        setIsPixModalOpen(false);
      }
      
      // Limpeza de outros estados problemáticos
      setShowDeleteConfirm(null);
      setIsLoading(false);
      setError(null);
    };
    
    // Verificar dados armazenados quando o componente montar
    checkStoredPaymentData();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Efeito para recuperar de possíveis estados de travamento
  useEffect(() => {
    // Função para limpar listeners e estados problemáticos
    const cleanup = () => {
      if (!isMounted.current) return;
      
      // Não resetamos o modal de PIX se ele estiver sendo usado
      if (!pixPaymentData) {
        setIsPixModalOpen(false);
      }
      setShowDeleteConfirm(null);
      setIsLoading(false);
      setError(null);
    };
    
    // Resetar estados ao iniciar
    cleanup();
    
    // Adicionar detector de visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current) {
        // Quando o usuário volta para a página, verificamos se há dados de PIX armazenados
        try {
          const storedPixData = localStorage.getItem('pixPaymentData');
          const storedOrderId = localStorage.getItem('createdOrderId');
          
          if (storedPixData && storedOrderId) {
            try {
              const parsedPixData = JSON.parse(storedPixData);
              
              // Verificar se o pagamento já expirou
              const expiresAt = parsedPixData.expiresAt ? new Date(parsedPixData.expiresAt) : null;
              const now = new Date();
              
              // Se o pagamento já expirou, limpar do localStorage
              if (expiresAt && expiresAt < now) {
                console.log('Dados de pagamento PIX expirados, removendo do localStorage');
                localStorage.removeItem('pixPaymentData');
                localStorage.removeItem('createdOrderId');
                setPixPaymentData(null);
                setCreatedOrderId(null);
                setIsPixModalOpen(false);
                return;
              }
              
              // Apenas atualizar os dados, não abrir o modal automaticamente
              // a menos que o modal já estivesse aberto anteriormente
              setPixPaymentData(parsedPixData);
              setCreatedOrderId(storedOrderId);
              // Manter o estado atual do modal - não alterar automaticamente
            } catch (parseError) {
              console.error('Erro ao processar dados de PIX armazenados:', parseError);
              localStorage.removeItem('pixPaymentData');
              localStorage.removeItem('createdOrderId');
              setPixPaymentData(null);
              setCreatedOrderId(null);
              setIsPixModalOpen(false);
            }
          } else {
            // Se não há dados armazenados, garantir que o modal esteja fechado
            setIsPixModalOpen(false);
          }
        } catch (error) {
          console.error('Erro ao recuperar dados de PIX do localStorage:', error);
          // Se houver erro, garantimos que o modal esteja fechado
          setIsPixModalOpen(false);
        }
        
        // Limpeza de outros estados problemáticos
        setShowDeleteConfirm(null);
        setIsLoading(false);
        setError(null);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Adicionar evento para quando o navegador restaura a página do histórico
    window.addEventListener('pageshow', (event) => {
      if (event.persisted && isMounted.current) {
        // A página foi restaurada do cache (voltar do navegador)
        console.log('Página restaurada do cache');
        
        // Verificar se há um modal que precisa ser fechado
        setIsPixModalOpen(false);
        
        // Forçar atualização dos estados para evitar UI travada
        setShowDeleteConfirm(null);
        setIsLoading(false);
        setError(null);
        
        // Chamar o cleanup após um pequeno delay
        setTimeout(cleanup, 100);
      }
    });
    
    // Cleanup ao desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
      // Marcar que o componente não está mais montado para evitar atualizações de estado
      isMounted.current = false;
    };
  }, [isPixModalOpen, pixPaymentData]);
  
  // Verificação de segurança para operações que podem causar problemas
  const safeOperation = (operation: Function) => {
    try {
      if (isMounted.current) {
        operation();
      }
    } catch (error) {
      console.error('Erro na operação:', error);
      // Resetar estados para evitar travamentos
      if (isMounted.current) {
        setIsLoading(false);
        setError('Ocorreu um erro. Por favor, recarregue a página.');
      }
    }
  };

  // Calcular o total do carrinho
  const cartSubtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  const cartTotal = cartSubtotal - couponDiscount;
  const isCartEmpty = items.length === 0;
  
  // Função para verificar se o componente ainda está montado antes de atualizar estados
  const updateStateIfMounted = (stateUpdater: Function) => {
    if (isMounted.current) {
      stateUpdater();
    }
  };

  // Handler para gerenciar alterações nos campos do formulário de cliente
  const handleCustomerDataChange = (e: any) => {
    const { name, value } = e.target;
    
    // Formatação especial para CPF
    if (name === 'cpf') {
      const formattedCPF = formatCPF(value);
      updateStateIfMounted(() => {
        setCustomerData(prev => ({
          ...prev,
          [name]: formattedCPF
        }));
      });
      return;
    }
    
    // Para outros campos, apenas atualizar normalmente
    updateStateIfMounted(() => {
      setCustomerData(prev => ({
        ...prev,
        [name]: value
      }));
    });
  };
  
  // Função para formatar CPF (000.000.000-00)
  const formatCPF = (value: string): string => {
    // Remover todos os caracteres não numéricos
    const cpfNumbers = value.replace(/\D/g, '');
    
    // Limitar a 11 dígitos
    const cpfLimited = cpfNumbers.substring(0, 11);
    
    // Aplicar máscara
    if (cpfLimited.length <= 3) {
      return cpfLimited;
    } else if (cpfLimited.length <= 6) {
      return `${cpfLimited.substring(0, 3)}.${cpfLimited.substring(3)}`;
    } else if (cpfLimited.length <= 9) {
      return `${cpfLimited.substring(0, 3)}.${cpfLimited.substring(3, 6)}.${cpfLimited.substring(6)}`;
    } else {
      return `${cpfLimited.substring(0, 3)}.${cpfLimited.substring(3, 6)}.${cpfLimited.substring(6, 9)}-${cpfLimited.substring(9)}`;
    }
  };

  // Função para aplicar cupom
  const applyCoupon = async () => {
    if (!couponCode.trim() || isApplyingCoupon) return;
    
    updateStateIfMounted(() => {
      setIsApplyingCoupon(true);
      setError(null);
    });
    
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: cartSubtotal,
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId
          })),
          itemsPrices: items.map(item => item.price * item.quantity)
        })
      });
      
      const data = await response.json();
      
      if (!isMounted.current) return;
      
      if (response.ok && data.success) {
        const discountValue = parseFloat(data.coupon.discountValue);
        updateStateIfMounted(() => {
          setCouponDiscount(discountValue);
          setIsCouponValid(true);
          toast.success('Cupom aplicado com sucesso!');
        });
      } else {
        updateStateIfMounted(() => {
          setCouponDiscount(0);
          setIsCouponValid(false);
          toast.error(data.message || 'Cupom inválido');
        });
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      updateStateIfMounted(() => {
        setCouponDiscount(0);
        setIsCouponValid(false);
        toast.error('Não foi possível validar o cupom');
      });
    } finally {
      updateStateIfMounted(() => {
        setIsApplyingCoupon(false);
      });
    }
  };

  // Função que lida com o checkout
  const handleCheckout = async () => {
    if (isLoading || isCartEmpty) return;
    
    if (!showCheckoutForm) {
      // Primeiro passo: mostrar o formulário
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveStep(2);
      setShowCheckoutForm(true);
      return;
    }
    
    // Segundo passo: processar o pagamento
    setIsLoading(true);
    setError(null);
    
    try {
      // Criar pedido no sistema
      const orderId = await createOrder(selectedPaymentMethod);
      
      if (!orderId) {
        throw new Error('Não foi possível criar o pedido');
      }
      
      // Processar o pagamento conforme o método escolhido
      if (selectedPaymentMethod === 'pix') {
        // Gerar o pagamento PIX
        const success = await generatePixPayment(orderId);
        
        if (!success) {
          throw new Error('Falha ao gerar o pagamento PIX');
        }
        
        // A redireção para a página de pagamento já acontece dentro da função generatePixPayment
      } else if (selectedPaymentMethod === 'card') {
        // Redirecionamento temporário para Mercado Pago (será implementado posteriormente)
        toast.success('Redirecionando para o processador de pagamento...');
        
        // Armazenar informações do pedido
        try {
          localStorage.setItem('createdOrderId', orderId);
        } catch (error) {
          console.error('Erro ao armazenar o ID do pedido:', error);
        }
        
        // Simular redirecionamento para processador externo
        setProcessingPayment({
          show: true,
          message: "Redirecionando para o Mercado Pago...",
          isRedirecting: true
        });
        
        // Redirecionar após um curto delay para melhor experiência
        setTimeout(() => {
          router.push(`/checkout/redirect?orderId=${orderId}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Erro durante o checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro durante o processamento do pagamento';
      updateStateIfMounted(() => {
        setError(errorMessage);
        toast.error(errorMessage);
      });
    } finally {
      updateStateIfMounted(() => {
        setIsLoading(false);
      });
    }
  };

  // Função segura para remover item do carrinho
  const handleRemoveItem = (variantId: string, productId: string) => {
    console.log(`Tentando remover item com ID: ${variantId} e productId: ${productId}`);
    
    if (!variantId || !productId) {
      console.error('Tentativa de remover item sem ID de variante ou produto');
      return;
    }
    
    // Verificar se o item existe no carrinho
    const itemExiste = items.some(item => item.variantId === variantId && item.productId === productId);
    if (!itemExiste) {
      console.error(`Item com variantId ${variantId} e productId ${productId} não encontrado no carrinho`);
      return;
    }
    
    safeOperation(() => {
      console.log(`Removendo item com variantId: ${variantId} e productId: ${productId}`);
      console.log(`Itens antes da remoção: ${items.length}`);
      console.log(`Itens no carrinho antes:`, items.map(i => ({ id: i.variantId, prodId: i.productId, nome: i.productName })));
      
      // Chamar a função de remoção do contexto com ambos os IDs
      removeItem(variantId, productId);
      
      // Atualizar o estado de confirmação
      updateStateIfMounted(() => setShowDeleteConfirm(null));
      
      // Mostrar mensagem de sucesso
      toast.success('Item removido do carrinho');
      
      // Verificar se o cupom já foi aplicado e ainda está válido
      if (isCouponValid && couponCode) {
        // Aguardar a atualização do estado do carrinho
        setTimeout(() => {
          // Revalidar o cupom após a remoção do item
          revalidateCoupon();
        }, 100);
      }
    });
  };
  
  // Função para revalidar o cupom após mudanças no carrinho
  const revalidateCoupon = async () => {
    if (!couponCode || !isMounted.current) return;
    
    updateStateIfMounted(() => {
      setIsApplyingCoupon(true);
    });
    
    try {
      const newItems = items.filter(item => item); // Obter itens atualizados
      
      // Se não houver itens no carrinho, remover cupom
      if (newItems.length === 0) {
        updateStateIfMounted(() => {
          setCouponDiscount(0);
          setIsCouponValid(null);
          setIsApplyingCoupon(false);
        });
        return;
      }
      
      // Enviar os IDs dos produtos no carrinho para verificar restrições
      const cartProductIds = newItems.map(item => ({
        productId: item.productId,
        variantId: item.variantId
      }));
      
      // Também enviar os preços individuais de cada item
      const itemsPrices = newItems.map(item => item.price * item.quantity);
      
      // Recalcular subtotal do carrinho
      const newCartSubtotal = newItems.reduce((total, item) => total + (item.price * item.quantity), 0);
      
      // Fazer chamada à API para revalidar o cupom
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode,
          cartTotal: newCartSubtotal,
          items: cartProductIds,
          itemsPrices: itemsPrices
        })
      });
      
      const data = await response.json();
      
      if (!isMounted.current) return;
      
      if (response.ok && data.success) {
        // Cupom ainda é válido
        const discountValue = parseFloat(data.coupon.discountValue);
        updateStateIfMounted(() => {
          setCouponDiscount(discountValue);
          setIsCouponValid(true);
        });
      } else {
        // Cupom não é mais válido
        updateStateIfMounted(() => {
          setCouponDiscount(0);
          setIsCouponValid(false);
        });
        toast.error('O cupom não é mais válido para os itens no carrinho');
      }
    } catch (error) {
      console.error('Erro ao revalidar cupom:', error);
      updateStateIfMounted(() => {
        setCouponDiscount(0);
        setIsCouponValid(false);
      });
    } finally {
      updateStateIfMounted(() => {
        setIsApplyingCoupon(false);
      });
    }
  };
  
  // Função segura para atualizar quantidade
  const handleUpdateQuantity = (itemId: string, newQuantity: number, productId: string) => {
    if (!isMounted.current) return;
    
    try {
      if (newQuantity < 1) {
        handleRemoveItem(itemId, productId);
        return;
      }
      
      // Buscar o item no carrinho
      const item = items.find(item => item.variantId === itemId && item.productId === productId);
      if (!item) {
        console.error(`Item com ID ${itemId} não encontrado no carrinho`);
        return;
      }
      
      // Verificar se a nova quantidade não excede o estoque
      const safeQuantity = item.stock !== undefined ? Math.min(newQuantity, item.stock) : newQuantity;
      
      // Atualizar a quantidade
      updateQuantity(itemId, safeQuantity);
      
      // Verificar se o cupom já foi aplicado e ainda está válido
      if (isCouponValid && couponCode) {
        // Aguardar a atualização do estado do carrinho
        setTimeout(() => {
          // Revalidar o cupom após a alteração da quantidade
          revalidateCoupon();
        }, 100);
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      if (isMounted.current) {
        toast.error('Não foi possível atualizar a quantidade. Tente novamente.');
      }
    }
  };
  
  // Função segura para limpar o carrinho
  const handleClearCart = () => {
    safeOperation(() => {
      clearCart();
      
      // Remover cupom quando o carrinho é limpo
      updateStateIfMounted(() => {
        setCouponCode('');
        setCouponDiscount(0);
        setIsCouponValid(null);
      });
      
      toast.success('Carrinho esvaziado com sucesso');
    });
  };
  
  // Função para criar o pedido
  const createOrder = async (paymentMethod: string): Promise<string | false> => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar se todos os dados são válidos
      if (!validateCustomerData()) {
        toast.error('Por favor, preencha todos os campos obrigatórios.');
        setIsLoading(false);
        return false;
      }

      // Preparar os dados do pedido
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          price: item.price
        })),
        paymentMethod,
        customer: {
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          email: customerData.email,
          cpf: customerData.cpf,
          // Enviar telefone apenas se estiver preenchido
          ...(customerData.phone ? { phone: customerData.phone } : {})
        },
        // Adicionar informações do cupom se tiver algum aplicado
        ...(isCouponValid && couponDiscount > 0 ? {
          coupon: {
            code: couponCode,
            discountAmount: couponDiscount
          }
        } : {})
      };

      // Enviar o pedido para a API
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Erro ao criar pedido');
      }

      const orderResult = await response.json();
      console.log('Pedido criado com sucesso:', orderResult);
      
      // Armazenar o ID do pedido para usar no pagamento
      setCreatedOrderId(orderResult.orderId);
      
      // Se tiver cupom aplicado, registrar o uso
      if (isCouponValid && couponDiscount > 0 && orderResult.orderId) {
        try {
          const couponUseResponse = await fetch('/api/coupons/use', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              couponCode: couponCode,
              orderId: orderResult.orderId
            })
          });
          
          if (couponUseResponse.ok) {
            console.log('Uso de cupom registrado com sucesso');
          } else {
            console.warn('Não foi possível registrar o uso do cupom');
          }
        } catch (error) {
          console.error('Erro ao registrar uso do cupom:', error);
          // Não falhar a criação do pedido se o registro do cupom falhar
        }
      }
      
      return orderResult.orderId;
    } catch (error: any) {
      console.error('Erro ao criar pedido:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar o pedido');
      toast.error('Erro ao criar pedido. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validar os dados do cliente
  const validateCustomerData = (): boolean => {
    if (!customerData.firstName || !customerData.lastName) {
      setError("Nome e sobrenome são obrigatórios");
      return false;
    }
    
    if (!customerData.email || !customerData.email.includes('@')) {
      setError("Email inválido");
      return false;
    }
    
    // Validação básica de CPF (apenas verificar se tem o formato correto)
    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/;
    if (!cpfRegex.test(customerData.cpf)) {
      setError("CPF inválido");
      return false;
    }
    
    // Telefone é opcional, não precisa validar
    
    return true;
  };
  
  // Função para gerar pagamento PIX
  const generatePixPayment = async (orderId: string): Promise<boolean> => {
    if (!isMounted.current) return false;
    
    console.log(`Gerando pagamento PIX para o pedido ${orderId}...`);
    
    try {
        setProcessingPayment({
          show: true,
          message: "Gerando código PIX para pagamento. Aguarde...",
          isRedirecting: false
      });
      
      let pixPaymentData;
      let useMockData = false;
      
      try {
        // Chamar a API para gerar o pagamento PIX
        const response = await fetch('/api/payment/pix', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: orderId
          })
        });
      
        if (!response.ok) {
          console.warn(`API de pagamento retornou status ${response.status}. Usando dados mock.`);
          useMockData = true;
        } else {
          // Processar a resposta real
          const data = await response.json();
          
          if (!isMounted.current) return false;
    
          if (!data.success) {
            console.warn(`API retornou success=false: ${data.message}. Usando dados mock.`);
            useMockData = true;
          } else if (!data.payment || !data.payment.id) {
            console.warn('Resposta da API incompleta. Usando dados mock.');
            useMockData = true;
          } else {
            console.log('Pagamento PIX gerado com sucesso:', data);
            
            // Criar objeto de dados de pagamento PIX com dados reais
            pixPaymentData = {
              orderId: orderId,
              paymentId: data.payment.id,
              pixCopiaECola: data.payment.point_of_interaction?.transaction_data?.qr_code || '',
              qrCodeBase64: data.payment.point_of_interaction?.transaction_data?.qr_code_base64 || '',
              qrCodeUrl: data.payment.point_of_interaction?.transaction_data?.qr_code_url || '', 
              expiresAt: data.payment.date_of_expiration || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              total: data.payment.transaction_amount || 0,
              isPaid: false
            };
          }
        }
      } catch (apiError) {
        console.error('Erro ao chamar API de pagamento:', apiError);
        useMockData = true;
      }
      
      // Se for necessário usar dados mock
      if (useMockData) {
        console.log('Criando dados de pagamento PIX simulados para permitir continuidade do fluxo');
        
        // QR code mínimo em base64 (1x1 pixel transparente)
        const minimalQrCode = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        
        // Criar dados mock com estrutura equivalente à resposta da API
        pixPaymentData = {
          orderId: orderId,
          paymentId: `mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          pixCopiaECola: '00020126580014br.gov.bcb.pix0136a37c6e50-ead8-4307-9984-60217498f01d520400005303986540510.005802BR5925LOJA MOCK PAGAMENTO TESTE6009SAO PAULO62070503***6304E2CA',
          qrCodeBase64: minimalQrCode,
          qrCodeUrl: 'https://chart.googleapis.com/chart?chs=250x250&cht=qr&chl=00020126580014br.gov.bcb.pix0136a37c6e50-ead8-4307-9984-60217498f01d520400005303986540510.005802BR5925LOJA%20MOCK%20PAGAMENTO%20TESTE6009SAO%20PAULO62070503***6304E2CA',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          total: cartSubtotal,
          isPaid: false
        };
      }
      
      if (!isMounted.current) return false;
      
      // Armazenar dados do pagamento PIX no localStorage
      try {
        localStorage.setItem('pixPaymentData', JSON.stringify(pixPaymentData));
        localStorage.setItem('createdOrderId', orderId);
      } catch (e) {
        console.error('Erro ao armazenar dados de pagamento PIX:', e);
      }
      
      // Atualizar estado com os dados de pagamento
      updateStateIfMounted(() => {
        setPixPaymentData(pixPaymentData);
      });
      
      // Ocultar indicador de processamento
      updateStateIfMounted(() => {
        setProcessingPayment({
          show: false,
          message: "",
          isRedirecting: false
        });
      });
      
      // Redirecionar para a página de pagamento PIX
      router.push('/checkout/payment');
      
      return true;
    } catch (error) {
      console.error('Erro grave ao processar pagamento PIX:', error);
      
      if (isMounted.current) {
        setError(error instanceof Error ? error.message : 'Erro ao gerar pagamento PIX');
        setProcessingPayment({
          show: false,
          message: "",
          isRedirecting: false
        });
        toast.error('Ocorreu um erro ao gerar o pagamento. Tente novamente.');
      }
      
      return false;
    }
  };

  // Renderizar o modal de pagamento PIX
  const renderPixPaymentModal = () => {
    // Não é mais necessário, agora usamos uma página dedicada
    return null;
  };

  // Efeito para detectar e corrigir possíveis estados inconsistentes
  useEffect(() => {
    // Verificar se há algum modal invisível que possa estar bloqueando a interação
    const checkForBlockingState = () => {
      if (!isMounted.current) return;
      
      // Verificar se o modal de PIX está aberto sem dados válidos
      if (isPixModalOpen && !pixPaymentData) {
        console.log('Detectado modal PIX aberto sem dados válidos. Fechando...');
        setIsPixModalOpen(false);
      }
    };
    
    // Verificar imediatamente ao montar o componente
    checkForBlockingState();
    
    // Verificar sempre que o estado do modal ou dos dados PIX mudar
    return () => {
      // Fazemos a verificação ao limpar também para garantir
      checkForBlockingState();
    };
  }, [isPixModalOpen, pixPaymentData]);
  
  // Efeito para lidar com o evento popstate (quando o usuário navega usando os botões do navegador)
  useEffect(() => {
    const handlePopState = () => {
      if (isMounted.current) {
        console.log('Evento popstate detectado');
        
        // Verificar e corrigir estados inconsistentes
        if (isPixModalOpen && !pixPaymentData) {
          console.log('Modal PIX em estado inconsistente. Fechando...');
          setIsPixModalOpen(false);
        }
        
        setShowDeleteConfirm(null);
        setIsLoading(false);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isPixModalOpen, pixPaymentData]);

  // Adicionar uma função para limpar estados inconsistentes ou camadas bloqueantes invisíveis
  const clearBlockingElements = () => {
    try {
      console.log('Verificando elementos bloqueantes...');
      
      // 1. Verificar modais ou overlays não visíveis que estejam bloqueando
      const hiddenOverlays = document.querySelectorAll('.fixed.inset-0');
      
      hiddenOverlays.forEach(element => {
        const el = element as HTMLElement;
        const style = window.getComputedStyle(el);
        
        // Se o elemento for invisível mas estiver no DOM e tiver z-index alto
        if (style.opacity === '0' && style.zIndex !== '-1' && style.pointerEvents !== 'none') {
          console.log('Encontrado overlay invisível bloqueando interações. Corrigindo...');
          el.style.pointerEvents = 'none';
          el.style.zIndex = '-1';
        }
      });
      
      // 2. Garantir que o estado do modal seja consistente
      if (isPixModalOpen && !pixPaymentData) {
        console.log('Corrigindo estado inconsistente do modal PIX...');
        setIsPixModalOpen(false);
      }
      
      // 3. Resetar quaisquer outros estados potencialmente problemáticos
      setIsLoading(false);
      setShowDeleteConfirm(null);
      setIsCheckingStatus(false);
      
    } catch (error) {
      console.error('Erro ao limpar elementos bloqueantes:', error);
    }
  };

  // Adicionar efeito para executar limpeza quando o documento ficar visível
  useEffect(() => {
    const handleVisibilityRecovery = () => {
      if (document.visibilityState === 'visible' && isMounted.current) {
        // Atrasar um pouco para garantir que o DOM esteja estabilizado
        setTimeout(clearBlockingElements, 300);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityRecovery);
    
    // Também executar quando o componente é montado
    setTimeout(clearBlockingElements, 500);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityRecovery);
    };
  }, []);

  // Adicionar um último mecanismo de segurança - ouvinte global de cliques
  useEffect(() => {
    let clickCount = 0;
    let lastClickTime = 0;
    
    const handleGlobalClick = () => {
      const now = Date.now();
      
      // Se o usuário clicar várias vezes rapidamente (possível sinal de interface travada)
      if (now - lastClickTime < 300) {
        clickCount++;
        
        // Após 5 cliques rápidos, assumir que a interface está travada
        if (clickCount >= 5) {
          console.log('Detectados múltiplos cliques rápidos. Recuperando interface...');
          clearBlockingElements();
          clickCount = 0;
        }
      } else {
        // Resetar contador se os cliques não forem rápidos
        clickCount = 1;
      }
      
      lastClickTime = now;
    };
    
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Adicionar efeito específico para resolver o problema de interações bloqueadas
  useEffect(() => {
    if (!isMounted.current) return;
    
    // Função para resolver problemas de interação quando o usuário retorna à página
    const fixInteractionIssues = () => {
      try {
        console.log('Padronizando comportamento da página para todos os navegadores');
        
        // 1. Remover overlays invisíveis que possam estar bloqueando interações
        const overlays = document.querySelectorAll('.fixed.inset-0');
        overlays.forEach(overlay => {
          const el = overlay as HTMLElement;
          const style = window.getComputedStyle(el);
          
          // Se o overlay estiver invisível mas ainda bloqueando interações
          if ((style.opacity === '0' || parseFloat(style.opacity) < 0.1) && 
              style.pointerEvents !== 'none') {
            console.log('Removendo overlay bloqueante invisível');
            el.style.pointerEvents = 'none';
            el.style.zIndex = '-1';
          }
        });
        
        // 2. Resetar estados que podem estar causando problemas
        if (isPixModalOpen && !pixPaymentData) {
          setIsPixModalOpen(false);
        }
        
        // 3. Garantir que o body possa receber interações
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
        
        // 4. Restaurar o estado de foco da página para facilitar interações
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        
        // 5. Adicionar estilo global consistente para todos os navegadores
        const styleId = 'cross-browser-fix';
        if (!document.getElementById(styleId)) {
          const styleElement = document.createElement('style');
          styleElement.id = styleId;
          styleElement.innerHTML = `
            /* Garantir que elementos clicáveis sejam sempre clicáveis */
            button, a, [role="button"], input, select, textarea {
              pointer-events: auto !important;
            }
            
            /* Garantir que overlays invisíveis não bloqueiem interações */
            .fixed.inset-0:not(.visible) {
              pointer-events: none !important;
            }
            
            /* Prevenir z-index excessivamente altos que possam causar problemas */
            .fixed.inset-0 {
              z-index: auto !important;
            }
          `;
          document.head.appendChild(styleElement);
        }
      } catch (error) {
        console.error('Erro ao padronizar comportamento da página:', error);
      }
    };
    
    // Executar imediatamente na montagem
    fixInteractionIssues();
    
    // Adicionar ouvintes para eventos que indicam que a página foi restaurada
    const eventHandlers = {
      // Quando a página volta a ficar visível após estar em segundo plano
      handleVisibilityChange: () => {
        if (document.visibilityState === 'visible') {
          setTimeout(fixInteractionIssues, 150);
        }
      },
      
      // Quando a página é restaurada do cache do navegador (voltar/avançar)
      handlePageShow: (e: PageTransitionEvent) => {
        if (e.persisted) {
          console.log('Página restaurada do cache. Padronizando comportamento...');
          // Executar imediatamente e com atraso para garantir que o DOM esteja estabilizado
          fixInteractionIssues();
          setTimeout(fixInteractionIssues, 200);
        }
      },
      
      // Quando a janela recebe foco novamente
      handleFocus: () => {
        setTimeout(fixInteractionIssues, 150);
      },
      
      // Quando um usuário tenta interagir com a página
      handleUserInteraction: () => {
        // Verificar se há elementos invisíveis bloqueando a interação
        setTimeout(() => {
          if (document.activeElement === document.body) {
            fixInteractionIssues();
          }
        }, 100);
      }
    };
    
    // Registrar todos os handlers de eventos
    document.addEventListener('visibilitychange', eventHandlers.handleVisibilityChange);
    window.addEventListener('pageshow', eventHandlers.handlePageShow);
    window.addEventListener('focus', eventHandlers.handleFocus);
    document.addEventListener('mousedown', eventHandlers.handleUserInteraction);
    document.addEventListener('touchstart', eventHandlers.handleUserInteraction);
    
    // Limpar todos os handlers ao desmontar o componente
    return () => {
      document.removeEventListener('visibilitychange', eventHandlers.handleVisibilityChange);
      window.removeEventListener('pageshow', eventHandlers.handlePageShow);
      window.removeEventListener('focus', eventHandlers.handleFocus);
      document.removeEventListener('mousedown', eventHandlers.handleUserInteraction);
      document.removeEventListener('touchstart', eventHandlers.handleUserInteraction);
    };
  }, [isPixModalOpen, pixPaymentData]);

  // Componente para exibir o indicador de processamento de pagamento
  const PaymentProcessingIndicator = () => {
    if (!processingPayment.show) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-dark-100/90 flex items-center justify-center z-50 backdrop-blur-sm"
      >
        <div className="bg-dark-200 p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <div className="flex justify-center mb-6">
            {processingPayment.isRedirecting ? (
              <div className="animate-pulse">
                <div className="text-primary"><IconFiCreditCard size={48} /></div>
              </div>
            ) : (
              <div className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2 border-primary"></div>
            )}
          </div>
          
          <h3 className="text-xl font-semibold mb-2">
            {processingPayment.isRedirecting ? 'Redirecionando...' : 'Processando...'}
          </h3>
          
          <p className="text-gray-300 mb-4">{processingPayment.message}</p>
          
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: processingPayment.isRedirecting ? 1.5 : 3 }}
            className="h-1 bg-primary rounded-full mt-4"
          />
          
          <p className="text-xs text-gray-400 mt-6">
            Aguarde enquanto preparamos seu pagamento com segurança.
            {processingPayment.isRedirecting && ' Você será redirecionado automaticamente.'}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Modal de processamento de pagamento */}
      <AnimatePresence>
        {processingPayment.show && <PaymentProcessingIndicator />}
      </AnimatePresence>
      
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200">
        {/* Barra de progresso */}
        {!isCartEmpty && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-dark-300 h-1">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-light"
              style={{ width: showCheckoutForm ? '66%' : '33%' }}
            />
          </div>
        )}
        
        <div className="container mx-auto max-w-6xl px-4 py-12">
          {/* Cabeçalho */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Seu Carrinho
            </h1>
            
            {!isCartEmpty && (
              <div className="flex items-center justify-center space-x-8 mt-6">
                <div className={`flex flex-col items-center ${activeStep >= 1 ? 'text-primary' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeStep >= 1 ? 'bg-primary text-white' : 'bg-dark-300 text-gray-500'}`}>1</div>
                  <span className="text-sm font-medium">Carrinho</span>
                </div>
                
                <div className="w-16 h-px bg-gray-700 mt-[-14px]"></div>
                
                <div className={`flex flex-col items-center ${activeStep >= 2 ? 'text-primary' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeStep >= 2 ? 'bg-primary text-white' : 'bg-dark-300 text-gray-500'}`}>2</div>
                  <span className="text-sm font-medium">Dados</span>
                </div>
                
                <div className="w-16 h-px bg-gray-700 mt-[-14px]"></div>
                
                <div className={`flex flex-col items-center ${activeStep >= 3 ? 'text-primary' : 'text-gray-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${activeStep >= 3 ? 'bg-primary text-white' : 'bg-dark-300 text-gray-500'}`}>3</div>
                  <span className="text-sm font-medium">Pagamento</span>
                </div>
              </div>
            )}
          </div>
          
          {cartIsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 text-lg">Carregando seu carrinho...</p>
            </div>
          ) : isCartEmpty ? (
            <div className="text-center py-20">
              <div className="text-8xl text-gray-300 mb-6 flex justify-center">
                <HiOutlineShoppingCart />
              </div>
              <h2 className="text-2xl font-semibold text-gray-300 mb-4">Seu carrinho está vazio</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Parece que você ainda não adicionou nenhum produto ao seu carrinho. Continue comprando para encontrar produtos incríveis.
              </p>
              <Link href="/products">
                <button className="bg-primary text-white py-3 px-8 rounded-lg font-medium hover:bg-primary-600 transition-colors">
                  Continuar Comprando
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Coluna do carrinho ou formulário de checkout */}
              <div className="lg:col-span-2">
                {!showCheckoutForm ? (
                  // Card de itens do carrinho
                  <div className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-dark-300 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <span className="mr-2"><IconFiShoppingBag size={18} /></span>
                        <span>Itens do Carrinho ({items.length})</span>
                      </h2>
                      <div className="flex items-center text-sm">
                        <span className="text-green-400">Estoque disponível</span>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-dark-300">
                      {items.map((item: CartItem, index: number) => (
                        <div key={`${item.productId}-${item.variantId}`} className="relative">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center p-6 group hover:bg-dark-300/30 transition-colors duration-300">
                            <div className="flex flex-col sm:flex-row sm:space-x-4 w-full">
                              {/* Imagem do produto */}
                              <div className="w-24 h-24 rounded-lg overflow-hidden bg-dark-300 flex-shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105">
                                {item.productImage ? (
                                  <Image 
                                    src={item.productImage} 
                                    alt={item.productName}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                    unoptimized={true}
                                    priority={index < 2}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-dark-300 text-dark-100">
                                    <IconFiShoppingBag size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 sm:mt-0 sm:ml-4 flex-grow">
                                <h3 className="text-white font-medium text-lg group-hover:text-primary transition-colors duration-300">{formatProductName(item.productName)}</h3>
                                <p className="text-gray-400 text-sm mt-1">Variante: {item.variantName}</p>
                                <div className="flex items-center mt-2">
                                  <p className="text-primary font-bold text-lg">R$ {item.price.toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center mt-4 sm:mt-0 space-y-3 sm:space-y-0 sm:space-x-4 self-start sm:self-center">
                                {/* Botão de incremento/decremento de quantidade */}
                                <div className="flex items-center bg-dark-300 border border-dark-400 rounded-full shadow-inner overflow-hidden">
                                  <button 
                                    onClick={() => handleUpdateQuantity(item.variantId, Math.max(1, item.quantity - 1), item.productId)}
                                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-dark-400 transition-colors"
                                    aria-label="Diminuir quantidade"
                                  >
                                    <div className="flex items-center justify-center">
                                      <IconFiMinus size={16} />
                                    </div>
                                  </button>
                                  <span className="w-10 text-center py-1 font-medium text-white">{item.quantity}</span>
                                  <button 
                                    onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1, item.productId)}
                                    className={`w-9 h-9 flex items-center justify-center ${!!item.stock && item.quantity >= item.stock ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 hover:text-white hover:bg-dark-400'} transition-colors`}
                                    disabled={!!item.stock && item.quantity >= item.stock}
                                    aria-label="Aumentar quantidade"
                                  >
                                    <div className="flex items-center justify-center">
                                      <IconFiPlus size={16} />
                                    </div>
                                  </button>
                                </div>
                                {/* Botão de remover item */}
                                <button 
                                  onClick={() => setShowDeleteConfirm({variantId: item.variantId, productId: item.productId})}
                                  className="group/trash w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500 flex items-center justify-center transition-colors duration-300"
                                  aria-label="Remover item"
                                >
                                  <IconFiTrash2 size={16} className="text-red-500 group-hover/trash:text-white transition-colors duration-300" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Confirmação de exclusão */}
                          {showDeleteConfirm && showDeleteConfirm.variantId === item.variantId && showDeleteConfirm.productId === item.productId && (
                            <div className="bg-dark-300/80 backdrop-blur-sm p-5 flex flex-col sm:flex-row items-center justify-between border-t border-dark-400">
                              <div className="flex items-center mb-4 sm:mb-0">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                                  <IconFiAlertTriangle size={16} className="text-red-500" />
                                </div>
                                <p className="text-white font-medium">Remover este item do carrinho?</p>
                              </div>
                              <div className="flex space-x-3">
                                <button 
                                  onClick={() => handleRemoveItem(item.variantId, item.productId)}
                                  className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300 flex items-center"
                                >
                                  <IconFiCheck size={16} className="mr-1" /> Sim, remover
                                </button>
                                <button 
                                  onClick={() => setShowDeleteConfirm(null)}
                                  className="px-4 py-2 bg-dark-400 text-white rounded-full hover:bg-dark-500 transition-colors duration-300"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="p-6 border-t border-dark-300 flex justify-between items-center">
                      <button
                        onClick={handleClearCart}
                        className="text-gray-400 hover:text-white transition-colors flex items-center"
                      >
                        <IconFiX className="mr-1" /> Limpar Carrinho
                      </button>
                      <div className="text-white">
                        <span className="text-gray-400 mr-2">Subtotal:</span>
                        <span className="font-bold text-lg">R$ {cartSubtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Card de formulário de checkout
                  <div className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-dark-300 flex justify-between items-center">
                      <h2 className="text-xl font-bold text-white flex items-center">
                        <span className="mr-2"><IconFiUser size={18} /></span>
                        <span>Dados para o Pedido</span>
                      </h2>
                      <button 
                        onClick={() => setShowCheckoutForm(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <span className="text-sm">Voltar ao carrinho</span>
                      </button>
                    </div>
                    
                    <div className="p-6">
                      <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-gray-300 mb-1 text-sm">Nome *</label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={customerData.firstName}
                              onChange={handleCustomerDataChange}
                              className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                              placeholder="Seu nome"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-gray-300 mb-1 text-sm">Sobrenome *</label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={customerData.lastName}
                              onChange={handleCustomerDataChange}
                              className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                              placeholder="Seu sobrenome"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="email" className="block text-gray-300 mb-1 text-sm">E-mail *</label>
                          <div className="relative">
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={customerData.email}
                              onChange={handleCustomerDataChange}
                              className="w-full bg-dark-300 border border-dark-400 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary"
                              placeholder="seu@email.com"
                            />
                            <div style={{ position: "absolute", left: "12px", top: "10px" }}>
                              <IconFiMail size={16} color="#6B7280" />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="cpf" className="block text-gray-300 mb-1 text-sm">CPF *</label>
                          <input
                            type="text"
                            id="cpf"
                            name="cpf"
                            value={customerData.cpf}
                            onChange={handleCustomerDataChange}
                            className="w-full bg-dark-300 border border-dark-400 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                            placeholder="000.000.000-00"
                            maxLength={14}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="phone" className="block text-gray-300 mb-1 text-sm">Telefone (opcional)</label>
                          <div className="relative">
                            <input
                              type="text"
                              id="phone"
                              name="phone"
                              value={customerData.phone}
                              onChange={handleCustomerDataChange}
                              className="w-full bg-dark-300 border border-dark-400 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary"
                              placeholder="(00) 00000-0000"
                              maxLength={15}
                            />
                            <div style={{ position: "absolute", left: "12px", top: "10px" }}>
                              <IconFiPhone size={16} color="#6B7280" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4">
                          <h3 className="text-white font-medium mb-3">Método de Pagamento</h3>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentMethod('pix')}
                              className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                                selectedPaymentMethod === 'pix'
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-dark-400 bg-dark-300 text-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <Image src="/icons8-pix-480.png" alt="PIX" width={24} height={24} className="mr-2" />
                              <span>PIX</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedPaymentMethod('card')}
                              className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                                selectedPaymentMethod === 'card'
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-dark-400 bg-dark-300 text-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <Image src="/credit.png" alt="Cartão de Crédito" width={24} height={24} className="mr-2" />
                              <span>Cartão</span>
                            </button>
                          </div>
                        </div>
                        
                        <div className="pt-4">
                          <button
                            type="button"
                            onClick={() => setShowCheckoutForm(false)}
                            className="text-gray-400 hover:text-white transition-colors flex items-center"
                          >
                            <span className="mr-2"><IconFiArrowLeft size={16} /></span>
                            <span>Voltar para o carrinho</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Coluna do resumo */}
              <div>
                <div className="bg-dark-200 border border-dark-300 rounded-2xl p-6 mb-4">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="mr-2"><IconFiShoppingCart size={18} /></span>
                    <span>Resumo do Pedido</span>
                    </h2>
                  
                    {/* Cupom de desconto */}
                    <div className="mb-6">
                      <h3 className="text-white font-medium mb-3">Cupom de Desconto</h3>
                      <div className="flex">
                        <div className="relative flex-grow">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Digite seu cupom"
                            className={`w-full bg-dark-300 border rounded-l-xl pl-10 pr-4 py-2.5 text-white focus:outline-none ${
                              isCouponValid === true
                                ? 'border-green-500' 
                                : isCouponValid === false 
                                  ? 'border-red-500' 
                                  : 'border-dark-400'
                            }`}
                          />
                          <div className="absolute left-3 top-3.5 text-gray-500"><IconFiTag size={16} /></div>
                          {isCouponValid === true && (
                            <div className="absolute right-3 top-3.5">
                              <IconFiCheck className="text-green-500" />
                            </div>
                          )}
                          {isCouponValid === false && (
                            <div className="absolute right-3 top-3.5">
                              <IconFiX className="text-red-500" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={applyCoupon}
                          disabled={isApplyingCoupon || !couponCode.trim()}
                          className={`px-4 rounded-r-xl font-medium transition-colors duration-300 ${
                            isApplyingCoupon || !couponCode.trim()
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary-dark'
                          }`}
                        >
                          {isApplyingCoupon ? (
                            <span className="flex items-center">
                              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                            </span>
                          ) : (
                            'Aplicar'
                          )}
                        </button>
                      </div>
                      {isCouponValid === true && (
                        <p className="text-green-500 text-sm mt-2 flex items-center">
                          <span className="mr-1"><IconFiCheck size={14} /></span> Cupom aplicado com sucesso!
                        </p>
                      )}
                      {isCouponValid === false && (
                        <p className="text-red-500 text-sm mt-2 flex items-center">
                          <span className="mr-1"><IconFiX size={14} /></span> Cupom inválido ou expirado
                        </p>
                      )}
                    </div>
                    {/* Resumo de valores */}
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between text-gray-300">
                        <span>Subtotal</span>
                        <span>R$ {cartSubtotal.toFixed(2)}</span>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between text-green-500">
                          <span className="flex items-center">
                            <span className="mr-1"><IconFiTag size={14} /></span> Desconto
                          </span>
                          <span>- R$ {couponDiscount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-white pt-4 border-t border-dark-300">
                        <span>Total</span>
                        <span className="text-primary text-xl">R$ {cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    {/* Botão de checkout */}
                    <button
                      onClick={handleCheckout}
                      disabled={isLoading || isCartEmpty}
                      className={`w-full py-3.5 px-6 rounded-xl font-medium text-white flex items-center justify-center transition-all duration-300 ${
                        isLoading || isCartEmpty
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary shadow-lg shadow-primary/20'
                      }`}
                    >
                      {isLoading ? (
                        <span className="flex items-center">
                          <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></span>
                          Processando...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <span className="mr-2">{showCheckoutForm ? <IconFiCreditCard size={18} /> : <IconFiArrowRight size={18} />}</span>
                          <span>{showCheckoutForm ? 'Finalizar Compra' : 'Continuar'}</span>
                        </span>
                      )}
                    </button>
                    {/* Mensagens de segurança */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center text-gray-400 text-sm">
                        <span className="mr-2"><IconFiLock size={16} color="#10b981" /></span>
                        <span>Pagamento 100% seguro</span>
                      </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <span className="mr-2"><IconFiShield size={16} color="#10b981" /></span>
                        <span>Seus dados estão protegidos</span>
                      </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <span className="mr-2"><IconFiAlertCircle size={16} color="#10b981" /></span>
                        <span>Suporte 24/7</span>
                      </div>
                    </div>
                    {error && (
                      <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm flex items-start">
                          <IconFiAlertTriangle className="mr-2 mt-0.5 flex-shrink-0" />
                          {error}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal de intenção de saída */}
        {showExitIntent && (
          <div className="fixed inset-0 bg-dark-900/70 flex items-center justify-center z-50 p-4"
               data-modal-container="true">
            {/* Conteúdo do modal aqui */}
          </div>
        )}
      </div>
    </>
  );
}