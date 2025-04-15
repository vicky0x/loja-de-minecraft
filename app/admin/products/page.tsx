'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiSearch, FiPackage, FiCopy } from 'react-icons/fi';

interface Product {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  images: string[];
  featured: boolean;
  variants: { name: string; price: number }[];
  createdAt: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    fetchProducts();
  }, [sortBy, sortDir]);

  async function fetchProducts() {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?sort=${sortBy}&dir=${sortDir}`);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
      } else {
        console.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Atualiza a lista de produtos após excluir
        setProducts(products.filter(product => product._id !== id));
      } else {
        const errorData = await response.json();
        alert(`Erro ao excluir produto: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto. Verifique o console para mais detalhes.');
    }
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
  };

  const handleCloneProduct = async (id: string) => {
    if (!window.confirm('Deseja criar uma cópia deste produto? A cópia terá as mesmas informações, exceto estoque e imagens.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/products/${id}/clone`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Redirecionar para a edição do novo produto clonado
        router.push(`/admin/products/${data.newProductId}/edit`);
      } else {
        const errorData = await response.json();
        alert(`Erro ao clonar produto: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao clonar produto:', error);
      alert('Erro ao clonar produto. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = searchTerm
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Gerenciar Produtos</h2>
        <div className="flex space-x-3">
          <Link 
            href="/admin/assign-products" 
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Atribuir Produtos
          </Link>
          <Link 
            href="/admin/products/new" 
            className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Produto
          </Link>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="bg-dark-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar produtos..."
              className="pl-10 pr-3 py-2 w-full bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-4">
            <select
              className="bg-dark-300 text-white border border-dark-400 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="createdAt">Data de Criação</option>
              <option value="name">Nome</option>
              <option value="price">Preço</option>
            </select>
            <button
              className="bg-dark-300 text-white border border-dark-400 rounded-md px-3 py-2 focus:outline-none hover:bg-dark-400"
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
            >
              {sortDir === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de produtos */}
      <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-400">
              <thead className="bg-dark-300">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('name')}
                  >
                    Nome {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('price')}
                  >
                    Preço Base {sortBy === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Variantes
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortChange('createdAt')}
                  >
                    Data {sortBy === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-300 divide-y divide-dark-400">
                {filteredProducts.map((product) => {
                  // Encontrar a variante de menor preço para exibir como preço base
                  const basePrice = product.variants && product.variants.length > 0
                    ? Math.min(...product.variants.map(v => v.price))
                    : 0;
                  
                  return (
                    <tr key={product._id} className="hover:bg-dark-400">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {product.images && product.images.length > 0 ? (
                            <div className="w-10 h-10 mr-3 bg-dark-400 rounded-md flex items-center justify-center text-gray-500 overflow-hidden">
                              {product.images[0].startsWith('data:') ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : product.images[0].startsWith('/uploads/') ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : product.images[0].startsWith('http') ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.name} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs">
                                  <span className="text-xs">Imagem não disponível</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-10 h-10 mr-3 bg-dark-400 rounded-md flex items-center justify-center text-gray-500">
                              <span className="text-xs">Sem img</span>
                            </div>
                          )}
                          <div className="font-medium text-white">{product.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {product.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {basePrice > 0 
                          ? `R$ ${basePrice.toFixed(2).replace('.', ',')}`
                          : 'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {product.variants ? product.variants.length : 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(product.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => router.push(`/product/${product.slug}`)}
                            className="p-2 text-white hover:text-primary transition-colors"
                            title="Visualizar produto"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/products/${product._id}/stock`)}
                            className="text-purple-400 hover:text-purple-300"
                            title="Gerenciar Estoque"
                          >
                            <FiPackage size={18} />
                          </button>
                          <button
                            onClick={() => router.push(`/admin/products/${product._id}`)}
                            className="text-blue-400 hover:text-blue-300"
                            title="Editar"
                          >
                            <FiEdit size={18} />
                          </button>
                          <button
                            onClick={() => handleCloneProduct(product._id)}
                            className="text-green-400 hover:text-green-300"
                            title="Clonar Produto"
                          >
                            <FiCopy size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-400 hover:text-red-300"
                            title="Excluir"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 text-gray-400">
            {searchTerm ? (
              <p>Nenhum produto encontrado para &quot;{searchTerm}&quot;</p>
            ) : (
              <p>Nenhum produto cadastrado. Clique em &quot;Novo Produto&quot; para adicionar.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 