'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaChevronRight } from 'react-icons/fa';
import categoryService, { Category } from '@/app/lib/services/categoryService';

export default function FooterCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animações para os elementos
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100,
        duration: 0.5
      }
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await categoryService.getCategories(true);
        setCategories(data);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
        setError('Não foi possível carregar as categorias');
      } finally {
        setIsLoading(false);
      }
    };

    // Carregar categorias imediatamente
    fetchCategories();

    // Registrar para receber atualizações quando as categorias forem alteradas
    const handleCategoriesUpdated = (updatedCategories: Category[]) => {
      setCategories(updatedCategories);
    };

    categoryService.onCategoriesUpdated(handleCategoriesUpdated);

    // Limpar ao desmontar
    return () => {
      categoryService.offCategoriesUpdated(handleCategoriesUpdated);
    };
  }, []);

  return (
    <motion.div variants={itemVariants}>
      <h3 className="text-white text-xl font-bold mb-6 relative inline-block">
        Categorias
        <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-gradient-to-r from-primary to-primary-light rounded-full"></span>
      </h3>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-6 bg-dark-400/60 rounded animate-pulse w-28"></div>
          ))}
        </div>
      ) : error ? (
        <p className="text-slate-400 text-sm">{error}</p>
      ) : categories.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhuma categoria disponível</p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => (
            <li key={category._id} className="group">
              <Link 
                href={`/products?category=${category.slug}`} 
                className="text-slate-300 group-hover:text-primary transition-colors inline-flex items-center"
              >
                <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity mr-2 w-3 h-3 block">
                  <FaChevronRight size={12} />
                </span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">
                  {category.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
} 