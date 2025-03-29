'use client';

// Este componente implementa o carrinho de compras e checkout
// A estrutura dos itens do carrinho é:
// CartItem {
//   productId: string;     // ID do produto
//   productName: string;   // Nome do produto
//   productImage: string;  // URL da imagem do produto
//   variantId: string;     // ID da variante do produto
//   variantName: string;   // Nome da variante (ex: "Plano Mensal")
//   price: number;         // Preço da variante
//   quantity: number;      // Quantidade no carrinho
//   stock: number;         // Estoque disponível
// }

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiTrash2, FiRefreshCw, FiCheck, FiShoppingBag, FiShield, FiLock, FiCreditCard, FiDollarSign, FiArrowRight, FiX, FiAlertCircle, FiCheckCircle, FiClock, FiCopy } from 'react-icons/fi';
import { useCart } from '@/app/contexts/CartContext';
import toast from 'react-hot-toast';
import PixPaymentModal from '@/app/components/PixPaymentModal';

// Componente de formulário de checkout
const CheckoutForm = ({ onSubmit, onPaymentMethodChange, isSubmitting }: { 
  onSubmit: () => void, 
  onPaymentMethodChange: (method: string) => void,
  isSubmitting: boolean 
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
    couponCode: '',
  });
  
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

  // Atualizar o método de pagamento e notificar o componente pai
  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    onPaymentMethodChange(method);
  };

  const formatCPF = (cpf: string) => {
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

  const validateCPF = (cpf: string) => {
    // Remove caracteres não numéricos
    const cleanCPF = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cleanCPF.length !== 11) return false;
    
    // Evita CPFs óbvios como 11111111111
    if (/^(\d)\1+$/.test(cleanCPF)) return false;
    
    // Algoritmo de validação de CPF
    let sum = 0;
    let remainder;
    
    // Primeiro dígito verificador
    for (let i = 1; i <= 9; i++) {
      sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
    
    // Segundo dígito verificador
    sum = 0;
    for (let i = 1; i <= 10; i++) {
      sum = sum + parseInt(cleanCPF.substring(i-1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if ((remainder === 10) || (remainder === 11)) remainder = 0;
    if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
    
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      setFormData({
        ...formData,
        [name]: formatCPF(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Limpa o erro do campo quando o usuário começa a digitar novamente
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleCheckCoupon = () => {
    if (!formData.couponCode) return;
    
    setIsCheckingCoupon(true);
    
    // Simulação de verificação de cupom
    setTimeout(() => {
      const isValid = Math.random() > 0.5; // Simulação aleatória
      setCouponValid(isValid);
      toast(isValid ? 'Cupom aplicado com sucesso!' : 'Cupom inválido ou expirado', {
        icon: isValid ? '✅' : '❌',
      });
      setIsCheckingCoupon(false);
    }, 1000);
  };

  const validateForm = () => {
    const newErrors = {
      firstName: formData.firstName ? '' : 'Nome é obrigatório',
      lastName: formData.lastName ? '' : 'Sobrenome é obrigatório',
      email: validateEmail(formData.email) ? '' : 'Email inválido',
      cpf: validateCPF(formData.cpf) ? '' : 'CPF inválido',
    };
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit();
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white mb-6">Dados para compra</h2>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
              Nome
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full py-2.5 px-3 bg-dark-300/70 border ${errors.firstName ? 'border-red-500' : 'border-dark-400'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
              placeholder="Seu nome"
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
              Sobrenome
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full py-2.5 px-3 bg-dark-300/70 border ${errors.lastName ? 'border-red-500' : 'border-dark-400'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
              placeholder="Seu sobrenome"
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full py-2.5 px-3 bg-dark-300/70 border ${errors.email ? 'border-red-500' : 'border-dark-400'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
            placeholder="seu@email.com"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-400">{errors.email}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-1">
            CPF
          </label>
          <input
            type="text"
            id="cpf"
            name="cpf"
            value={formData.cpf}
            onChange={handleChange}
            maxLength={14}
            className={`w-full py-2.5 px-3 bg-dark-300/70 border ${errors.cpf ? 'border-red-500' : 'border-dark-400'} rounded-md focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
            placeholder="000.000.000-00"
          />
          {errors.cpf && (
            <p className="mt-1 text-xs text-red-400">{errors.cpf}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="couponCode" className="block text-sm font-medium text-gray-300 mb-1">
            Cupom de desconto
          </label>
          <div className="flex">
            <input
              type="text"
              id="couponCode"
              name="couponCode"
              value={formData.couponCode}
              onChange={handleChange}
              className={`flex-1 py-2.5 px-3 bg-dark-300/70 border ${couponValid === false ? 'border-red-500' : couponValid === true ? 'border-green-500' : 'border-dark-400'} rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary transition-all`}
              placeholder="CUPOM10"
            />
            <button
              type="button"
              onClick={handleCheckCoupon}
              disabled={!formData.couponCode || isCheckingCoupon}
              className="px-4 py-2.5 bg-dark-400/90 hover:bg-dark-500 text-white rounded-r-md flex items-center justify-center transition-all disabled:opacity-50"
            >
              {isCheckingCoupon ? (
                <FiRefreshCw className="animate-spin" />
              ) : couponValid ? (
                <FiCheck className="text-green-500" />
              ) : (
                'Aplicar'
              )}
            </button>
          </div>
          {couponValid === false && (
            <p className="mt-1 text-xs text-red-400">Cupom inválido ou expirado</p>
          )}
        </div>
        
        <div className="pt-4 border-t border-dark-400">
          <h3 className="text-white font-medium mb-4">Método de pagamento</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div 
              className={`p-3 border ${paymentMethod === 'pix' ? 'border-primary bg-dark-300/80' : 'border-dark-400 bg-dark-300/50'} rounded-md cursor-pointer transition-all hover:border-primary/70`}
              onClick={() => handlePaymentMethodChange('pix')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'pix' ? 'border-primary' : 'border-gray-500'} flex items-center justify-center mr-2`}>
                  {paymentMethod === 'pix' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                </div>
                <div className="flex items-center text-white">
                  <FiDollarSign className="mr-2" />
                  <span>PIX</span>
                </div>
              </div>
              <input 
                type="radio" 
                id="payment_pix" 
                name="paymentMethod" 
                value="pix" 
                checked={paymentMethod === 'pix'} 
                onChange={() => handlePaymentMethodChange('pix')} 
                className="hidden" 
              />
            </div>
            
            <div 
              className={`p-3 border ${paymentMethod === 'credito' ? 'border-primary bg-dark-300/80' : 'border-dark-400 bg-dark-300/50'} rounded-md cursor-pointer transition-all hover:border-primary/70`}
              onClick={() => handlePaymentMethodChange('credito')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'credito' ? 'border-primary' : 'border-gray-500'} flex items-center justify-center mr-2`}>
                  {paymentMethod === 'credito' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                </div>
                <div className="flex items-center text-white">
                  <FiCreditCard className="mr-2" />
                  <span>Cartão de crédito</span>
                </div>
              </div>
              <input 
                type="radio" 
                id="payment_credito" 
                name="paymentMethod" 
                value="credito" 
                checked={paymentMethod === 'credito'} 
                onChange={() => handlePaymentMethodChange('credito')} 
                className="hidden" 
              />
            </div>
            
            <div 
              className={`p-3 border ${paymentMethod === 'boleto' ? 'border-primary bg-dark-300/80' : 'border-dark-400 bg-dark-300/50'} rounded-md cursor-pointer transition-all hover:border-primary/70`}
              onClick={() => handlePaymentMethodChange('boleto')}
            >
              <div className="flex items-center">
                <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === 'boleto' ? 'border-primary' : 'border-gray-500'} flex items-center justify-center mr-2`}>
                  {paymentMethod === 'boleto' && <div className="w-2 h-2 bg-primary rounded-full"></div>}
                </div>
                <div className="flex items-center text-white">
                  <FiShoppingBag className="mr-2" />
                  <span>Boleto</span>
                </div>
              </div>
              <input 
                type="radio" 
                id="payment_boleto" 
                name="paymentMethod" 
                value="boleto" 
                checked={paymentMethod === 'boleto'} 
                onChange={() => handlePaymentMethodChange('boleto')} 
                className="hidden" 
              />
            </div>
          </div>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full mt-6 py-3.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white font-medium rounded-lg transition-all flex items-center justify-center shadow-lg shadow-primary/20"
        >
          {isSubmitting ? (
            <FiRefreshCw className="animate-spin mr-2" />
          ) : (
            <FiShoppingBag className="mr-2" />
          )}
          Finalizar compra
        </motion.button>
      </form>
    </div>
  );
};

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, clearCart } = useCart();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('pix');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pixPaymentData, setPixPaymentData] = useState<any>(null);
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    cpf: '',
    phone: '',
  });
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Atualizar efeito para carregar também o estoque atual dos produtos
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const response = await fetch('/api/auth/me');
        const data = await response.json();
        
        if (response.ok && data.user) {
          setIsAuthenticated(true);
          // Preencher os dados do cliente com os dados do usuário
          if (data.user.name) {
            const nameParts = data.user.name.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');
            
            setCustomerData(prev => ({
              ...prev,
              firstName: firstName || '',
              lastName: lastName || '',
              email: data.user.email || '',
              cpf: data.user.cpf || '',
              phone: data.user.phone || ''
            }));
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setIsAuthenticated(false);
      }
    }
    
    checkAuthStatus();
  }, []); // Este efeito só deve ser executado uma vez, na montagem do componente

  // Efeito separado para verificar o estoque
  useEffect(() => {
    async function checkStockStatus() {
      if (items.length === 0) return;
      
      try {
        // Crie uma cópia dos itens do carrinho para atualizar os dados de estoque
        const updatedItems = [...items];
        let hasStockIssue = false;
        
        // Verificar o estoque de cada item
        for (let i = 0; i < updatedItems.length; i++) {
          const item = updatedItems[i];
          const response = await fetch(`/api/stock/check?productId=${item.productId}&variantId=${item.variantId}&quantity=${item.quantity}`);
          const data = await response.json();
          
          // Atualizar a informação de estoque no item
          updatedItems[i] = { 
            ...item, 
            stock: data.available || 0,
            hasStockIssue: data.available < item.quantity
          };
          
          if (data.available < item.quantity) {
            hasStockIssue = true;
            toast.error(`Estoque insuficiente para ${item.productName} - ${item.variantName}. Disponível: ${data.available}, Solicitado: ${item.quantity}`);
          }
        }
        
        // Se houver problemas de estoque, exibir um erro geral
        if (hasStockIssue) {
          setError('Alguns itens do carrinho não possuem estoque suficiente.');
        }
        
      } catch (error) {
        console.error('Erro ao verificar estoque dos itens:', error);
      }
    }
    
    checkStockStatus();
  }, [items]); // Este efeito deve ser executado quando os itens do carrinho mudam
  
  // Calcular o valor total do carrinho
  const cartTotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Verificar se o carrinho está vazio
  const isCartEmpty = items.length === 0;

  // Função para lidar com mudanças no formulário de cliente
  const handleCustomerDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'cpf') {
      // Limpar CPF (remover não numéricos)
      const cleanCPF = value.replace(/\D/g, '');
      
      // Limitar a 11 dígitos
      const limitedCPF = cleanCPF.slice(0, 11);
      
      // Formatar CPF para exibição
      let formattedCPF = limitedCPF;
      
      if (limitedCPF.length > 3) {
        formattedCPF = `${limitedCPF.slice(0, 3)}.${limitedCPF.slice(3)}`;
      }
      if (limitedCPF.length > 6) {
        formattedCPF = `${formattedCPF.slice(0, 7)}.${limitedCPF.slice(6)}`;
      }
      if (limitedCPF.length > 9) {
        formattedCPF = `${formattedCPF.slice(0, 11)}-${limitedCPF.slice(9)}`;
      }
      
      setCustomerData({
        ...customerData,
        cpf: formattedCPF
      });
    } else if (name === 'phone') {
      // Resto do código permanece igual
      const cleanPhone = value.replace(/\D/g, '');
      let formattedPhone = cleanPhone;
      
      if (cleanPhone.length > 2) {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2)}`;
      }
      if (cleanPhone.length > 7) {
        formattedPhone = `${formattedPhone.slice(0, 10)}-${cleanPhone.slice(7)}`;
      }
      
      setCustomerData({
        ...customerData,
        phone: formattedPhone
      });
    } else {
      setCustomerData({
        ...customerData,
        [name]: value
      });
    }
  };

  // Validar os dados do cliente
  const validateCustomerData = () => {
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

  // Função para criar o pedido
  const createOrder = async (paymentMethod: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar se todos os dados são válidos
      if (!validateCustomerData()) {
        toast.error('Por favor, preencha todos os campos obrigatórios.');
        setIsLoading(false);
        return;
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
          phone: customerData.phone,
          address: `${customerData.street}, ${customerData.number}, ${customerData.neighborhood}, ${customerData.city}, ${customerData.state}, ${customerData.zipCode}`
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
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar o pedido');
      toast.error('Erro ao criar pedido. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Processador de pagamento PIX
  const processPixPayment = async (orderId: string) => {
    try {
      setIsLoading(true);
      
      // Obter o total do carrinho
      const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
      
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
      
      // Guardar dados do PIX e abrir modal
      setPixPaymentData(pixData.payment);
      setIsPixModalOpen(true);
      
      return true;
    } catch (error) {
      console.error('Erro ao processar pagamento PIX:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar pagamento');
      toast.error('Erro ao gerar QR Code PIX. Tente novamente.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Verificar status do pagamento
  const checkPaymentStatus = async (orderId: string) => {
    try {
      setIsCheckingStatus(true);
      setError(null);
      
      if (!orderId) {
        toast.error('ID do pedido não encontrado');
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
        toast.info('Pagamento ainda pendente. Tente novamente em alguns instantes.');
        
        if (data.paymentStatus) {
          console.log(`Status atual do pagamento: ${data.paymentStatus}`);
        }
        
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao verificar status';
      console.error('Erro ao verificar status:', error);
      toast.error(errorMessage);
      setError(errorMessage);
      return false;
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // Enviar o pedido para a API
  const handleSubmitCheckout = async () => {
    try {
      setError(null);
      
      // Verificar se o carrinho está vazio
      if (isCartEmpty) {
        toast.error('Seu carrinho está vazio. Adicione produtos antes de finalizar.');
        return;
      }
      
      if (!showCheckoutForm) {
        // Mostrar o formulário de checkout primeiro
        setShowCheckoutForm(true);
        return;
      }
      
      // Verificar estoque antes de prosseguir
      try {
        setIsLoading(true);
        
        // Verificar disponibilidade de todos os itens
        for (const item of items) {
          const stockResponse = await fetch(`/api/stock/check?productId=${item.productId}&variantId=${item.variantId}&quantity=${item.quantity}`);
          
          if (!stockResponse.ok) {
            const stockData = await stockResponse.json();
            throw new Error(stockData.error || `Estoque insuficiente para ${item.productName} - ${item.variantName}. Disponível: ${stockData.available || 0}, Solicitado: ${item.quantity}`);
          }
        }
        
        // Se chegou aqui, o estoque está ok
        const orderId = createdOrderId || await createOrder(selectedPaymentMethod);
        if (!orderId) return;
        
        // Se o método de pagamento for PIX, gerar o QR code
        if (selectedPaymentMethod === 'pix') {
          const success = await processPixPayment(orderId);
          if (!success) return;
        } else {
          // Para outros métodos de pagamento (não implementados ainda)
          toast.info('Este método de pagamento ainda não está disponível.');
        }
      } catch (error) {
        console.error('Erro ao verificar estoque:', error);
        setError(error instanceof Error ? error.message : 'Erro ao verificar disponibilidade de estoque');
        toast.error('Erro ao verificar estoque. Por favor, tente novamente.');
        return;
      }
      
    } catch (error) {
      console.error('Erro ao finalizar compra:', error);
      setError(error instanceof Error ? error.message : 'Erro ao processar o pedido');
      toast.error('Erro ao finalizar compra. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fechar modal PIX
  const handleClosePixModal = () => {
    setIsPixModalOpen(false);
  };
  
  // Função para simular aprovação de pagamento em ambiente de desenvolvimento
  const simulatePaymentApproval = async (paymentId: string | number | undefined) => {
    if (!paymentId) return;
    
    try {
      setIsCheckingStatus(true);
      
      const response = await fetch(`/api/dev/approve-payment/${paymentId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast.success('Pagamento aprovado com sucesso! Atualizando...');
        // Verificar o status do pagamento para obter a atualização
        if (createdOrderId) {
          await checkPaymentStatus(createdOrderId);
        }
      } else {
        const data = await response.json();
        toast.error(data.message || 'Erro ao simular aprovação');
      }
    } catch (error) {
      console.error('Erro ao simular aprovação:', error);
      toast.error('Erro ao simular aprovação do pagamento');
    } finally {
      setIsCheckingStatus(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-8 flex items-center">
        <FiShoppingBag className="mr-2" /> Seu Carrinho
      </h1>
      
      {isCartEmpty ? (
        <div className="bg-dark-200 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center">
            <FiShoppingBag className="text-gray-500 text-6xl mb-4" />
            <h2 className="text-xl text-white mb-2">Seu carrinho está vazio</h2>
            <p className="text-gray-400 mb-4">Adicione produtos ao carrinho para continuar.</p>
            <a href="/products" className="bg-primary hover:bg-primary/90 text-white py-2 px-6 rounded-md flex items-center">
              Explorar Produtos <FiArrowRight className="ml-2" />
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de itens do carrinho */}
          <div className="lg:col-span-2">
            <div className="bg-dark-200 rounded-lg shadow-md">
              <div className="p-4 border-b border-dark-300">
                <h2 className="text-lg font-semibold text-white">Itens do Carrinho ({items.length})</h2>
              </div>
              
              <div>
                {items.map((item, index) => (
                  <div key={`${item.productId}-${item.variantId}`} className={`flex items-center p-4 ${index < items.length - 1 ? 'border-b border-dark-300' : ''}`}>
                    <div className="w-16 h-16 bg-dark-300 rounded-md overflow-hidden flex-shrink-0 relative">
                      {item.productImage ? (
                        <Image 
                          src={item.productImage} 
                          alt={item.productName} 
                          fill 
                          sizes="64px"
                          className="object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-dark-300 text-dark-400">
                          <FiShoppingBag size={24} />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-grow">
                      <h3 className="text-white font-medium">{item.productName}</h3>
                      <p className="text-gray-400 text-sm">Variante: {item.variantName}</p>
                      <div className="flex items-center mt-1">
                        <p className="text-primary font-semibold">R$ {item.price.toFixed(2)}</p>
                        <span className="mx-2 text-gray-500">×</span>
                        <p className="text-gray-400">{item.quantity}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="ml-2 text-red-500 hover:text-red-400"
                      aria-label="Remover item"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-dark-300 flex justify-between">
                <button
                  onClick={clearCart}
                  className="text-red-500 hover:text-red-400 text-sm flex items-center"
                >
                  <FiX className="mr-1" /> Limpar Carrinho
                </button>
                
                <div className="text-white">
                  <span className="text-gray-400 mr-2">Total:</span>
                  <span className="font-bold text-lg">R$ {cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Formulário de checkout */}
            {showCheckoutForm && (
              <div className="bg-dark-200 rounded-lg shadow-md mt-6 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Informações do Cliente</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                        Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={customerData.firstName}
                        onChange={handleCustomerDataChange}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                        Sobrenome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={customerData.lastName}
                        onChange={handleCustomerDataChange}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={customerData.email}
                      onChange={handleCustomerDataChange}
                      className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="cpf" className="block text-sm font-medium text-gray-300 mb-1">
                        CPF <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="cpf"
                        name="cpf"
                        value={customerData.cpf}
                        onChange={handleCustomerDataChange}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
                        Telefone
                      </label>
                      <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={customerData.phone}
                        onChange={handleCustomerDataChange}
                        placeholder="(00) 00000-0000"
                        className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Resumo e pagamento */}
          <div className="lg:col-span-1">
            <div className="bg-dark-200 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Resumo do Pedido</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-medium text-white pt-3 border-t border-dark-300">
                  <span>Total</span>
                  <span className="text-primary">R$ {cartTotal.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-white font-medium mb-3">Método de Pagamento</h3>
                
                <div className="space-y-2">
                  <label className={`flex items-center p-3 rounded-md cursor-pointer transition ${selectedPaymentMethod === 'pix' ? 'bg-primary/20 border border-primary' : 'bg-dark-300 border border-dark-400 hover:border-gray-500'}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="pix"
                      checked={selectedPaymentMethod === 'pix'}
                      onChange={() => setSelectedPaymentMethod('pix')}
                      className="hidden"
                    />
                    <div className={`w-5 h-5 rounded-full border mr-3 flex items-center justify-center ${selectedPaymentMethod === 'pix' ? 'border-primary' : 'border-gray-500'}`}>
                      {selectedPaymentMethod === 'pix' && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <span className="text-white flex items-center">
                      <FiDollarSign className="mr-2 text-primary" /> PIX
                    </span>
                  </label>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-900/30 border-l-4 border-red-500 p-3 text-red-400 flex items-start mb-4">
                  <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <button
                onClick={handleSubmitCheckout}
                disabled={isLoading || isCartEmpty}
                className={`w-full py-3 px-4 rounded-md font-medium flex items-center justify-center ${
                  isLoading || isCartEmpty 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Processando...
                  </>
                ) : showCheckoutForm ? (
                  <>
                    <FiDollarSign className="mr-2" /> Pagar com {selectedPaymentMethod.toUpperCase()}
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="mr-2" /> Finalizar Compra
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de pagamento PIX */}
      {isPixModalOpen && (
        <PixPaymentModal
          isOpen={isPixModalOpen}
          onClose={() => setIsPixModalOpen(false)}
          paymentData={{
            qrCode: pixPaymentData?.qrCode || '',
            qrCodeBase64: pixPaymentData?.qrCodeBase64 || '',
            copyPaste: pixPaymentData?.copyPaste || '',
            expirationDate: pixPaymentData?.expirationDate || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            paymentId: pixPaymentData?.id || '',
            orderId: createdOrderId || ''
          }}
          onPaymentConfirmed={() => {
            // Limpar o carrinho e redirecionar ao confirmar o pagamento
            clearCart();
            setTimeout(() => {
              setIsPixModalOpen(false);
              router.push('/profile/orders');
            }, 3000);
          }}
        />
      )}
    </div>
  );
}