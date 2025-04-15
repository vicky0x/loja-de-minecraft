'use client';

import { useState, useEffect } from 'react';

interface SystemStats {
  counts: {
    users: number;
    products: number;
    orders: number;
    categories: number;
    coupons: number;
  };
  orders: {
    pending: number;
    completed: number;
    totalRevenue: string;
  };
  timestamp: string;
}

interface SystemInfo {
  system: {
    platform: string;
    type: string;
    release: string;
    hostname: string;
    arch: string;
    uptime: number;
    totalMemory: number;
    freeMemory: number;
    cpus: number;
  };
  disk: any;
  timestamp: string;
}

export default function ConfigPage() {
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando conexão com o MongoDB...');
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [systemLoading, setSystemLoading] = useState(true);
  const [configData, setConfigData] = useState({
    port: process.env.PORT || '3000',
    apiUrl: process.env.API_URL || 'http://localhost:3000/api',
    mongodbUri: process.env.MONGODB_URI ? 'Configurado' : 'Não configurado',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    mpAccessToken: process.env.MP_ACCESS_TOKEN ? 'Configurado' : 'Não configurado'
  });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    async function checkConnection() {
      try {
        const response = await fetch('/api/system/check-db');
        const data = await response.json();
        
        if (data.connected) {
          setConnectionStatus('success');
          setMessage(`MongoDB conectado com sucesso! Versão: ${data.version}`);
          // Se conectado, busca as estatísticas
          fetchSystemStats();
        } else {
          setConnectionStatus('error');
          setMessage(`Erro na conexão: ${data.error}`);
          setStatsLoading(false);
        }
      } catch (error) {
        setConnectionStatus('error');
        setMessage('Erro ao verificar conexão com o MongoDB.');
        setStatsLoading(false);
        console.error('Erro:', error);
      }
    }

    async function fetchSystemStats() {
      try {
        const response = await fetch('/api/system/stats');
        const data = await response.json();
        setSystemStats(data);
        setStatsLoading(false);
      } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        setStatsLoading(false);
      }
    }
    
    async function fetchSystemInfo() {
      try {
        const response = await fetch('/api/system/disk-space');
        const data = await response.json();
        setSystemInfo(data);
        setSystemLoading(false);
      } catch (error) {
        console.error('Erro ao obter informações do sistema:', error);
        setSystemLoading(false);
      }
    }

    checkConnection();
    fetchSystemInfo();
  }, []);

  const refreshData = async () => {
    setConnectionStatus('loading');
    setMessage('Verificando conexão com o MongoDB...');
    setStatsLoading(true);
    setSystemLoading(true);
    
    try {
      const response = await fetch('/api/system/check-db');
      const data = await response.json();
      
      if (data.connected) {
        setConnectionStatus('success');
        setMessage(`MongoDB conectado com sucesso! Versão: ${data.version}`);
        
        // Busca estatísticas atualizadas
        const statsResponse = await fetch('/api/system/stats');
        const statsData = await statsResponse.json();
        setSystemStats(statsData);
      } else {
        setConnectionStatus('error');
        setMessage(`Erro na conexão: ${data.error}`);
      }
      
      // Busca informações do sistema atualizadas
      const systemResponse = await fetch('/api/system/disk-space');
      const systemData = await systemResponse.json();
      setSystemInfo(systemData);
    } catch (error) {
      setConnectionStatus('error');
      setMessage('Erro ao verificar conexão com o MongoDB.');
      console.error('Erro:', error);
    } finally {
      setStatsLoading(false);
      setSystemLoading(false);
    }
  };

  const resetDatabase = async () => {
    if (!confirm('Tem certeza que deseja limpar o banco de dados? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setResetLoading(true);
    setResetSuccess(false);
    setResetError(false);
    setResetMessage('Limpando banco de dados...');

    try {
      const response = await fetch('/api/system/reset-db');
      const data = await response.json();

      if (data.success) {
        setResetSuccess(true);
        setResetMessage('Banco de dados limpo com sucesso');
      } else {
        setResetError(true);
        setResetMessage(`Falha ao limpar banco de dados: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (err) {
      setResetError(true);
      setResetMessage('Erro ao limpar banco de dados');
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  // Formatar valor de uptime em formato legível
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };
  
  // Formatar bytes em formato legível
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Configurações do Sistema</h2>
      </div>

      {/* Status da Conexão */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Status da Conexão</h3>
        <div className="flex items-center space-x-2">
          <div 
            className={`w-4 h-4 rounded-full ${
              connectionStatus === 'loading' ? 'bg-yellow-500' : 
              connectionStatus === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          ></div>
          <span>{message}</span>
        </div>
        
        {resetMessage && (
          <div className={`mt-4 p-3 rounded ${
            resetLoading ? 'bg-yellow-100 text-yellow-800' : 
            resetSuccess ? 'bg-green-100 text-green-800' : 
            resetError ? 'bg-red-100 text-red-800' : ''
          }`}>
            {resetMessage}
          </div>
        )}
      </div>

      {/* Estatísticas do Sistema */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Estatísticas do Sistema</h3>
        {statsLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : systemStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Contagens Gerais */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-500">Contagens</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Usuários:</span>
                  <span className="font-bold">{systemStats.counts.users}</span>
                </div>
                <div className="flex justify-between">
                  <span>Produtos:</span>
                  <span className="font-bold">{systemStats.counts.products}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pedidos:</span>
                  <span className="font-bold">{systemStats.counts.orders}</span>
                </div>
                <div className="flex justify-between">
                  <span>Categorias:</span>
                  <span className="font-bold">{systemStats.counts.categories}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cupons:</span>
                  <span className="font-bold">{systemStats.counts.coupons}</span>
                </div>
              </div>
            </div>

            {/* Estatísticas de Pedidos */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-500">Pedidos</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Pendentes:</span>
                  <span className="font-bold">{systemStats.orders.pending}</span>
                </div>
                <div className="flex justify-between">
                  <span>Concluídos:</span>
                  <span className="font-bold">{systemStats.orders.completed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Receita Total:</span>
                  <span className="font-bold">R$ {systemStats.orders.totalRevenue}</span>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-500">Informações</h4>
              <div className="space-y-2">
                <div>
                  <span className="block text-sm text-gray-400">Última Atualização</span>
                  <span className="font-medium">
                    {new Date(systemStats.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            Não foi possível carregar as estatísticas do sistema.
          </div>
        )}
      </div>

      {/* Informações do Servidor */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Informações do Servidor</h3>
        {systemLoading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : systemInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informações do Sistema */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-500">Sistema Operacional</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Plataforma:</span>
                  <span className="font-medium">{systemInfo.system.platform}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-medium">{systemInfo.system.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Versão:</span>
                  <span className="font-medium">{systemInfo.system.release}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hostname:</span>
                  <span className="font-medium">{systemInfo.system.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span>Arquitetura:</span>
                  <span className="font-medium">{systemInfo.system.arch}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span className="font-medium">{formatUptime(systemInfo.system.uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processadores:</span>
                  <span className="font-medium">{systemInfo.system.cpus}</span>
                </div>
                <div className="flex justify-between">
                  <span>Memória Total:</span>
                  <span className="font-medium">{formatBytes(systemInfo.system.totalMemory)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Memória Livre:</span>
                  <span className="font-medium">{formatBytes(systemInfo.system.freeMemory)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Uso de Memória:</span>
                  <span className="font-medium">
                    {Math.round(((systemInfo.system.totalMemory - systemInfo.system.freeMemory) / systemInfo.system.totalMemory) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Informações do Disco */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-500">Espaço em Disco</h4>
              {systemInfo.disk.error ? (
                <div className="p-4 bg-red-50 text-red-600 rounded-md">
                  {systemInfo.disk.error}
                </div>
              ) : (
                <div>
                  {Object.keys(systemInfo.disk).map((drive) => (
                    <div key={drive} className="mb-4 p-4 border rounded-md">
                      <h5 className="font-medium mb-2">Drive {drive}</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Tamanho Total:</span>
                          <span className="font-medium">{systemInfo.disk[drive].size}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Espaço Livre:</span>
                          <span className="font-medium">{systemInfo.disk[drive].freeSpace}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Espaço Usado:</span>
                          <span className="font-medium">{systemInfo.disk[drive].used}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Porcentagem de Uso:</span>
                          <span className="font-medium">{systemInfo.disk[drive].usePercentage}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: systemInfo.disk[drive].usePercentage }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div>
                <span className="block text-sm text-gray-400">Última Atualização</span>
                <span className="font-medium">
                  {new Date(systemInfo.timestamp).toLocaleString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            Não foi possível carregar as informações do sistema.
          </div>
        )}
      </div>

      {/* Configurações da Aplicação */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Variáveis de Ambiente</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-sm">PORT</p>
              <p className="font-medium">{configData.port}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">API URL</p>
              <p className="font-medium">{configData.apiUrl}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">MONGODB URI</p>
              <p className="font-medium">{configData.mongodbUri}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">BASE URL</p>
              <p className="font-medium">{configData.baseUrl}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">MERCADO PAGO TOKEN</p>
              <p className="font-medium">{configData.mpAccessToken}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Ações do Sistema</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            className="btn btn-primary" 
            onClick={refreshData}
            disabled={statsLoading || systemLoading}
          >
            {statsLoading || systemLoading ? 'Atualizando...' : 'Atualizar Dados'}
          </button>
          <button 
            className="btn btn-danger" 
            onClick={resetDatabase}
            disabled={resetLoading}
          >
            {resetLoading ? 'Limpando...' : 'Limpar Banco de Dados'}
          </button>
          <p className="w-full text-sm text-gray-500 mt-2">
            Atenção: Limpar o banco de dados irá remover todos os dados. Esta ação não pode ser desfeita.
          </p>
        </div>
      </div>
    </div>
  );
} 