'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiAlertCircle, FiCheckCircle, FiCreditCard } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para os valores dos campos
  const [mercadoPagoToken, setMercadoPagoToken] = useState('');
  const [hasMercadoPagoToken, setHasMercadoPagoToken] = useState(false);
  
  // Buscar configurações atuais
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoadingData(true);
      setError(null);
      
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Falha ao buscar configurações');
      }
      
      const data = await response.json();
      
      // Atualizar estados com dados recebidos
      if (data.mercadoPagoToken) {
        // Mostrar apenas os primeiros e últimos caracteres do token por segurança
        const token = data.mercadoPagoToken;
        const maskedToken = token.substring(0, 6) + '...' + token.substring(token.length - 4);
        setMercadoPagoToken(maskedToken);
        setHasMercadoPagoToken(true);
      } else {
        setHasMercadoPagoToken(false);
      }
      
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      setError('Não foi possível carregar as configurações');
    } finally {
      setLoadingData(false);
    }
  };
  
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      const formData = {
        mercadoPagoToken: mercadoPagoToken.includes('...') ? null : mercadoPagoToken,
      };
      
      // Se o token não foi alterado (contém '...'), não enviá-lo
      const dataToSend = {
        ...(formData.mercadoPagoToken && { mercadoPagoToken: formData.mercadoPagoToken }),
      };
      
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao salvar configurações');
      }
      
      setSuccess('Configurações salvas com sucesso!');
      toast.success('Configurações salvas com sucesso!');
      
      // Atualizar dados após salvar
      fetchSettings();
      
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setError(error instanceof Error ? error.message : 'Erro ao salvar configurações');
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Configurações</h2>
      
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400 flex items-start">
          <FiCheckCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      {loadingData ? (
        <div className="bg-dark-200 rounded-lg p-8 flex justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-400">Carregando configurações...</p>
          </div>
        </div>
      ) : (
        <div className="bg-dark-200 rounded-lg shadow-md">
          <form onSubmit={handleSaveSettings}>
            <div className="p-6 space-y-6">
              <h3 className="text-xl font-medium text-white mb-4 flex items-center">
                <FiCreditCard className="mr-2 text-primary" />
                Integrações de Pagamento
              </h3>
              
              {/* Mercado Pago */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="mercadoPagoToken" className="block text-sm font-medium text-gray-300 mb-1">
                    Token de Acesso do Mercado Pago
                  </label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      id="mercadoPagoToken"
                      value={mercadoPagoToken}
                      onChange={(e) => setMercadoPagoToken(e.target.value)}
                      placeholder="APP_USR-0000000000000-000000-00000000000000000000000000000000-000000000"
                      className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-describedby="mercadoPagoTokenHelp"
                    />
                  </div>
                  
                  <div id="mercadoPagoTokenHelp" className="mt-1 text-sm text-gray-400">
                    {hasMercadoPagoToken ? (
                      <span className="flex items-center text-green-400">
                        <FiCheckCircle className="mr-1" />
                        Token configurado. Preencha apenas se desejar alterá-lo.
                      </span>
                    ) : (
                      'Adicione o token de acesso do Mercado Pago para processar pagamentos PIX.'
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-dark-300 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`bg-primary hover:bg-primary/90 text-white py-2 px-6 rounded-md flex items-center ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" />
                    Salvar Configurações
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 