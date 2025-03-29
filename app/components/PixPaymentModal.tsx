'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FiCopy, FiCheck, FiClock, FiAlertCircle, FiX, FiRefreshCw } from 'react-icons/fi';

// Importações do date-fns com try-catch
let formatDistanceToNow: any;
let ptBR: any;

try {
  const dateFns = require('date-fns');
  const dateFnsLocale = require('date-fns/locale');
  formatDistanceToNow = dateFns.formatDistanceToNow;
  ptBR = dateFnsLocale.ptBR;
} catch (error) {
  console.error('Erro ao importar date-fns:', error);
  // Implementação simples para caso o pacote não esteja disponível
  formatDistanceToNow = (date: Date) => {
    const diffMs = date.getTime() - new Date().getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins <= 0) return 'expirado';
    return `em ${diffMins} minutos`;
  };
  ptBR = {};
}

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: {
    qrCode: string;
    qrCodeBase64: string;
    copyPaste: string;
    expirationDate: string;
    paymentId: string;
    orderId: string;
  };
  onPaymentConfirmed?: () => void;
}

export default function PixPaymentModal({ 
  isOpen, 
  onClose, 
  paymentData,
  onPaymentConfirmed
}: PixPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const statusCheckRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Referência para controlar o abort controller das requisições
  const abortControllerRef = useRef<AbortController | null>(null);

  // Efeito para limpar requisições na desmontagem ou quando o modal for fechado
  useEffect(() => {
    if (!isOpen && isPaid) {
      // Limpar todos os recursos quando o modal for fechado após o pagamento
      clearResources();
    }
    
    return () => {
      // Limpar todos os recursos na desmontagem
      clearResources();
    };
    
    // Função auxiliar para limpar todos os recursos
    function clearResources() {
      // Cancelar qualquer requisição pendente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      
      // Limpar timers
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = undefined;
      }
      
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
        statusCheckRef.current = undefined;
      }
    }
  }, [isOpen, isPaid]);

  // Função para copiar o código PIX
  const copyToClipboard = () => {
    try {
      navigator.clipboard.writeText(paymentData.copyPaste);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar para a área de transferência:', err);
      // Alternativa para browsers que não suportam clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = paymentData.copyPaste;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (e) {
        console.error('Falha ao copiar texto:', e);
      }
      document.body.removeChild(textArea);
    }
  };

  // Atualizar o tempo restante
  useEffect(() => {
    // Limpar o timer anterior
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Função para atualizar o contador
    const updateTimeLeft = () => {
      try {
        const now = new Date();
        const expirationDate = new Date(paymentData.expirationDate);
        
        // Se a data de expiração já passou
        if (now > expirationDate) {
          setTimeLeft('Expirado');
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return;
        }
        
        // Atualizar o tempo restante em formato legível
        try {
          setTimeLeft(
            formatDistanceToNow(expirationDate, { 
              addSuffix: true, 
              locale: ptBR 
            })
          );
        } catch (error) {
          console.error('Erro ao formatar tempo restante:', error);
          // Fallback simples se o formatDistanceToNow falhar
          const diffMs = expirationDate.getTime() - now.getTime();
          const diffMins = Math.round(diffMs / 60000);
          setTimeLeft(`em aproximadamente ${diffMins} minutos`);
        }
      } catch (error) {
        console.error('Erro ao calcular tempo restante:', error);
        setTimeLeft('tempo indeterminado');
      }
    };
    
    // Atualizar imediatamente e configurar intervalo
    updateTimeLeft();
    timerRef.current = setInterval(updateTimeLeft, 30000); // Atualizar a cada 30 segundos
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [paymentData.expirationDate]);

  // Verificar periodicamente o status do pagamento
  useEffect(() => {
    if (!isOpen || isPaid) return;
    
    // Limpar o timer anterior
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = undefined;
    }
    
    // Flag global para evitar verificações simultâneas
    let isCheckingPaymentGlobally = false;
    
    // Função para verificar o status do pagamento
    const checkPaymentStatus = async () => {
      // Prevenir verificações simultâneas tanto de chamadas automáticas quanto manuais
      if (isCheckingPaymentGlobally || checkingStatus) {
        console.log('Verificação em andamento, ignorando nova solicitação');
        return;
      }
      
      // Cancelar qualquer requisição pendente anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Criar um novo controller para esta requisição
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;
      
      try {
        isCheckingPaymentGlobally = true;
        setCheckingStatus(true);
        setError('');
        
        console.log('Verificando status do pagamento:', paymentData.orderId);
        
        // Verificar se os dados necessários estão disponíveis
        if (!paymentData.orderId) {
          console.error('ID do pedido não disponível para verificação');
          throw new Error('Dados do pedido incompletos para verificação');
        }
        
        const requestBody = {
          orderId: paymentData.orderId,
          paymentId: paymentData.paymentId || ''
        };
        
        console.log('Enviando requisição para verificar status:', requestBody);
        
        const response = await fetch('/api/payment/check-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal // Associar o sinal do AbortController
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
          console.log('Resposta da verificação de pagamento:', data);
        } catch (parseError) {
          console.error('Erro ao processar resposta JSON:', parseError);
          throw new Error('Erro ao processar resposta do servidor');
        }
        
        // Verificar se estamos recebendo uma resposta de rate limiting
        if (data.message && data.message.includes('Verificação muito frequente')) {
          console.log('Rate limit atingido, próxima verificação será agendada adequadamente');
          
          // Se temos informação sobre o tempo de espera, vamos logar isso
          if (data.waitSeconds) {
            console.log(`Aguardando ${data.waitSeconds} segundos antes da próxima verificação permitida`);
          }
          
          // Não fazer nada, apenas aguardar a próxima verificação programada
          return;
        }
        
        // Se o pagamento foi confirmado
        if (data.isPaid) {
          console.log('Pagamento confirmado! Atualizando estado...');
          setIsPaid(true);
          
          // Limpar timer quando pago
          if (statusCheckRef.current) {
            clearInterval(statusCheckRef.current);
            statusCheckRef.current = undefined;
          }
          
          // Notificar o componente pai que o pagamento foi confirmado
          if (onPaymentConfirmed) {
            onPaymentConfirmed();
          }
          
          // Fechar o modal após 5 segundos
          setTimeout(() => {
            onClose();
            // Redirecionar para a página de produtos do usuário
            window.location.href = '/profile/orders';
          }, 5000);
        } else {
          console.log('Pagamento ainda não confirmado, status:', data.paymentStatus || 'pendente');
        }
      } catch (error) {
        // Verificar se o erro é devido ao cancelamento da requisição
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Requisição de verificação cancelada');
          return;
        }
        
        // Tratar erros específicos
        let errorMessage = 'Erro ao verificar pagamento';
        
        if (error instanceof Error) {
          console.error('Erro detalhado da verificação:', error);
          
          // Se for o erro específico "order.items is not iterable", exibir mensagem amigável
          if (error.message.includes('order.items is not iterable')) {
            errorMessage = 'Erro ao processar os itens do pedido. Aguarde um momento e tente novamente.';
            
            // Agendar uma nova verificação após 10 segundos
            setTimeout(() => {
              console.log('Tentando verificar novamente após erro de itens...');
              // Recarregar a página se o erro persistir
              window.location.reload();
            }, 10000);
          } else {
            errorMessage = error.message;
          }
        }
        
        setError(errorMessage);
        console.error('Erro ao verificar status do pagamento:', error);
      } finally {
        setCheckingStatus(false);
        isCheckingPaymentGlobally = false;
        // Limpar a referência do controller se não foi abortado
        if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          abortControllerRef.current = null;
        }
      }
    };
    
    // Iniciar a verificação após um delay inicial menor
    const initialCheckDelay = setTimeout(() => {
      checkPaymentStatus();
      
      // Configurar as verificações periódicas após a primeira, com intervalo menor
      statusCheckRef.current = setInterval(() => {
        // Verificar antes de chamar para garantir que não há uma verificação em andamento
        if (!isCheckingPaymentGlobally && !checkingStatus) {
          checkPaymentStatus();
        } else {
          console.log('Ignorando verificação programada, pois há uma verificação em andamento');
        }
      }, 15000); // Verificar a cada 15 segundos (reduzido de 45s)
    }, 5000); // Delay inicial de 5 segundos (reduzido de 10s)
    
    return () => {
      clearTimeout(initialCheckDelay);
      if (statusCheckRef.current) {
        clearInterval(statusCheckRef.current);
        statusCheckRef.current = undefined;
      }
    };
  }, [isOpen, paymentData.orderId, paymentData.paymentId, isPaid, onClose, onPaymentConfirmed, checkingStatus]);

  // Função para verificar manualmente o status do pagamento
  const verifyPaymentManually = async () => {
    // Evitar verificações simultâneas
    if (checkingStatus) {
      console.log('Verificação já em andamento, ignorando solicitação manual');
      return;
    }
    
    // Limpar o timer de verificação automática existente
    if (statusCheckRef.current) {
      clearInterval(statusCheckRef.current);
      statusCheckRef.current = undefined;
    }
    
    // Cancelar qualquer requisição pendente anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar um novo controller para esta requisição
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;
    
    try {
      setCheckingStatus(true);
      setError('');
      
      // Adicionar um pequeno delay para evitar cliques múltiplos acidentais
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verificar se os dados necessários estão disponíveis
      if (!paymentData.orderId) {
        console.error('ID do pedido não disponível para verificação manual');
        throw new Error('Dados do pedido incompletos para verificação');
      }
      
      const requestBody = {
        orderId: paymentData.orderId,
        paymentId: paymentData.paymentId || ''
      };
      
      console.log('Enviando requisição manual para verificar status:', requestBody);
      
      const response = await fetch('/api/payment/check-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal // Associar o sinal do AbortController
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
      
      // Verificar se estamos recebendo uma resposta de rate limiting
      if (data.message && data.message.includes('Verificação muito frequente')) {
        console.log('Rate limit atingido na verificação manual');
        
        // Mostrar ao usuário quanto tempo falta para poder verificar novamente
        if (data.waitSeconds) {
          setError(`Muitas verificações em um curto período. Aguarde mais ${data.waitSeconds} segundos antes de tentar novamente.`);
        } else {
          setError('Muitas verificações em um curto período. Aguarde pelo menos 30 segundos antes de tentar novamente.');
        }
        
        // Não continuar com verificações automáticas por um período maior
        setTimeout(() => {
          // Após o tempo de espera, reiniciar as verificações automáticas
          statusCheckRef.current = setInterval(() => {
            if (!checkingStatus) {
              verifyPaymentManually();
            }
          }, 60000); // Verificar a cada 1 minuto
        }, 40000); // Esperar 40 segundos antes de reiniciar as verificações
        
        return;
      }
      
      // Se o pagamento foi confirmado
      if (data.isPaid) {
        console.log('Pagamento confirmado manualmente! Atualizando estado...');
        setIsPaid(true);
        
        // Notificar o componente pai que o pagamento foi confirmado
        if (onPaymentConfirmed) {
          onPaymentConfirmed();
        }
        
        // Fechar o modal após 5 segundos
        setTimeout(() => {
          onClose();
          // Redirecionar para a página de produtos do usuário
          window.location.href = '/profile/orders';
        }, 5000);
      } else {
        console.log('Pagamento ainda não confirmado, status:', data.paymentStatus || 'pendente');
      }
    } catch (error) {
      // Verificar se o erro é devido ao cancelamento da requisição
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Requisição de verificação manual cancelada');
        return;
      }
      
      // Tratar erros específicos
      let errorMessage = 'Erro ao verificar pagamento';
      
      if (error instanceof Error) {
        console.error('Erro detalhado da verificação manual:', error);
        
        // Se for o erro específico "order.items is not iterable", exibir mensagem amigável
        if (error.message.includes('order.items is not iterable')) {
          errorMessage = 'Erro ao processar os itens do pedido. Aguarde um momento e tente novamente.';
          
          // Agendar uma nova verificação após 5 segundos
          setTimeout(() => {
            console.log('Tentando verificar novamente após erro de itens...');
            verifyPaymentManually();
          }, 5000);
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      console.error('Erro ao verificar status do pagamento manualmente:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-dark-200 p-6 text-left align-middle shadow-xl transition-all">
                <div className="absolute right-4 top-4">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-300 focus:outline-none"
                    onClick={onClose}
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>

                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-white text-center mb-4"
                >
                  Pagamento via PIX
                </Dialog.Title>

                {isPaid ? (
                  <div className="bg-green-900/30 border border-green-500 rounded-md p-4 mb-4 text-center">
                    <FiCheck className="mx-auto h-12 w-12 text-green-500 mb-2" />
                    <p className="text-green-300 font-medium text-lg">Pagamento confirmado!</p>
                    <p className="text-gray-300 mt-2">
                      Você será redirecionado para seus produtos em alguns segundos...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 text-center">
                      <p className="text-gray-300 mb-2">
                        Escaneie o QR code abaixo com o aplicativo do seu banco para realizar o pagamento
                      </p>
                      
                      <div className="bg-white rounded-lg p-4 mx-auto w-48 h-48 flex items-center justify-center mb-2">
                        {paymentData.qrCodeBase64 ? (
                          <Image
                            src={`data:image/png;base64,${paymentData.qrCodeBase64}`}
                            alt="QR Code para pagamento PIX"
                            width={160}
                            height={160}
                          />
                        ) : (
                          <div className="text-gray-500 text-sm">QR Code não disponível</div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-center text-xs text-gray-400">
                        <FiClock className="mr-1" /> 
                        <span>Expira {timeLeft}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-300 mb-2">
                        Ou copie o código PIX abaixo e cole no seu aplicativo de banco:
                      </p>
                      <div className="flex bg-dark-300 rounded-md border border-gray-600 overflow-hidden">
                        <div className="flex-1 p-2 text-sm text-gray-200 font-mono overflow-hidden overflow-ellipsis whitespace-nowrap">
                          {paymentData.copyPaste || 'Código não disponível'}
                        </div>
                        <button
                          onClick={copyToClipboard}
                          className="bg-primary px-3 text-white flex items-center justify-center"
                          disabled={copied}
                        >
                          {copied ? <FiCheck className="h-4 w-4" /> : <FiCopy className="h-4 w-4" />}
                        </button>
                      </div>
                      {copied && (
                        <p className="text-green-400 text-xs mt-1">Código copiado!</p>
                      )}
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
                        <FiAlertCircle className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="mt-6">
                      {isPaid ? (
                        <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 flex items-start">
                          <FiCheck className="mr-2 mt-0.5 flex-shrink-0" />
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
                              <FiRefreshCw className="animate-spin mr-2" />
                              Verificando pagamento...
                            </>
                          ) : (
                            'Já paguei, verificar agora'
                          )}
                        </button>
                      )}
                      
                      {error && (
                        <div className="mt-4 bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
                          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      )}
                      
                      {!isPaid && !error && (
                        <p className="text-gray-400 text-center text-sm mt-4">
                          {checkingStatus ? (
                            <span className="flex items-center justify-center">
                              <FiRefreshCw className="animate-spin mr-2" />
                              Verificando pagamento...
                            </span>
                          ) : (
                            <>Estamos verificando seu pagamento automaticamente<br />Não é necessário atualizar a página</>
                          )}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 