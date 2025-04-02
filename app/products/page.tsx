'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch, FiFilter, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import ProductCard from '../components/ProductCard';
import Link from 'next/link';

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
        
        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
            <p className="font-medium">Erro</p>
            <p>{error}</p>
          </div>
        )}
        
        {/* Indicador de carregamento */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Lista de produtos */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                {filteredProducts.map((product, index) => (
                  <div 
                    key={product._id}
                    style={{ animationDelay: `${0.1 + index * 0.05}s`, animationFillMode: 'forwards' }}
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-dark-200 rounded-lg p-8 flex flex-col items-center justify-center shadow-md">
                <p className="text-lg text-gray-400 mb-4">Nenhum produto encontrado para os filtros selecionados</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('');
                    setStatusFilter('all');
                    setSortBy('createdAt');
                    setSortDir('desc');
                    router.push('/products');
                  }}
                  className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 