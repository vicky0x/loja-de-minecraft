'use client';

import { useState, useEffect, useRef } from 'react';
import { Fragment } from 'react';
import { FiCopy, FiCheck, FiClock, FiAlertCircle, FiX, FiRefreshCw, FiHelpCircle, FiAlertTriangle } from 'react-icons/fi';
import { IconBaseProps } from 'react-icons';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// Interface para os props do componente PixPaymentModal
interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    orderId: string;
    paymentId?: string;
    pixCopiaECola?: string;
    qrCodeBase64?: string;
    qrCodeUrl?: string;
    expiresAt?: string;
    total?: number;
  };
  onPaymentConfirmed?: () => void;
  clearCart?: () => void;
}

// Componente PixPaymentModal
function PixPaymentModal({
  isOpen,
  onClose,
  paymentData,
  onPaymentConfirmed,
  clearCart
}: PixPaymentModalProps) {
  // Estados do componente
  const [isPaid, setIsPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);
  
  // Referência para o timer de verificação de status
  const statusCheckRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
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
  
  // Efeito para calcular o tempo restante para expiração do pagamento
  useEffect(() => {
    if (!isOpen || !paymentData?.expiresAt) return;
    
    const calculateTimeLeft = () => {
      try {
        const expiresAt = new Date(paymentData.expiresAt || '');
        const now = new Date();
        
        // Se já expirou, mostrar 00:00
        if (expiresAt <= now) {
          setTimeLeft('00:00');
          return;
        }
        
        // Calcular a diferença em milissegundos
        const diff = expiresAt.getTime() - now.getTime();
        
        // Converter para minutos e segundos
        const minutes = Math.floor(diff / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        // Formatar como MM:SS
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } catch (error) {
        console.error('Erro ao calcular tempo restante:', error);
        setTimeLeft('--:--');
      }
    };
    
    // Calcular imediatamente
    calculateTimeLeft();
    
    // Atualizar a cada segundo
    const timer = setInterval(calculateTimeLeft, 1000);
    
    // Limpar o timer quando o componente for desmontado
    return () => clearInterval(timer);
  }, [isOpen, paymentData?.expiresAt]);
  
  // Efeito para configurar a verificação periódica do status do pagamento
  useEffect(() => {
    // Se o modal não estiver aberto ou o pagamento já foi confirmado, não configurar verificação
    if (!isOpen || isPaid) {
      return;
    }
    
    // Referência para o último tempo de verificação
    let lastCheckTime = Date.now();
    // Intervalo padrão entre verificações (em ms)
    let checkInterval = 20000; // 20 segundos
    
    // Função para verificar o status do pagamento
    const checkPaymentStatus = async () => {
      // Verificar se já passou tempo suficiente desde a última verificação
      const currentTime = Date.now();
      const timeSinceLastCheck = currentTime - lastCheckTime;
      
      if (timeSinceLastCheck < checkInterval) {
        console.log(`Verificação muito frequente. Aguardando mais ${Math.ceil((checkInterval - timeSinceLastCheck) / 1000)}s...`);
        return;
      }
      
      // Evitar múltiplas verificações simultâneas
      if (checkingStatus) {
        console.log('Verificação já em andamento, ignorando solicitação');
        return;
      }
      
      try {
        lastCheckTime = Date.now(); // Atualizar o tempo da última verificação
        setCheckingStatus(true);
        setError('');
        
        console.log('Verificando status do pagamento:', paymentData?.orderId);
        
        // Verificar se os dados necessários estão disponíveis
        if (!paymentData?.orderId) {
          console.error('ID do pedido não disponível para verificação');
          return;
        }
        
        const requestBody = {
          orderId: paymentData.orderId,
          paymentId: paymentData.paymentId || ''
        };
        
        const response = await fetch('/api/payment/check-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
        
        // Processar a resposta recebida
        const data = await response.json();
        console.log('Resposta da verificação de pagamento:', data);
        
        // Se a resposta indicar rate limiting, ajustar o intervalo
        if (response.status === 429 && data.waitTime) {
          const waitTimeMs = data.waitTime * 1000;
          console.log(`Rate limiting detectado. Próxima verificação em ${data.waitTime} segundos`);
          
          // Aumentar o intervalo de verificação para evitar mais rate limiting
          checkInterval = Math.max(checkInterval, waitTimeMs + 5000); // Adicionar 5 segundos extras
          
          // Mostrar mensagem ao usuário
          toast.error(`Verificações muito frequentes. Por favor, aguarde ${data.waitTime} segundos.`);
          
          // Não mostrar erro no modal
          setError('');
        }
        // Se a resposta não for bem-sucedida por outro motivo
        else if (!response.ok) {
          let errorMessage = 'Erro ao verificar status do pagamento';
          
          if (data.error) {
            errorMessage = data.error;
          }
          
          throw new Error(errorMessage);
        }
        // Se o pagamento foi confirmado
        else if (data.isPaid) {
          console.log('Pagamento confirmado! Atualizando estado...');
          setIsPaid(true);
          
          // Notificar o componente pai que o pagamento foi confirmado
          if (onPaymentConfirmed) {
            onPaymentConfirmed();
          }
          
          // Limpar o carrinho
          if (clearCart) {
            clearCart();
          }
          
          // Mostrar notificação de sucesso
          toast.success('Pagamento confirmado com sucesso!');
        } else {
          console.log('Pagamento ainda não confirmado, status:', data.paymentStatus || 'pendente');
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
        setError('Erro ao verificar status do pagamento. Tente novamente.');
      } finally {
        setCheckingStatus(false);
      }
    };
    
    // Verificar o status imediatamente
    checkPaymentStatus();
    
    // Configurar verificação periódica com o intervalo definido
    statusCheckRef.current = setInterval(checkPaymentStatus, checkInterval);
    
    // Limpar o timer quando o componente for desmontado
    return () => {
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
        statusCheckRef.current = undefined;
      }
    };
  }, [isOpen, isPaid, paymentData?.orderId, paymentData?.paymentId, onPaymentConfirmed, clearCart, checkingStatus, onClose]);
  
  // Efeito para redirecionar quando o pagamento for confirmado
  useEffect(() => {
    // Se o pagamento foi confirmado, mostrar a tela de sucesso e redirecionar
    if (isPaid) {
      console.log('Pagamento confirmado, configurando redirecionamento...');
      
      // Manter o modal aberto com a mensagem de sucesso por 5 segundos
      // e depois redirecionar para a página de produtos
      const timer = setTimeout(() => {
        console.log('Tempo expirado, redirecionando...');
        // Fechar o modal
        onClose();
        
        // Redirecionar para a página "meus produtos"
        window.location.href = '/profile/products';
      }, 5000);
      
      // Limpar o timer quando o componente for desmontado
      return () => {
        console.log('Limpando timer de redirecionamento');
        clearTimeout(timer);
      };
    }
  }, [isPaid, onClose]);
  
  // Exibir o código PIX na interface
  const renderPixCode = () => {
    if (!paymentData?.pixCopiaECola) {
      return (
        <div className="bg-gray-800 p-4 rounded-md text-center">
          <p className="text-yellow-400 mb-2">
            <IconFiAlertTriangle className="inline-block mr-1" />
            Código PIX não disponível
          </p>
          <p className="text-gray-300 text-sm">
            Por favor, utilize o QR code para realizar o pagamento.
          </p>
        </div>
      );
    }
    
    return (
      <div className="bg-gray-800 p-4 rounded-md">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-300 text-sm">Código PIX:</p>
          <button
            onClick={copyToClipboard}
            className="flex items-center text-blue-400 hover:text-blue-300 text-sm"
          >
            {copied ? (
              <>
                <IconFiCheck className="mr-1" size={14} />
                Copiado!
              </>
            ) : (
              <>
                <IconFiCopy className="mr-1" size={14} />
                Copiar código
              </>
            )}
          </button>
        </div>
        <div className="bg-gray-700 p-3 rounded-md mb-2 overflow-auto max-h-24">
          <p className="text-gray-200 text-sm font-mono break-all">
            {paymentData?.pixCopiaECola}
          </p>
        </div>
      </div>
    );
  };
  
  // Função para verificar o status do pagamento manualmente
  const verifyPaymentManually = async () => {
    // Evitar múltiplas verificações simultâneas
    if (checkingStatus) {
      console.log('Verificação já em andamento, ignorando solicitação');
      return;
    }
    
    try {
      setCheckingStatus(true);
      setError('');
      
      console.log('Verificando status do pagamento manualmente:', paymentData?.orderId);
      
      // Verificar se os dados necessários estão disponíveis
      if (!paymentData?.orderId) {
        console.error('ID do pedido não disponível para verificação manual');
        throw new Error('Dados do pedido incompletos para verificação');
      }
      
      const requestBody = {
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId || ''
      };
      
      console.log('Enviando requisição para verificação manual:', requestBody);
      
      const response = await fetch('/api/payment/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      // Se a resposta não for bem-sucedida
      if (!response.ok) {
        let errorMessage = 'Erro ao verificar status do pagamento';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || `Erro ${response.status}: ${response.statusText}`;
          console.error('Detalhes do erro recebidos:', errorData);
        } catch (parseError) {
          console.error('Erro ao processar resposta de erro:', parseError);
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Processar a resposta recebida
      let data;
      try {
        data = await response.json();
        console.log('Resposta da verificação manual de pagamento:', data);
      } catch (parseError) {
        console.error('Erro ao processar resposta JSON:', parseError);
        throw new Error('Erro ao processar resposta do servidor');
      }
      
      // Se o pagamento foi confirmado
      if (data.isPaid) {
        console.log('Pagamento confirmado manualmente! Atualizando estado...');
        setIsPaid(true);
        
        // Notificar o componente pai que o pagamento foi confirmado
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
        
        // Limpar o carrinho
        if (clearCart) {
          clearCart();
        }
      } else {
        console.log('Pagamento ainda não confirmado, status:', data.paymentStatus || 'pendente');
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      setError(error instanceof Error ? error.message : 'Erro ao verificar status do pagamento');
    } finally {
      setCheckingStatus(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75" onClick={(e) => e.stopPropagation()}></div>
      
      <div className="relative z-10 w-full max-w-md transform overflow-hidden rounded-lg bg-dark-200 p-6 text-left align-middle shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="absolute right-4 top-4">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-300 focus:outline-none"
            onClick={onClose}
          >
            <IconFiX className="h-5 w-5" />
          </button>
        </div>

        <h3 className="text-lg font-medium leading-6 text-white text-center mb-4">
          {isPaid ? "Pagamento Confirmado" : "Pagamento via PIX"}
        </h3>

        {isPaid ? (
          <div className="bg-green-900/30 border border-green-500 rounded-md p-6 mb-4 text-center">
            <IconFiCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-green-300 font-medium text-xl mb-2">Pagamento confirmado!</h3>
            <div className="bg-green-800/30 p-3 rounded-md mb-4">
              <p className="text-white font-medium">Seu pedido foi processado com sucesso!</p>
              <p className="text-gray-300 mt-2">
                Você será redirecionado para seus produtos em alguns segundos...
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-green-300 text-sm">
                <IconFiCheck className="inline-block mr-1" size={14} />
                Pagamento processado
              </p>
              <p className="text-green-300 text-sm">
                <IconFiCheck className="inline-block mr-1" size={14} />
                Pedido registrado
              </p>
              <p className="text-green-300 text-sm">
                <IconFiCheck className="inline-block mr-1" size={14} />
                Produtos liberados
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-green-800">
              <p className="text-gray-400 text-sm">
                Você pode acessar seus produtos a qualquer momento na página "Meus Produtos"
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-300 mb-2 text-center">
                Escaneie o QR code com o aplicativo do seu banco para realizar o pagamento
              </p>
              
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white p-4 rounded-lg flex items-center justify-center mb-2">
                  {paymentData?.qrCodeBase64 ? (
                    // Usar uma tag img direta para o QR code base64
                    <img 
                      src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                      alt="QR Code para pagamento PIX"
                      width={256}
                      height={256}
                      className="max-w-full h-auto"
                    />
                  ) : paymentData?.qrCodeUrl ? (
                    // Usar uma tag img direta para a URL do QR code
                    <img
                      src={paymentData.qrCodeUrl}
                      alt="QR Code para pagamento PIX"
                      width={256}
                      height={256}
                      className="max-w-full h-auto"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 w-64 bg-gray-100 rounded-lg">
                      <p className="text-gray-500 text-center px-4">
                        QR Code não disponível. Por favor, use o código PIX abaixo.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="w-full">
                  {/* Instruções passo a passo */}
                  {showInstructions && (
                    <div className="bg-dark-300 rounded-lg p-4 mb-4">
                      <h4 className="text-white font-medium mb-3 flex items-center">
                        <div className="mr-2"><IconFiAlertCircle size={18} color="#FF5722" /></div>
                        Como realizar o pagamento:
                      </h4>
                      <ol className="text-gray-300 text-sm space-y-2 ml-6 list-decimal">
                        <li>Abra o aplicativo do seu banco ou instituição financeira</li>
                        <li>Acesse a área de <strong className="text-white">PIX</strong> no aplicativo</li>
                        <li>Selecione a opção <strong className="text-white">Pagar com QR Code</strong></li>
                        <li>Escaneie o QR code acima ou use o código PIX abaixo</li>
                        <li>Confirme os dados do pagamento (valor e destinatário)</li>
                        <li>Confirme o pagamento com sua senha ou biometria</li>
                      </ol>
                    </div>
                  )}
                  
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
              
              <div className={`flex items-center justify-center text-sm font-medium py-2 px-4 rounded-full mt-4 ${
                timeLeft && timeLeft.includes(':') && timeLeft.startsWith('00:') && parseInt(timeLeft.split(':')[1]) < 30 
                  ? 'text-red-400 bg-red-500/10 animate-pulse' 
                  : 'text-yellow-400 bg-yellow-500/10'
              }`}>
                <div className="mr-2"><IconFiClock size={16} /></div>
                <span>Expira em {timeLeft || '--:--'}</span>
              </div>
            </div>

            {/* Mensagens de segurança e gatilhos mentais */}
            <div className="mb-4 bg-green-900/20 border border-green-800 rounded-lg p-3">
              <div className="flex items-start">
                <div className="mr-2 mt-0.5"><IconFiCheck size={16} color="#10b981" /></div>
                <div>
                  <p className="text-green-400 text-sm font-medium">Compra 100% segura</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Os dados do PIX estão corretos e seu produto será liberado imediatamente após a confirmação do pagamento.
                  </p>
                </div>
              </div>
            </div>

            <div className="py-3 border-t border-dark-300 flex justify-between items-center">
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">Status:</span>{" "}
                {checkingStatus ? (
                  <span className="text-yellow-400">Verificando...</span>
                ) : (
                  <span className="text-yellow-400">Aguardando pagamento</span>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-2 p-2 bg-red-900/30 border-l-4 border-red-500 text-red-400 text-sm flex items-start">
                <div className="mr-1 mt-0.5 flex-shrink-0"><IconFiAlertCircle size={16} /></div>
                <span>{error}</span>
              </div>
            )}

            <div className="mt-6">
              {isPaid ? (
                <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 flex items-start">
                  <div className="mr-2 mt-0.5 flex-shrink-0"><IconFiCheck size={16} /></div>
                  <div>
                    <p className="font-medium">Pagamento confirmado!</p>
                    <p className="text-sm mt-1">Você será redirecionado em breve...</p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={verifyPaymentManually}
                  disabled={checkingStatus}
                  className={`w-full py-3 px-4 rounded-md ${
                    checkingStatus
                      ? 'bg-dark-500 cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary'
                  } text-white font-medium flex items-center justify-center`}
                >
                  {checkingStatus ? (
                    <>
                      <div className="mr-2">
                        <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white inline-block"></span>
                      </div>
                      <span>Verificando pagamento...</span>
                    </>
                  ) : (
                    <>
                      <div className="mr-2"><IconFiRefreshCw size={18} /></div>
                      <span>Verificar pagamento agora</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className={`mt-4 mb-4 py-2 px-4 rounded-md ${
                showInstructions
                  ? 'bg-dark-500 text-gray-300'
                  : 'bg-dark-400 hover:bg-dark-500 text-gray-200'
              } font-medium flex items-center justify-center transition-colors`}
            >
              {showInstructions ? (
                <>
                  <div className="mr-2"><IconFiX size={16} /></div>
                  <span>Esconder instruções</span>
                </>
              ) : (
                <>
                  <div className="mr-2"><IconFiHelpCircle size={16} /></div>
                  <span>Como realizar o pagamento?</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PixPaymentModal;