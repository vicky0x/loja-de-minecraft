'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FiCopy, FiCheck, FiClock, FiAlertCircle, FiX, FiRefreshCw, FiHelpCircle, 
         FiAlertTriangle, FiArrowRight, FiShield, FiInfo, FiChevronLeft, FiLock } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

// Interface para ícones com tipagem correta
interface IconProps extends IconBaseProps {
  className?: string;
  size?: number | string;
  color?: string;
}

// Componentes de ícone com tipagem correta
const IconFiCopy = (props: IconProps) => <FiCopy {...props} />;
const IconFiCheck = (props: IconProps) => <FiCheck {...props} />;
const IconFiClock = (props: IconProps) => <FiClock {...props} />;
const IconFiAlertCircle = (props: IconProps) => <FiAlertCircle {...props} />;
const IconFiX = (props: IconProps) => <FiX {...props} />;
const IconFiRefreshCw = (props: IconProps) => <FiRefreshCw {...props} />;
const IconFiHelpCircle = (props: IconProps) => <FiHelpCircle {...props} />;
const IconFiAlertTriangle = (props: IconProps) => <FiAlertTriangle {...props} />;
const IconFiArrowRight = (props: IconProps) => <FiArrowRight {...props} />;
const IconFiShield = (props: IconProps) => <FiShield {...props} />;
const IconFiInfo = (props: IconProps) => <FiInfo {...props} />;
const IconFiChevronLeft = (props: IconProps) => <FiChevronLeft {...props} />;
const IconFiLock = (props: IconProps) => <FiLock {...props} />;

