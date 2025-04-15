'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiPlus, FiEdit, FiTrash2, FiSearch } from 'react-icons/fi';
import categoryService, { Category } from '@/app/lib/services/categoryService';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      setError('');
      
      const data = await categoryService.getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      setError('Erro ao buscar categorias. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      return;
    }

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        
        // Atualiza o cache de categorias com a nova lista retornada pela API
        if (data.categories) {
          categoryService.updateCategories(data.categories);
        } else {
          // Se a API não retornar as categorias atualizadas, atualizar localmente
          const updatedCategories = categories.filter(category => category._id !== id);
          setCategories(updatedCategories);
          categoryService.updateCategories(updatedCategories);
        }
        
        setSuccessMessage('Categoria excluída com sucesso');
        
        // Limpar mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setError(`Erro ao excluir categoria: ${errorData.message || 'Erro desconhecido'}`);
        
        // Limpar mensagem de erro após 5 segundos
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      setError('Erro ao excluir categoria. Verifique sua conexão e tente novamente.');
      
      // Limpar mensagem de erro após 5 segundos
      setTimeout(() => setError(''), 5000);
    }
  };

  // Filtrar categorias com base no termo de busca
  const filteredCategories = searchTerm
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : categories;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Categorias</h2>
        <Link 
          href="/admin/categories/new" 
          className="bg-primary hover:bg-primary/90 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiPlus className="mr-2" />
          Nova Categoria
        </Link>
      </div>

      {/* Mensagens de erro/sucesso */}
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-900/30 border-l-4 border-green-500 p-4 text-green-400">
          {successMessage}
        </div>
      )}

      {/* Filtros e busca */}
      <div className="bg-dark-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar categorias..."
              className="pl-10 pr-3 py-2 w-full bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de categorias */}
      <div className="bg-dark-200 rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-400">
              <thead className="bg-dark-300">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Nome
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ícone
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-dark-300 divide-y divide-dark-400">
                {filteredCategories.map((category) => (
                  <tr key={category._id} className="hover:bg-dark-400">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-white">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {category.description.length > 50
                        ? `${category.description.substring(0, 50)}...`
                        : category.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {category.icon}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-3">
                        <Link
                          href={`/admin/categories/${category._id}/edit`}
                          className="text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          <FiEdit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className="text-red-400 hover:text-red-300"
                          title="Excluir"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">
            {searchTerm ? (
              <p>Nenhuma categoria encontrada para "{searchTerm}".</p>
            ) : (
              <p>Nenhuma categoria cadastrada. Clique em "Nova Categoria" para adicionar.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 