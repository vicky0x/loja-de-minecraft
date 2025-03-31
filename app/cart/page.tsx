"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useCart } from '../contexts/CartContext';
import { 
  FiShoppingCart, FiPlus, FiMinus, FiTrash2, FiX, FiArrowLeft,
  FiShoppingBag, FiTag, FiAlertTriangle, FiCheck, FiUser,
  FiMail, FiPhone, FiCreditCard, FiArrowRight, FiLock,
  FiShield, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import PixPaymentModal from '../components/PixPaymentModal';
import toast from 'react-hot-toast';

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

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, clearCart, updateQuantity } = useCart();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isCouponValid, setIsCouponValid] = useState<boolean | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData>({
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
    phone: '',
  });
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [key, setKey] = useState(0);
  
  // Estado para controlar se o componente está montado
  const isMounted = useRef(false);

  // Efeito para recuperar de possíveis estados de travamento
  useEffect(() => {
    // Marcar o componente como montado
    isMounted.current = true;
    
    // Função para limpar listeners e estados problemáticos
    const cleanup = () => {
      // Remover qualquer estado que possa estar causando problemas
      setShowDeleteConfirm(null);
      setIsPixModalOpen(false);
      setIsLoading(false);
      setError(null);
    };
    
    // Executar limpeza inicial
    cleanup();
    
    // Adicionar detector de visibilidade da página
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Quando o usuário volta para a página, fazer limpeza para evitar estados inconsistentes
        cleanup();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup ao desmontar
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isMounted.current = false;
    };
  }, []);
  
  // Verificação de segurança para operações que podem causar problemas
  const safeOperation = (operation: Function) => {
    try {
      if (isMounted.current) {
        operation();
      }
    } catch (error) {
      console.error('Erro na operação:', error);
      // Resetar estados para evitar travamentos
      setIsLoading(false);
      setError('Ocorreu um erro. Por favor, recarregue a página.');
    }
  };

  // Calcular o total do carrinho
  const cartSubtotal = items.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0);
  const cartTotal = cartSubtotal - couponDiscount;
  const isCartEmpty = items.length === 0;
  
  // Efeito para detectar intenção de saída
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isCartEmpty && !showExitIntent) {
        setShowExitIntent(true);
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isCartEmpty, showExitIntent]);

  // Atualizar dados do cliente
  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Formatação especial para CPF
    if (name === 'cpf') {
      const formattedCPF = formatCPF(value);
      setCustomerData((prev: CustomerData) => ({ ...prev, [name]: formattedCPF }));
      return;
    }
    
    // Formatação especial para telefone
    if (name === 'phone') {
      const cleanPhone = value.replace(/\D/g, '');
      let formattedPhone = cleanPhone;
      
      if (cleanPhone.length <= 2) {
        formattedPhone = cleanPhone;
      } else if (cleanPhone.length <= 6) {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
      } else if (cleanPhone.length <= 10) {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 6)}-${cleanPhone.slice(6)}`;
      } else {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7, 11)}`;
      }
      
      setCustomerData((prev: CustomerData) => ({ ...prev, [name]: formattedPhone }));
      return;
    }
    
    setCustomerData((prev: CustomerData) => ({ ...prev, [name]: value }));
  };

  // Função para formatar CPF
  const formatCPF = (cpf: string): string => {
    // Remover todos os caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Limitar a 11 dígitos
    const limitedCPF = cleanCPF.slice(0, 11);
    
    // Formatar o CPF
    if (limitedCPF.length <= 3) {
      return limitedCPF;
    }
    if (limitedCPF.length <= 6) {
      return `${limitedCPF.slice(0, 3)}.${limitedCPF.slice(3)}`;
    }
    if (limitedCPF.length <= 9) {
      return `${limitedCPF.slice(0, 3)}.${limitedCPF.slice(3, 6)}.${limitedCPF.slice(6)}`;
    }
    return `${limitedCPF.slice(0, 3)}.${limitedCPF.slice(3, 6)}.${limitedCPF.slice(6, 9)}-${limitedCPF.slice(9, 11)}`;
  };

  // Função para aplicar cupom
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom válido');
      return;
    }
    
    setIsApplyingCoupon(true);
    setIsCouponValid(null);
    
    try {
      // Simular verificação de cupom (substitua por uma chamada real à API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Exemplo: cupom "FANTASY10" dá 10% de desconto
      if (couponCode.toUpperCase() === 'FANTASY10') {
        const discount = cartSubtotal * 0.1;
        setCouponDiscount(discount);
        setIsCouponValid(true);
        toast.success('Cupom aplicado com sucesso!');
      } else {
        setCouponDiscount(0);
        setIsCouponValid(false);
        toast.error('Cupom inválido ou expirado');
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      toast.error('Erro ao verificar cupom. Tente novamente.');
      setIsCouponValid(false);
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  // Função para lidar com mudança de quantidade
  const handleQuantityChange = (variantId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    // Encontrar o item no carrinho
    const item = items.find((item: CartItem) => item.variantId === variantId);
    if (!item) return;
    
    // Verificar se a nova quantidade excede o estoque
    if (item.stock && newQuantity > item.stock) {
      toast.error(`Quantidade máxima disponível: ${item.stock}`);
      return;
    }
    
    updateQuantity(variantId, newQuantity);
  };

  // Função segura para remover item do carrinho
  const handleRemoveItem = (variantId: string) => {
    safeOperation(() => {
      removeItem(variantId);
      setShowDeleteConfirm(null);
      toast.success('Item removido do carrinho');
    });
  };
  
  // Função segura para atualizar quantidade
  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (!isMounted.current) return;
    
    try {
      if (newQuantity < 1) {
        handleRemoveItem(itemId);
        return;
      }
      
      // Buscar o item no carrinho
      const item = items.find(item => item.variantId === itemId);
      if (!item) {
        console.error(`Item com ID ${itemId} não encontrado no carrinho`);
        return;
      }
      
      // Verificar se a nova quantidade não excede o estoque
      const safeQuantity = Math.min(newQuantity, item.stock);
      
      // Atualizar a quantidade
      updateQuantity(itemId, safeQuantity);
      
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      toast.error('Não foi possível atualizar a quantidade. Tente novamente.');
    }
  };
  
  // Função segura para limpar o carrinho
  const handleClearCart = () => {
    safeOperation(() => {
      clearCart();
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
          phone: customerData.phone
        }
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
    
    return true;
  };
  
  // Processador de pagamento PIX
  const processPixPayment = async (orderId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Obter o total do carrinho
      const totalAmount = cartTotal.toFixed(2);
      
      // Limpar o CPF (remover pontos, traços e espaços)
      const cleanCPF = customerData.cpf.replace(/\D/g, '');
      
      // Validar formato do CPF antes de enviar
      if (cleanCPF.length !== 11) {
        throw new Error('CPF inválido. Insira um CPF com 11 dígitos.');
      }
      
      const pixResponse = await fetch('/api/payment/mercadopago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          transaction_amount: totalAmount,
          email: customerData.email,
          cpf: cleanCPF, // Enviando CPF apenas com números
          first_name: customerData.firstName,
          last_name: customerData.lastName
        }),
      });
      
      if (!pixResponse.ok) {
        const errorData = await pixResponse.json();
        throw new Error(errorData.details || errorData.error || 'Erro ao gerar pagamento PIX');
      }
      
      const pixData = await pixResponse.json();
      console.log('Dados do PIX gerados:', pixData);
      
      // Verificar se os dados do PIX estão presentes
      if (!pixData.pixCopiaECola && !pixData.qrCodeBase64 && !pixData.qrCodeUrl) {
        console.error('Dados do PIX incompletos:', pixData);
        throw new Error('Não foi possível gerar o código PIX. Tente novamente.');
      }

      // Guardar dados do PIX e abrir modal
      setPixPaymentData({
        orderId: orderId,
        paymentId: pixData.paymentId,
        qrCodeBase64: pixData.qrCodeBase64,
        qrCodeUrl: pixData.qrCodeUrl,
        pixCopiaECola: pixData.pixCopiaECola,
        expiresAt: pixData.expiresAt
      });
      setIsPixModalOpen(true);
      
      return true;
    } catch (error: any) {
      console.error('Erro ao processar pagamento PIX:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
      toast.error('Erro ao gerar QR Code PIX. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verificar status do pagamento
  const checkPaymentStatus = async (orderId: string): Promise<boolean> => {
    try {
      setIsCheckingStatus(true);
      setError(null);
      
      if (!orderId) {
        const errorMsg = 'ID do pedido não disponível para verificação manual';
        console.error(errorMsg);
        toast.error(errorMsg);
        setError(errorMsg);
        return false;
      }
      
      console.log('Verificando status do pagamento para o pedido:', orderId);
      
      // Enviar requisição para verificar o status
      const response = await fetch('/api/payment/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });
      
      // Se a requisição falhar, notificar o usuário
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro na resposta da API:', errorData);
        
        // Mostrar mensagem de erro específica ou genérica
        const errorMessage = errorData.error || errorData.details || 'Erro ao verificar status do pagamento';
        toast.error(errorMessage);
        setError(errorMessage);
        return false;
      }
      
      // Processar resposta
      const data = await response.json().catch(() => ({ success: false, isPaid: false }));
      console.log('Resposta da verificação de status:', data);
      
      if (data.isPaid) {
        // Pagamento aprovado
        toast.success('Pagamento aprovado! Redirecionando...');
        
        // Limpar o carrinho
        clearCart();
        
        // Fechar modal
        setIsPixModalOpen(false);
        
        // Redirecionar para a página de confirmação/pedidos
        setTimeout(() => {
          router.push('/profile/orders');
        }, 2000);
        
        return true;
      } else {
        // Ainda aguardando pagamento
        toast.error('Pagamento ainda pendente. Tente novamente em alguns instantes.');
        
        if (data.paymentStatus) {
          console.log(`Status atual do pagamento: ${data.paymentStatus}`);
        }
        
        return false;
      }
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar status';
      console.error('Erro ao verificar status:', error);
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsCheckingStatus(false);
    }
  };
  
  // Função para lidar com o checkout
  const handleCheckout = () => {
    if (isCartEmpty) return;
    
    if (!showCheckoutForm) {
      // Se o formulário de checkout não estiver visível, mostrar
      setShowCheckoutForm(true);
      setActiveStep(2);
      return;
    }
    
    // Validar dados do cliente
    if (!validateCustomerData()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    
    // Processar o pagamento
    processPayment();
  };
  
  // Função para processar o pagamento
  const processPayment = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Criar o pedido
      const orderId = await createOrder(selectedPaymentMethod);
      if (!orderId) return;
      
      // Armazenar o ID do pedido para verificação posterior
      setCreatedOrderId(orderId);
      
      // Processar o pagamento de acordo com o método selecionado
      if (selectedPaymentMethod === 'pix') {
        await processPixPayment(orderId);
      } else {
        toast.error('Método de pagamento não implementado');
      }
    } catch (error: any) {
      console.error('Erro ao finalizar compra:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar o pedido');
      toast.error('Erro ao finalizar compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função para lidar com a mudança de visibilidade da página
  useEffect(() => {
    // Função para verificar o estado do carrinho quando a página fica visível
    const checkCartState = () => {
      try {
        // Verificar se o localStorage está acessível
        const test = localStorage.getItem('test');
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        
        // Forçar uma atualização do componente
        setKey(prev => prev + 1);
      } catch (error) {
        console.error('Erro ao acessar localStorage:', error);
      }
    };
    
    // Adicionar listener para quando a página ficar visível
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkCartState();
      }
    });
    
    // Adicionar listener para quando a página for recarregada
    window.addEventListener('pageshow', (event) => {
      // O evento pageshow é disparado quando a página é mostrada, incluindo quando
      // o usuário navega usando o botão voltar do navegador
      if (event.persisted) {
        // A página foi restaurada do cache do navegador
        checkCartState();
      }
    });
    
    return () => {
      document.removeEventListener('visibilitychange', checkCartState);
      window.removeEventListener('pageshow', checkCartState);
    };
  }, []);

  // Função para verificar se a página está visível
  const checkVisibility = () => {
    if (typeof document !== 'undefined') {
      return !document.hidden;
    }
    return true;
  };

  return (
    <div key={key} className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200">
      {/* Barra de progresso */}
      {!isCartEmpty && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-dark-300 h-1">
        <motion.div 
          className="h-full bg-gradient-to-r from-primary to-primary-light"
          initial={{ width: '0%' }}
          animate={{ width: showCheckoutForm ? '66%' : '33%' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>
      )}
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Seu Carrinho
          </motion.h1>
          
          {!isCartEmpty && (
            <motion.div 
              className="flex items-center justify-center space-x-8 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
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
            </motion.div>
          )}
        </div>
        
        {isCartEmpty ? (
          <motion.div 
            className="bg-dark-200 rounded-2xl p-12 text-center shadow-xl border border-dark-300"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-dark-300 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-transform duration-300">
                <IconFiShoppingBag size={32} color="#FF5722" />
              </div>
              <h2 className="text-2xl text-white font-bold mb-3 mt-4">Seu carrinho está vazio</h2>
              <p className="text-gray-400 mb-8">Adicione produtos ao carrinho para continuar com sua compra.</p>
              <Link 
                href="/products" 
                className="relative overflow-hidden group bg-transparent border-2 border-primary text-primary hover:text-white text-center text-lg px-8 py-3 rounded-xl font-medium transition-all duration-300 ease-in-out"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Explorar Produtos
                  <svg className="w-5 h-5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary-dark transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500"></span>
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna do carrinho ou formulário de checkout */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {!showCheckoutForm ? (
                // Card de itens do carrinho
                <div className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden">
                  <div className="p-6 border-b border-dark-300 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <div className="mr-2"><IconFiShoppingBag size={18} /></div>
                      <span>Itens do Carrinho ({items.length})</span>
                    </h2>
                    <div className="flex items-center text-sm">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-green-400">Estoque disponível</span>
                    </div>
                  </div>
                  
                  <div className="divide-y divide-dark-300">
                    <AnimatePresence>
                      {items.map((item: CartItem, index: number) => (
                        <motion.div 
                          key={`${item.productId}-${item.variantId}`}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="relative"
                        >
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
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-dark-300 text-dark-100">
                                    <IconFiShoppingBag size={24} />
                                  </div>
                                )}
                              </div>
                              <div className="mt-4 sm:mt-0 sm:ml-4 flex-grow">
                                <h3 className="text-white font-medium text-lg group-hover:text-primary transition-colors duration-300">{item.productName}</h3>
                                <p className="text-gray-400 text-sm mt-1">Variante: {item.variantName}</p>
                                <div className="flex items-center mt-2">
                                  <p className="text-primary font-bold text-lg">R$ {item.price.toFixed(2)}</p>
                                </div>
                              </div>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center mt-4 sm:mt-0 space-y-3 sm:space-y-0 sm:space-x-4 self-start sm:self-center">
                                {/* Botão de incremento/decremento de quantidade */}
                                <div className="flex items-center bg-dark-300 border border-dark-400 rounded-full shadow-inner overflow-hidden">
                                  <button 
                                    onClick={() => handleUpdateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white hover:bg-dark-400 transition-colors"
                                    aria-label="Diminuir quantidade"
                                  >
                                    <div className="flex items-center justify-center">
                                      <IconFiMinus size={16} />
                                    </div>
                                  </button>
                                  <span className="w-10 text-center py-1 font-medium text-white">{item.quantity}</span>
                                  <button 
                                    onClick={() => handleUpdateQuantity(item.variantId, item.quantity + 1)}
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
                                  onClick={() => setShowDeleteConfirm(item.variantId)}
                                  className="group/trash w-9 h-9 rounded-full bg-red-500/10 hover:bg-red-500 flex items-center justify-center transition-colors duration-300"
                                  aria-label="Remover item"
                                >
                                  <IconFiTrash2 size={16} className="text-red-500 group-hover/trash:text-white transition-colors duration-300" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {/* Confirmação de exclusão */}
                          {showDeleteConfirm === item.variantId && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-dark-300/80 backdrop-blur-sm p-5 flex flex-col sm:flex-row items-center justify-between border-t border-dark-400"
                            >
                              <div className="flex items-center mb-4 sm:mb-0">
                                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mr-3">
                                  <IconFiAlertTriangle size={16} className="text-red-500" />
                                </div>
                                <p className="text-white font-medium">Remover este item do carrinho?</p>
                              </div>
                              <div className="flex space-x-3">
                                <button 
                                  onClick={() => handleRemoveItem(item.variantId)}
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
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
                  <div className="p-6 border-b border-dark-300">
                    <h2 className="text-xl font-bold text-white flex items-center">
                      <div className="mr-2"><IconFiUser size={18} /></div>
                      <span>Seus Dados</span>
                    </h2>
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
                        <label htmlFor="phone" className="block text-gray-300 mb-1 text-sm">Telefone *</label>
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
                          <div className="mr-2"><IconFiArrowLeft size={16} /></div>
                          <span>Voltar para o carrinho</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
            {/* Resumo do pedido */}
            <motion.div 
              className="lg:col-span-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden">
                <div className="p-6 border-b border-dark-300">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <div className="mr-2"><IconFiShoppingBag size={20} /></div> 
                    Resumo do Pedido
                  </h2>
                </div>
                
                <div className="p-6">
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
                        <div className="mr-1"><IconFiCheck size={14} /></div> Cupom aplicado com sucesso!
                      </p>
                    )}
                    {isCouponValid === false && (
                      <p className="text-red-500 text-sm mt-2 flex items-center">
                        <div className="mr-1"><IconFiX size={14} /></div> Cupom inválido ou expirado
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
                          <div className="mr-1"><IconFiTag size={14} /></div> Desconto
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
                  <motion.button
                    onClick={handleCheckout}
                    disabled={isLoading || isCartEmpty}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                      <>
                        <div className="mr-2">{showCheckoutForm ? <IconFiCreditCard size={18} /> : <IconFiArrowRight size={18} />}</div>
                        <span>{showCheckoutForm ? 'Finalizar Compra' : 'Continuar'}</span>
                      </>
                    )}
                  </motion.button>
                  {/* Mensagens de segurança */}
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center text-gray-400 text-sm">
                      <div className="mr-2"><IconFiLock size={16} color="#10b981" /></div>
                      <span>Pagamento 100% seguro</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <div className="mr-2"><IconFiShield size={16} color="#10b981" /></div>
                      <span>Seus dados estão protegidos</span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <div className="mr-2"><IconFiAlertCircle size={16} color="#10b981" /></div>
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
            </motion.div>
          </div>
        )}
      </div>
      {/* Modal de pagamento PIX */}
      {isPixModalOpen && pixPaymentData && (
        <div className="fixed inset-0 bg-dark-900/70 flex items-center justify-center z-50 p-4">
          <PixPaymentModal 
            isOpen={isPixModalOpen}
            onClose={() => setIsPixModalOpen(false)}
            paymentData={{
              orderId: createdOrderId || '',
              paymentId: pixPaymentData.paymentId || '',
              pixCopiaECola: pixPaymentData.pixCopiaECola || '',
              qrCodeBase64: pixPaymentData.qrCodeBase64 || '',
              qrCodeUrl: pixPaymentData.qrCodeUrl || '',
              expiresAt: pixPaymentData.expiresAt || '',
              total: cartTotal
            }}
            onPaymentConfirmed={() => {
              if (createdOrderId) {
                checkPaymentStatus(createdOrderId);
              }
            }}
            clearCart={clearCart}
          />
        </div>
      )}
      {/* Modal de intenção de saída */}
      <AnimatePresence>
        {showExitIntent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-dark-900/70 flex items-center justify-center z-50 p-4"
          >
            {/* Conteúdo do modal aqui */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}