'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiHome, FiSearch, FiShoppingBag } from 'react-icons/fi';
import Head from 'next/head';

export default function NotFound() {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-dark-100 to-dark-200 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="text-9xl font-bold text-primary/80">404</div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Página não encontrada
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-gray-400 mb-8"
          >
            A página que você está procurando pode ter sido removida ou está temporariamente indisponível.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Link 
              href="/" 
              className="flex items-center justify-center py-3 px-6 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
            >
              <FiHome className="mr-2" />
              Voltar para o início
            </Link>
            
            <Link 
              href="/products" 
              className="flex items-center justify-center py-3 px-6 bg-dark-300 hover:bg-dark-400 text-white font-medium rounded-lg transition-all duration-300"
            >
              <FiShoppingBag className="mr-2" />
              Ver produtos
            </Link>
          </motion.div>
        </div>
      </div>
    </>
  );
} 