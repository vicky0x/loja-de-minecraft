'use client';

import { useState, useEffect, useRef } from 'react';
import { Fragment } from 'react';
import { FiCopy, FiCheck, FiClock, FiAlertCircle, FiX, FiRefreshCw, FiHelpCircle, FiAlertTriangle, FiArrowRight, FiShield, FiInfo } from 'react-icons/fi';
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
const IconFiArrowRight = (props: IconProps) => <FiArrowRight {...props} />;
const IconFiShield = (props: IconProps) => <FiShield {...props} />;
const IconFiInfo = (props: IconProps) => <FiInfo {...props} />;

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
  const [isExpired, setIsExpired] = useState(false);
  const [lastVerificationTime, setLastVerificationTime] = useState<string | null>(null);
  
  // Referência para o timer de verificação de status
  const statusCheckRef = useRef<NodeJS.Timeout | undefined>(undefined);
  
  // Referência para controlar se o componente está montado
  const isMounted = useRef(false);
  
  // Referência para controlar verificações ativas
  const activeCheckRef = useRef(true);
  
  // Referência para o último tempo de verificação
  const lastCheckTimeRef = useRef(Date.now());
  
  // Referência para manter o intervalo atual entre verificações
  const checkIntervalRef = useRef(5000);
  
  // Referência para o contador de verificações
  const checkCountRef = useRef(0);
  
  // Referência para a função checkPaymentStatus para evitar recriações
  const checkPaymentStatusRef = useRef<() => Promise<void>>();

  // Referência para controlar a estratégia de verificação
  const verificationStrategyRef = useRef<'normal' | 'aggressive' | 'recovery'>('normal');
  
  // Referência para armazenar os erros consecutivos
  const consecutiveErrorsRef = useRef(0);
  
  // Referência para estratégia de fallback
  const fallbackModeRef = useRef(false);
  
  // Referência para websocket de verificação em tempo real
  const wsRef = useRef<WebSocket | null>(null);
  
  // Contador de verificações bem-sucedidas
  const successfulChecksRef = useRef(0);
  
  // Última resposta HTTP recebida
  const lastResponseRef = useRef<{ status: number; data: any } | null>(null);
  
  // Estado para mostrar um feedback visual mais claro sobre a verificação
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'checking' | 'success' | 'error' | 'waiting'>('idle');
  
  // Contador de verificações totais
  const totalChecksRef = useRef(0);
  
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
  
  // Efeito para marcar o componente como montado
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Efeito para calcular o tempo restante para expiração do pagamento
  useEffect(() => {
    if (!isOpen || !paymentData?.expiresAt) return;
    
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
          toast.warning(`Atenção! Pagamento expira em ${seconds} segundos.`);
        }
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
  }, [isOpen, paymentData?.expiresAt, isExpired]);
  
  // Efeito para lidar com mudanças de visibilidade da página
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted.current) {
        // Apenas garantimos que o estado de verificação seja resetado
        setCheckingStatus(false);
        
        // Verificar se precisamos forçar alguma atualização 
        if (checkingStatus) {
          setCheckingStatus(false);
        }
        
        // Verificar se o modal ainda está aberto e se os dados ainda são válidos
        if (isOpen && paymentData?.orderId) {
          console.log('Documento voltou a ser visível, modal ainda aberto');
        }
      }
    };
    
    // Adicionar evento para quando o navegador restaura a página do histórico
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted && isMounted.current) {
        // Evitar estados de UI travados
        console.log('Página PIX restaurada do cache');
        setCheckingStatus(false);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isOpen, paymentData?.orderId, checkingStatus]);
  
  // Função para iniciar uma conexão WebSocket para verificação em tempo real
  const setupRealtimeVerification = () => {
    if (!paymentData?.orderId || !isOpen || isPaid || isExpired) return;
    
    try {
      // Verificar se o browser suporta WebSocket
      if ('WebSocket' in window) {
        // Fechar conexão anterior se existir
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
          try {
            wsRef.current.close();
          } catch (closeError) {
            console.error('Erro ao fechar WebSocket existente:', closeError);
          }
        }
        
        // Verificar primeiro se a API de realtime está disponível para evitar erro
        fetch('/api/payment/check-realtime-available')
          .then(response => {
            if (!response.ok) {
              // Se o endpoint não existir, usar fallback para HTTP polling
              console.log('API de realtime não disponível, usando HTTP polling');
              fallbackModeRef.current = true;
              return;
            }
            
            // Tentar criar uma conexão WebSocket apenas se a API estiver disponível
            try {
              // Criar nova conexão segura com SSL (wss://)
              const wsUrl = process.env.NODE_ENV === 'production'
                ? `wss://${window.location.host}/api/payment/realtime-check`
                : `ws://${window.location.host}/api/payment/realtime-check`;
                
              const ws = new WebSocket(wsUrl);
              wsRef.current = ws;
              
              // Configurar listeners com tratamento de erros
              ws.onopen = () => {
                console.log('Conexão WebSocket estabelecida para verificação em tempo real');
                // Enviar dados do pedido para iniciar monitoramento
                if (ws.readyState === WebSocket.OPEN) {
                  try {
                    ws.send(JSON.stringify({
                      type: 'subscribe',
                      orderId: paymentData.orderId,
                      paymentId: paymentData.paymentId || ''
                    }));
                  } catch (sendError) {
                    console.error('Erro ao enviar dados para WebSocket:', sendError);
                    fallbackModeRef.current = true;
                  }
                }
              };
              
              ws.onmessage = (event) => {
                try {
                  const data = JSON.parse(event.data);
                  console.log('Dados recebidos via WebSocket:', data);
                  
                  if (data.type === 'payment_status') {
                    if (data.isPaid) {
                      console.log('Pagamento confirmado via WebSocket!');
                      handlePaymentConfirmed();
                    } else if (data.isExpired) {
                      setIsExpired(true);
                      if (ws.readyState === WebSocket.OPEN) {
                        try {
                          ws.close();
                        } catch (closeError) {
                          console.error('Erro ao fechar WebSocket após expiração:', closeError);
                        }
                      }
                    }
                  } else if (data.type === 'ping') {
                    // Manter conexão ativa
                    if (ws.readyState === WebSocket.OPEN) {
                      try {
                        ws.send(JSON.stringify({ type: 'pong' }));
                      } catch (pongError) {
                        console.error('Erro ao enviar pong:', pongError);
                      }
                    }
                  } else if (data.type === 'error') {
                    console.error('Erro na verificação via WebSocket:', data.message);
                    // Trocar para polling em caso de erro
                    fallbackModeRef.current = true;
                  }
                } catch (error) {
                  console.error('Erro ao processar mensagem do WebSocket:', error);
                  fallbackModeRef.current = true;
                }
              };
              
              ws.onerror = (event) => {
                // Tratar o evento de erro de forma segura sem acessar propriedades que podem não existir
                console.error('Erro no WebSocket - usando fallback para HTTP polling');
                fallbackModeRef.current = true;
                
                // Fechar conexão com problema
                try {
                  if (ws.readyState !== WebSocket.CLOSED) {
                    ws.close();
                  }
                } catch (closeError) {
                  console.error('Erro ao fechar WebSocket com erro:', closeError);
                }
                
                // Forçar verificação via HTTP imediatamente
                if (isMounted.current && activeCheckRef.current && checkPaymentStatusRef.current) {
                  setTimeout(() => {
                    checkPaymentStatusRef.current && checkPaymentStatusRef.current();
                  }, 100);
                }
              };
              
              ws.onclose = (event) => {
                console.log('Conexão WebSocket fechada', event.code, event.reason);
                wsRef.current = null;
                
                // Tentar reconectar em caso de falha temporária
                if (isMounted.current && isOpen && !isPaid && !isExpired && activeCheckRef.current) {
                  setTimeout(() => {
                    if (isMounted.current && isOpen && !isPaid && !isExpired && activeCheckRef.current) {
                      // Verificar novamente se o componente ainda está ativo antes de reconectar
                      try {
                        setupRealtimeVerification();
                      } catch (reconnectError) {
                        console.error('Erro ao tentar reconectar WebSocket:', reconnectError);
                        fallbackModeRef.current = true;
                      }
                    }
                  }, 5000);
                }
              };
              
              return ws;
            } catch (wsError) {
              console.error('Erro ao configurar WebSocket:', wsError);
              fallbackModeRef.current = true;
              return null;
            }
          })
          .catch(checkError => {
            console.error('Erro ao verificar disponibilidade de API realtime:', checkError);
            fallbackModeRef.current = true;
            return null;
          });
      } else {
        console.log('WebSocket não suportado pelo navegador, usando HTTP polling');
        fallbackModeRef.current = true;
      }
    } catch (outerError) {
      console.error('Erro ao configurar WebSocket (erro externo):', outerError);
      fallbackModeRef.current = true;
    }
    
    return null;
  };
  
  // Efeito para configurar websocket de verificação em tempo real
  useEffect(() => {
    if (!isOpen || isPaid || isExpired) return;
    
    let ws = null;
    
    // Usar um timeout para iniciar a conexão apenas depois que o componente estiver totalmente montado
    const connectionTimeout = setTimeout(() => {
      if (isMounted.current && isOpen && !isPaid && !isExpired) {
        try {
          // Verificar se o endpoint existe antes
          fetch('/api/payment/check-status')
            .then(() => {
              // Apenas iniciar o WebSocket se a verificação básica funcionar
              if (isMounted.current && isOpen && !isPaid && !isExpired) {
                ws = setupRealtimeVerification();
              }
            })
            .catch(error => {
              console.error('Erro na verificação de API, usando apenas HTTP polling:', error);
              fallbackModeRef.current = true;
            });
        } catch (error) {
          console.error('Erro ao configurar verificação em tempo real:', error);
          fallbackModeRef.current = true;
        }
      }
    }, 1000);
    
    return () => {
      clearTimeout(connectionTimeout);
      
      // Fechar conexão no cleanup
      if (ws) {
        try {
          if (ws.readyState !== WebSocket.CLOSED) {
            ws.close();
          }
        } catch (error) {
          console.error('Erro ao fechar WebSocket durante limpeza:', error);
        }
      }
      
      // Também fechar qualquer conexão na referência
      if (wsRef.current) {
        try {
          if (wsRef.current.readyState !== WebSocket.CLOSED) {
            wsRef.current.close();
          }
        } catch (error) {
          console.error('Erro ao fechar WebSocket na referência durante limpeza:', error);
        }
        wsRef.current = null;
      }
    };
  }, [isOpen, isPaid, isExpired, paymentData?.orderId]);
  
  // Função unificada para confirmar pagamento
  const handlePaymentConfirmed = () => {
    if (isMounted.current && activeCheckRef.current && !isPaid) {
      console.log('Confirmando pagamento e atualizando estado...');
      setIsPaid(true);
      setVerificationStatus('success');
      
      // Cancelar todas as verificações pendentes
      activeCheckRef.current = false;
      
      // Fechar WebSocket se estiver aberto
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      
      // Atualizar localStorage
      if (paymentData) {
        try {
          const updatedPaymentData = { ...paymentData, isPaid: true };
          localStorage.setItem('pixPaymentData', JSON.stringify(updatedPaymentData));
        } catch (error) {
          console.error('Erro ao atualizar dados de pagamento no localStorage:', error);
        }
      }
      
      // Notificar componente pai
      if (onPaymentConfirmed) {
        onPaymentConfirmed();
      }
      
      // Limpar carrinho
      if (clearCart) {
        clearCart();
      }
      
      // Mostrar notificação
      toast.success('Pagamento confirmado com sucesso!');
    }
  };
  
  // Efeito para redirecionar quando o pagamento for confirmado
  useEffect(() => {
    // Se o pagamento foi confirmado, redirecionar imediatamente
    if (isPaid) {
      console.log('Pagamento confirmado, redirecionando imediatamente...');
      
      // Redirecionar para a página de produtos do dashboard
      window.location.href = '/dashboard/products';
    }
  }, [isPaid]);
  
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
        
        // Atualizar o estado do objeto paymentData para refletir que o pagamento foi confirmado
        if (paymentData) {
          const updatedPaymentData = { ...paymentData, isPaid: true };
          // Atualizar o localStorage para manter este estado
          try {
            localStorage.setItem('pixPaymentData', JSON.stringify(updatedPaymentData));
          } catch (error) {
            console.error('Erro ao atualizar dados de pagamento no localStorage:', error);
          }
        }
        
        // Notificar o componente pai que o pagamento foi confirmado
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
        
        // Limpar o carrinho
        if (clearCart) {
          clearCart();
        }
      } else if (data.isExpired) {
        // Se o pagamento expirou
        console.log('Pagamento expirado! Atualizando estado...');
        setIsExpired(true);
        toast.error('O pagamento expirou. Você precisa gerar um novo código PIX.');
      } else {
        // Só mostrar essa mensagem se o pagamento ainda não estiver confirmado
        if (!isPaid) {
          console.log('Pagamento ainda não confirmado, status:', data.paymentStatus || 'pendente');
          toast.error('Pagamento ainda pendente. Tente novamente em alguns instantes.');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      setError(error instanceof Error ? error.message : 'Erro ao verificar status do pagamento');
    } finally {
      setCheckingStatus(false);
    }
  };
  
  // Logo após a definição das referências (isMounted, statusCheckRef)
  // Adicionar um efeito para verificação periódica de estados travados
  useEffect(() => {
    if (!isOpen) return;
    
    // Verificar se há algum estado bloqueante
    let blockingStateTimer: NodeJS.Timeout;
    
    const checkBlockingState = () => {
      if (!isMounted.current) return;
      
      // Se o status de verificação estiver travado por mais de 15 segundos, resetar
      if (checkingStatus) {
        console.log('Verificando possível estado de verificação travado...');
        setCheckingStatus(false);
      }
    };
    
    blockingStateTimer = setInterval(checkBlockingState, 15000);
    
    return () => {
      clearInterval(blockingStateTimer);
    };
  }, [isOpen, checkingStatus]);

  // Adicionar um efeito para corrigir o z-index do modal se necessário
  useEffect(() => {
    // Verificar se há algum problema de z-index ou posicionamento absoluto
    const fixZIndexIfNeeded = () => {
      if (!isMounted.current || !isOpen) return;
      
      // Tentar verificar se há cliques sendo interceptados incorretamente
      try {
        const modalElements = document.querySelectorAll('.fixed.inset-0');
        
        if (modalElements.length > 1) {
          console.log('Múltiplos elementos fixed.inset-0 detectados, verificando sobreposição...');
          
          // Verificar quais elementos podem estar na frente, mas invisíveis
          modalElements.forEach((element) => {
            const el = element as HTMLElement;
            const computed = window.getComputedStyle(el);
            
            if (computed.opacity === '0' && computed.zIndex !== '-1') {
              console.log('Elemento invisível com z-index alto detectado, ajustando...');
              el.style.zIndex = '-1';
            }
          });
        }
      } catch (error) {
        console.error('Erro ao tentar corrigir problemas de z-index:', error);
      }
    };
    
    // Executar uma vez na montagem
    fixZIndexIfNeeded();
    
    // E também quando o estado de visibilidade da página mudar
    const handleVisChange = () => {
      if (document.visibilityState === 'visible') {
        fixZIndexIfNeeded();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisChange);
    };
  }, [isOpen]);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
      onClick={(e) => {
        // Se o clique foi no overlay (não em um elemento filho)
        if (e.target === e.currentTarget && !isPaid) {
          // Fechar o modal apenas se o pagamento não estiver confirmado
          onClose();
        }
      }}
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md" onClick={(e) => e.stopPropagation()}></div>
      
      <div className={`relative z-10 w-full max-w-4xl transform overflow-hidden rounded-xl bg-dark-200 p-5 text-left align-middle shadow-2xl transition-all duration-500 ${isPaid ? 'scale-105' : 'scale-100'}`} onClick={(e) => e.stopPropagation()}>
        {!isPaid && (
          <div className="absolute right-4 top-4 transition-opacity">
            <button
              type="button"
              className="text-gray-400 hover:text-gray-300 focus:outline-none"
              onClick={onClose}
            >
              <IconFiX className="h-5 w-5" />
            </button>
          </div>
        )}

        <h3 className={`text-xl font-medium leading-6 text-white text-center mb-6 transition-all duration-300 ${isPaid ? 'opacity-0 h-0 mb-0' : ''}`}>
          {isPaid ? "" : "Pagamento via PIX"}
        </h3>

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
                  <button
                    onClick={() => window.location.href = '/dashboard/products'}
                    className="py-3 px-6 bg-green-600 hover:bg-green-700 transition-colors duration-300 text-white font-medium rounded-lg shadow-lg shadow-green-900/30 w-full flex items-center justify-center"
                  >
                    <span className="mr-2">Acessar Meus Produtos</span>
                    <IconFiArrowRight size={16} />
                  </button>
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
                        <span className="text-yellow-400">Aguardando pagamento</span>
                      )}
                    </div>
                    {lastVerificationTime && !isPaid && !isExpired && (
                      <div className="text-xs text-gray-400">
                        Última verificação: {new Date(lastVerificationTime).toLocaleTimeString()}
                      </div>
                    )}
                  </div>

                  {!isPaid && !isExpired && (
                    <div className="mt-2 p-3 bg-blue-900/20 border-l-4 border-blue-500 text-gray-300 text-sm rounded">
                      <div className="flex items-start">
                        <span className="mr-2 mt-0.5 flex-shrink-0">
                          <IconFiHelpCircle size={16} className="text-blue-400" />
                        </span>
                        <div>
                          <p className="font-medium text-blue-300 mb-1">Verificação automática ativa</p>
                          <p className="text-gray-300">
                            Seu pagamento está sendo verificado automaticamente a cada poucos segundos.
                          </p>
                          <div className="mt-2 flex items-center text-blue-300">
                            {verificationStatus === 'checking' ? (
                              <>
                                <div className="h-2 w-2 bg-blue-400 rounded-full animate-ping mr-1.5"></div>
                                <span>Verificando pagamento...</span>
                              </>
                            ) : verificationStatus === 'waiting' ? (
                              <>
                                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse mr-1.5"></div>
                                <span>Pagamento detectado, aguardando confirmação...</span>
                              </>
                            ) : verificationStatus === 'error' ? (
                              <>
                                <div className="h-2 w-2 bg-red-400 rounded-full mr-1.5"></div>
                                <span>Ocorreu um erro, tentando novamente...</span>
                              </>
                            ) : (
                              <>
                                <div className="h-1 w-1 bg-blue-400 rounded-full animate-ping mr-1.5"></div>
                                <span>Aguardando confirmação do banco...</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="mt-2 p-2 bg-red-900/30 border-l-4 border-red-500 text-red-400 text-sm flex items-start">
                      <span className="mr-1 mt-0.5 flex-shrink-0"><IconFiAlertCircle size={16} /></span>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="mt-3">
                    {isPaid ? (
                      <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 flex items-start">
                        <span className="mr-2 mt-0.5 flex-shrink-0"><IconFiCheck size={16} /></span>
                        <div>
                          <p className="font-medium">Pagamento confirmado!</p>
                          <p className="text-sm mt-1">Você será redirecionado em breve...</p>
                        </div>
                      </div>
                    ) : isExpired ? (
                      <div className="mb-4">
                        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start mb-4">
                          <span className="mr-2 mt-0.5 flex-shrink-0"><IconFiAlertCircle size={16} /></span>
                          <div>
                            <p className="font-medium">Tempo para pagamento expirado</p>
                            <p className="text-sm mt-1">Por favor, crie um novo pedido para continuar com a compra.</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={onClose}
                          className="w-full py-3 px-4 rounded-md bg-dark-400 hover:bg-dark-500 focus:outline-none focus:ring-2 focus:ring-dark-300 text-white font-medium flex items-center justify-center"
                        >
                          <span className="mr-2"><IconFiX size={18} /></span>
                          <span>Cancelar</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={verifyPaymentManually}
                        disabled={checkingStatus}
                        className={`w-full py-3 px-4 rounded-md ${
                          checkingStatus
                            ? 'bg-dark-500 cursor-not-allowed'
                            : 'bg-dark-300 hover:bg-dark-400 focus:outline-none focus:ring-2 focus:ring-primary'
                        } text-gray-300 text-sm font-medium flex items-center justify-center transition-colors`}
                      >
                        {checkingStatus ? (
                          <>
                            <span className="mr-2">
                              <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white inline-block"></span>
                            </span>
                            <span>Verificando pagamento...</span>
                          </>
                        ) : (
                          <>
                            <span className="mr-2"><IconFiRefreshCw size={16} /></span>
                            <span>Verificar manualmente (se necessário)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lado direito: Tutorial e Garantias */}
            <div className="bg-dark-300/30 rounded-xl p-5">
              <div className="flex flex-col h-full">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <IconFiShield className="mr-2 text-primary" size={18} />
                    Compra 100% Segura
                  </h4>
                  
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-900/20 to-green-800/10 border border-green-800/30 p-4 mb-5 transform transition-all duration-300 hover:shadow-green-900/20">
                    <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-green-500/5"></div>
                    <div className="relative flex items-start">
                      <div className="mr-3 mt-0.5 bg-green-500/10 p-2 rounded-full flex-shrink-0">
                        <IconFiCheck size={16} color="#10b981" className="animate-pulse" />
                      </div>
                      <div>
                        <p className="text-green-400 font-medium mb-1">Garantia de Entrega Imediata</p>
                        <p className="text-gray-400 text-sm">
                          Seu produto será liberado automaticamente assim que seu pagamento for confirmado.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <IconFiInfo size={16} className="mr-2 text-primary" />
                    Como Pagar com PIX
                  </h4>
                  
                  <div className="bg-dark-400/50 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">
                        1
                      </div>
                      <div>
                        <p className="text-white mb-1 text-sm font-medium">Abra o aplicativo do seu banco</p>
                        <p className="text-gray-400 text-xs">Acesse o app do seu banco ou instituição financeira de preferência.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark-400/50 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">
                        2
                      </div>
                      <div>
                        <p className="text-white mb-1 text-sm font-medium">Escolha a opção PIX</p>
                        <p className="text-gray-400 text-xs">Busque pela função PIX ou pagamentos no menu do aplicativo.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark-400/50 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">
                        3
                      </div>
                      <div>
                        <p className="text-white mb-1 text-sm font-medium">Escaneie o QR code ou cole o código</p>
                        <p className="text-gray-400 text-xs">Use a câmera para ler o QR code ou copie e cole o código PIX.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-dark-400/50 rounded-lg p-4">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center mr-3">
                        4
                      </div>
                      <div>
                        <p className="text-white mb-1 text-sm font-medium">Confirme o pagamento</p>
                        <p className="text-gray-400 text-xs">Verifique os dados e confirme a transação com sua senha ou biometria.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-auto pt-4">
                  <button 
                    type="button"
                    className="w-full py-4 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 text-white font-semibold rounded-lg shadow-lg shadow-green-900/30 flex items-center justify-center group mt-4"
                    onClick={() => {
                      const buttonText = document.getElementById('safe-payment-text');
                      if (buttonText) {
                        buttonText.innerText = 'Aguarde a confirmação do PIX';
                        setTimeout(() => {
                          if (buttonText) buttonText.innerText = 'Compra 100% Segura e Garantida';
                        }, 3000);
                      }
                    }}
                  >
                    <IconFiCheck size={20} className="mr-2 group-hover:scale-110 transition-transform" />
                    <span id="safe-payment-text">Compra 100% Segura e Garantida</span>
                  </button>
                  
                  <p className="text-center text-xs text-gray-500 mt-3">
                    Seus dados estão protegidos por criptografia de ponta a ponta
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PixPaymentModal;