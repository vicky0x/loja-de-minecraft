'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiTag, FiGrid, FiChevronRight } from 'react-icons/fi';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/categories');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar categorias');
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error: any) {
      console.error('Erro ao buscar categorias:', error);
      setError(error.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200 py-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="animate-pulse">
            <div className="h-8 bg-dark-300/50 rounded-md w-1/3 mb-8"></div>
            <div className="h-4 bg-dark-300/50 rounded-md w-2/3 mb-12"></div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="bg-dark-300/30 rounded-xl overflow-hidden h-48">
                  <div className="p-6">
                    <div className="h-6 bg-dark-400/40 rounded-md w-1/2 mb-3"></div>
                    <div className="h-4 bg-dark-400/40 rounded-md w-3/4 mb-2"></div>
                    <div className="h-4 bg-dark-400/40 rounded-md w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200 flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md w-full bg-dark-300/50 backdrop-blur-md rounded-2xl p-8 border border-dark-400/20 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-2">Erro ao carregar categorias</h2>
          <p className="text-gray-300 text-center mb-8">{error}</p>
          <button 
            onClick={fetchCategories}
            className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl text-center transition-all duration-300"
          >
            Tentar novamente
          </button>
        </motion.div>
      </div>
    );
  }

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200 flex items-center justify-center p-4">
        <motion.div 
          className="max-w-md w-full bg-dark-300/50 backdrop-blur-md rounded-2xl p-8 border border-dark-400/20 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-white text-center mb-2">Nenhuma categoria encontrada</h2>
          <p className="text-gray-300 text-center mb-8">Não há categorias disponíveis no momento.</p>
          <Link 
            href="/" 
            className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white font-medium rounded-xl text-center transition-all duration-300"
          >
            Voltar para a loja
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200">
      <div className="container mx-auto px-4 py-10 max-w-7xl">
        {/* Cabeçalho */}
        <div className="mb-8">
          <motion.div 
            className="flex items-center mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href="/" className="text-gray-400 hover:text-primary transition-colors flex items-center">
              <FiArrowLeft className="mr-2" />
              <span>Voltar</span>
            </Link>
            <div className="flex-1 text-center">
              <h1 className="text-3xl font-bold text-white">Categorias</h1>
            </div>
            <div className="w-20"></div> {/* Espaço para equilibrar o layout */}
          </motion.div>
          
          <motion.p 
            className="text-gray-400 text-center mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Explore nossos produtos por categoria
          </motion.p>
        </div>
        
        {/* Lista de categorias */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {categories.map((category, index) => (
            <Link 
              key={category._id} 
              href={`/category/${category.slug}`}
            >
              <motion.div 
                className="bg-dark-300/30 hover:bg-dark-300/50 backdrop-blur-sm border border-dark-400/20 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:translate-y-[-5px] hover:border-primary/20 group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-primary/20 p-3 rounded-lg">
                    <FiTag className="text-primary w-6 h-6" />
                  </div>
                  <div className="p-2 rounded-full bg-dark-400/30 group-hover:bg-primary/20 transition-colors">
                    <FiChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
                <p className="text-gray-400 text-sm line-clamp-2">{category.description}</p>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
} 