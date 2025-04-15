'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { FiArrowLeft, FiSave, FiAlertCircle } from 'react-icons/fi';
import categoryService from '@/app/lib/services/categoryService';

interface CategoryData {
  name: string;
  description: string;
  icon: string;
}

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [categoryData, setCategoryData] = useState<CategoryData>({
    name: '',
    description: '',
    icon: '',
  });

  useEffect(() => {
    fetchCategory();
  }, [id]);

  async function fetchCategory() {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`/api/categories/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setCategoryData({
          name: data.category.name,
          description: data.category.description,
          icon: data.category.icon || '',
        });
      } else {
        const errorData = await response.json();
        setError(`Erro ao carregar categoria: ${errorData.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      setError('Erro ao carregar dados da categoria. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!categoryData.name.trim()) {
      setError('O nome da categoria é obrigatório');
      return;
    }
    
    if (!categoryData.description.trim()) {
      setError('A descrição da categoria é obrigatória');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        // Atualizar o cache de categorias se a API retornar a lista atualizada
        if (responseData.categories) {
          categoryService.updateCategories(responseData.categories);
        } else {
          // Se a API não retornar as categorias atualizadas, forçar uma nova busca
          await categoryService.getCategories(true);
        }
        
        router.push('/admin/categories');
      } else {
        setError(responseData.message || 'Erro ao atualizar categoria');
      }
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      setError('Erro ao atualizar categoria. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Editar Categoria</h2>
        <Link 
          href="/admin/categories" 
          className="bg-dark-300 hover:bg-dark-400 text-white py-2 px-4 rounded-md flex items-center"
        >
          <FiArrowLeft className="mr-2" />
          Voltar para Categorias
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-900/30 border-l-4 border-red-500 p-4 text-red-400 flex items-start">
          <FiAlertCircle className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="bg-dark-200 rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                id="name"
                name="name"
                value={categoryData.name}
                onChange={handleChange}
                placeholder="Digite o nome da categoria"
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                Descrição <span className="text-red-500">*</span>
              </label>
              <textarea 
                id="description"
                name="description"
                value={categoryData.description}
                onChange={handleChange}
                placeholder="Digite uma descrição para a categoria"
                rows={4}
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                required
              />
            </div>
            
            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-300 mb-1">
                Ícone (opcional)
              </label>
              <input 
                type="text"
                id="icon"
                name="icon"
                value={categoryData.icon}
                onChange={handleChange}
                placeholder="Nome do ícone (ex: FiGamepad)"
                className="w-full px-3 py-2 bg-dark-300 text-white border border-dark-400 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-sm text-gray-400">
                Insira o nome do ícone da biblioteca React Icons (Fi, Bi, etc.)
              </p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className={`bg-primary hover:bg-primary/90 text-white py-2 px-6 rounded-md flex items-center ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 