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
  FiSearch
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

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<ProductItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    // Filtrar produtos com base na pesquisa e status
    const filtered = products.filter(product => {
      const matchesSearch = searchTerm.trim() === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.variant.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredProducts(filtered);
  }, [products, searchTerm, statusFilter]);

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
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-700 text-gray-400">
            Desconhecido
          </span>
        );
    }
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
        
        <div className="relative min-w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiFilter className="text-gray-400" />
          </div>
          <select
            className="bg-dark-300 border border-dark-400 rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Em Manutenção">Em Manutenção</option>
            <option value="Beta">Beta</option>
            <option value="Detectável">Detectável</option>
          </select>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {filteredProducts.map((product) => (
              <div key={product._id} className="bg-dark-300 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative h-48">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-dark-400 flex items-center justify-center">
                      <FiPackage className="text-4xl text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-medium text-white">{product.name}</h4>
                    {getStatusBadge(product.status)}
                  </div>
                  
                  <p className="text-sm text-gray-400 mt-2 line-clamp-2">
                    {product.shortDescription || 'Sem descrição disponível'}
                  </p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Variante:</span>
                      <span className="text-white">{product.variant?.name || 'Padrão'}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Adquirido em:</span>
                      <span className="text-white">{formatDate(product.assignedAt)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Link 
                      href={`/dashboard/products/${product._id}`} 
                      className="text-primary hover:text-primary/80 flex items-center"
                    >
                      <span>Ver detalhes</span>
                      <FiChevronRight className="ml-1" />
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