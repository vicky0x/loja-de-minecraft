'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiClock, FiArrowLeft, FiShoppingBag, FiRefreshCw } from 'react-icons/fi';

// Componente principal que utiliza useSearchParams
function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obter o external_reference dos parâmetros da URL
  const externalReference = searchParams.get('external_reference');
  const orderId = externalReference?.startsWith('order_') 
    ? externalReference.substring(6) 
    : externalReference;

  useEffect(() => {
    if (!orderId) {
      setError('Referência do pedido não encontrada');
      setLoading(false);
      return;
    }

    // Função para verificar o status do pedido
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // Obter detalhes do pedido
        const response = await fetch(`/api/orders/${orderId}`);
        if (!response.ok) {
          throw new Error('Não foi possível obter os detalhes do pedido');
        }

        const data = await response.json();
        setOrderDetails(data.order);
      } catch (error) {
        console.error('Erro ao verificar pedido:', error);
        setError('Erro ao verificar o status do pedido');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  // Função para verificar novamente o status do pagamento
  const checkPaymentStatus = async () => {
    if (!orderId || checking) return;
    
    try {
      setChecking(true);
      
      // Verificar o status do pagamento
      const response = await fetch(`/api/payment/verify-status?orderId=${orderId}`);
      if (!response.ok) {
        throw new Error('Erro ao verificar status do pagamento');
      }
      
      const data = await response.json();
      
      // Se o pagamento estiver aprovado, redirecionar para a página de sucesso
      if (data.paymentStatus === 'paid') {
        router.push(`/checkout/success?external_reference=${externalReference}`);
        return;
      }
      
      // Atualizar os detalhes do pedido
      const orderResponse = await fetch(`/api/orders/${orderId}`);
      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        setOrderDetails(orderData.order);
      }
      
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-dark-200 rounded-lg shadow-xl p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-t-2 border-primary border-r-2 rounded-full animate-spin mb-4"></div>
            <p className="text-white text-lg">Carregando detalhes do pedido...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 text-5xl mb-4">
              <FiClock className="mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Ops! Algo deu errado</h1>
            <p className="text-gray-300 mb-8">{error}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/dashboard"
                className="bg-dark-300 hover:bg-dark-400 text-white py-3 px-6 rounded-lg flex items-center justify-center"
              >
                <FiShoppingBag className="mr-2" />
                Ir para o Dashboard
              </Link>
              <Link
                href="/dashboard/support"
                className="bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg flex items-center justify-center"
              >
                Contatar Suporte
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-yellow-500 text-6xl mb-6">
              <FiClock className="mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">Pagamento Pendente</h1>
            <p className="text-gray-300 mb-2">
              Seu pagamento está sendo processado pelo banco.
            </p>
            <p className="text-gray-400 mb-8">
              O código do pedido é: <span className="text-primary font-medium">{orderDetails?._id || orderId || "N/A"}</span>
            </p>
            
            <div className="my-8 p-4 bg-dark-300 rounded-lg">
              <h2 className="text-xl font-medium text-white mb-4">O que acontece agora?</h2>
              <ol className="text-left text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="bg-yellow-500 text-dark-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">1</span>
                  <span>Seu banco está processando o pagamento</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-yellow-500 text-dark-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">2</span>
                  <span>Assim que aprovado, seu pedido será processado automaticamente</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-yellow-500 text-dark-100 rounded-full w-6 h-6 flex items-center justify-center mr-2 flex-shrink-0">3</span>
                  <span>Você pode verificar o status a qualquer momento no seu Dashboard</span>
                </li>
              </ol>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={checkPaymentStatus}
                disabled={checking}
                className="bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg flex items-center justify-center disabled:opacity-70"
              >
                {checking ? (
                  <>
                    <FiRefreshCw className="mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <FiRefreshCw className="mr-2" />
                    Verificar Status
                  </>
                )}
              </button>
              <Link
                href="/dashboard"
                className="bg-dark-300 hover:bg-dark-400 text-white py-3 px-6 rounded-lg flex items-center justify-center"
              >
                <FiShoppingBag className="mr-2" />
                Ir para o Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de fallback para o Suspense
function Loading() {
  return (
    <div className="min-h-screen bg-dark-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-dark-200 rounded-lg shadow-xl p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-t-2 border-primary border-r-2 rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    </div>
  );
}

// Página principal que usa Suspense para envolver o componente que utiliza useSearchParams
export default function CheckoutPendingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PendingContent />
    </Suspense>
  );
} 