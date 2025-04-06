'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch, FiFilter, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Link from 'next/link';
import ProductList from '../components/ProductList';

interface Variant {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  features: string[];
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
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros e ordenação
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  useEffect(() => {
    // Extrair parâmetros da URL
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'createdAt';
    const dir = searchParams.get('dir') || 'desc';
    const status = searchParams.get('status') || 'all';
    
    // Configurar os filtros com os parâmetros da URL
    setSelectedCategory(category);
    setSearchTerm(search);
    setSortBy(sort);
    setSortDir(dir);
    setStatusFilter(status);
    
    // Buscar categorias apenas uma vez
    if (categories.length === 0) {
      fetchCategories();
    }
    
    // Buscar produtos com os filtros da URL
    fetchProducts(category, search, sort, dir, status);
  }, [searchParams]);
  
  const fetchProducts = async (category?: string, search?: string, sort?: string, dir?: string, status?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Usar os parâmetros passados ou os valores do estado
      const categoryParam = category !== undefined ? category : selectedCategory;
      const searchParam = search !== undefined ? search : searchTerm;
      const sortParam = sort !== undefined ? sort : sortBy;
      const dirParam = dir !== undefined ? dir : sortDir;
      const statusParam = status !== undefined ? status : statusFilter;
      
      // Construir URL com filtros para a API
      let url = '/api/products?limit=50';
      
      // Adicionar parâmetros de ordenação
      if (sortParam) url += `&sort=${sortParam}`;
      if (dirParam) url += `&dir=${dirParam}`;
      
      // Adicionar filtro de pesquisa
      if (searchParam) url += `&search=${encodeURIComponent(searchParam)}`;
      
      // Adicionar filtro de categoria
      if (categoryParam && categoryParam !== '') {
        url += `&category=${categoryParam}`;
      }
      
      // Adicionar filtro de status
      if (statusParam && statusParam !== 'all') {
        url += `&status=${statusParam}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar produtos');
      }
      
      const data = await response.json();
      console.log(`Recebidos ${data.products?.length || 0} produtos`);
      
      // Definir diretamente produtos filtrados, sem necessidade de useEffect separado
      let products = data.products || [];
      setProducts(products);
      setFilteredProducts(products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar produtos');
      setFilteredProducts([]);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar categorias');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrlParams();
  };
  
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // Se já estiver ordenando por este campo, inverte a direção
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      // Define o novo campo de ordenação e reseta a direção para desc
      setSortBy(field);
      setSortDir('desc');
    }
    
    updateUrlParams();
  };
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    
    // Construir parâmetros de URL baseados nos filtros atuais
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (categoryId) params.set('category', categoryId);
    if (sortBy !== 'createdAt') params.set('sort', sortBy);
    if (sortDir !== 'desc') params.set('dir', sortDir);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    
    // Atualizar a URL com os parâmetros diretamente, sem timeout
    router.push(`/products?${params.toString()}`);
  };
  
  const updateUrlParams = () => {
    // Construir parâmetros de URL baseados nos filtros atuais
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy !== 'createdAt') params.set('sort', sortBy);
    if (sortDir !== 'desc') params.set('dir', sortDir);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    
    // Atualizar a URL com os parâmetros
    router.push(`/products?${params.toString()}`);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Produtos</h1>
          
          <button
            onClick={() => fetchProducts()}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
          >
            <FiRefreshCw />
            <span>Atualizar</span>
          </button>
        </div>
        
        <div className="bg-dark-200 rounded-lg p-4 shadow-md">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Barra de pesquisa */}
            <form onSubmit={handleSearch} className="flex-1 w-full md:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  className="w-full pl-10 pr-4 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <FiSearch size={16} />
                </div>
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-primary/20 hover:bg-primary/40 text-primary rounded-full p-1 transition-all duration-300"
                >
                  <FiSearch size={16} />
                </button>
              </div>
            </form>
            
            {/* Botão de mostrar/esconder filtros em dispositivos móveis */}
            <button
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded-md transition-colors"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              <span>Filtros</span>
              {showFilters ? <FiChevronUp /> : <FiChevronDown />}
            </button>
            
            {/* Filtros para desktop */}
            <div className="hidden md:flex items-center gap-4">
              {/* Dropdown de categorias */}
              <select
                className="bg-dark-300 text-white border border-dark-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              {/* Dropdown de ordenação */}
              <select
                className="bg-dark-300 text-white border border-dark-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
              >
                <option value="createdAt">Data (Mais recentes)</option>
                <option value="name">Nome</option>
                <option value="price">Preço</option>
              </select>
              
              {/* Botão para inverter a ordem */}
              <button
                className="bg-dark-300 text-white border border-dark-400 rounded-md px-3 py-2 focus:outline-none hover:bg-dark-400"
                onClick={() => {
                  setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                  updateUrlParams();
                }}
              >
                {sortDir === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
              </button>
            </div>
          </div>
          
          {/* Filtros para dispositivos móveis */}
          {showFilters && (
            <div className="md:hidden mt-4 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Categoria</label>
                <select
                  className="w-full bg-dark-300 text-white border border-dark-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Ordenar por</label>
                <select
                  className="w-full bg-dark-300 text-white border border-dark-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  <option value="createdAt">Data (Mais recentes)</option>
                  <option value="name">Nome</option>
                  <option value="price">Preço</option>
                </select>
              </div>
              
              <div>
                <button
                  className="w-full bg-dark-300 text-white border border-dark-400 rounded-md px-3 py-2 focus:outline-none hover:bg-dark-400"
                  onClick={() => {
                    setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    updateUrlParams();
                  }}
                >
                  {sortDir === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Status da Busca */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-400">Carregando produtos...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="mb-4 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => fetchProducts()} 
              className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-dark-200 rounded-lg">
            <div className="mb-4 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-400 mb-4">Tente ajustar os filtros ou fazer outra busca.</p>
            <button 
              onClick={() => {
                setSelectedCategory('');
                setSearchTerm('');
                setStatusFilter('all');
                setSortBy('createdAt');
                setSortDir('desc');
                router.push('/products');
              }}
              className="px-4 py-2 bg-dark-300 hover:bg-dark-400 text-white rounded-md transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <ProductList 
              selectedIds={filteredProducts.map(p => p._id)} 
              limit={filteredProducts.length} 
              showTitle={false} 
            />
          </div>
        )}
      </div>
    </div>
  );
} 