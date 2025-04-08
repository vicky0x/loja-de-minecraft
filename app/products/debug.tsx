"use client";

import React, { useState, useEffect } from 'react';

// Componente básico para depuração da conexão com a API
export default function DebugProductAPI() {
  const [status, setStatus] = useState<string>('Iniciando teste de conexão...');
  const [error, setError] = useState<string | null>(null);
  const [mongoConnected, setMongoConnected] = useState<boolean | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Função para testar a conexão com a API
  const testConnection = async () => {
    setStatus('Testando conexão com a API...');
    setError(null);
    setResponse(null);
    
    try {
      // Registrar tempo de início para medir latência
      const startTime = performance.now();
      
      // Tentar fazer uma requisição para a API
      const response = await fetch('/api/products?limit=1', {
        headers: {
          'Cache-Control': 'no-store'
        }
      });
      
      // Calcular latência
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      
      if (!response.ok) {
        throw new Error(`Resposta da API com status ${response.status}: ${response.statusText}`);
      }
      
      // Obter dados da resposta
      const data = await response.json();
      setResponse(data);
      
      // Verificar se a resposta contém produtos
      if (data && data.products) {
        setStatus(`Conexão bem-sucedida. ${data.products.length} produto(s) recebido(s).`);
        setMongoConnected(true);
      } else {
        setStatus('Resposta recebida, mas sem produtos. Estrutura de dados inesperada.');
        setMongoConnected(null);
      }
    } catch (error) {
      console.error('Erro no teste de conexão:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setStatus('Falha na conexão com a API.');
      setMongoConnected(false);
    }
  };

  // Executar o teste ao carregar o componente
  useEffect(() => {
    testConnection();
  }, []);

  // Estilo para destacar status de conexão
  const getStatusStyle = () => {
    if (mongoConnected === true) return 'text-green-500';
    if (mongoConnected === false) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-dark-200 rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-4">Diagnóstico da API de Produtos</h1>
        
        <div className="mb-6">
          <p className={`text-xl font-semibold ${getStatusStyle()}`}>
            Status: {status}
          </p>
          {latency !== null && (
            <p className="text-gray-300">
              Latência: {latency}ms
            </p>
          )}
        </div>
        
        {error && (
          <div className="mb-6 bg-red-900/30 p-4 rounded-md border border-red-500">
            <h2 className="text-lg font-semibold text-red-400 mb-2">Erro Detectado:</h2>
            <pre className="whitespace-pre-wrap text-red-300 font-mono text-sm">{error}</pre>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-2">Informações do Ambiente:</h2>
          <ul className="list-disc pl-5 text-gray-300 space-y-1">
            <li>Next.js Runtime: {typeof window !== 'undefined' ? 'Client' : 'Server'}</li>
            <li>Hora atual: {new Date().toLocaleString()}</li>
            <li>Navegador: {typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A'}</li>
          </ul>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={testConnection}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
          >
            Testar Novamente
          </button>
          
          <button 
            onClick={() => window.location.href = '/api/products?limit=5'}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            Acessar API Diretamente
          </button>
          
          <button 
            onClick={() => window.location.href = '/products'}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            Voltar para Produtos
          </button>
        </div>
        
        {response && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-white mb-2">Resposta da API:</h2>
            <pre className="bg-dark-300 p-4 rounded-md overflow-auto max-h-96 text-sm text-gray-300 font-mono">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 