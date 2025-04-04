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
      const response = await fetch('/api/user/products');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar produtos');
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-dark-300 rounded-lg overflow-hidden flex flex-col border border-dark-400 hover:border-primary transition-colors duration-200"
              >
                <div className="relative aspect-video">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-dark-400 flex justify-center items-center">
                      <FiPackage className="text-4xl text-gray-500" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(product.status)}
                  </div>
                </div>
                
                <div className="p-4 flex-grow flex flex-col">
                  <h3 className="text-lg font-medium mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-400 mb-2">
                    {product.variant.name}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-xs text-gray-400">
                      <span>Adquirido em: </span>
                      <span>{formatDate(product.assignedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-dark-400 p-3 flex justify-end items-center">
                  <Link 
                    href={`/dashboard/products/${product._id}`} 
                    className="inline-flex items-center text-primary hover:text-primary-light"
                  >
                    <span className="text-sm">Ver detalhes</span>
                    <FiChevronRight className="ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 