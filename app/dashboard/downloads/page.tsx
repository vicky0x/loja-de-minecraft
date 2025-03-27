'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FiDownload, FiCopy, FiInfo, FiPackage } from 'react-icons/fi';
import { useSearchParams } from 'next/navigation';

interface ProductItem {
  product: {
    _id: string;
    name: string;
    slug: string;
    images: string[];
  };
  variant: string;
  items: {
    _id: string;
    code: string;
    assignedAt: string;
  }[];
}

export default function DownloadsPage() {
  const [loading, setLoading] = useState(true);
  const [downloads, setDownloads] = useState<ProductItem[]>([]);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    fetchDownloads();
  }, []);
  
  // Função para buscar os downloads do usuário
  const fetchDownloads = async () => {
    try {
      setLoading(true);
      
      // Construir URL com base em parâmetros de consulta
      let url = '/api/stock/assign';
      const productId = searchParams.get('product');
      const orderId = searchParams.get('order');
      
      if (productId) {
        url += `?product=${productId}`;
      }
      
      if (orderId) {
        url += `${productId ? '&' : '?'}order=${orderId}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar seus produtos');
      }
      
      const data = await response.json();
      setDownloads(data.items);
    } catch (error) {
      console.error('Erro ao carregar downloads:', error);
      setError('Não foi possível carregar seus produtos. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para copiar código para a área de transferência
  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };
  
  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Meus Downloads</h2>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
          {error}
        </div>
      )}
      
      {downloads.length === 0 ? (
        <div className="bg-dark-200 p-8 rounded-lg shadow-md text-center">
          <FiPackage className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Nenhum produto encontrado</h3>
          <p className="text-gray-400 mb-4">
            Você ainda não possui produtos para download.
          </p>
          <Link 
            href="/products" 
            className="inline-block bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md"
          >
            Explorar Produtos
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {downloads.map((productItem) => (
            <div key={`${productItem.product._id}-${productItem.variant}`} className="bg-dark-200 rounded-lg shadow-md overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 relative">
                  <img 
                    src={productItem.product.images[0] || '/placeholder-image.jpg'} 
                    alt={productItem.product.name}
                    className="w-full h-48 md:h-full object-cover"
                  />
                </div>
                
                <div className="p-6 flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {productItem.product.name}
                  </h3>
                  
                  <div className="mb-4">
                    <Link 
                      href={`/product/${productItem.product.slug}`}
                      className="text-primary hover:text-primary/80 text-sm"
                    >
                      Ver detalhes do produto
                    </Link>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-dark-300 p-4 rounded-md">
                      <h4 className="font-medium text-white mb-3 flex items-center">
                        <FiDownload className="mr-2" />
                        Chaves de Acesso ({productItem.items.length})
                      </h4>
                      
                      <div className="space-y-3">
                        {productItem.items.map((item) => (
                          <div key={item._id} className="flex flex-col md:flex-row md:items-center md:justify-between bg-dark-400 p-3 rounded-md">
                            <div className="font-mono text-white break-all mb-2 md:mb-0 md:mr-4">
                              {item.code}
                            </div>
                            
                            <div className="flex items-center">
                              <span className="text-gray-400 text-sm mr-2">
                                {formatDate(item.assignedAt)}
                              </span>
                              
                              <button
                                onClick={() => copyToClipboard(item.code)}
                                className={`p-2 rounded-md ${
                                  copiedCode === item.code
                                    ? 'bg-green-600 text-white'
                                    : 'bg-dark-300 text-gray-300 hover:bg-dark-500'
                                }`}
                                title="Copiar código"
                              >
                                {copiedCode === item.code ? 'Copiado!' : <FiCopy />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-dark-300 p-4 rounded-md">
                      <div className="flex items-start">
                        <FiInfo className="text-primary mt-1 mr-2 flex-shrink-0" />
                        <div className="text-sm text-gray-300">
                          <p>
                            Você precisará dessas chaves para ativar ou usar seu produto. Guarde-as com segurança.
                            Em caso de problemas, entre em contato com nosso suporte.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 