'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FiPackage, 
  FiClock, 
  FiEye, 
  FiCheck, 
  FiAlertTriangle, 
  FiX,
  FiRefreshCw, 
  FiChevronRight,
  FiFilter,
  FiSearch,
  FiCopy,
  FiImage
} from 'react-icons/fi';

// Polyfill para AbortSignal.timeout para navegadores que não suportam
if (typeof AbortSignal !== 'undefined' && !AbortSignal.timeout) {
  AbortSignal.timeout = function timeout(ms) {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

interface ProductItem {
  _id: string;
  productId: string | null;
  name: string;
  slug: string;
  status: string;
  image: string;
  shortDescription: string;
  assignedAt: string;
  code: string;
  variant: {
    _id: string;
    name: string;
  };
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Buscar produtos quando o componente montar
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filtrar produtos com base na pesquisa
    const filtered = products.filter(product => {
      const matchesSearch = searchTerm.trim() === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.variant.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('fetchProducts: Iniciando busca de produtos');
      
      try {
        const response = await fetch('/api/user/products', {
          signal: AbortSignal.timeout(15000) // 15 segundos timeout
        });
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Você precisa estar autenticado para ver seus produtos');
          } else if (response.status === 403) {
            throw new Error('Você não tem permissão para acessar esta página');
          } else if (response.status === 404) {
            throw new Error('Recurso não encontrado');
          } else if (response.status >= 500) {
            throw new Error('Erro no servidor. Por favor, tente novamente mais tarde');
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro ao carregar produtos (${response.status})`);
        }
        
        const data = await response.json();
        
        if (!data.success || !data.products || !Array.isArray(data.products)) {
          console.warn('Resposta da API de produtos inválida:', data);
          throw new Error('Dados de produtos inválidos');
        }
        
        // Verificar e filtrar produtos com valores nulos ou indefinidos
        const validProducts = data.products.filter(product => {
          // Verificar se o produto existe e tem propriedades necessárias
          if (!product || typeof product !== 'object') {
            console.warn('Produto inválido encontrado:', product);
            return false;
          }
          
          // Verificar se o produto tem _id e outras propriedades essenciais
          if (!product._id) {
            console.warn('Produto sem ID encontrado:', product);
            return false;
          }
          
          // Garantir que a propriedade variant exista
          if (!product.variant) {
            console.warn('Produto sem variante encontrado:', product._id);
            product.variant = { _id: 'default', name: 'Padrão' };
          }
          
          return true;
        });
        
        console.log(`fetchProducts: ${validProducts.length} produtos válidos encontrados`);
        setProducts(validProducts);
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Tempo limite excedido ao buscar produtos. Verifique sua conexão e tente novamente.');
        }
        throw fetchError;
      }
    } catch (err) {
      console.error('Erro ao buscar produtos do usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
      setProducts([]); // Definir como array vazio para evitar erros
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400">
            <FiCheck className="mr-1" />
            Ativo
          </span>
        );
      case 'Em Manutenção':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/30 text-yellow-400">
            <FiClock className="mr-1" />
            Em Manutenção
          </span>
        );
      case 'Beta':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/30 text-blue-400">
            <FiAlertTriangle className="mr-1" />
            Beta
          </span>
        );
      case 'Detectável':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400">
            <FiX className="mr-1" />
            Detectável
          </span>
        );
      default:
        return null;
    }
  };

  const copyToClipboard = (text: string) => {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Meus Produtos</h2>
        <button
          onClick={fetchProducts}
          className="flex items-center gap-2 px-3 py-2 bg-dark-300 hover:bg-dark-400 rounded-md"
        >
          <FiRefreshCw />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Aviso sobre entregas manuais */}
      <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0 bg-amber-500/20 p-2 rounded-full mr-3">
            <FiClock className="text-amber-400 text-xl" />
          </div>
          <div className="flex-1">
            <h3 className="text-amber-400 font-semibold text-lg mb-1">Informação sobre Entregas Manuais</h3>
            <p className="text-white text-sm leading-relaxed">
              Se você comprou um produto com <strong>entrega manual</strong>, ele será entregue em até <strong>24 horas</strong> após a confirmação do pagamento e aparecerá nesta página.
            </p>
            <p className="text-white/80 text-sm mt-2">
              Nossa equipe trabalha para fazer a entrega em <strong>poucos minutos</strong>. Fique tranquilo, não é necessário entrar em contato com o suporte para solicitar informações sobre a entrega.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros e pesquisa */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar produtos..."
            className="bg-dark-300 border border-dark-400 rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium">Erro</p>
              <p>{error}</p>
            </div>
            <button 
              onClick={fetchProducts} 
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded flex items-center gap-2"
            >
              <FiRefreshCw size={14} />
              <span>Tentar novamente</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid de produtos */}
      <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-dark-300">
          <div className="flex items-center space-x-3">
            <FiPackage className="text-primary text-xl" />
            <h3 className="text-lg font-semibold">Produtos Adquiridos</h3>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Todos os produtos que você comprou
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mb-4">
              <FiPackage className="w-12 h-12 mx-auto text-gray-400" />
            </div>
            {searchTerm.trim() !== '' ? (
              <div>
                <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-400">
                  Não encontramos produtos correspondentes à sua busca. Tente outros termos.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-2">Você ainda não possui produtos</h3>
                <p className="text-gray-400">
                  Todos os produtos que você adquirir aparecerão aqui.
                </p>
                <Link href="/products" className="inline-flex items-center mt-4 px-4 py-2 bg-primary rounded-md">
                  <span>Explorar Produtos</span>
                  <FiChevronRight className="ml-1" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-5">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-gradient-to-b from-dark-300/90 to-dark-200 rounded-xl overflow-hidden shadow-md transition-all duration-400 hover:shadow-xl hover:shadow-dark-400/30 transform hover:-translate-y-1 flex flex-col h-[420px]"
              >
                <div className="relative rounded-lg overflow-hidden z-10">
                  {/* Container da imagem com padding */}
                  <div className="pt-3 px-3 pb-0 bg-gradient-to-br from-dark-800 to-dark-900">
                    {/* Imagem com efeitos */}
                    <div className="h-44 relative overflow-hidden rounded-lg">
                      <div className="absolute inset-0 z-0 overflow-hidden">
                        <div className="bg-gradient-to-br from-dark-800 to-dark-900 h-full w-full opacity-90"></div>
                        {/* Padrão sutil no fundo */}
                        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
                      </div>
                      
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover relative z-10 transition-all duration-500"
                          onError={(e) => {
                            console.warn(`Erro ao carregar imagem para produto: ${product._id}`);
                            const target = e.currentTarget as HTMLImageElement;
                            target.src = '/placeholder-image.jpg';
                            target.onerror = null; // Evita loop infinito
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center relative z-10">
                          <FiImage size={32} className="text-gray-500" />
                        </div>
                      )}
                      
                      {/* Gradiente na parte inferior para melhorar transição com o conteúdo */}
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-dark-300/90 to-transparent z-10"></div>
                    </div>
                  </div>
                  
                  {/* Badge de status */}
                  {product.status && (
                    <div className="absolute bottom-[8px] left-4 bg-dark-800/80 text-green-400 border border-green-500/30 text-xs px-3 py-1 rounded-full flex items-center backdrop-blur-xl z-20 shadow-sm transition-all duration-300">
                      <FiCheck size={12} className="mr-1.5 flex-shrink-0" />
                      {product.status}
                    </div>
                  )}
                </div>
                
                {/* Conteúdo do card */}
                <div className="p-5 relative z-10 flex-grow flex flex-col">
                  {/* Título do produto */}
                  <div className="relative group">
                    <h3 className="text-white font-medium text-lg mb-1 transition-colors duration-300 line-clamp-2 h-14">
                      {product.name}
                    </h3>
                    <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-primary/30 group-hover:w-1/4 transition-all duration-500"></span>
                  </div>
                  
                  {/* Tipo do produto/variante */}
                  <p className="text-gray-400 text-sm mb-2">
                    {product.variant?.name || 'Padrão'}
                  </p>
                  
                  {/* Data de aquisição */}
                  <p className="text-gray-500 text-xs mb-4 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary/50 mr-2"></span>
                    Adquirido em: {formatDate(product.assignedAt)}
                  </p>
                  
                  {/* Botão de ver detalhes */}
                  <div className="mt-auto">
                    <Link 
                      href={`/dashboard/products/${product._id}`}
                      className="block w-full"
                    >
                      <button className="w-full py-2.5 px-4 rounded-lg text-center font-medium transition-all duration-300 relative overflow-hidden bg-primary text-white hover:bg-primary-dark group">
                        <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">Ver detalhes</span>
                        <span className="absolute bottom-0 left-1/2 right-1/2 h-[1px] bg-white/20 group-hover:left-4 group-hover:right-4 transition-all duration-500"></span>
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 