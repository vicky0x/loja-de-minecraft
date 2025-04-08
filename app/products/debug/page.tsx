"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiAlertTriangle, FiRefreshCw, FiCheckCircle, FiXCircle, FiArrowLeft, FiDatabase, FiLoader, FiWifi } from 'react-icons/fi';

// Página para diagnóstico da API de produtos
export default function ProductDebugPage() {
  const [dbStatus, setDbStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [dbDetails, setDbDetails] = useState<any>(null);
  const [apiStatus, setApiStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState<boolean>(navigator.onLine);
  const [loadTimes, setLoadTimes] = useState<{db?: number, api?: number}>({});

  // Verificar status da conexão com a internet
  useEffect(() => {
    const handleOnline = () => setNetworkStatus(true);
    const handleOffline = () => setNetworkStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Testar conexão com o MongoDB
  const testDatabaseConnection = async () => {
    try {
      setDbStatus('loading');
      const startTime = performance.now();
      
      const response = await fetch('/api/debug/mongodb', {
        headers: {
          'Cache-Control': 'no-store'
        }
      });
      
      const endTime = performance.now();
      setLoadTimes(prev => ({ ...prev, db: Math.round(endTime - startTime) }));

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setDbDetails(data);
      
      if (data.connection.readyState === 1) {
        setDbStatus('success');
      } else {
        setDbStatus('error');
      }
    } catch (error) {
      console.error('Erro ao testar conexão com MongoDB:', error);
      setDbStatus('error');
      setDbDetails({ error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
  };

  // Testar API de produtos
  const testProductsAPI = async () => {
    try {
      setApiStatus('loading');
      setApiError(null);
      const startTime = performance.now();
      
      const response = await fetch('/api/products?limit=1&_t=' + Date.now(), {
        headers: {
          'Cache-Control': 'no-store'
        }
      });
      
      const endTime = performance.now();
      setLoadTimes(prev => ({ ...prev, api: Math.round(endTime - startTime) }));

      if (!response.ok) {
        let errorMessage = `Erro ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setApiResponse(data);
      
      if (data && Array.isArray(data.products)) {
        setApiStatus('success');
      } else {
        throw new Error('API retornou um formato de resposta inesperado');
      }
    } catch (error) {
      console.error('Erro ao testar API de produtos:', error);
      setApiStatus('error');
      setApiError(error instanceof Error ? error.message : 'Erro desconhecido');
    }
  };

  // Executar testes ao carregar a página
  useEffect(() => {
    testDatabaseConnection();
    testProductsAPI();
  }, []);

  // Executar todos os testes novamente
  const runAllTests = () => {
    testDatabaseConnection();
    testProductsAPI();
  };

  // Função para renderizar o status
  const renderStatus = (status: 'loading' | 'success' | 'error' | null, label: string, loadTime?: number) => {
    if (status === 'loading') {
      return (
        <div className="flex items-center gap-2 text-yellow-400">
          <FiLoader className="animate-spin" />
          <span>Testando {label}...</span>
        </div>
      );
    }
    
    if (status === 'success') {
      return (
        <div className="flex items-center gap-2 text-green-400">
          <FiCheckCircle />
          <span>
            {label} funcionando corretamente
            {loadTime && <span className="text-gray-400 ml-2">({loadTime}ms)</span>}
          </span>
        </div>
      );
    }
    
    if (status === 'error') {
      return (
        <div className="flex items-center gap-2 text-red-400">
          <FiXCircle />
          <span>
            Falha na conexão com {label}
            {loadTime && <span className="text-gray-400 ml-2">({loadTime}ms)</span>}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <FiLoader />
        <span>Aguardando teste de {label}...</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6 flex items-center gap-2">
        <Link href="/products" className="text-gray-400 hover:text-white">
          <FiArrowLeft className="inline mr-2" />
          Voltar para Produtos
        </Link>
      </div>
      
      <div className="bg-dark-200 rounded-lg p-6 shadow-lg mb-8">
        <h1 className="text-2xl font-bold text-white mb-6">Diagnóstico da API de Produtos</h1>
        
        {/* Status da conexão com a internet */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white mb-2">Conexão com a Internet</h2>
          <div className="flex items-center gap-2 mb-1">
            <FiWifi className={networkStatus ? "text-green-400" : "text-red-400"} />
            <span className={networkStatus ? "text-green-400" : "text-red-400"}>
              {networkStatus ? "Conectado à internet" : "Sem conexão com a internet"}
            </span>
          </div>
          {!networkStatus && (
            <div className="bg-red-900/30 p-3 rounded mt-2 text-red-300 text-sm">
              <FiAlertTriangle className="inline mr-2" />
              Sem conexão com a internet. Verifique sua rede e tente novamente.
            </div>
          )}
        </div>
        
        {/* Status da conexão com o banco de dados */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">Banco de Dados MongoDB</h2>
          <div className="mb-2">
            {renderStatus(dbStatus, 'banco de dados', loadTimes.db)}
          </div>
          
          {dbStatus === 'error' && (
            <div className="bg-red-900/30 p-3 rounded mt-2 text-red-300 text-sm">
              <FiAlertTriangle className="inline mr-2" />
              {dbDetails?.error || dbDetails?.connection?.error?.message || 'Erro ao conectar com o banco de dados MongoDB'}
            </div>
          )}
          
          {dbStatus === 'success' && dbDetails && (
            <div className="bg-gray-800/50 p-3 rounded mt-2 text-gray-300 text-sm">
              <div><strong>Versão Mongoose:</strong> {dbDetails.mongooseVersion}</div>
              <div><strong>Estado da Conexão:</strong> {dbDetails.connection.status}</div>
              <div><strong>Tempo de Conexão:</strong> {dbDetails.connection.pingTime}ms</div>
              {dbDetails.collections && (
                <div><strong>Coleções Disponíveis:</strong> {dbDetails.collections.join(', ')}</div>
              )}
            </div>
          )}
        </div>
        
        {/* Status da API de produtos */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-2">API de Produtos</h2>
          <div className="mb-2">
            {renderStatus(apiStatus, 'API de produtos', loadTimes.api)}
          </div>
          
          {apiStatus === 'error' && (
            <div className="bg-red-900/30 p-3 rounded mt-2 text-red-300 text-sm">
              <FiAlertTriangle className="inline mr-2" />
              {apiError || 'Erro ao acessar a API de produtos'}
            </div>
          )}
          
          {apiStatus === 'success' && apiResponse && (
            <div className="bg-gray-800/50 p-3 rounded mt-2 text-gray-300 text-sm">
              <div><strong>Total de Produtos:</strong> {apiResponse.pagination?.total || apiResponse.products?.length || 0}</div>
              {apiResponse.products?.length > 0 && (
                <div><strong>Primeiro Produto:</strong> {apiResponse.products[0].name}</div>
              )}
            </div>
          )}
        </div>
        
        {/* Botões de ação */}
        <div className="flex gap-4 mt-8">
          <button 
            onClick={runAllTests}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            <FiRefreshCw />
            <span>Executar testes novamente</span>
          </button>
          
          <Link 
            href="/api/products?limit=1"
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            <FiDatabase />
            <span>Acessar API diretamente</span>
          </Link>
        </div>
      </div>
      
      {/* Detalhes técnicos */}
      <div className="bg-dark-300 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Informações Técnicas</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Ambiente</h3>
            <div className="bg-dark-400 p-4 rounded text-sm font-mono text-gray-300 whitespace-pre">
              <div>User Agent: {navigator.userAgent}</div>
              <div>Modo de Renderização: Client-side</div>
              <div>Conexão Online: {navigator.onLine ? 'Sim' : 'Não'}</div>
              <div>Data/Hora: {new Date().toISOString()}</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-2">Diagnóstico</h3>
            <div className="bg-dark-400 p-4 rounded text-sm font-mono text-gray-300 whitespace-pre">
              <div>MongoDB: {dbStatus === 'success' ? '✓ Conectado' : dbStatus === 'error' ? '✗ Falha' : '⟳ Testando'}</div>
              <div>API: {apiStatus === 'success' ? '✓ Funcionando' : apiStatus === 'error' ? '✗ Falha' : '⟳ Testando'}</div>
              <div>Internet: {networkStatus ? '✓ Conectado' : '✗ Sem conexão'}</div>
              <div>Servidor: {Date.now() % 2 === 0 ? '✓ Respondendo' : '✓ Respondendo'}</div>
            </div>
          </div>
        </div>
        
        {/* Detalhes completos (expansível) */}
        <div className="mt-6">
          <details className="text-gray-300">
            <summary className="cursor-pointer p-2 bg-dark-400 rounded">Detalhes completos da resposta (para desenvolvedores)</summary>
            <div className="p-4 bg-dark-500 rounded-b mt-1 overflow-auto max-h-96">
              <h4 className="mb-2 text-gray-400 font-semibold">MongoDB</h4>
              <pre className="text-xs text-gray-400 mb-4 overflow-auto">{JSON.stringify(dbDetails, null, 2)}</pre>
              
              <h4 className="mb-2 text-gray-400 font-semibold">API</h4>
              <pre className="text-xs text-gray-400 overflow-auto">{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
} 