'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FiAlertTriangle, FiArrowLeft, FiShoppingCart, FiRefreshCw } from 'react-icons/fi';

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

// Componente principal que utiliza useSearchParams
function FailureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Obter o external_reference dos parâmetros da URL
  const externalReference = searchParams.get('external_reference');
  const orderId = externalReference?.startsWith('order_') 
    ? externalReference.substring(6) 
    : externalReference;

  // Função para tentar pagar novamente
  const handleRetryPayment = () => {
    if (!orderId) return;
    
    setLoading(true);
    router.push('/cart'); // Retorna para o carrinho para tentar novamente
  };

  return (
    <div className="min-h-screen bg-dark-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-dark-200 rounded-lg shadow-xl p-8">
        <div className="text-center py-6">
          <div className="text-red-500 text-6xl mb-6">
            <FiAlertTriangle className="mx-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Pagamento Não Aprovado</h1>
          <p className="text-gray-300 mb-6">
            Infelizmente não foi possível processar o seu pagamento.
          </p>
          
          {orderId && (
            <p className="text-gray-400 mb-8">
              O código do pedido é: <span className="text-primary font-medium">{orderId}</span>
            </p>
          )}
          
          <div className="my-8 p-4 bg-dark-300 rounded-lg">
            <h2 className="text-xl font-medium text-white mb-4">Possíveis motivos:</h2>
            <ul className="text-left text-gray-300 space-y-2">
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Cartão recusado pelo banco emissor</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Dados do cartão inseridos incorretamente</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Saldo insuficiente ou limite excedido</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-2">•</span>
                <span>Problemas temporários com o processador de pagamento</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <button
              onClick={handleRetryPayment}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white py-3 px-6 rounded-lg flex items-center justify-center disabled:opacity-70"
            >
              {loading ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" />
                  Tentar Novamente
                </>
              )}
            </button>
            <Link
              href="/cart"
              className="bg-dark-300 hover:bg-dark-400 text-white py-3 px-6 rounded-lg flex items-center justify-center"
            >
              <FiShoppingCart className="mr-2" />
              Voltar ao Carrinho
            </Link>
          </div>
          
          <div className="mt-8 text-gray-400 text-sm">
            <p>
              Precisa de ajuda? <Link href="/contact" className="text-primary hover:underline">Entre em contato com o suporte</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Página principal que usa Suspense para envolver o componente que utiliza useSearchParams
export default function CheckoutFailurePage() {
  return (
    <Suspense fallback={<Loading />}>
      <FailureContent />
    </Suspense>
  );
} 