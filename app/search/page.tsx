'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import Link from 'next/link';
import ProductList from '../components/ProductList';

interface Variant {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  images: string[];
  featured: boolean;
  variants: Variant[];
  status?: 'indetectavel' | 'detectavel' | 'manutencao' | 'beta';
  price?: number;
  stock?: number;
  category?: {
    _id: string;
    name: string;
    slug: string;
  };
  originalPrice?: number;
  discountPercentage?: number;
}

// Componente de fallback para o Suspense
function SearchLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold text-white">Pesquisar Produtos</h1>
          <div className="max-w-xl">
            <div className="relative">
              <div className="w-full pl-10 pr-4 py-3 bg-dark-300 text-dark-300 border border-dark-400 rounded-md">
                Carregando...
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}

// Componente principal que utiliza useSearchParams
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  
  useEffect(() => {
    // Extrair query de pesquisa da URL
    const query = searchParams.get('q') || '';
    setSearchQuery(query);
    
    if (query) {
      searchProducts(query);
    } else {
      setProducts([]);
      setProductIds([]);
      setLoading(false);
    }
  }, [searchParams]);
  
  const searchProducts = async (query: string) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Erro ao pesquisar produtos');
      }
      
      const data = await response.json();
      setProducts(data.products || []);
      
      // Extrair IDs para usar com o componente ProductList
      const ids = (data.products || []).map((p: Product) => p._id);
      setProductIds(ids);
    } catch (error) {
      console.error('Erro na pesquisa:', error);
      setError(error instanceof Error ? error.message : 'Erro ao pesquisar produtos');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="flex flex-col space-y-4">
          <h1 className="text-3xl font-bold text-white">
            {searchParams.get('q') 
              ? `Resultados para "${searchParams.get('q')}"` 
              : 'Pesquisar Produtos'}
          </h1>
          
          {/* Barra de pesquisa */}
          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="O que você está procurando?"
                className="w-full pl-10 pr-4 py-3 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <FiSearch size={18} />
              </div>
              <button 
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary-light transition-colors"
              >
                <FiSearch size={18} />
              </button>
            </div>
          </form>
        </div>
        
        {/* Resultados da pesquisa */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
            {error}
          </div>
        ) : productIds.length > 0 ? (
          <>
            <div className="mb-4 text-gray-400">
              {productIds.length} {productIds.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
            </div>
            
            {/* Usando o componente ProductList com os IDs específicos */}
            <ProductList 
              selectedIds={productIds} 
              showTitle={false}
              limit={productIds.length}
            />
          </>
        ) : searchParams.get('q') ? (
          <div className="py-12 text-center">
            <div className="bg-dark-200 p-8 rounded-lg inline-block">
              <div className="text-2xl text-gray-300 mb-4">
                Nenhum produto encontrado para "{searchParams.get('q')}"
              </div>
              <p className="text-gray-400 mb-6">
                Tente usar termos diferentes ou verifique a ortografia
              </p>
              <Link
                href="/products"
                className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
              >
                Ver todos os produtos
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400">
            Digite um termo de pesquisa para encontrar produtos
          </div>
        )}
      </div>
    </div>
  );
}

// Página principal que usa Suspense para envolver o componente que utiliza useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
} 