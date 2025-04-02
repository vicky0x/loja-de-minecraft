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
  FiCopy
} from 'react-icons/fi';

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

// Função vazia para evitar erros com fetchAssignments
// Exportando para que possa ser usada por outros módulos que tentam importá-la
export const fetchAssignments = async (page: number = 1): Promise<void> => {
  try {
    console.warn('fetchAssignments foi chamado, mas está desativado para prevenir erros. Página:', page);
    return Promise.resolve();
  } catch (error) {
    console.error('Erro em fetchAssignments:', error);
    return Promise.resolve();
  }
};

// Exportado como objeto para garantir compatibilidade com diferentes formas de importação
export const Assignments = {
  fetchAssignments
};

// Atribuir à window para garantir que está disponível globalmente
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.fetchAssignments = fetchAssignments;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Evitar que o fetchAssignments cause erro
    try {
      fetchProducts();
      // Garantir que fetchAssignments não cause erros
      try {
        fetchAssignments(1);
      } catch (assignError) {
        console.error('Erro ao executar fetchAssignments:', assignError);
      }
    } catch (err) {
      console.error('Erro ao inicializar página de produtos:', err);
      setError('Ocorreu um erro ao carregar a página. Por favor, tente novamente.');
      setLoading(false);
    }
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
      
      const response = await fetch('/api/user/products');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar produtos');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
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
          <p className="font-medium">Erro</p>
          <p>{error}</p>
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
          <div className="p-10 text-center">
            <p className="text-gray-400">Você ainda não possui produtos adquiridos</p>
            <Link href="/products" className="text-primary hover:text-primary/80 inline-block mt-2">
              Ver produtos disponíveis
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
            {filteredProducts.map((product, index) => (
              <div 
                key={product._id} 
                className="bg-gradient-to-b from-dark-300/90 to-dark-200 rounded-xl overflow-hidden shadow-md transition-all duration-400 hover:shadow-xl hover:shadow-dark-400/30 product-card"
                style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: 'forwards' }}
              >
                <div className="relative h-48">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover w-full transition-all duration-500"
                      style={{ objectPosition: 'center' }}
                      unoptimized={true}
                      priority={index < 6}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-dark-400 flex items-center justify-center">
                      <FiPackage className="text-4xl text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex flex-col justify-between h-40">
                  <h3 className="text-white font-medium text-base mb-3">{product.name}</h3>
                  <div>
                    <div className="text-gray-400 text-sm mb-2">{product.variant.name}</div>
                    <Link 
                      href={`/dashboard/products/${product._id}`} 
                      className="block mt-3 w-full"
                    >
                      <button 
                        className="product-card-button w-full py-2.5 px-4 rounded-lg text-center font-medium transition-all duration-300 relative overflow-hidden bg-primary text-white hover:bg-primary-dark"
                      >
                        <span className="relative z-10 group-hover:tracking-wide transition-all duration-300">Ver Detalhes</span>
                        <span className="btn-underline absolute bottom-0 left-1/2 right-1/2 h-[1px] bg-white/20 group-hover:left-4 group-hover:right-4 transition-all duration-500"></span>
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