export default function CheckoutPaymentPage() {
  const router = useRouter();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [lastVerificationTime, setLastVerificationTime] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  
  // Referências para controle de estado
  const isMounted = useRef(true);
  const statusCheckRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const checkCountRef = useRef(0);
  const verificationStrategyRef = useRef<'normal' | 'aggressive' | 'recovery'>('normal');
  const consecutiveErrorsRef = useRef(0);
  
  useEffect(() => {
    // Marcar componente como montado
    isMounted.current = true;
    
    // Recuperar dados do pagamento do localStorage
    const storedPixData = localStorage.getItem('pixPaymentData');
    const storedOrderId = localStorage.getItem('createdOrderId');
    
    if (storedPixData && storedOrderId) {
      try {
        const parsedPixData = JSON.parse(storedPixData);
        
        // Verificar se o pagamento já expirou
        const expiresAt = parsedPixData.expiresAt ? new Date(parsedPixData.expiresAt) : null;
        const now = new Date();
        
        // Se o pagamento já expirou, redirecionar para o carrinho
        if (expiresAt && expiresAt < now) {
          console.log('Dados de pagamento PIX expirados, redirecionando para o carrinho');
          localStorage.removeItem('pixPaymentData');
          localStorage.removeItem('createdOrderId');
          router.push('/cart');
          return;
        }
        
        // Atualizar estados
        setPaymentData(parsedPixData);
        setCreatedOrderId(storedOrderId);
        
        // Iniciar verificação de status e timer
        startStatusCheck(storedOrderId);
      } catch (parseError) {
        console.error('Erro ao processar dados de PIX armazenados:', parseError);
        localStorage.removeItem('pixPaymentData');
        localStorage.removeItem('createdOrderId');
        router.push('/cart');
      }
    } else {
      // Se não houver dados, redirecionar para o carrinho
      router.push('/cart');
    }
    
    return () => {
      // Limpar ao desmontar
      isMounted.current = false;
      
      // Limpar timers
      if (statusCheckRef.current) {
        clearTimeout(statusCheckRef.current);
      }
    };
  }, [router]);
  
  // Efeito para calcular o tempo restante para expiração do pagamento
  useEffect(() => {
    if (!paymentData?.expiresAt) return;
    
    const calculateTimeLeft = () => {
      try {
        // Garantir que temos uma data válida
        let expiresAt;
        try {
          // Verificar e converter a string de data para um objeto Date
          expiresAt = new Date(paymentData.expiresAt);
          
          // Verificar se a data é válida
          if (isNaN(expiresAt.getTime())) {
            console.error('Data de expiração inválida:', paymentData.expiresAt);
            setTimeLeft('--:--');
            return;
          }
        } catch (dateError) {
          console.error('Erro ao processar data de expiração:', dateError);
          setTimeLeft('--:--');
          return;
        }
        
        const now = new Date();
        
        // Se já expirou, mostrar 00:00 e marcar como expirado
        if (expiresAt <= now) {
          setTimeLeft('00:00');
          setIsExpired(true);
          
          // Notificar o usuário na primeira vez que expira
          if (!isExpired) {
            toast.error('O pagamento PIX expirou. Gere um novo código para continuar.');
          }
          
          return;
        }
        
        // Calcular a diferença em milissegundos
        const diff = expiresAt.getTime() - now.getTime();
        
        // Converter para minutos e segundos
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Formatar como MM:SS
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        
        // Alertar quando estiver próximo da expiração (menos de 60 segundos)
        if (minutes === 0 && seconds <= 60 && seconds % 15 === 0 && seconds > 0) {
          toast.error(`Atenção! Pagamento expira em ${seconds} segundos.`);
        }
      } catch (error) {
        console.error('Erro ao calcular tempo restante:', error);
        setTimeLeft('--:--');
      }
    };
    
    // Calcular imediatamente
    calculateTimeLeft();
    
    // Configurar intervalo para atualizar a cada segundo
    const timer = setInterval(calculateTimeLeft, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [paymentData, isExpired]);
  
  // Função para iniciar verificação de status do pagamento
  const startStatusCheck = (orderId: string) => {
    if (!orderId) return;
    
    // Verificar imediatamente
    checkPaymentStatus(orderId);
    
    // Configurar verificação periódica
    const setupPeriodicCheck = () => {
      const checkInterval = 10000; // 10 segundos
      
      statusCheckRef.current = setTimeout(async () => {
        if (isMounted.current) {
          await checkPaymentStatus(orderId);
          if (isMounted.current && !isPaid) {
            setupPeriodicCheck();
          }
        }
      }, checkInterval);
    };
    
    setupPeriodicCheck();
  };
  
  // Função para verificar o status do pagamento
  const checkPaymentStatus = async (orderId: string) => {
    if (checkingStatus || !isMounted.current) return;
    
    setCheckingStatus(true);
    checkCountRef.current += 1;
    
    try {
      console.log(`Verificando status do pagamento para o pedido ${orderId}...`);
      
      // Remover verificação de dados mockados e sempre usar dados reais
      // Fazer chamada à API para verificar status do pagamento
      const response = await fetch(`/api/payment/check-status?orderId=${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (!isMounted.current) return;
      
      if (response.ok && data.success) {
        console.log('Resposta da API de verificação de status:', data);
        
        if (data.status === 'approved' || data.status === 'paid') {
          console.log('Pagamento confirmado!');
          setIsPaid(true);
          
          // Limpar localStorage
          localStorage.removeItem('pixPaymentData');
          localStorage.removeItem('createdOrderId');
          
          // Limpar o carrinho e exibir mensagem de sucesso
          clearCart();
          toast.success('Pagamento confirmado! Seus produtos foram liberados');
          
          // Redirecionar após 5 segundos
          setTimeout(() => {
            if (isMounted.current) {
              router.push('/checkout/success?external_reference=' + orderId);
            }
          }, 5000);
        } else {
          // Atualizar tempo da última verificação
          const now = new Date();
          setLastVerificationTime(
            `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
          );
        }
      } else {
        console.error('Erro ao verificar status:', data.message || 'Erro desconhecido');
        consecutiveErrorsRef.current += 1;
        
        // Se muitos erros consecutivos, mudar estratégia
        if (consecutiveErrorsRef.current > 3) {
          verificationStrategyRef.current = 'recovery';
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      consecutiveErrorsRef.current += 1;
    } finally {
      if (isMounted.current) {
        setCheckingStatus(false);
      }
    }
  };
  
  // Função para limpar o carrinho
  const clearCart = () => {
    try {
      // Limpar itens do carrinho no localStorage
      localStorage.removeItem('cart_items');
    } catch (e) {
      console.error('Erro ao limpar o carrinho:', e);
    }
  };
  
  // Função para copiar o código PIX para a área de transferência
  const copyToClipboard = () => {
    if (!paymentData?.pixCopiaECola) return;
    
    navigator.clipboard.writeText(paymentData.pixCopiaECola)
      .then(() => {
        setCopied(true);
        toast.success('Código PIX copiado!');
        
        // Resetar o estado após 3 segundos
        setTimeout(() => {
          setCopied(false);
        }, 3000);
      })
      .catch(err => {
        console.error('Erro ao copiar para a área de transferência:', err);
        toast.error('Não foi possível copiar o código. Tente copiar manualmente.');
      });
  };
  
  // Função para verificar pagamento manualmente
  const verifyPaymentManually = async () => {
    if (!createdOrderId || checkingStatus) return;
    
    toast.loading('Verificando pagamento...', { duration: 3000 });
    await checkPaymentStatus(createdOrderId);
  };
  
  // Função para voltar ao carrinho
  const backToCart = () => {
    // Se o pagamento não foi confirmado, podemos voltar
    if (!isPaid) {
      router.push('/cart');
    }
  };
  
  // Renderização da página
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200">
      {/* Barra de progresso */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-dark-300 h-1">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary-light"
          style={{ width: '100%' }}
        />
      </div>
      
      <div className="container mx-auto max-w-6xl px-4 py-12">
        {/* Cabeçalho */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Finalizar Compra
          </h1>
          
          <div className="flex items-center justify-center space-x-8 mt-6">
            <div className="flex flex-col items-center text-primary">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-primary text-white">1</div>
              <span className="text-sm font-medium">Carrinho</span>
            </div>
            
            <div className="w-16 h-px bg-gray-700 mt-[-14px]"></div>
            
            <div className="flex flex-col items-center text-primary">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-primary text-white">2</div>
              <span className="text-sm font-medium">Dados</span>
            </div>
            
            <div className="w-16 h-px bg-gray-700 mt-[-14px]"></div>
            
            <div className="flex flex-col items-center text-primary">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-primary text-white">3</div>
              <span className="text-sm font-medium">Pagamento</span>
            </div>
          </div>
        </div>
        
        {/* Voltar */}
        {!isPaid && (
          <div className="mb-6">
            <button
              onClick={backToCart}
              className="flex items-center text-gray-300 hover:text-white transition-colors"
            >
              <IconFiChevronLeft className="mr-1" />
              <span>Voltar ao carrinho</span>
            </button>
          </div>
        )}
        
        {/* Conteúdo principal */}
        <div className="bg-dark-200 border border-dark-300 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-dark-300">
            <h2 className="text-xl font-bold text-white">
              {isPaid ? "Pagamento Confirmado" : "Pagamento via PIX"}
            </h2>
          </div>
          
          <div className="p-6">
            {isPaid ? (
              <div className="animate-fadeIn">
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-900/40 via-green-800/30 to-green-900/40 border border-green-500/50 p-8 mb-4 text-center shadow-lg shadow-green-900/20">
                  {/* Círculos decorativos animados */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-green-500/10 animate-pulse-slow"></div>
                  <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-green-500/10 animate-pulse-slow delay-700"></div>
                  
                  <div className="relative">
                    {/* Animação do ícone de check */}
                    <div className="mx-auto h-20 w-20 rounded-full bg-green-500/20 flex items-center justify-center mb-6 transform transition-all duration-1000 animate-scale-check">
                      <IconFiCheck className="text-green-400 h-10 w-10 animate-fade-check" />
                    </div>
                    
                    <h3 className="text-white font-bold text-2xl mb-3 animate-fade-up">Pagamento Confirmado!</h3>
                    
                    <p className="text-gray-300 mb-6 animate-fade-up delay-200">
                      Seus produtos foram liberados com sucesso
                    </p>
                    
                    <div className="bg-green-500/10 p-4 rounded-lg mb-6 text-center animate-fade-up delay-300">
                      <p className="text-white font-medium mb-1">
                        Você será redirecionado em instantes...
                      </p>
                      <div className="w-full bg-gray-700 h-1 rounded-full overflow-hidden mt-3">
                        <div className="bg-green-400 h-full animate-progress-bar"></div>
                      </div>
                    </div>
                    
                    <div className="mt-6 animate-fade-up delay-400">
                      <Link href="/dashboard/products">
                        <button
                          className="py-3 px-6 bg-green-600 hover:bg-green-700 transition-colors duration-300 text-white font-medium rounded-lg shadow-lg shadow-green-900/30 w-full flex items-center justify-center"
                        >
                          <span className="mr-2">Acessar Meus Produtos</span>
                          <IconFiArrowRight size={16} />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lado esquerdo: QR Code e Código PIX */}
                <div className="bg-dark-300/50 rounded-xl p-5">
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <p className="text-gray-300 text-center mb-4">
                        Escaneie o QR code com o aplicativo do seu banco para realizar o pagamento
                      </p>
                      
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-white p-4 rounded-lg flex items-center justify-center mb-2">
                          {paymentData?.qrCodeBase64 ? (
                            // Usar uma tag img direta para o QR code base64
                            <img 
                              src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                              alt="QR Code para pagamento PIX"
                              width={220}
                              height={220}
                              className="max-w-full h-auto"
                            />
                          ) : paymentData?.qrCodeUrl ? (
                            // Usar uma tag img direta para a URL do QR code
                            <img
                              src={paymentData.qrCodeUrl}
                              alt="QR Code para pagamento PIX"
                              width={220}
                              height={220}
                              className="max-w-full h-auto"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-56 w-56 bg-gray-100 rounded-lg">
                              <p className="text-gray-500 text-center px-4">
                                QR Code não disponível. Por favor, use o código PIX abaixo.
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className={`flex items-center justify-center text-sm font-medium py-2 px-4 rounded-full my-2 w-full ${
                          isExpired
                            ? 'text-red-400 bg-red-500/10 animate-pulse' 
                            : timeLeft && timeLeft.includes(':') && timeLeft.startsWith('00:') && parseInt(timeLeft.split(':')[1]) < 30 
                              ? 'text-red-400 bg-red-500/10 animate-pulse' 
                              : 'text-yellow-400 bg-yellow-500/10'
                        }`}>
                          <span className="mr-2">
                            {isExpired ? <IconFiAlertCircle size={16} /> : <IconFiClock size={16} />}
                          </span>
                          <span>
                            {isExpired 
                              ? "Pagamento expirado" 
                              : `Expira em ${timeLeft || '--:--'}`}
                          </span>
                        </div>
                        
                        <div className="w-full mt-2">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-300">
                              Ou copie o código PIX:
                            </p>
                            <div className="text-xs text-gray-400">
                              Recebedor: <span className="text-white">Mercado Pago LTDA</span>
                            </div>
                          </div>
                          <div className="flex bg-dark-300 rounded-md border border-gray-600 overflow-hidden">
                            <div className="flex-1 p-2 text-sm text-gray-200 font-mono overflow-hidden overflow-ellipsis whitespace-nowrap">
                              {paymentData?.pixCopiaECola || 'Código não disponível'}
                            </div>
                            <button
                              onClick={copyToClipboard}
                              className="bg-primary px-3 text-white flex items-center justify-center"
                              disabled={copied || !paymentData?.pixCopiaECola}
                            >
                              {copied ? <IconFiCheck size={16} /> : <IconFiCopy size={16} />}
                            </button>
                          </div>
                          {copied && (
                            <p className="text-green-400 text-xs mt-1">Código copiado para a área de transferência!</p>
                          )}
                          {!paymentData?.pixCopiaECola && (
                            <p className="text-red-400 text-xs mt-1">Código PIX não disponível. Tente escanear o QR Code.</p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-auto pt-4">
                      <div className="py-3 border-t border-dark-300 flex justify-between items-center">
                        <div className="text-sm text-gray-300">
                          <span className="text-gray-400">Status:</span>{" "}
                          {checkingStatus ? (
                            <span className="text-yellow-400">Verificando...</span>
                          ) : isExpired ? (
                            <span className="text-red-400">Pagamento expirado</span>
                          ) : (
                            <span>Aguardando pagamento</span>
                          )}
                        </div>
                        <button
                          onClick={verifyPaymentManually}
                          disabled={checkingStatus || isExpired}
                          className={`text-sm py-1 px-3 rounded-md flex items-center ${
                            checkingStatus || isExpired
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary-dark'
                          }`}
                        >
                          <span className={`mr-1 ${checkingStatus ? 'animate-spin' : ''}`}>
                            <IconFiRefreshCw size={14} />
                          </span>
                          <span>Verificar</span>
                        </button>
                      </div>
                      {lastVerificationTime && (
                        <p className="text-xs text-gray-400 mt-1">
                          Última verificação: {lastVerificationTime}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Lado direito: Instruções e Informações */}
                <div className="rounded-xl">
                  <div className="bg-dark-300/50 rounded-xl p-5 mb-4">
                    <h3 className="font-medium text-white mb-3 flex items-center">
                      <span className="mr-2"><IconFiInfo size={16} /></span>
                      <span>Instruções para Pagamento PIX</span>
                    </h3>
                    <ol className="list-decimal pl-5 space-y-3 text-gray-300">
                      <li>Abra o aplicativo do seu banco</li>
                      <li>Selecione a opção para pagamento via PIX</li>
                      <li>Escaneie o QR Code ou copie e cole o código PIX</li>
                      <li>Confira as informações e confirme o pagamento</li>
                      <li>Aguarde a confirmação (geralmente é instantânea)</li>
                    </ol>
                    <div className="mt-4 px-3 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
                      <p className="text-yellow-400 text-sm flex items-start">
                        <span className="mr-2 mt-1 flex-shrink-0"><IconFiAlertTriangle size={14} /></span>
                        <span>
                          O pagamento é processado pelo Mercado Pago. Após a confirmação, seus produtos serão liberados automaticamente.
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-dark-300/50 rounded-xl p-5">
                    <h3 className="font-medium text-white mb-4 flex items-center">
                      <span className="mr-2"><IconFiShield size={16} /></span>
                      <span>Resumo da Compra</span>
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-dark-300 pb-2">
                        <span className="text-gray-300">Número do Pedido:</span>
                        <span className="text-white font-mono">{createdOrderId || paymentData?.orderId || 'N/A'}</span>
                      </div>
                      {paymentData?.total && (
                        <div className="flex justify-between border-b border-dark-300 pb-2">
                          <span className="text-gray-300">Valor:</span>
                          <span className="text-white font-bold">R$ {paymentData.total.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-b border-dark-300 pb-2">
                        <span className="text-gray-300">Método:</span>
                        <span className="text-white">PIX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Status:</span>
                        <span className={`${
                          isPaid ? 'text-green-500' : isExpired ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {isPaid ? 'Aprovado' : isExpired ? 'Expirado' : 'Aguardando Pagamento'}
                        </span>
                      </div>
                    </div>
                    <div className="mt-6">
                      <div className="flex items-center text-gray-400 text-sm mb-2">
                        <span className="mr-2"><IconFiLock size={16} color="#10b981" /></span>
                        <span>Pagamento 100% seguro</span>
                      </div>
                      <div className="flex items-center text-gray-400 text-sm mb-2">
                        <span className="mr-2"><IconFiShield size={16} color="#10b981" /></span>
                        <span>Seus dados estão protegidos</span>
                      </div>
                      <div className="flex items-center text-gray-400 text-sm">
                        <span className="mr-2"><IconFiAlertCircle size={16} color="#10b981" /></span>
                        <span>Suporte 24/7</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 